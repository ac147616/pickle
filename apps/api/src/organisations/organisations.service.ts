import { Injectable } from '@nestjs/common';
import { CreateOrganisationRequest } from '@pickle/types';

import { OrgMemberRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  // The creator becomes OWNER in the same transaction the org is created in
  // - there's no path to an org existing without an owner member.
  create(userId: string, request: CreateOrganisationRequest) {
    return this.prisma.organisation.create({
      data: {
        name: request.name,
        nzbn: request.nzbn ?? null,
        type: request.type,
        members: {
          create: { userId, memberRole: OrgMemberRole.OWNER },
        },
      },
    });
  }
}
