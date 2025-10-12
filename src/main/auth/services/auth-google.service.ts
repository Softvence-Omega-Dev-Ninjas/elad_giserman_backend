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

    // Ensure email is verified
    if (!payload.email_verified) {
      throw new AppError(400, 'Google email is not verified');
    }

    // Normalize email
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

    if (!payload || !payload.sub || !payload.email) {
      throw new AppError(400, 'Invalid Google token: missing user information');
    }

    return payload;
  }

  private async findOrCreateGoogleUser(
    payload: TokenPayload,
    email: string,
  ): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // New user with Google signup
    if (!user) {
      return await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            username: email.split('@')[0], // Generate username from email
            googleId: payload.sub,
            isVerified: true,
            name: payload.name || 'Unnamed User',
            isLoggedIn: true,
            lastLoginAt: new Date(),
            avatarUrl:
              payload.picture ||
              'https://www.gravatar.com/avatar/000000000000000000000000000000?d=mp&f=y',
          },
        });
        return newUser;
      });
    }

    // If user exists but no Google provider linked → link it
    const hasGoogleId = user.googleId === payload.sub;

    if (!hasGoogleId) {
      // Ensure verified
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          isLoggedIn: true,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Update profile info (non-breaking fields only)
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: payload.name || user.name,
          avatarUrl: payload.picture || user.avatarUrl,
          isVerified: true,
          isLoggedIn: true,
          lastLoginAt: new Date(),
        },
      });
    }

    return user;
  }
}
