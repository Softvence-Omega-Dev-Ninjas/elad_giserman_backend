import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminReviewService } from '../service/admin-review.service';
import { GetReviewDto } from '../dto/getReview.dto';

@Controller('admin-reviews')
@ApiBearerAuth()
export class AdminReviewController {
  constructor(private readonly adminReviewService: AdminReviewService) {}

  @Get('reviews')
  @ValidateAdmin()
  async getReviews(@Query() filter: GetReviewDto) {
    try {
      const result = await this.adminReviewService.getReviews(filter);
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
