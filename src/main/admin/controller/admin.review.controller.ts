import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminReviewService } from '../service/admin-review.service';

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
      console.log(id);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
