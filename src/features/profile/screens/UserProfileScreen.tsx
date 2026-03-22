import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';

// Third-party libraries
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';

// Contexts & Hooks
import { useI18n } from '@shared/i18n';

// API & Utils
import { getProfile } from '@shared/lib/api';
import { getDisplayName } from '@shared/utils/profile';

// Components
import Avatar from '@shared/components/Avatar';
import Chip from '@shared/components/Chip';

// Constants
import { COLORS, SIZES, SHADOW, getLanguageByCode, getInterestByKey } from '@shared/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getProfile(userId);
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const openSocialLink = async (platform: 'instagram' | 'telegram', username: string) => {
    const urls = {
      instagram: `https://instagram.com/${username.replace('@', '')}`,
      telegram: `https://t.me/${username.replace('@', '')}`,
    };
    
    const url = urls[platform];
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING,
            paddingBottom: 40 + insets.bottom 
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('profile')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={() => profile.avatar_url && setIsImageModalVisible(true)}
            activeOpacity={profile.avatar_url ? 0.7 : 1}
            disabled={!profile.avatar_url}
          >
            <Avatar 
              uri={profile.avatar_url} 
              name={getDisplayName(profile) || '?'} 
              size={100}
              shape={'square' as 'square'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.displayName}>{getDisplayName(profile)}</Text>

        {profile.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.label}>{t('aboutMe').toUpperCase()}</Text>
            <View style={styles.bioCard}>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          </View>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>{t('languages').toUpperCase()}</Text>
            <View style={styles.chipsContainer}>
              {profile.languages.map((langCode: string) => {
                const lang = getLanguageByCode(langCode);
                if (!lang) return null;
                return (
                  <Chip
                    key={langCode}
                    label={t(lang.nameKey as any)}
                    emoji={lang.flag}
                    isActive={true}
                    onPress={() => {}}
                  />
                );
              })}
            </View>
          </View>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>{t('interests').toUpperCase()}</Text>
            <View style={styles.chipsContainer}>
              {profile.interests.map((interestKey: string) => {
                const interest = getInterestByKey(interestKey);
                if (!interest) return null;
                return (
                  <Chip
                    key={interestKey}
                    label={t(interest.key as any)}
                    emoji={interest.emoji}
                    isActive={true}
                    onPress={() => {}}
                  />
                );
              })}
            </View>
          </View>
        )}

        {(profile.social_instagram || profile.social_telegram) && (
          <View style={styles.section}>
            <Text style={styles.label}>{t('socialMedia').toUpperCase()}</Text>
            <View style={styles.socialContainer}>
              {profile.social_instagram && (
                <TouchableOpacity
                  style={styles.socialItem}
                  activeOpacity={0.7}
                  onPress={() => openSocialLink('instagram', profile.social_instagram)}
                >
                  <View style={[styles.socialIcon, { backgroundColor: COLORS.INSTAGRAM_BG }]}>
                    <Text style={{ fontSize: 18 }}>📷</Text>
                  </View>
                  <View style={styles.socialInfo}>
                    <Text style={styles.socialLabel}>Instagram</Text>
                    <Text style={styles.socialValue}>@{profile.social_instagram}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {profile.social_telegram && (
                <TouchableOpacity
                  style={styles.socialItem}
                  activeOpacity={0.7}
                  onPress={() => openSocialLink('telegram', profile.social_telegram)}
                >
                  <View style={[styles.socialIcon, { backgroundColor: COLORS.TELEGRAM_BG }]}>
                    <Text style={{ fontSize: 18 }}>✈️</Text>
                  </View>
                  <View style={styles.socialInfo}>
                    <Text style={styles.socialLabel}>Telegram</Text>
                    <Text style={styles.socialValue}>{profile.social_telegram}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setIsImageModalVisible(false)}
          >
            <View style={styles.closeButtonCircle}>
              <X size={28} color={COLORS.WHITE} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalImageContainer}
            activeOpacity={1}
            onPress={() => setIsImageModalVisible(false)}
          >
            {profile?.avatar_url && (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.fullScreenImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BG_SECONDARY,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
    marginBottom: 24,
  },
  bioSection: {
    marginBottom: 24,
  },
  bioCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 24,
    ...SHADOW.standard,
    padding: 20,
  },
  bio: {
    fontSize: 15,
    color: COLORS.TEXT_DARK,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialContainer: {
    gap: 12,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 24,
    ...SHADOW.standard,
    padding: 4,
    minHeight: 56,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginRight: 8,
  },
  socialInfo: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 16,
  },
  socialLabel: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialValue: {
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  errorText: {
    color: COLORS.ERROR_RED,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButtonError: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 24,
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
