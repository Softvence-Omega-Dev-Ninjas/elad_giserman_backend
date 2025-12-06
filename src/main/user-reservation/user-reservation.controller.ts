import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { UserReservationService } from './user-reservation.service';

import { UpdateUserReservationDto } from './dto/update-user-reservation.dto';
import { CreateReservationDto } from './dto/create-user-reservation.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { GetUser, ValidateAuth } from '@/common/jwt/jwt.decorator';


@Controller('user-reservation')
@ApiBearerAuth()
export class UserReservationController {
  constructor(private readonly userReservationService: UserReservationService) {}

  @ValidateAuth()
  @Post()
  @ApiBody({type:CreateReservationDto})
  async create(@Body() createUserReservationDto: CreateReservationDto,@GetUser('sub') userId:string) {
    try{
      const res=await this.userReservationService.create(createUserReservationDto,userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Your Reservation succesful',
      data: res,
    }
    }catch(error){
      throw new InternalServerErrorException(error.message,error.status)
    }
  }

  @Get()
  @ValidateAuth()
  @ApiOperation({summary:"Get Users Reservation"})
  async findAll(@GetUser('sub') userId:string) {
    try{
        const res=await this.userReservationService.findAll(userId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Your Reservation succesful',
        data: res,
      }
    }catch(error){
      throw new InternalServerErrorException(error.message, error.status)
    }

  }

  @Get('singleReservation/:id')
 async findOne(@Param('id') id: string) {
    try{
      const res=await this.userReservationService.findOne(id)
      return {
        statusCode: HttpStatus.OK,
        message: 'Your Reservation succesful',
        data: res,
      }
    }catch(error){
      throw new InternalServerErrorException(error.message, error.status)
    
    }

  }



  @Delete('delete/:id')
  async remove(@Param('id') id: string) {
    try{
      const res=await this.userReservationService.remove(id);
      return{
        statusCode: HttpStatus.OK,
        message: ' Reservation Deleted  succesful'
      }
    }catch(error){
      throw new InternalServerErrorException(error.message, error.status)
    
    }
  }
}
