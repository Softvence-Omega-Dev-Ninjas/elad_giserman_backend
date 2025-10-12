import { UserResponseDto } from '@/common/dto/user-response.dto';
import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { AuthMailService } from '@/lib/mail/services/auth-mail.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { UtilsService } from '@/lib/utils/utils.service';
import { Injectable } from '@nestjs/common';
import { OtpType } from '@prisma/client';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authMailService: AuthMailService,
    private readonly utils: UtilsService,
  ) {}

  @HandleError('Login failed', 'User')
  async login(dto: LoginDto): Promise<TResponse<any>> {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(400, 'User not found');
    if (!user.password)
      throw new AppError(400, 'Please login using your social account');

    const isPasswordCorrect = await this.utils.compare(password, user.password);
    if (!isPasswordCorrect) throw new AppError(400, 'Invalid password');

    // 1. Email verification
    if (!user.isVerified) {
      await this.generateAndSendOtp(email, 'EMAIL', 'REGISTER');
      return successResponse(
        { email: user.email },
        'Your email is not verified. A new OTP has been sent to your email.',
      );
    }

    // 2. Regular login
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { isLoggedIn: true, lastLoginAt: new Date() },
    });

    const token = this.utils.generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse(
      {
        user: this.utils.sanitizedResponse(UserResponseDto, updatedUser),
        token,
      },
      'Logged in successfully',
    );
  }

  // Helper: generate and send OTP
  private async generateAndSendOtp(
    email: string,
    method: 'EMAIL' | 'PHONE',
    type: OtpType,
  ): Promise<number> {
    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();
    const hashedOtp = await this.utils.hash(otp.toString());

    await this.prisma.user.update({
      where: { email },
      data: { otp: hashedOtp, otpExpiresAt: expiryTime, otpType: type },
    });

    if (method === 'EMAIL') {
      const response = await this.authMailService.sendVerificationCodeEmail(
        email,
        otp.toString(),
        {
          subject: 'Verify your login',
          message: 'Please verify your email to complete the login process.',
        },
      );

      if (response.error) {
        throw new AppError(500, 'Failed to send email');
      }
    } else if (method === 'PHONE') {
      // TODO: Send SMS
    }

    return otp;
  }
}
