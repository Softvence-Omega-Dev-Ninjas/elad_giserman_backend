import { ValidateAdmin } from "@/common/jwt/jwt.decorator";
import { Controller, Delete, Get, InternalServerErrorException, Patch, Post } from "@nestjs/common";
import { CategoryService } from "../service/admin.category.service";

@Controller('category')
export class CategoryContoller{
    constructor(
        private readonly categoryService:CategoryService
    ){}


    @ValidateAdmin()
    @Post('create')
    async createCategory(){
        try{

        }catch(error){
            throw new InternalServerErrorException(error.message,error.status)
        }
    }

    @Get('all')
    async getAllCategories(){
        try{

        }catch(error){
            throw new InternalServerErrorException(error.message, error.status)
        }
    }

    @Patch('update/:id')
    async updateCategory(){
        try{

        }catch(error){
            throw new InternalServerErrorException(error.message, error.status)
        }
    }

    @Delete('delete/:id')
    async deleteCategory(){
        try{

        }catch(error){
            throw new InternalServerErrorException(error.message, error.status)
        }
    }
}