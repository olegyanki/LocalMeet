import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock, ChevronLeft } from 'lucide-react-native';

// Contexts & Hooks
import { useAuth } from '@shared/contexts';
import { useI18n } from '@shared/i18n';

// API & Utils
import { 
  deleteWalk, 
  getMyRequestForWalk, 
  getWalkById,
  getProfile,
  WalkRequest, 
  Walk,
  UserProfile 
} from '@shared/lib/api';
import { getTimeText, getTimeColor } from '@shared/utils/time';

// Components
import Avatar from '@shared/components/Avatar';
import PrimaryButton from '@shared/components/PrimaryButton';

// Constants
import { COLORS, SIZES } from '@shared/constants';

export default function EventDetailsScreen() {
  // Hooks
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<WalkRequest | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  const [walk, setWalk] = useState<Walk | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const walkId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isOwnEvent = walk?.user_id === currentUser?.id;

  // Load walk data
  useEffect(() => {
    const loadWalkData = async () => {
      if (!walkId) return;

      try {
        setIsLoading(true);
        setError(null);

        const walkData = await getWalkById(walkId);
        if (!walkData) {
          setError(t('walkNotFound'));
          return;
        }

        const profile = await getProfile(walkData.user_id);
        
        setWalk(walkData);
        setUserProfile(profile);
      } catch (err) {
        console.error('Failed to load walk:', err);
        setError(t('errorLoading'));
      } finally {
        setIsLoading(false);
      }
    };

    loadWalkData();
  }, [walkId, t]);

  // Load existing request
  useEffect(() => {
    const loadExistingRequest = async () => {
      if (!currentUser || !walk?.id || isOwnEvent) return;

      try {
        setIsLoadingRequest(true);
        const request = await getMyRequestForWalk(walk.id, currentUser.id);
        setExistingRequest(request);
      } catch (error) {
        console.error('Failed to load request:', error);
      } finally {
        setIsLoadingRequest(false);
      }
    };

    if (walk) {
      loadExistingRequest();
    }
  }, [currentUser, walk?.id, isOwnEvent]);

  // Handlers
  const handleBack = () => {
    router.back();
  };

  const handleUserPress = () => {
    if (walk?.user_id) {
      router.push(`/user/${walk.user_id}`);
    }
  };

  const handleConnect = () => {
    // TODO: Implement connect logic
    console.log('Connect pressed');
  };

  const handleDelete = async () => {
    if (!walk?.id) return;

    try {
      setIsDeleting(true);
      await deleteWalk(walk.id);
      router.back();
    } catch (error) {
      console.error('Failed to delete walk:', error);
      setError(t('errorDeleting'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Derived state
  const buttonConfig = useMemo(() => {
    if (isLoadingRequest) {
      return {
        text: t('loading'),
        color: COLORS.BORDER_COLOR,
        disabled: true,
      };
    }

    if (!existingRequest) {
      return {
        text: t('connecting'),
        color: COLORS.ACCENT_ORANGE,
        disabled: false,
      };
    }

    switch (existingRequest.status) {
      case 'pending':
      case 'rejected':
        return {
          text: t('requestSentStatus'),
          color: COLORS.TEXT_LIGHT,
          disabled: true,
        };
      case 'accepted':
        return {
          text: t('requestAccepted'),
          color: COLORS.SUCCESS_GREEN,
          disabled: true,
        };
      default:
        return {
          text: t('connecting'),
          color: COLORS.ACCENT_ORANGE,
          disabled: false,
        };
    }
  }, [isLoadingRequest, existingRequest, t]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
      </View>
    );
  }

  // Error state
  if (error || !walk || !userProfile) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error || t('walkNotFound')}</Text>
          </View>
        </View>
      </View>
    );
  }

  // Render
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={handleUserPress}
          activeOpacity={0.7}
        >
          <Avatar 
            uri={walk.image_url} 
            name={userProfile.display_name} 
            size={64}
          />
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile.display_name}</Text>
          </View>
        </TouchableOpacity>

        {/* Event Details Card */}
        {walk.title && (
          <View style={styles.detailsCard}>
            <View>
              <Text style={styles.label}>{t('eventTitleLabel')}</Text>
              <Text style={styles.eventTitle}>{walk.title}</Text>
            </View>
            
            {walk.description && (
              <View>
                <Text style={styles.label}>{t('walkDescription')}</Text>
                <Text style={styles.description}>{walk.description}</Text>
              </View>
            )}
            
            {walk.start_time && (
              <View style={styles.timeSection}>
                <Text style={styles.label}>{t('startTimeLabel')}</Text>
                <View style={styles.timeContainer}>
                  <Clock size={18} color={getTimeColor(walk.start_time)} />
                  <Text style={[styles.timeText, { color: getTimeColor(walk.start_time) }]}>
                    {getTimeText(walk.start_time, t)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        {!isOwnEvent && (
          <PrimaryButton
            title={buttonConfig.text}
            onPress={handleConnect}
            disabled={buttonConfig.disabled}
            style={{ backgroundColor: buttonConfig.color }}
          />
        )}

        {isOwnEvent && (
          <PrimaryButton
            title={t('deleteEvent')}
            onPress={handleDelete}
            disabled={isDeleting}
            loading={isDeleting}
            style={styles.deleteButton}
          />
        )}
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
    paddingHorizontal: 24,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  detailsCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: COLORS.TEXT_DARK,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT_DARK,
    opacity: 0.8,
  },
  timeSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_COLOR,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.ERROR_RED,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR_RED,
  },
});
