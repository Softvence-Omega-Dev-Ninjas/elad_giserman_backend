import { AppError } from '@/common/error/handle-error.app';
import { HandleError } from '@/common/error/handle-error.decorator';
import { successResponse, TResponse } from '@/common/utils/response.util';
import { AuthMailService } from '@/lib/mail/services/auth-mail.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { UtilsService } from '@/lib/utils/utils.service';
import { Injectable } from '@nestjs/common';
import { OtpType, UserRole } from '@prisma/client';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authMailService: AuthMailService,
    private readonly utils: UtilsService,
  ) {}

  @HandleError('Registration failed', 'User')
  async register(dto: RegisterDto): Promise<TResponse<any>> {
    const { email, password, username } = dto;

    // Check if user email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new AppError(400, 'User already exists with this email');
    }

    // Check if username already exists
    const existingUsernameUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsernameUser) {
      throw new AppError(400, 'Username already taken');
    }

    // Generate OTP and expiry
    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();
    const hashedOtp = await this.utils.hash(otp.toString());

    // Trial ends in 3 months
    const trialEndsAt: Date = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() - 1);
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 3);

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email,
        username,
        password: await this.utils.hash(password),
        trialEndsAt,
        memberShip: 'FREE',
        otp: hashedOtp,
        otpType: 'REGISTER',
        otpExpiresAt: expiryTime,
      },
    });

    // Send verification email
    await this.authMailService.sendVerificationCodeEmail(
      email,
      otp.toString(),
      {
        subject: 'Verify your email',
        message:
          'Welcome to our platform! Your account has been successfully created.',
      },
    );

    // Return sanitized response
    return successResponse(
      {
        email: newUser.email,
      },
      `Registration successful. A verification email has been sent to ${newUser.email}.`,
    );
  }

  @HandleError('Registration failed', 'User')
  async registerOrganizer(dto: RegisterDto): Promise<TResponse<any>> {
    const { email, password, username } = dto;

    // check if user email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new AppError(400, 'User already exists with this email');
    }

    // check if username already exists
    const existingUsernameUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsernameUser) {
      throw new AppError(400, 'Username already taken');
    }

    // generate OTP and expiry
    const { otp, expiryTime } = this.utils.generateOtpAndExpiry();
    const hashedOtp = await this.utils.hash(otp.toString());

    // create new user with ORGANIZER role
    const newUser = await this.prisma.user.create({
      data: {
        email,
        username,
        password: await this.utils.hash(password),
        role: UserRole.ORGANIZER,
        otp: hashedOtp,
        otpType: OtpType.REGISTER,
        otpExpiresAt: expiryTime,
        businessProfile: {
          create: {
            title: 'Default Business Profile',
            description: 'Default description',
            location: 'Default location',
            openingTime: 'Default opening time',
            closingTime: 'Default closing time',
          },
        },
      },
      include: {
        businessProfile: true,
      },
    });

    // Send verification email
    await this.authMailService.sendVerificationCodeEmail(
      email,
      otp.toString(),
      {
        subject: 'Verify your email',
        message:
          'Welcome to our platform! Your account has been successfully created.',
      },
    );

    return {
      success: true,
      message:
        'Organizer registered successfully. Verify your email using OTP.',
      data: {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        businessProfile: newUser.businessProfile,
      },
    };
  }
}
