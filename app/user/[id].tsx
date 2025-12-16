import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getProfile } from '../../lib/api';
import {
  ChevronLeft,
  Instagram,
  Send,
  User,
  Calendar,
  Languages,
  Heart,
  MessageCircle
} from 'lucide-react-native';

const BG_COLOR = '#F5F5F5';
const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
const INPUT_BG = '#FFFFFF';
const BORDER_COLOR = '#E8E8E8';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        console.log('Profile data:', {
          interests: data.interests,
          languages: data.languages,
          hasInterests: !!data.interests,
          interestsLength: data.interests?.length,
          interestsType: typeof data.interests,
        });
        setProfile(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ACCENT_ORANGE} />
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
          <ChevronLeft size={28} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профіль</Text>
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
          <View style={styles.avatarContainer}>
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
          </View>

          <Text style={styles.displayName}>{profile.display_name}</Text>

          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          {(profile.age || profile.gender) && (
            <View style={styles.statsGrid}>
              {profile.age && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Calendar size={18} color={ACCENT_ORANGE} />
                  </View>
                  <Text style={styles.statLabel}>Вік</Text>
                  <Text style={styles.statValue}>{profile.age}</Text>
                </View>
              )}

              {profile.gender && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <User size={18} color={ACCENT_ORANGE} />
                  </View>
                  <Text style={styles.statLabel}>Стать</Text>
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
                <Languages size={18} color={ACCENT_ORANGE} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Мови</Text>
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
                <Heart size={18} color={ACCENT_ORANGE} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Інтереси</Text>
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
                <MessageCircle size={18} color={ACCENT_ORANGE} />
              </View>
              <Text style={styles.sectionTitle}>Що шукає</Text>
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
                <Send size={18} color={ACCENT_ORANGE} />
              </View>
              <Text style={styles.sectionTitle}>Соціальні мережі</Text>
            </View>
            <View style={styles.socialLinksContainer}>
              {profile.social_instagram && (
                <TouchableOpacity
                  style={styles.socialLinkCard}
                  activeOpacity={0.7}
                >
                  <View style={[styles.socialIconContainer, styles.instagramIcon]}>
                    <Instagram size={24} color="#FFFFFF" />
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
                >
                  <View style={[styles.socialIconContainer, styles.telegramIcon]}>
                    <Send size={24} color="#FFFFFF" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
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
    backgroundColor: BG_COLOR,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: INPUT_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  profileHeader: {
    backgroundColor: INPUT_BG,
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: TEXT_LIGHT,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  statCard: {
    backgroundColor: '#FFF9F0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
    maxWidth: 100,
    borderWidth: 1,
    borderColor: '#FFE8CC',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  section: {
    backgroundColor: INPUT_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  countBadge: {
    backgroundColor: ACCENT_ORANGE,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languagesList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFE8CC',
  },
  languageIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_ORANGE,
    marginRight: 12,
  },
  languageText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '600',
  },
  languageChip: {
    backgroundColor: ACCENT_ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: ACCENT_ORANGE,
  },
  interestChipVariant1: {
    backgroundColor: ACCENT_ORANGE,
  },
  interestChipVariant2: {
    backgroundColor: '#FFA726',
  },
  interestChipVariant3: {
    backgroundColor: '#FFB74D',
  },
  chipText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lookingForCard: {
    backgroundColor: '#FFF9F0',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT_ORANGE,
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: 8,
    right: 12,
    opacity: 0.1,
  },
  quoteText: {
    fontSize: 72,
    fontWeight: '900',
    color: ACCENT_ORANGE,
    lineHeight: 72,
  },
  lookingForText: {
    fontSize: 15,
    color: TEXT_DARK,
    lineHeight: 24,
    fontWeight: '500',
  },
  socialLinksContainer: {
    gap: 12,
  },
  socialLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  socialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  instagramIcon: {
    backgroundColor: '#E4405F',
  },
  telegramIcon: {
    backgroundColor: '#0088cc',
  },
  socialLinkInfo: {
    flex: 1,
  },
  socialLinkLabel: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginBottom: 4,
    fontWeight: '500',
  },
  socialLinkValue: {
    fontSize: 16,
    color: TEXT_DARK,
    fontWeight: '600',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ACCENT_ORANGE,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
