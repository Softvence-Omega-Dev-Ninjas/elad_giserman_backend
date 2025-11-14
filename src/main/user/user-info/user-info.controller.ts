import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, HttpStatus, HttpException, InternalServerErrorException } from '@nestjs/common';
import { UserInfoService } from './user-info.service';
import { CreateUserInfoDto } from './dto/create-user-info.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { GetUser, ValidateAuth } from '@/common/jwt/jwt.decorator';

@Controller('user-info')
@ApiBearerAuth()
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

  @Get('my-profile')
  async findMyProfile(@GetUser('sub') id:string) {
   try{
     const res=await this.userInfoService.finMyProfile(id);
     return{
      message:"Profile fetch succesful",
      data:res
     }
   }catch(error){
    throw new InternalServerErrorException(error.message,error.status)
   }
  }


  @Patch()
  @ValidateAuth()
  @ApiBody({type:UpdateUserInfoDto})
  @ApiConsumes('multipart/form-data')
   @UseInterceptors(FileInterceptor('file'))
 async updateUserProfile(@Body() updateUserInfoDto: UpdateUserInfoDto,@UploadedFile() file:Express.Multer.File,@GetUser('sub') id:string) {
    try{
      const res=await this.userInfoService.updateUserProfile(id, updateUserInfoDto,file);
      return{
        status:HttpStatus.OK,
        message:"Your profile updated successful",
        data:res
      }
    }catch(error){
      throw new HttpException(error.message,error.status)
    }
  }

  @Delete('delete-my-account')
  async deleteMyAccount(@GetUser('sub') id:string) {
    try{  
      const res=await this.userInfoService.deleteMyAccount(id);
      return{
        status:HttpStatus.OK,
        message:"Your account deleted successful"
      }
    }catch(error){
      throw new InternalServerErrorException(error.message,error.status)
    }
  }
}
