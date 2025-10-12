import { UserResponseDto } from '@/common/dto/user-response.dto';
import { ENVEnum } from '@/common/enum/env.enum';
import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { UtilsService } from '@/lib/utils/utils.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleLoginDto } from '../dto/login.dto';

@Injectable()
export class AuthGoogleService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.getOrThrow<string>(ENVEnum.OAUTH_CLIENT_ID),
    );
  }

  @HandleError('Google login failed', 'User')
  async googleLogin(dto: GoogleLoginDto): Promise<TResponse<any>> {
    if (!dto.idToken) {
      throw new AppError(400, 'Google ID token is required');
    }

    const payload = await this.verifyGoogleIdToken(dto.idToken);

    if (!payload.email_verified) {
      throw new AppError(400, 'Google email is not verified');
    }

    const email = (payload.email || '').toLowerCase();

    const user = await this.findOrCreateGoogleUser(payload, email);

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

  private async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.getOrThrow<string>(ENVEnum.OAUTH_CLIENT_ID),
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      throw new AppError(400, 'Invalid Google token: missing user information');
    }

    return payload;
  }

  /**
   * Finds existing user or creates a new one via Google login.
   */
  private async findOrCreateGoogleUser(
    payload: TokenPayload,
    email: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // === CASE 1: No user exists → create new Google user ===
    if (!user) {
      return this.prisma.user.create({
        data: {
          email,
          username: await this.utils.generateUsername(email),
          googleId: payload.sub,
          isVerified: true,
          isLoggedIn: true,
          lastLoginAt: new Date(),
          name: payload.name || 'Unnamed User',
          avatarUrl:
            payload.picture ||
            'https://www.gravatar.com/avatar/000000000000000000000000000000?d=mp&f=y',
        },
      });
    }

    // === CASE 2: Existing user has no googleId → link Google account ===
    if (!user.googleId) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          isVerified: true,
          isLoggedIn: true,
          lastLoginAt: new Date(),
          // Optional: sync profile if user didn't set custom values
          name: user.name === 'Unnamed User' ? payload.name : user.name,
          avatarUrl: payload.picture || user.avatarUrl,
        },
      });
    }

    // === CASE 3: User already has googleId but mismatch (conflict) ===
    if (user.googleId && user.googleId !== payload.sub) {
      throw new AppError(
        400,
        'Google account does not match the linked account for this email',
      );
    }

    // === CASE 4: Regular login → just update login info ===
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        isLoggedIn: true,
        lastLoginAt: new Date(),
        name: payload.name || user.name,
        avatarUrl: payload.picture || user.avatarUrl,
      },
    });
  }
}
