import { Injectable } from '@nestjs/common';

import { UpdateUserFavoriteDto } from './dto/update-user-favorite.dto';
import { CreateFavoriteDto } from './dto/create-user-favorite.dto';
import { PrismaService } from '@/lib/prisma/prisma.service';

@Injectable()
export class UserFavoriteService {
  constructor(private readonly prisma:PrismaService){}
async toggleFavorite( dto: CreateFavoriteDto,userId: string,) {
  const existing = await this.prisma.client.favorite.findFirst({
    where: {
      userId,
      restaurantId: dto.restaurantId,
    },
  });

  if (existing) {
    // If exists, remove it
    await this.prisma.client.favorite.delete({
      where: { id: existing.id },
    });
    return { message: 'Favorite removed', favorite: null };
  } else {
    // If not exists, create it
    const favorite = await this.prisma.client.favorite.create({
      data: {
        userId,
        restaurantId: dto.restaurantId,
      },
    });
    return { message: 'Favorite added', favorite };
  }
}


  async findAll(userId:string) {
    const res=await this.prisma.client.favorite.findMany({
      where:{
        userId:userId
      },
      include:{
        restaurant:{
          select:{
            id:true,
            title:true,
            closingTime:true,
            openingTime:true,
            category:{
              select:{name:true}
            },
            gallery:{
              select:{url:true}
            }
          }
        }
      }
    })
    return res
  }

}
