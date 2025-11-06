import { Module } from '@nestjs/common';
import { BusinessProfileController } from './controller/bussiness-profile.controller';
import { BusinessProfileService } from './service/bussiness-profile.service';
import { OfferService } from './service/offer.service';

@Module({
  imports: [],
  controllers: [BusinessProfileController],
  providers: [BusinessProfileService, OfferService],
  exports: [],
})
export class OrganizerModule {}
