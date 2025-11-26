import { ValidateAdmin } from '@/common/jwt/jwt.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from '../service/admin.category.service';
import { CategoryDto, updateCategoryDto } from '../dto/createCategory.dto';
import { dot } from 'node:test/reporters';

@Controller('category')
export class CategoryContoller {
  constructor(private readonly categoryService: CategoryService) {}

  @ValidateAdmin()
  @Post('create')
  async createCategory(@Body() dto:CategoryDto) {
    try {
      const category = await this.categoryService.createCategory(dto);
      return{
        status:HttpStatus.OK,
        message:'Category created successfully',
        data:category
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @Get('all')
  async getAllCategories() {
    try {
      const categories = await this.categoryService.getAllCategories();
      return {
        status: HttpStatus.OK,
        message: 'Categories fetched successfully',
        data: categories,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @Patch('update/:id')
  async updateCategory(@Param('id') id:string,@Body() dto:updateCategoryDto) {
    try {
      const category = await this.categoryService.updateCategory(id,dto);
      return {
        status: HttpStatus.OK,
        message: 'Category updated successfully',
        data: category,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @Delete('delete/:id')
  async deleteCategory(@Param('id') id:string) {
    try {
      const category = await this.categoryService.deleteCategory(id);
      return{
        status:HttpStatus.OK,
        message:'Category deleted successfully',
        data:category
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }
}
