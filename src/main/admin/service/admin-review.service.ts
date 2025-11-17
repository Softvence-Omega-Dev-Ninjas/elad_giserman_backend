import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class AdminReviewService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all reviews
  async getReviews() {
    try {
      const result = await this.prisma.review.findMany();
      return result;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  // delete review  by admin
  async deleteReview(id: string) {
    if (!id) {
      throw new NotFoundException('user id is required');
    }
    const isExistReivew = await this.prisma.review.findUnique({
      where: {
        id: id,
      },
    });
    if (!isExistReivew) {
      throw new HttpException('Review not found', HttpStatus.NOT_FOUND);
    }
    const res = await this.prisma.review.delete({
      where: { id },
    });
    return {
      status: HttpStatus.ACCEPTED,
      messge: 'reivew delete successfull',
    };
  }


}
