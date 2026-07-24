import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Stub only - NZBN lookup + org creation is milestone 1.1 stage D.
export default function BusinessOnboardingScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Business onboarding
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Coming soon. For now, continue as an individual.
        </ThemedText>
        <Link href="/(onboarding)/choose-lane" style={styles.link}>
          <ThemedText type="linkPrimary">Back</ThemedText>
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
