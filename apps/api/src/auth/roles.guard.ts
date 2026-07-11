import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../generated/prisma/client';
import { AuthenticatedRequest } from './auth.guard';
import { ROLES_KEY } from './roles.decorator';

// Must run after AuthGuard - it reads request.user, which only AuthGuard sets.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        code: 'AUTH_ROLE_FORBIDDEN',
        message: 'Insufficient role',
      });
    }
    return true;
  }
}
