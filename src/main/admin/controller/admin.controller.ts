import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import { handleRequest } from '@/common/utils/handle.request';
import { AdminUpdateOfferDto } from '../dto/admin-update-offer.dto';
import { AdminOfferService } from '../service/admin-offer.service';

@ApiBearerAuth()
@ValidateAdmin()
@ApiTags('Admin- offer handle')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminOfferService: AdminOfferService) {}

  @Get('offers/pending')
  @ApiOperation({ summary: 'Get all pending offers (Only for admin)' })
  @ApiResponse({ status: 200, description: 'Pending offers fetched' })
  getPendingOffers() {
    return handleRequest(
      () => this.adminOfferService.getPendingOffers(),
      'Pending offers fetched successfully',
    );
  }

  @Patch('offers/:id/status')
  @ApiOperation({ summary: 'Approve or reject an offer (Only for admin)' })
  @ApiResponse({ status: 200, description: 'Offer status updated' })
  updateOfferStatus(@Param('id') id: string, @Body() dto: AdminUpdateOfferDto) {
    return handleRequest(
      () => this.adminOfferService.updateOfferStatus(id, dto),
      `Offer status updated to ${dto.status}`,
    );
  }

  @Get('offers')
  @ApiOperation({ summary: 'Get all offers (Only for admin)' })
  @ApiResponse({ status: 200, description: 'All offers fetched' })
  getAllOffers() {
    return handleRequest(
      () => this.adminOfferService.getAllOffers(),
      'All offers fetched successfully',
    );
  }
}
