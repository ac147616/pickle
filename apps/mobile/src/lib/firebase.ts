import { getApp } from '@react-native-firebase/app';
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';

import { getDevHost } from './dev-host';

// Unlike the JS SDK, the default app here is created automatically from the
// native google-services.json (see app.json's android.googleServicesFile) at
// app launch - no initializeApp() call needed.
export const auth = getAuth(getApp());

connectAuthEmulator(auth, `http://${getDevHost()}:9099`, { disableWarnings: true });
