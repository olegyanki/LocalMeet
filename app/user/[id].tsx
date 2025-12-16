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
import { ChevronLeft, Instagram, Send } from 'lucide-react-native';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: 100 + insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
        >
          <ChevronLeft size={28} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профіль</Text>
        <View style={{ width: 28 }} />
      </View>

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
        <View style={styles.section}>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>
      )}

      <View style={styles.infoSection}>
        {profile.age && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Вік</Text>
            <Text style={styles.infoValue}>{profile.age}</Text>
          </View>
        )}

        {profile.gender && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Стать</Text>
            <Text style={styles.infoValue}>{profile.gender}</Text>
          </View>
        )}
      </View>

      {profile.languages && profile.languages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Мови</Text>
          <View style={styles.chipsContainer}>
            {profile.languages.map((lang: string) => (
              <View key={lang} style={styles.chip}>
                <Text style={styles.chipText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {profile.interests && profile.interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Інтереси</Text>
          <View style={styles.chipsContainer}>
            {profile.interests.map((interest: string) => (
              <View key={interest} style={styles.interestChip}>
                <Text style={styles.chipText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {profile.looking_for && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Що шукає</Text>
          <Text style={styles.lookingForText}>{profile.looking_for}</Text>
        </View>
      )}

      {(profile.social_instagram || profile.social_telegram) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Соціальні мережі</Text>
          <View style={styles.chipsContainer}>
            {profile.social_instagram && (
              <View style={styles.socialChip}>
                <Instagram size={16} color="#E4405F" />
                <Text style={styles.socialChipText}>{profile.social_instagram}</Text>
              </View>
            )}
            {profile.social_telegram && (
              <View style={styles.socialChip}>
                <Send size={16} color="#0088cc" />
                <Text style={styles.socialChipText}>{profile.social_telegram}</Text>
              </View>
            )}
          </View>
        </View>
      )}
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '600',
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: TEXT_DARK,
    lineHeight: 24,
    textAlign: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginVertical: 24,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  section: {
    marginBottom: 24,
    backgroundColor: INPUT_BG,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: ACCENT_ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestChip: {
    backgroundColor: ACCENT_ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  socialChipText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  lookingForText: {
    fontSize: 15,
    color: TEXT_DARK,
    lineHeight: 22,
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
