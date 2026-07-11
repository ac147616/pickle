import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuthInternal from '@firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth, initializeAuth, Persistence } from 'firebase/auth';
import { Platform } from 'react-native';

import { getDevHost } from './dev-host';

interface ReactNativeAsyncStorageShape {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

// @firebase/auth's package.json exports map lists a top-level "types"
// condition before its "react-native" condition, so TypeScript always
// resolves the generic (non-RN) declaration file and never sees
// getReactNativePersistence - even though it exists and works correctly at
// runtime (Metro resolves the "react-native" condition fine; this is a
// types-only gap). A `declare module` augmentation looked like the obvious
// fix but actually replaces @firebase/auth's real types wholesale instead of
// merging - this local cast is more contained.
const getReactNativePersistence = (
  FirebaseAuthInternal as unknown as {
    getReactNativePersistence: (storage: ReactNativeAsyncStorageShape) => Persistence;
  }
).getReactNativePersistence;

// Emulator-only config (see firebase.json / .firebaserc) - apiKey is never
// validated by the emulator, projectId must match .firebaserc's "demo-pickle".
const firebaseConfig = {
  apiKey: 'demo-pickle-api-key',
  projectId: 'demo-pickle',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    // React Native needs an explicit persistence layer; Fast Refresh can
    // re-run this module against an app that's already initialized, which
    // throws - fall back to the existing instance in that case.
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();

connectAuthEmulator(auth, `http://${getDevHost()}:9099`, { disableWarnings: true });
