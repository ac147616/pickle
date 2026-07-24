import {
  RequestVerificationDocument,
  UploadContentType,
  VerificationDocumentUploadResponse,
} from '@pickle/types';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useMe } from '@/contexts/me-context';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';

const ALLOWED_CONTENT_TYPES: readonly UploadContentType[] = ['image/jpeg', 'image/png'];

function resolveContentType(mimeType: string | undefined): UploadContentType {
  if (mimeType && (ALLOWED_CONTENT_TYPES as readonly string[]).includes(mimeType)) {
    return mimeType as UploadContentType;
  }
  return 'image/jpeg';
}

export default function IndividualOnboardingScreen() {
  const theme = useTheme();
  const { refetch } = useMe();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(source: 'camera' | 'library') {
    setError(null);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permission needed to continue.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) {
      return;
    }

    await uploadDocument(asset);
  }

  async function uploadDocument(asset: ImagePicker.ImagePickerAsset) {
    setSubmitting(true);
    setError(null);
    try {
      const contentType = resolveContentType(asset.mimeType);
      const { uploadUrl } = await apiFetch<VerificationDocumentUploadResponse>(
        '/verification-documents',
        {
          method: 'POST',
          body: JSON.stringify({
            docType: 'ID',
            contentType,
          } satisfies RequestVerificationDocument),
        },
      );

      const file = new File(asset.uri);
      const uploadResult = await file.upload(uploadUrl, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': contentType },
      });
      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload failed (${uploadResult.status})`);
      }

      // Flips needsOnboarding to false server-side - the root layout's
      // Stack.Protected guard picks this up and routes into (tabs).
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Verify your identity
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          A photo of your driver licence or passport. This stays private and is only used to
          verify you.
        </ThemedText>

        {error && (
          <ThemedText themeColor="text" style={styles.error}>
            {error}
          </ThemedText>
        )}

        {submitting ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <>
            <Pressable
              style={[styles.button, { backgroundColor: theme.text }]}
              onPress={() => void handlePick('camera')}>
              <ThemedText themeColor="background" type="smallBold">
                Take a photo
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.button, { borderWidth: 1, borderColor: theme.backgroundSelected }]}
              onPress={() => void handlePick('library')}>
              <ThemedText type="smallBold">Choose from library</ThemedText>
            </Pressable>
          </>
        )}

        <Link href="/(onboarding)/choose-lane" style={styles.link}>
          <ThemedText type="link">Back</ThemedText>
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
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  error: {
    textAlign: 'center',
  },
  link: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
});
