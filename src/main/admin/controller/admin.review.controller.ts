import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { AdminReviewService } from '../service/admin-review.service';
import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('admin-reviews')
@ApiBearerAuth()
export class AdminReviewController {
  constructor(private readonly adminReviewService: AdminReviewService) {}

  @Get('reviews')
  @ValidateAdmin()
  async getReviews() {
    try {
      const result = await this.adminReviewService.getReviews();
      return {
        status: HttpStatus.OK,
        message: 'Reviews fetched successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @Delete('reviews/:id')
  @ValidateAdmin()
  async deleteReview(@Param('id') id: string) {
    try {
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
