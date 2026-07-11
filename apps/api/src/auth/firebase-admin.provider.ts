import { Provider } from '@nestjs/common';
import { App, getApps, initializeApp } from 'firebase-admin/app';

// FIREBASE_AUTH_EMULATOR_HOST (set in .env for dev/test) redirects every Admin
// SDK auth call to the local emulator automatically - no code branching needed.
// No credentials are configured here because the emulator doesn't check them;
// a real deployment will need to add applicationDefault() credentials.
export const FIREBASE_ADMIN_APP = 'FIREBASE_ADMIN_APP';

export const firebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN_APP,
  useFactory: (): App => {
    const [existing] = getApps();
    if (existing) {
      return existing;
    }
    return initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-pickle',
    });
  },
};
