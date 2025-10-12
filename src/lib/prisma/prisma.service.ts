import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import chalk from 'chalk';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [{ emit: 'event', level: 'error' }],
    });

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error('Error IN PRISMA', e.message);
    });
  }

  async onModuleInit() {
    console.info(chalk.bgGreen.white.bold('🚀 Prisma connected'));
    await this.$connect();
  }

  async onModuleDestroy() {
    console.info(chalk.bgRed.white.bold('🚫 Prisma disconnected'));
    await this.$disconnect();
  }
}
