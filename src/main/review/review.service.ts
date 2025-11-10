import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from '@/lib/prisma/prisma.service';

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
    const result = await this.prisma.review.create({
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
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new HttpException('Review not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.prisma.user.findUnique({
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
    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: {
        comment: updateReviewDto.comment,
        rating: updateReviewDto.rating,
      },
    });

    return updatedReview;
  }
}
