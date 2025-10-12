import { Global, Module } from '@nestjs/common';
import { FileService } from './file.service';

@Global()
@Module({
  providers: [FileService],
})
export class FileModule {}
