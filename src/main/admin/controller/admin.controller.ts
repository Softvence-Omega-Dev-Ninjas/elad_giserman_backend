import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
import { GetOffersDto2 } from '../dto/getOffer.dto';
import { AdminActivityDto } from '../dto/admin.activity';

@ApiBearerAuth()
@ApiTags('Admin- offer handle')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminOfferService: AdminOfferService) {}

  @Get('offers/pending')
  @ValidateAdmin()
  @ApiOperation({ summary: 'Get all pending offers (Only for admin)' })
  @ApiResponse({ status: 200, description: 'Pending offers fetched' })
  getPendingOffers() {
    return handleRequest(
      () => this.adminOfferService.getPendingOffers(),
      'Pending offers fetched successfully',
    );
  }

  @Patch('offers/:id/status')
  @ValidateAdmin()
  @ApiOperation({ summary: 'Approve or reject an offer (Only for admin)' })
  @ApiResponse({ status: 200, description: 'Offer status updated' })
  updateOfferStatus(@Param('id') id: string, @Body() dto: AdminUpdateOfferDto) {
    return handleRequest(
      () => this.adminOfferService.updateOfferStatus(id, dto),
      `Offer status updated to ${dto.status}`,
    );
  }

  @Get('offers')
  @ValidateAdmin()
  @ApiOperation({ summary: 'Get all offers (Only for admin)' })
  @ApiResponse({ status: 200, description: 'All offers fetched' })
  getAllOffers(@Query() Query: GetOffersDto2) {
    const page = Query.page ? Number(Query.page) : 1;
    const limit = Query.limit ? Number(Query.limit) : 10;
    const status = Query.status;
    return handleRequest(
      () => this.adminOfferService.getAllOffers(page, limit, status),
      'All offers fetched successfully',
    );
  }

  @Post('create-admin-activity')
  @ValidateAdmin()
  @ApiOperation({
    summary:
      'Create admin activity log (Only for admin.It will also use for update it this table already exit then i will auto update',
  })
  @ApiResponse({ status: 200, description: 'Admin activity log created' })
  async createAdminActivityLog(@Body() dto: AdminActivityDto) {
    try {
      const res = await this.adminOfferService.createAdminActivityLog(dto);
      return {
        status: HttpStatus.OK,
        message: 'Reviews fetched successfully',
        data: res,
      };
    } catch (err) {
      throw new Error(err.message);
    }
  }

  @Get('get-admin-activity')
  @ApiOperation({ summary: 'Get admin activity log (Only for admin)' })
  @ApiResponse({ status: 200, description: 'Admin activity log fetched' })
  async getAdminActivityLog() {
    const res = await this.adminOfferService.getAdminActivityLogs();

    return {
      status: HttpStatus.OK,
      message: 'Admin activity fetched successfully',
      data: res,
    };
  }
}
