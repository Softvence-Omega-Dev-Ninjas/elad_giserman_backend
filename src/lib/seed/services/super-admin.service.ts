import { ENVEnum } from '@/common/enum/env.enum';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { UtilsService } from '@/lib/utils/utils.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import chalk from 'chalk';

@Injectable()
export class SuperAdminService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): Promise<void> {
    return this.seedSuperAdminUser();
  }

  async seedSuperAdminUser(): Promise<void> {
    const superAdminEmail = this.configService.getOrThrow<string>(
      ENVEnum.SUPER_ADMIN_EMAIL,
    );
    const superAdminPass = this.configService.getOrThrow<string>(
      ENVEnum.SUPER_ADMIN_PASS,
    );

    const superAdminExists = await this.prisma.user.findFirst({
      where: {
        email: superAdminEmail,
      },
    });

    // * create super admin
    if (!superAdminExists) {
      await this.prisma.user.create({
        data: {
          email: superAdminEmail,
          username: 'superadmin',
          password: await this.utils.hash(superAdminPass),
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          isVerified: true,
        },
      });
      console.info(
        chalk.bgGreen.white.bold(
          `🚀 Super Admin user created with email: ${superAdminEmail}`,
        ),
      );
      return;
    }

    // * Log & update if super admin already exists
    await this.prisma.user.update({
      where: {
        email: superAdminEmail,
      },
      data: {
        isVerified: true,
        role: 'SUPER_ADMIN',
      },
    });
    console.info(
      chalk.bgGreen.white.bold(
        `🚀 Super Admin user exists with email: ${superAdminEmail}`,
      ),
    );
  }
}
