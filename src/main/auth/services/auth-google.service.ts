import { UserResponseDto } from '@/common/dto/user-response.dto';
import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { FirebaseService } from '@/lib/firebase/firebase.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { UtilsService } from '@/lib/utils/utils.service';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as admin from 'firebase-admin';
import { GoogleLoginDto } from '../dto/login.dto';

@Injectable()
export class AuthGoogleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @HandleError('Google login failed', 'User')
  async googleLogin(dto: GoogleLoginDto): Promise<TResponse<any>> {
    if (!dto.idToken) {
      throw new AppError(400, 'Firebase ID token is required');
    }

    // Verify Firebase token
    const decodedToken = await this.firebaseService.verifyIdToken(dto.idToken);
    const email = decodedToken.email?.toLowerCase();

    if (!email) {
      throw new AppError(400, 'Firebase token does not contain an email');
    }

    const user = await this.findOrCreateFirebaseUser(decodedToken, email);

    const token = this.utils.generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse(
      {
        user: this.utils.sanitizedResponse(UserResponseDto, user),
        token,
      },
      'User logged in successfully',
    );
  }

  /**
   * Finds existing user or creates a new one via Firebase Google login.
   */
  private async findOrCreateFirebaseUser(
    decodedToken: admin.auth.DecodedIdToken,
    email: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const trialEndsAt: Date = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() - 1);
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 3);

    // === CASE 1: No user exists → create new Firebase Google user ===
    if (!user) {
      return this.prisma.user.create({
        data: {
          email,
          username: await this.utils.generateUsername(email),
          googleId: decodedToken.uid, // store Firebase UID
          isVerified: true,
          isLoggedIn: true,
          lastLoginAt: new Date(),
          trialEndsAt,
          memberShip: 'FREE',
          name: decodedToken.name || 'Unnamed User',
          avatarUrl:
            decodedToken.picture ||
            'https://www.gravatar.com/avatar/000000000000000000000000000000?d=mp&f=y',
        },
      });
    }

    // === CASE 2: Existing user has no googleId → link Firebase UID ===
    if (!user.googleId) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: decodedToken.uid,
          isVerified: true,
          isLoggedIn: true,
          lastLoginAt: new Date(),
          name: user.name === 'Unnamed User' ? decodedToken.name : user.name,
          avatarUrl: decodedToken.picture || user.avatarUrl,
        },
      });
    }

    // === CASE 3: User already has googleId but mismatch (conflict) ===
    if (user.googleId && user.googleId !== decodedToken.uid) {
      throw new AppError(
        400,
        'Firebase account does not match the linked account for this email',
      );
    }

    // === CASE 4: Regular login → just update login info ===
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        isLoggedIn: true,
        lastLoginAt: new Date(),
        name: decodedToken.name || user.name,
        avatarUrl: decodedToken.picture || user.avatarUrl,
      },
    });
  }
}
