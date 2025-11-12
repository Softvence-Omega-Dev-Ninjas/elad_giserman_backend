import { Module } from '@nestjs/common';
import { UserInfoService } from './user-info.service';
import { UserInfoController } from './user-info.controller';
import { S3Service } from '@/lib/s3/s3.service';

@Module({
  controllers: [UserInfoController],
  providers: [UserInfoService,S3Service],
})
export class UserInfoModule {}
