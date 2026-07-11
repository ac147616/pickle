import { Controller, Get, UseGuards } from '@nestjs/common';

import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from './authenticated-user';

interface MeResponse {
  id: string;
  email: string | null;
  fullName: string;
  role: string;
  status: string;
}

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser): MeResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };
  }
}
