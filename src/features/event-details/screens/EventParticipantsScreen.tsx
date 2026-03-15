import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Search, ChevronRight } from 'lucide-react-native';

// Contexts & Hooks
import { useI18n } from '@shared/i18n';

// API & Utils
import { getWalkParticipants, getProfile, UserProfile } from '@shared/lib/api';
import { getPluralSuffix } from '@shared/utils/pluralization';

// Components
import Avatar from '@shared/components/Avatar';

// Constants
import { COLORS, SIZES } from '@shared/constants';

export default function EventParticipantsScreen() {
  // Hooks
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const params = useLocalSearchParams();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [hostProfile, setHostProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const walkId = Array.isArray(params.id) ? params.id[0] : params.id;
  const hostId = Array.isArray(params.hostId) ? params.hostId[0] : params.hostId;

  // Load participants
  useEffect(() => {
    const loadData = async () => {
      if (!walkId || !hostId) return;

      try {
        setIsLoading(true);
        setError(null);

        const [participantsList, host] = await Promise.all([
          getWalkParticipants(walkId),
          getProfile(hostId),
        ]);

        setParticipants(participantsList);
        setHostProfile(host);
      } catch (err) {
        console.error('Failed to load participants:', err);
        setError(t('errorLoading'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [walkId, hostId, t]);

  // Filter participants by search query
  const filteredParticipants = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return participants;
    }

    const query = searchQuery.toLowerCase();
    return participants.filter(
      (p) =>
        p.display_name.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query)
    );
  }, [participants, searchQuery]);

  // All participants including host
  const allParticipants = React.useMemo(() => {
    if (!hostProfile) return filteredParticipants;
    
    // Check if searching and host matches
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const hostMatches =
        hostProfile.display_name.toLowerCase().includes(query) ||
        hostProfile.username.toLowerCase().includes(query);
      
      return hostMatches ? [hostProfile, ...filteredParticipants] : filteredParticipants;
    }
    
    return [hostProfile, ...filteredParticipants];
  }, [hostProfile, filteredParticipants, searchQuery]);

  // Handlers
  const handleBack = () => {
    router.back();
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('participants')}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </ScrollView>
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
            paddingBottom: SIZES.TAB_BAR_HEIGHT + 20 
          },
        ]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('participants')}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.TEXT_LIGHT} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchParticipants')}
              placeholderTextColor={COLORS.TEXT_LIGHT}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Count */}
        <Text style={styles.countText}>
          {t(`participantsCount${getPluralSuffix(allParticipants.length, locale)}` as any, { count: allParticipants.length })}
        </Text>

        {/* Participants List */}
        {allParticipants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noParticipantsFound')}</Text>
          </View>
        ) : (
          <View style={styles.participantsList}>
            {allParticipants.map((item) => {
              const isHost = item.id === hostId;
              return (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.participantCard}
                  onPress={() => handleUserPress(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.participantLeft}>
                    <Avatar uri={item.avatar_url} name={item.display_name} size={48} />
                    <View style={styles.participantInfo}>
                      <View style={styles.participantNameRow}>
                        <Text style={styles.participantName}>{item.display_name}</Text>
                        {isHost && (
                          <View style={styles.hostBadge}>
                            <Text style={styles.hostBadgeText}>{t('host')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.participantUsername}>@{item.username}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={COLORS.TEXT_LIGHT} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  headerContainer: {
    backgroundColor: COLORS.BG_SECONDARY,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 16,
    marginTop: 8,
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  participantInfo: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  hostBadge: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.CARD_BG,
    textTransform: 'uppercase',
  },
  participantUsername: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.ERROR_RED,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
  },
});
