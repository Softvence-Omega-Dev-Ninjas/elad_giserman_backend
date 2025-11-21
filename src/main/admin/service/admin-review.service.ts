import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetReviewDto } from '../dto/getReview.dto';

@Injectable()
export class AdminReviewService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all reviews
  async getReviews(filter:GetReviewDto) {
    const {page=1,limit=10,search}=filter
    const skip=(page-1)*limit
    const where:any={}
    if(search){
      where.OR=[
        {user:{name:{contains:search}}},
        {businessProfile:{title:{contains:search}}}
      ]
    }
    try {
      const result = await this.prisma.review.findMany({
        where,
        skip,
        take:limit,
        include:{
          user:{
            select:{
              name:true
            }
          },
          businessProfile:{
            select:{
              title:true
            }
          }
        }
      });
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
    await this.prisma.review.delete({
      where: { id },
    });
    return {
      status: HttpStatus.ACCEPTED,
      messge: 'reivew delete successfull',
    };
  }
}
