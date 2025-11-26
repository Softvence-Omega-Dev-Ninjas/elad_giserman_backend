import { PrismaService } from '@/lib/prisma/prisma.service';
import {
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewReplyDTO } from './dto/create-reviewReply';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  // create review according to restaurnt or bussiness profile
  async createReview(createReviewDto: CreateReviewDto, userId: string) {
    if (!createReviewDto.businessProfileId) {
      throw new HttpException(
        'BussinessProfile id is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const bussineesProfile = await this.prisma.client.businessProfile.findUnique({
      where: {
        id: createReviewDto.businessProfileId,
      },
    });
    if (bussineesProfile?.ownerId === userId) {
      throw new HttpException(
        'user can not give review on his own profile',
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.prisma.client.review.create({
      data: {
        comment: createReviewDto.comment,
        rating: createReviewDto.rating,
        businessProfileId: createReviewDto.businessProfileId,
        userId: userId,
      },
    });
    return result;
  }

  // update reivew----this review just can update by admin and review owner
  async updateReview(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ) {
    const review = await this.prisma.client.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new HttpException('Review not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isAdmin = user.role === 'ADMIN';
    const isOwner = review.userId === userId;

    // just admin and review owner can update his review
    if (!isAdmin && !isOwner) {
      throw new HttpException(
        'You are not authorized to update this review',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const updatedReview = await this.prisma.client.review.update({
      where: { id },
      data: {
        comment: updateReviewDto.comment,
        rating: updateReviewDto.rating,
      },
    });

    return updatedReview;
  }

  // post review of reply
  async postReplyOfReview(dto: ReviewReplyDTO, userId: string) {
    const { reviewId, comment } = dto;
    if (!reviewId) {
      throw new NotFoundException('Review id required');
    }
    const isExistReview = await this.prisma.client.review.findMany({
      where: {
        id: reviewId,
      },
    });
    if (!isExistReview) {
      throw new NotFoundException('The review not found with this id');
    }

    const res = await this.prisma.client.reviewReply.create({
      data: {
        comment: comment,
        reviewId,
        userId: userId,
      },
    });
    return res;
  }
}
