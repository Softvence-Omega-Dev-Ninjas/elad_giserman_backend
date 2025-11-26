import { PrismaService } from '@/lib/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CategoryDto, updateCategoryDto } from '../dto/createCategory.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // *create category
  async createCategory(dto: CategoryDto) {
    const category = await this.prisma.client.category.create({
      data: {
        name: dto.name,
      },
    });
    return category;
  }

  //* GET ALL GATEGORYIS
  async getAllCategories() {
    const categories = await this.prisma.client.category.findMany();
    return categories;
  }

  async updateCategory(id: string, dto: updateCategoryDto) {
    const isExistcategory = await this.prisma.client.category.findUnique({
      where: {
        id: id,
      },
    });
    if (!isExistcategory) {
      throw new Error('Category not found');
    }
    const category = await this.prisma.client.category.update({
      where: {
        id: id,
      },
      data: {
        name: dto.name,
      },
    });
    return category;
  }

  //*dELETE CATEGORY
  async deleteCategory(id: string) {
    const isExistcategory = await this.prisma.client.category.findUnique({
      where: {
        id: id,
      },
    });
    if (!isExistcategory) {
      throw new Error('Category not found');
    }
    const category = await this.prisma.client.category.delete({
      where: {
        id: id,
      },
    });
    return category;
  }
}
