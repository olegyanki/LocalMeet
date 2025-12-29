import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@shared/i18n';
import { signIn } from '@shared/lib/auth';
import { COLORS } from '@shared/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await signIn({ email, password });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('hello')}</Text>
          <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              placeholderTextColor={COLORS.TEXT_LIGHT}
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('password')}
              placeholderTextColor={COLORS.TEXT_LIGHT}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>{t('loginButton')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerSection}>
            <Text style={styles.registerText}>{t('noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')} disabled={isLoading}>
              <Text style={styles.registerLink}>{t('registerLink')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loginButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: ERROR_BG,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: ERROR_RED,
    fontSize: 14,
    fontWeight: '500',
  },
  registerSection: {
    marginTop: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  registerText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 15,
  },
  registerLink: {
    color: COLORS.ACCENT_ORANGE,
    fontSize: 15,
    fontWeight: '600',
  },
});
