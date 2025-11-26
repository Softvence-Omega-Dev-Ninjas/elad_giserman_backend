import { UserLanguage, UserRole, UserStatus } from '@prisma';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  // ===== Auth =====
  @Expose()
  email: string;

  @Expose()
  username: string;

  // ===== Contact =====
  @Expose()
  mobile?: string;

  // ===== Profile =====
  @Expose()
  name: string;

  @Expose()
  avatarUrl: string;

  // ===== Settings =====
  @Expose()
  role: UserRole;

  @Expose()
  status: UserStatus;

  @Expose()
  isVerified: boolean;

  @Expose()
  timezone: string;

  @Expose()
  language: UserLanguage;

  @Expose()
  allowNotification: boolean;

  @Expose()
  memberShip: string;

  @Expose()
  trialEndsAt?: Date;

  // ===== Activity tracking =====
  @Expose()
  isLoggedIn: boolean;

  @Expose()
  lastLoginAt?: Date;

  @Expose()
  lastLogoutAt?: Date;

  @Expose()
  lastActiveAt?: Date;

  // ===== Meta =====
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
