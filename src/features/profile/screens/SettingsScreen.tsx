import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@shared/i18n';
import { useRouter } from 'expo-router';
import { signOut } from '@shared/lib/auth';
import { COLORS, SIZES, HEADER_STYLES } from '@shared/constants';
import PrimaryButton from '@shared/components/PrimaryButton';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { 
          paddingTop: insets.top + 16, 
          paddingBottom: SIZES.TAB_BAR_HEIGHT + 20 
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>{t('settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('appLanguage').toUpperCase()}</Text>
        <View style={styles.languageSwitcher}>
          <Pressable
            style={[styles.langButton, language === 'uk' && styles.langButtonActive]}
            onPress={() => setLanguage('uk')}
          >
            <Text style={[styles.langButtonText, language === 'uk' && styles.langButtonTextActive]}>
              🇺🇦 Українська
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langButton, language === 'en' && styles.langButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langButtonText, language === 'en' && styles.langButtonTextActive]}>
              🇬🇧 English
            </Text>
          </Pressable>
        </View>
      </View>

      <PrimaryButton
        title={t('logout')}
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
    paddingHorizontal: 24,
  },
  header: {
    ...HEADER_STYLES.container,
  },
  headerSpacer: {
    ...HEADER_STYLES.spacer,
  },
  title: {
    ...HEADER_STYLES.title,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  languageSwitcher: {
    flexDirection: 'row',
    gap: 12,
  },
  langButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.CARD_BG,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  langButtonActive: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  langButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  langButtonTextActive: {
    color: COLORS.CARD_BG,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.ERROR_RED,
    marginTop: 16,
  },
});
