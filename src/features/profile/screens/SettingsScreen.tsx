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
import GradientView from '@shared/components/GradientView';
import PrimaryButton from '@shared/components/PrimaryButton';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/auth/register');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { 
          paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING, 
          paddingBottom: SIZES.TAB_BAR_HEIGHT + 20 
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings')}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('appLanguage').toUpperCase()}</Text>
        <View style={styles.languageSwitcher}>
          <Pressable
            style={styles.langButtonWrapper}
            onPress={() => setLanguage('uk')}
          >
            {language === 'uk' ? (
              <GradientView style={styles.langButton}>
                <Text style={styles.langButtonTextActive}>
                  🇺🇦 Українська
                </Text>
              </GradientView>
            ) : (
              <View style={styles.langButton}>
                <Text style={styles.langButtonText}>
                  🇺🇦 Українська
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={styles.langButtonWrapper}
            onPress={() => setLanguage('en')}
          >
            {language === 'en' ? (
              <GradientView style={styles.langButton}>
                <Text style={styles.langButtonTextActive}>
                  🇬🇧 English
                </Text>
              </GradientView>
            ) : (
              <View style={styles.langButton}>
                <Text style={styles.langButtonText}>
                  🇬🇧 English
                </Text>
              </View>
            )}
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
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
  langButtonWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  langButton: {
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
  langButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  langButtonTextActive: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.CARD_BG,
  },
  logoutButton: {
    backgroundColor: COLORS.ERROR_RED,
    marginTop: 16,
  },
});
