import { Controller, Get, UseGuards } from '@nestjs/common';
import { MeResponse, MeResponseSchema } from '@pickle/types';

import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from './auth.guard';
import { AuthenticatedUser } from './authenticated-user';
import { CurrentUser } from './current-user.decorator';

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    return MeResponseSchema.parse({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      needsOnboarding: await this.needsOnboarding(user),
    });
  }

  private async needsOnboarding(user: AuthenticatedUser): Promise<boolean> {
    if (user.role === 'ADMIN') {
      return false;
    }
    const [organisationMember, verificationDocument] = await Promise.all([
      this.prisma.organisationMember.findFirst({ where: { userId: user.id } }),
      this.prisma.verificationDocument.findFirst({
        where: { ownerUserId: user.id },
      }),
    ]);
    return !organisationMember && !verificationDocument;
  }
}
