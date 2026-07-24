import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function ChooseLaneScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          One more step
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Tell us a bit about how you&apos;ll use Pickle.
        </ThemedText>

        <Link href="/(onboarding)/individual" asChild>
          <Pressable style={[styles.card, { borderColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">Shipping something personally</ThemedText>
            <ThemedText themeColor="textSecondary">
              A couch, a few boxes, one-off items. Just an ID document to verify you.
            </ThemedText>
          </Pressable>
        </Link>

        <Link href="/(onboarding)/business" asChild>
          <Pressable style={[styles.card, { borderColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">I run a business</ThemedText>
            <ThemedText themeColor="textSecondary">
              Shipping or carrying freight as a company. We&apos;ll verify your NZBN.
            </ThemedText>
          </Pressable>
        </Link>

        <Pressable style={styles.link} onPress={() => void signOut()}>
          <ThemedText type="link">Sign out</ThemedText>
        </Pressable>
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
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  card: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  link: {
    alignSelf: 'center',
    marginTop: Spacing.three,
  },
});
