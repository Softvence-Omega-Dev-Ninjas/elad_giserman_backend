import { Global, Module } from '@nestjs/common';
import { SuperAdminService } from './services/super-admin.service';
import { FileService } from './services/file.service';

@Global()
@Module({
  imports: [],
  providers: [SuperAdminService, FileService],
})
export class SeedModule {}
