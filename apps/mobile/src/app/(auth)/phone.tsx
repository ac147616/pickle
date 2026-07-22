import { getAuth, signInWithPhoneNumber, ConfirmationResult } from '@react-native-firebase/auth';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// NZ mobile numbers only for now - strips a leading 0 and prefixes +64.
// Numbers already in E.164 form (leading +) are passed through untouched.
function toE164(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('+')) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, '');
  return `+64${digits.replace(/^0+/, '')}`;
}

export default function PhoneSignInScreen() {
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await signInWithPhoneNumber(getAuth(), toE164(phone));
      setConfirmation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCode() {
    if (!confirmation) return;
    setError(null);
    setSubmitting(true);
    try {
      await confirmation.confirm(code.trim());
      // onAuthStateChanged (in AuthProvider) picks up the signed-in user
      // from here - no manual navigation needed.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Phone sign-in
        </ThemedText>

        {!confirmation ? (
          <>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Enter your NZ mobile number
            </ThemedText>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              placeholder="021 234 5678"
              placeholderTextColor={theme.textSecondary}
              autoComplete="tel"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {error && (
              <ThemedText themeColor="text" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <Pressable
              style={[styles.button, { backgroundColor: theme.text }, submitting && styles.disabled]}
              disabled={submitting || !phone}
              onPress={handleSendCode}>
              {submitting ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <ThemedText themeColor="background" type="smallBold">
                  Send code
                </ThemedText>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Enter the code sent to {toE164(phone)}
            </ThemedText>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />

            {error && (
              <ThemedText themeColor="text" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <Pressable
              style={[styles.button, { backgroundColor: theme.text }, submitting && styles.disabled]}
              disabled={submitting || !code}
              onPress={handleConfirmCode}>
              {submitting ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <ThemedText themeColor="background" type="smallBold">
                  Confirm code
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={styles.link}
              onPress={() => {
                setConfirmation(null);
                setCode('');
                setError(null);
              }}>
              <ThemedText type="link">Use a different number</ThemedText>
            </Pressable>
          </>
        )}

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
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    textAlign: 'center',
  },
  link: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
});
