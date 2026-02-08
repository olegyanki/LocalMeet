import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@shared/i18n';
import { useRouter } from 'expo-router';
import { signOut } from '@shared/lib/auth';
import { LogOut } from 'lucide-react-native';
import { COLORS } from '@shared/constants';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: 40 + insets.top, paddingBottom: 100 + insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('appLanguage')}</Text>
        <View style={styles.languageSwitcher}>
          <Pressable
            style={[styles.langButton, language === 'uk' && styles.langButtonActive]}
            onPress={() => setLanguage('uk')}
          >
            <Text style={[styles.langButtonText, language === 'uk' && styles.langButtonTextActive]}>
              {t('langUkrainian')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langButton, language === 'en' && styles.langButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langButtonText, language === 'en' && styles.langButtonTextActive]}>
              {t('langEnglish')}
            </Text>
          </Pressable>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={18} color={COLORS.ERROR_RED} strokeWidth={2.5} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  section: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
    textTransform: 'uppercase',
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
    backgroundColor: COLORS.BG_SECONDARY,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  langButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  langButtonTextActive: {
    color: COLORS.CARD_BG,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: COLORS.ERROR_RED,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
