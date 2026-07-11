import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { UserRole, UserStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './authenticated-user';
import { FIREBASE_ADMIN_APP } from './firebase-admin.provider';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(FIREBASE_ADMIN_APP) private readonly firebaseApp: App,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException({
        code: 'AUTH_MISSING_TOKEN',
        message: 'Missing bearer token',
      });
    }

    let firebaseUid: string;
    let email: string | null;
    let displayName: string | null;
    try {
      const decoded = await getAuth(this.firebaseApp).verifyIdToken(token);
      firebaseUid = decoded.uid;
      email = decoded.email ?? null;
      displayName = (decoded.name as string | undefined) ?? null;
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_TOKEN',
        message: 'Invalid or expired token',
      });
    }

    const user = await this.loadOrProvisionUser(
      firebaseUid,
      email,
      displayName,
    );

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: 'AUTH_ACCOUNT_SUSPENDED',
        message: 'Account suspended',
      });
    }

    request.user = user;
    return true;
  }

  private async loadOrProvisionUser(
    firebaseUid: string,
    email: string | null,
    displayName: string | null,
  ): Promise<AuthenticatedUser> {
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });
    if (existing) {
      return existing;
    }

    const fullName = displayName ?? email?.split('@')[0] ?? 'New user';
    return this.prisma.user.create({
      data: {
        firebaseUid,
        email,
        fullName,
        role: UserRole.SHIPPER,
      },
    });
  }
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length).trim() || null;
}
