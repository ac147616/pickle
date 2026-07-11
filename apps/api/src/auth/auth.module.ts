import { Module } from '@nestjs/common';

import { AdminController } from './admin.controller';
import { AuthGuard } from './auth.guard';
import { firebaseAdminProvider } from './firebase-admin.provider';
import { MeController } from './me.controller';
import { RolesGuard } from './roles.guard';

@Module({
  controllers: [MeController, AdminController],
  providers: [firebaseAdminProvider, AuthGuard, RolesGuard],
  exports: [firebaseAdminProvider, AuthGuard, RolesGuard],
})
export class AuthModule {}
