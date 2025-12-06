import { PartialType } from '@nestjs/swagger';
import { CreateFavoriteDto } from './create-user-favorite.dto';

export class UpdateUserFavoriteDto extends PartialType(CreateFavoriteDto) {}
