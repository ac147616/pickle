import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateOrganisationRequest,
  CreateOrganisationRequestSchema,
  NzbnLookupResponse,
  NzbnLookupResponseSchema,
  Organisation,
  OrganisationSchema,
} from '@pickle/types';

import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { serializeDates } from '../common/serialize-dates';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { NzbnClient } from './nzbn-client';
import { OrganisationsService } from './organisations.service';

@Controller('organisations')
@UseGuards(AuthGuard)
export class OrganisationsController {
  constructor(
    private readonly organisations: OrganisationsService,
    private readonly nzbnClient: NzbnClient,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateOrganisationRequestSchema))
    body: CreateOrganisationRequest,
  ): Promise<Organisation> {
    const organisation = await this.organisations.create(user.id, body);
    return OrganisationSchema.parse(serializeDates(organisation));
  }

  @Get('nzbn/:nzbn')
  async lookupNzbn(@Param('nzbn') nzbn: string): Promise<NzbnLookupResponse> {
    const result = await this.nzbnClient.lookup(nzbn);
    if (!result) {
      throw new NotFoundException({
        code: 'NZBN_NOT_FOUND',
        message: 'NZBN not found',
      });
    }
    return NzbnLookupResponseSchema.parse(result);
  }
}
