import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useMe } from '@/contexts/me-context';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const { me } = useMe();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Kia ora{user?.displayName ? `, ${user.displayName}` : ''}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          You&apos;re signed in to Pickle.
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">API session (GET /me)</ThemedText>
          {!me && <ThemedText themeColor="textSecondary">Loading…</ThemedText>}
          {me && (
            <>
              <ThemedText themeColor="textSecondary">email: {me.email}</ThemedText>
              <ThemedText themeColor="textSecondary">role: {me.role}</ThemedText>
              <ThemedText themeColor="textSecondary">status: {me.status}</ThemedText>
            </>
          )}
        </ThemedView>

        <Pressable style={[styles.button, { borderColor: theme.text }]} onPress={() => void signOut()}>
          <ThemedText type="smallBold">Sign out</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  button: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
});
