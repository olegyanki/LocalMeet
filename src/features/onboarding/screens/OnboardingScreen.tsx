import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@shared/contexts/AuthContext';
import { COLORS } from '@shared/constants';
import { useI18n } from '@shared/i18n';
import { updateProfile } from '@shared/lib/api';
import PrimaryButton from '@shared/components/PrimaryButton';

const BG_COLOR = '#F5F5F5';
export default function OnboardingScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('Looking for someone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError('');
      await updateProfile(user.id, {
        bio,
        status,
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('completeProfile')}</Text>
      <Text style={styles.subtitle}>{t('tellMoreAboutYou')}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.label}>{t('statusLabel')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('statusPlaceholder')}
        placeholderTextColor={COLORS.TEXT_LIGHT}
        value={status}
        onChangeText={setStatus}
        multiline
        numberOfLines={2}
        editable={!isLoading}
      />

      <Text style={styles.label}>{t('aboutYou')}</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder={t('aboutYouPlaceholder')}
        placeholderTextColor={COLORS.TEXT_LIGHT}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        editable={!isLoading}
      />

      <PrimaryButton
        title={t('continue')}
        onPress={handleContinue}
        disabled={isLoading}
        loading={isLoading}
        style={{ marginTop: 24 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  content: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    marginBottom: 24,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FADBD8',
    borderRadius: 8,
  },
});
