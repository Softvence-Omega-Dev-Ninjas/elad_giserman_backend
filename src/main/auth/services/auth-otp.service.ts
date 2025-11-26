import { UserResponseDto } from '@/common/dto/user-response.dto';
import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { AuthMailService } from '@/lib/mail/services/auth-mail.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { UtilsService } from '@/lib/utils/utils.service';
import { Injectable } from '@nestjs/common';
import { VerifyOTPDto } from '../dto/otp.dto';

@Injectable()
export class AuthOtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly authMailService: AuthMailService,
  ) {}

  @HandleError('Failed to resend OTP')
  async resendOtp(email: string): Promise<TResponse<any>> {
    // 1. Find user by email
    const user = await this.prisma.client.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // 2. Prevent multiple active OTPs
    if (user.otp && user.otpExpiresAt && user.otpExpiresAt > new Date()) {
      throw new AppError(
        400,
        'An active OTP already exists. Please check your inbox.',
      );
    }

    // 3. Generate OTP and expiry
    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();
    const hashedOtp = await this.utils.hash(otp.toString());

    // 4. Save hashed OTP
    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { otp: hashedOtp, otpExpiresAt: expiryTime },
    });

    // 5. Send OTP
    try {
      await this.authMailService.sendVerificationCodeEmail(
        email,
        otp.toString(),
        {
          subject: 'Your OTP Code',
          message: `Here is your OTP code. It will expire in 5 minutes.`,
        },
      );
    } catch (error) {
      console.error(error);
      await this.prisma.client.user.update({
        where: { id: user.id },
        data: { otp: null, otpExpiresAt: null, otpType: null },
      });
      throw new AppError(
        400,
        'Failed to send OTP email. Please try again later.',
      );
    }

    return successResponse(null, 'OTP resent successfully');
  }

  @HandleError('OTP verification failed', 'User')
  async verifyOTP(dto: VerifyOTPDto): Promise<TResponse<any>> {
    const { email, otp } = dto;

    // 1. Find user by email
    const user = await this.prisma.client.user.findFirst({
      where: { email },
    });

    if (!user) throw new AppError(400, 'User not found');

    // 2. Email verification
    if (!user.otp || !user.otpExpiresAt) {
      throw new AppError(400, 'OTP is not set. Please request a new one.');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new AppError(400, 'OTP has expired. Please request a new one.');
    }

    const isCorrectOtp = await this.utils.compare(otp, user.otp);
    if (!isCorrectOtp) throw new AppError(400, 'Invalid OTP');

    // 3. Mark user verified (if not already)
    const updatedUser = await this.prisma.client.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
        otpType: null,
        isLoggedIn: true,
        lastLoginAt: new Date(),
      },
    });

    const token = this.utils.generateToken({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    return successResponse(
      {
        user: this.utils.sanitizedResponse(UserResponseDto, updatedUser),
        token,
      },
      'OTP code verified successfully',
    );
  }
}
