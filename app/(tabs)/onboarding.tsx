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
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../lib/api';

const BG_COLOR = '#F5F5F5';
const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
const INPUT_BG = '#FFFFFF';
const BORDER_COLOR = '#E8E8E8';

export default function OnboardingScreen() {
  const { user } = useAuth();
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
      <Text style={styles.title}>Завершіть ваш профіль</Text>
      <Text style={styles.subtitle}>Розкажіть про себе трохи більше</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.label}>Статус (те що вам цікаво прямо зараз)</Text>
      <TextInput
        style={styles.input}
        placeholder="Наприклад: Гуляю в парку, шукаю компанію"
        placeholderTextColor={TEXT_LIGHT}
        value={status}
        onChangeText={setStatus}
        multiline
        numberOfLines={2}
        editable={!isLoading}
      />

      <Text style={styles.label}>Про вас</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Розкажіть про себе, ваші інтереси..."
        placeholderTextColor={TEXT_LIGHT}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Продовжити</Text>
        )}
      </TouchableOpacity>
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
    color: TEXT_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_LIGHT,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 24,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: ACCENT_ORANGE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
