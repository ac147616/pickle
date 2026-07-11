import Constants from 'expo-constants';

/**
 * Resolves the LAN IP of the machine running `expo start`, so a physical
 * device on the same WiFi can reach the locally-running API and Firebase
 * emulator without hardcoding an IP. Falls back to EXPO_PUBLIC_DEV_HOST
 * (set in .env) for tunnel mode / simulators where hostUri isn't a LAN IP.
 */
export function getDevHost(): string {
  const override = process.env.EXPO_PUBLIC_DEV_HOST;
  if (override) {
    return override;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) {
    return host;
  }

  return 'localhost';
}
