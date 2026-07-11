import { Controller, Get, UseGuards } from '@nestjs/common';

import { UserRole } from '../generated/prisma/client';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

// Placeholder proving the role-guard chain works end to end; real admin
// routes (verification queue, disputes, refunds) land in milestone 1.2.
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  @Get('ping')
  @Roles(UserRole.ADMIN)
  ping(): { ok: true } {
    return { ok: true };
  }
}
