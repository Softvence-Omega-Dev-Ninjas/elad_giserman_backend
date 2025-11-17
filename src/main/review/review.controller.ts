import { GetUser, ValidateAuth } from '@/common/jwt/jwt.decorator';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewReplyDTO } from './dto/create-reviewReply';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

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
      const res = await this.reviewService.createReview(createReviewDto, id);
      return {
        status: HttpStatus.CREATED,
        message: 'your review posted successful',
        data: res,
      };
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }
  @Post('reply')
  @ValidateAuth()
  @ApiBearerAuth()
  async postReviewReplay(
    @Body() dto: ReviewReplyDTO,
    @GetUser('sub') id: string,
  ) {
    try {
      const res = await this.reviewService.postReplyOfReview(dto, id);
      return res;
    } catch (error) {
      throw new HttpException(error.message, error.status);
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
