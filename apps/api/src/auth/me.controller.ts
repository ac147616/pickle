import { Controller, Get, UseGuards } from '@nestjs/common';
import { MeResponse, MeResponseSchema } from '@pickle/types';

import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from './authenticated-user';

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser): MeResponse {
    return MeResponseSchema.parse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    });
  }
}
