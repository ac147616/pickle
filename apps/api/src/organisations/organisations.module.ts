import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NzbnClient } from './nzbn-client';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganisationsController],
  providers: [OrganisationsService, NzbnClient],
})
export class OrganisationsModule {}
