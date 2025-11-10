import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { GetUser, ValidateAuth } from '@/common/jwt/jwt.decorator';

@ApiTags('Reviews')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ValidateAuth()
  @ApiBearerAuth()
  @Post()
  @ApiBody({ type: CreateReviewDto })
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @GetUser('sub') id: string,
  ) {
    try {
      const res = this.reviewService.createReview(createReviewDto, id);
      return {
        status: HttpStatus.CREATED,
        message: 'your review posted successful',
        data: res,
      };
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  @Patch(':id')
  @ValidateAuth()
  @ApiBearerAuth()
  async updateReview(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @GetUser('sub') userId: string,
  ) {
    try {
      const res = await this.reviewService.updateReview(
        id,
        updateReviewDto,
        userId,
      );
      return {
        status: HttpStatus.OK,
        message: 'your review updated successful',
        data: res,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
