import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CategoryDto } from '../dto/createCategory.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}
  async createCategory(dto: CategoryDto) {
    const category = await this.prisma.client.category.create({
      data: {
        name: dto.name,
      },
    });
    return category;
  }
}
