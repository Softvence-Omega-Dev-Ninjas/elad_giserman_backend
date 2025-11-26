import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { AuthMailService } from '@/lib/mail/services/auth-mail.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { UtilsService } from '@/lib/utils/utils.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto, ResetPasswordDto } from '../dto/password.dto';

@Injectable()
export class AuthPasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly mailService: AuthMailService,
    private readonly configService: ConfigService,
  ) {}

  @HandleError('Failed to change password')
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<TResponse<any>> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // If user registered via Social login and has no password set
    if (!user.password) {
      const hashedPassword = await this.utils.hash(dto.newPassword);
      await this.prisma.client.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      return successResponse(null, 'Password set successfully');
    }

    // For normal email/password users — require current password check
    if (!dto.password) {
      throw new AppError(400, 'Current password is required');
    }

    const isPasswordValid = await this.utils.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new AppError(400, 'Invalid current password');
    }

    const hashedPassword = await this.utils.hash(dto.newPassword);
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return successResponse(null, 'Password updated successfully');
  }

  @HandleError('Failed to send password reset email')
  async forgotPassword(email: string): Promise<TResponse<any>> {
    const user = await this.prisma.client.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();

    const hashedOtp = await this.utils.hash(otp.toString());

    await this.prisma.client.user.update({
      where: { email },
      data: {
        otp: hashedOtp,
        otpExpiresAt: expiryTime,
        otpType: 'RESET',
      },
    });

    await this.mailService.sendResetPasswordCodeEmail(email, otp.toString());

    return successResponse(null, 'Password reset email sent');
  }

  @HandleError('Failed to reset password')
  async resetPassword(dto: ResetPasswordDto): Promise<TResponse<any>> {
    const { otp, email, newPassword } = dto;

    const user = await this.prisma.client.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // * Check if otp of RESET type is valid
    if (!user.otp || !user.otpExpiresAt || user.otpType !== 'RESET') {
      throw new AppError(400, 'OTP is not set. Please request a new one.');
    }

    // check expiry
    if (user.otpExpiresAt < new Date()) {
      throw new AppError(
        401,
        'Reset token has expired. Please request a new one.',
      );
    }

    // verify token
    const isMatch = this.utils.compare(otp, user.otp);
    if (!isMatch) {
      throw new AppError(403, 'Invalid reset token');
    }

    // hash new password
    const hashedPassword = await this.utils.hash(newPassword);

    // update password and invalidate reset token
    await this.prisma.client.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
        otpType: null,
      },
    });

    // send email
    await this.mailService.sendPasswordResetConfirmationEmail(email);

    return successResponse(null, 'Password reset successfully');
  }
}
