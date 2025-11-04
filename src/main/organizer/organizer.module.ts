import { Module } from '@nestjs/common';
import { BusinessProfileController } from './controller/bussiness-profile.controller';
import { BusinessProfileService } from './service/bussiness-profile.service';

@Module({
  imports: [],
  controllers: [BusinessProfileController],
  providers: [BusinessProfileService],
  exports: [],
})
export class OrganizerModule {}
