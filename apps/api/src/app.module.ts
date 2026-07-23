import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { VerificationDocumentsModule } from './verification-documents/verification-documents.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StorageModule,
    OrganisationsModule,
    VerificationDocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
