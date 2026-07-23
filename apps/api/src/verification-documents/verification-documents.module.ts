import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { VerificationDocumentsController } from './verification-documents.controller';
import { VerificationDocumentsService } from './verification-documents.service';

@Module({
  imports: [AuthModule],
  controllers: [VerificationDocumentsController],
  providers: [VerificationDocumentsService],
})
export class VerificationDocumentsModule {}
