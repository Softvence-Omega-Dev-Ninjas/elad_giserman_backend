import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthGetProfileService } from './services/auth-get-profile.service';
import { AuthGoogleService } from './services/auth-google.service';
import { AuthLoginService } from './services/auth-login.service';
import { AuthLogoutService } from './services/auth-logout.service';
import { AuthOtpService } from './services/auth-otp.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthRegisterService } from './services/auth-register.service';
import { UpdateProfileService } from './services/update-profile.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [
    AuthGetProfileService,
    AuthGoogleService,
    AuthLoginService,
    AuthLogoutService,
    AuthOtpService,
    AuthPasswordService,
    AuthRegisterService,
    UpdateProfileService,
  ],
  exports: [],
})
export class AuthModule {}
