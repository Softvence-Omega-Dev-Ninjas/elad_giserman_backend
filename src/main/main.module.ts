import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { OrganizerModule } from './organizer/organizer.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, AdminModule, OrganizerModule, UserModule],
  controllers: [],
  providers: [],
})
export class MainModule {}
