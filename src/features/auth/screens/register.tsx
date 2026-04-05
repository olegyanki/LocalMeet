import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUp } from '@shared/lib/auth';
import { markLoggedIn } from '@shared/lib/authPreference';
import { COLORS, INPUT_STYLES } from '@shared/constants';
import { useI18n } from '@shared/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@shared/components/PrimaryButton';
import { Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const handleGoToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/auth/login');
    }
  };

  const handleRegister = async () => {
    setError('');

    if (!email.trim() || !password) {
      setError(t('authFillAllFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('authPasswordTooShort'));
      return;
    }

    try {
      setIsLoading(true);
      await signUp({ email: email.trim(), password, first_name: '' });
      await markLoggedIn();
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message ?? t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('newAccount')}</Text>
          <Text style={styles.subtitle}>{t('registerSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('email').toUpperCase()}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={t('email')}
                placeholderTextColor={COLORS.GRAY_PLACEHOLDER}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password').toUpperCase()}</Text>
            <View style={[styles.inputWrapper, styles.passwordWrapper]}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t('password')}
                placeholderTextColor={COLORS.GRAY_PLACEHOLDER}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              {isPasswordFocused && password.length > 0 && (
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                  {showPassword
                    ? <EyeOff size={20} color={COLORS.TEXT_LIGHT} />
                    : <Eye size={20} color={COLORS.TEXT_LIGHT} />
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>

          <PrimaryButton
            title={t('registerButton')}
            onPress={handleRegister}
            disabled={isLoading}
            loading={isLoading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>{t('haveAccount')}</Text>
            <TouchableOpacity onPress={handleGoToLogin} disabled={isLoading}>
              <Text style={styles.loginLink}>{t('loginLink')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
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
    ...INPUT_STYLES.label,
  },
  inputWrapper: {
    ...INPUT_STYLES.wrapper,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    ...INPUT_STYLES.input,
    flex: 1,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeButton: {
    padding: 14,
  },
  errorContainer: {
    backgroundColor: COLORS.ERROR_BG,
    padding: 12,
    borderRadius: 16,
  },
  errorText: {
    color: COLORS.ERROR_RED,
    fontSize: 14,
    fontWeight: '500',
  },
  loginSection: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  loginText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.ACCENT_ORANGE,
    fontSize: 15,
    fontWeight: '600',
  },
});
