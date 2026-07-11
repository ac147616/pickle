import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Stub only. Native phone OTP needs @react-native-firebase, which needs a
// dev-client build (not Expo Go) - see BUILD_PLAN.md milestone 1.0.
export default function PhoneSignInScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Phone sign-in
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Coming soon. For now, sign in with email.
        </ThemedText>
        <Link href="/(auth)/sign-in" style={styles.link}>
          <ThemedText type="linkPrimary">Back to sign in</ThemedText>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  link: {
    marginTop: Spacing.three,
  },
});
