import { Module } from '@nestjs/common';
import { UserFavoriteService } from './user-favorite.service';
import { UserFavoriteController } from './user-favorite.controller';

@Module({
  controllers: [UserFavoriteController],
  providers: [UserFavoriteService],
})
export class UserFavoriteModule {}
