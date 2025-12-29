import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';
import { getProfile } from '@shared/lib/api';
import {
  ChevronLeft,
  Instagram,
  Send,
  User,
  Calendar,
  Languages,
  Heart,
  MessageCircle,
  X
} from 'lucide-react-native';

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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
        >
          <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => profile.avatar_url && setIsImageModalVisible(true)}
            activeOpacity={profile.avatar_url ? 0.7 : 1}
            disabled={!profile.avatar_url}
          >
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {profile.display_name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.displayName}>{profile.display_name}</Text>

          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          {(profile.age || profile.gender) && (
            <View style={styles.statsGrid}>
              {profile.age && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Calendar size={18} color={COLORS.ACCENT_ORANGE} />
                  </View>
                  <Text style={styles.statLabel}>{t('ageLabel')}</Text>
                  <Text style={styles.statValue}>{profile.age}</Text>
                </View>
              )}

              {profile.gender && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <User size={18} color={COLORS.ACCENT_ORANGE} />
                  </View>
                  <Text style={styles.statLabel}>{t('genderLabel')}</Text>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                    {profile.gender}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {profile.languages && profile.languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Languages size={18} color={COLORS.ACCENT_ORANGE} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>{t('languagesLabel')}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{profile.languages.length}</Text>
                </View>
              </View>
            </View>
            <View style={styles.languagesList}>
              {profile.languages.map((lang: string) => (
                <View key={lang} style={styles.languageItem}>
                  <View style={styles.languageIconDot} />
                  <Text style={styles.languageText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Heart size={18} color={COLORS.ACCENT_ORANGE} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>{t('interestsLabel')}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{profile.interests.length}</Text>
                </View>
              </View>
            </View>
            <View style={styles.chipsContainer}>
              {profile.interests.map((interest: string, index: number) => (
                <View key={interest} style={[
                  styles.interestChip,
                  index % 3 === 0 && styles.interestChipVariant1,
                  index % 3 === 1 && styles.interestChipVariant2,
                  index % 3 === 2 && styles.interestChipVariant3,
                ]}>
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {profile.looking_for && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MessageCircle size={18} color={COLORS.ACCENT_ORANGE} />
              </View>
              <Text style={styles.sectionTitle}>{t('lookingForLabel')}</Text>
            </View>
            <View style={styles.lookingForCard}>
              <View style={styles.quoteIcon}>
                <Text style={styles.quoteText}>"</Text>
              </View>
              <Text style={styles.lookingForText}>{profile.looking_for}</Text>
            </View>
          </View>
        )}

        {(profile.social_instagram || profile.social_telegram) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Send size={18} color={COLORS.ACCENT_ORANGE} />
              </View>
              <Text style={styles.sectionTitle}>{t('socialNetworksLabel')}</Text>
            </View>
            <View style={styles.socialLinksContainer}>
              {profile.social_instagram && (
                <TouchableOpacity
                  style={styles.socialLinkCard}
                  activeOpacity={0.7}
                  onPress={() => openSocialLink('instagram', profile.social_instagram)}
                >
                  <View style={[styles.socialIconContainer, styles.instagramIcon]}>
                    <Instagram size={24} color={COLORS.WHITE} />
                  </View>
                  <View style={styles.socialLinkInfo}>
                    <Text style={styles.socialLinkLabel}>Instagram</Text>
                    <Text style={styles.socialLinkValue}>@{profile.social_instagram}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {profile.social_telegram && (
                <TouchableOpacity
                  style={styles.socialLinkCard}
                  activeOpacity={0.7}
                  onPress={() => openSocialLink('telegram', profile.social_telegram)}
                >
                  <View style={[styles.socialIconContainer, styles.telegramIcon]}>
                    <Send size={24} color={COLORS.WHITE} />
                  </View>
                  <View style={styles.socialLinkInfo}>
                    <Text style={styles.socialLinkLabel}>Telegram</Text>
                    <Text style={styles.socialLinkValue}>{profile.social_telegram}</Text>
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
                resizeMode="contain"
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
    paddingHorizontal: 20,
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.CARD_BG,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: 40,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: COLORS.TEXT_DARK,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  section: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionIconContainer: {
    marginBottom: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languagesList: {
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  languageIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ACCENT_ORANGE,
    marginRight: 12,
  },
  languageText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  interestChipVariant1: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  interestChipVariant2: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    opacity: 0.9,
  },
  interestChipVariant3: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    opacity: 0.8,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  lookingForCard: {
    paddingVertical: 4,
  },
  quoteIcon: {
    display: 'none',
  },
  quoteText: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.ACCENT_ORANGE,
    lineHeight: 72,
  },
  lookingForText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    lineHeight: 24,
  },
  socialLinksContainer: {
    gap: 8,
  },
  socialLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  socialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instagramIcon: {
    background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    backgroundColor: COLORS.INSTAGRAM_PINK,
  },
  telegramIcon: {
    backgroundColor: COLORS.TELEGRAM_BLUE,
  },
  socialLinkInfo: {
    flex: 1,
  },
  socialLinkLabel: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialLinkValue: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.ERROR_LIGHT,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 12,
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
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
