import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserFavoriteService } from './user-favorite.service';

import { CreateFavoriteDto } from './dto/create-user-favorite.dto';
import { GetUser, ValidateAuth } from '@/common/jwt/jwt.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('user-favorite')
@ApiBearerAuth()
export class UserFavoriteController {
  constructor(private readonly userFavoriteService: UserFavoriteService) {}

  @Post()
  @ValidateAuth()
  @ApiOperation({ summary: 'Toggle favorite' })
  @ApiBody({ type: CreateFavoriteDto })
  async create(
    @Body() createUserFavoriteDto: CreateFavoriteDto,
    @GetUser('sub') userId: string,
  ) {
    try {
      const res = await this.userFavoriteService.toggleFavorite(
        createUserFavoriteDto,
        userId,
      );
      return res;
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }

  @Get('my-favorite')
  @ValidateAuth()
  async findAll(@GetUser('sub') userId: string) {
    try {
      const res = await this.userFavoriteService.findAll(userId);
      return {
        statusCode: 200,
        message: 'Favorite fetch successful',
        data: res,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message, error.status);
    }
  }
}
