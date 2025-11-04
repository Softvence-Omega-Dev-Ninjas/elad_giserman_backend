import { Module } from '@nestjs/common';
import { FileModule } from './file/file.module';
import { FirebaseModule } from './firebase/firebase.module';
import { MailModule } from './mail/mail.module';
import { MulterModule } from './multer/multer.module';
import { PrismaModule } from './prisma/prisma.module';
import { S3BucketModule } from './s3/s3.module';
import { SeedModule } from './seed/seed.module';
import { StripeModule } from './stripe/stripe.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [
    SeedModule,
    PrismaModule,
    MailModule,
    UtilsModule,
    FileModule,
    MulterModule,
    StripeModule,
    FirebaseModule,
    S3BucketModule,
  ],
  exports: [],
  providers: [],
})
export class LibModule {}
