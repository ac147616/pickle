import { deleteApp, FirebaseApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
} from 'firebase/auth';

// Mints real ID tokens against the local Auth emulator (firebase.json) via
// the same client SDK the mobile app uses, so e2e tests exercise the actual
// verification path instead of a mocked token.
let app: FirebaseApp | undefined;

function getTestFirebaseApp(): FirebaseApp {
  app ??= initializeApp({ apiKey: 'test-api-key', projectId: 'demo-pickle' });
  return app;
}

export async function mintIdToken(
  email: string,
  password = 'Password123!',
): Promise<string> {
  const auth = getAuth(getTestFirebaseApp());
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return credential.user.getIdToken();
}

export async function teardownTestFirebaseApp(): Promise<void> {
  if (app) {
    await deleteApp(app);
    app = undefined;
  }
}
