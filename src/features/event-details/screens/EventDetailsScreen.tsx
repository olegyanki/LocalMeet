import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import CachedImage from '@shared/components/CachedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Location from 'expo-location';

// Contexts & Hooks
import { useAuth } from '@shared/contexts';
import { useI18n } from '@shared/i18n';

// API & Utils
import { 
  deleteWalk, 
  getMyRequestForWalk, 
  getWalkById,
  getProfile,
  getChatByWalkId,
  getOrCreateChatForWalk,
  getWalkParticipants,
  WalkRequest, 
  Walk,
  UserProfile 
} from '@shared/lib/api';
import { getEventImage } from '@shared/utils/eventImage';
import { getPluralSuffix } from '@shared/utils/pluralization';
import { getDisplayName } from '@shared/utils/profile';

// Components
import Avatar from '@shared/components/Avatar';
import PrimaryButton from '@shared/components/PrimaryButton';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import LocationPickerModal from '@features/events/modals/LocationPickerModal';
import ContactRequestBottomSheet from '@features/events/modals/ContactRequestBottomSheet';

// Constants
import { COLORS, SIZES } from '@shared/constants';

const HERO_IMAGE_HEIGHT = 224;

export default function EventDetailsScreen() {
  // Hooks
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<WalkRequest | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);
  const [hasLoadedRequest, setHasLoadedRequest] = useState(false);
  const [walk, setWalk] = useState<Walk | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [descriptionLineCount, setDescriptionLineCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showContactRequestModal, setShowContactRequestModal] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [titleLineCount, setTitleLineCount] = useState(1);
  const [navbarHeight, setNavbarHeight] = useState(SIZES.NAVBAR_HEIGHT);

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

  // Load participants
  useEffect(() => {
    const loadParticipants = async () => {
      if (!walkId) return;

      try {
        setIsLoadingParticipants(true);
        const participantsList = await getWalkParticipants(walkId);
        setParticipants(participantsList);
      } catch (err) {
        console.error('Failed to load participants:', err);
      } finally {
        setIsLoadingParticipants(false);
      }
    };

    loadParticipants();
  }, [walkId]);

  // Load user location
  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
        }
      } catch (err) {
        console.error('Failed to get user location:', err);
      }
    };

    loadUserLocation();
  }, []);

  // Load location address
  useEffect(() => {
    const loadAddress = async () => {
      if (!walk) return;

      try {
        const result = await Location.reverseGeocodeAsync({
          latitude: walk.latitude,
          longitude: walk.longitude,
        });

        if (result && result.length > 0) {
          const address = result[0];
          const parts = [
            address.street,
            address.city || address.district,
          ].filter(Boolean);
          
          setLocationAddress(parts.join(', ') || null);
        }
      } catch (err) {
        console.error('Failed to load address:', err);
        // Keep coordinates as fallback
      }
    };

    loadAddress();
  }, [walk]);

  // Load existing request
  useEffect(() => {
    const loadExistingRequest = async () => {
      if (!currentUser || !walk?.id || isOwnEvent) {
        setHasLoadedRequest(true);
        return;
      }

      try {
        setIsLoadingRequest(true);
        const request = await getMyRequestForWalk(walk.id, currentUser.id);
        setExistingRequest(request);
      } catch (error) {
        console.error('Failed to load request:', error);
      } finally {
        setIsLoadingRequest(false);
        setHasLoadedRequest(true);
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
    if (!existingRequest) {
      setShowContactRequestModal(true);
    }
  };

  const handleRequestSent = async () => {
    setShowContactRequestModal(false);
    // Reload existing request
    if (currentUser && walk?.id) {
      try {
        const request = await getMyRequestForWalk(walk.id, currentUser.id);
        setExistingRequest(request);
        
        // Reload participants if request was accepted
        if (request?.status === 'accepted') {
          const participantsList = await getWalkParticipants(walk.id);
          setParticipants(participantsList);
        }
      } catch (error) {
        console.error('Failed to reload request:', error);
      }
    }
  };

  const handleOpenMap = () => {
    setShowLocationModal(true);
  };

  const handleOpenInNativeMaps = () => {
    if (!walk) return;
    
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `${scheme}?q=${walk.latitude},${walk.longitude}`,
      android: `${scheme}${walk.latitude},${walk.longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error('Failed to open map:', err);
      });
    }
    
    setShowLocationModal(false);
  };

  const handleOpenParticipants = () => {
    if (!walk?.id || !walk?.user_id) return;
    router.push(`/event-participants/${walk.id}?hostId=${walk.user_id}`);
  };

  const handleDelete = async () => {
    if (!walk?.id) return;

    try {
      setIsDeleting(true);
      await deleteWalk(walk.id);
      
      setShowDeleteModal(false);
      
      // Navigate back and trigger refresh
      router.back();
      
      // Trigger refresh on search screen via params
      setTimeout(() => {
        router.setParams({ refresh: Date.now().toString() });
      }, 100);
    } catch (error) {
      console.error('Failed to delete walk:', error);
      setError(t('errorDeleting'));
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenGroupChat = async () => {
    if (!walk?.id || !currentUser?.id) return;

    try {
      let chatId: string | null;
      if (walk.type === 'live') {
        chatId = await getOrCreateChatForWalk(walk.id, currentUser.id);
      } else {
        chatId = await getChatByWalkId(walk.id);
      }
      
      if (chatId) {
        router.push(`/chat/${chatId}`);
      } else {
        setError(t('groupChatNotFound'));
      }
    } catch (error) {
      console.error('Failed to open group chat:', error);
      setError(t('errorOpeningChat'));
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const handleTextLayout = (e: any) => {
    const { lines } = e.nativeEvent;
    setDescriptionLineCount(lines.length);
  };

  const handleTitleLayout = (e: any) => {
    const { lines } = e.nativeEvent;
    setTitleLineCount(lines.length);
  };

  const handleNavbarLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    setNavbarHeight(height);
  };

  // Derived state
  const buttonConfig = useMemo(() => {
    if (isLoadingRequest) {
      return {
        text: t('loading'),
        color: COLORS.BORDER_COLOR,
        disabled: true,
        onPress: undefined,
      };
    }

    if (!existingRequest) {
      return {
        text: t('joinEvent'),
        color: COLORS.ACCENT_ORANGE,
        disabled: false,
        onPress: handleConnect,
      };
    }

    switch (existingRequest.status) {
      case 'pending':
      case 'rejected':
        return {
          text: t('requestSentStatus'),
          color: COLORS.TEXT_LIGHT,
          disabled: true,
          onPress: undefined,
        };
      case 'accepted':
        return {
          text: t('openGroupChat'),
          color: COLORS.ACCENT_ORANGE,
          disabled: false,
          onPress: handleOpenGroupChat,
        };
      default:
        return {
          text: t('joinEvent'),
          color: COLORS.ACCENT_ORANGE,
          disabled: false,
          onPress: handleConnect,
        };
    }
  }, [isLoadingRequest, existingRequest, t]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format time
  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
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
  if (error || !walk || !userProfile) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {walk?.type === 'live' ? t('walkTitle') : (walk?.title || t('walkTitle'))}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error || t('walkNotFound')}</Text>
          </View>
        </View>
      </View>
    );
  }

  const heroImage = getEventImage(walk, userProfile?.avatar_url) || walk.image_url;

  // Render
  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View 
        style={[styles.fixedHeader, { paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING }]}
        onLayout={handleNavbarLayout}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
          </TouchableOpacity>
          {/* Hidden text to measure line count */}
          <Text 
            style={[styles.headerTitle, { position: 'absolute', opacity: 0 }]}
            onTextLayout={handleTitleLayout}
          >
            {walk.type === 'live' ? t('walkTitle') : (walk.title || '')}
          </Text>
          
          {/* Visible title with dynamic alignment */}
          <Text 
            style={[
              styles.headerTitle, 
              { textAlign: titleLineCount > 1 ? 'left' : 'center' }
            ]} 
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {walk.type === 'live' ? t('walkTitle') : (walk.title || '')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: navbarHeight }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {heroImage && (
            <CachedImage
              uri={heroImage}
              style={styles.heroImage}
              contentFit="cover"
              borderRadius={0}
            />
          )}
          <View style={styles.heroGradient} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Calendar size={20} color={COLORS.ACCENT_ORANGE} />
                <Text style={styles.infoLabel}>{t('date')}</Text>
                <Text style={styles.infoValue}>{formatDate(walk.start_time)}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Clock size={20} color={COLORS.ACCENT_ORANGE} />
                <Text style={styles.infoLabel}>{t('time')}</Text>
                <Text style={styles.infoValue}>{formatTimeOnly(walk.start_time)}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Clock size={20} color={COLORS.ACCENT_ORANGE} />
                <Text style={styles.infoLabel}>{t('duration')}</Text>
                <Text style={styles.infoValue}>{formatDuration(walk.duration)}</Text>
              </View>
            </View>
            <View style={styles.locationSection}>
              <View style={styles.locationLeft}>
                <MapPin size={16} color={COLORS.ACCENT_ORANGE} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationAddress || `${walk.latitude.toFixed(4)}, ${walk.longitude.toFixed(4)}`}
                </Text>
              </View>
              <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
                <Text style={styles.mapButtonText}>{t('map')}</Text>
                <ChevronRight size={14} color={COLORS.ACCENT_ORANGE} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Attendees Card */}
          {(participants.length > 0 || userProfile) && (
            <TouchableOpacity 
              style={styles.attendeesCard} 
              onPress={handleOpenParticipants}
              activeOpacity={0.7}
            >
              <View style={styles.attendeesHeader}>
                <View style={styles.attendeesLeft}>
                  <View>
                    <Text style={styles.attendeesLabel}>{t('attendees')}</Text>
                    <Text style={styles.attendeesCount}>
                      {t(`participantsCount${getPluralSuffix(participants.length + 1, locale)}` as any, { count: participants.length + 1 })}
                    </Text>
                  </View>
                  <View style={styles.avatarStack}>
                    {/* Show host first */}
                    {userProfile && (
                      <View style={[styles.avatarStackItem, { zIndex: 10 }]}>
                        <Avatar 
                          uri={userProfile.avatar_url} 
                          name={getDisplayName(userProfile)} 
                          size={32}
                        />
                      </View>
                    )}
                    {/* Then show participants */}
                    {participants.slice(0, 2).map((participant, index) => (
                      <View 
                        key={participant.id} 
                        style={[styles.avatarStackItem, { zIndex: 9 - index }]}
                      >
                        <Avatar 
                          uri={participant.avatar_url} 
                          name={getDisplayName(participant)} 
                          size={32}
                        />
                      </View>
                    ))}
                    {participants.length > 2 && (
                      <View style={[styles.avatarStackItem, styles.avatarMore, { zIndex: 0 }]}>
                        <Text style={styles.avatarMoreText}>+{participants.length - 2}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color={COLORS.TEXT_LIGHT} />
              </View>
            </TouchableOpacity>
          )}

          {/* About Section */}
          {walk.description && (
            <View style={styles.aboutCard}>
              <Text style={styles.aboutLabel}>{t('aboutEvent')}</Text>
              
              {/* Hidden text to measure full line count */}
              <Text 
                style={[styles.aboutText, { position: 'absolute', opacity: 0 }]}
                onTextLayout={handleTextLayout}
              >
                {walk.description}
              </Text>
              
              {/* Visible text with truncation */}
              <Text 
                style={styles.aboutText}
                numberOfLines={showFullDescription ? undefined : 3}
              >
                {walk.description}
              </Text>
              
              {descriptionLineCount > 3 && (
                <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                  <Text style={styles.readMoreButton}>
                    {showFullDescription ? t('showLess') : t('readMore')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Join Button for Other's Events */}
          {!isOwnEvent && hasLoadedRequest && (
            <PrimaryButton
              title={buttonConfig.text}
              onPress={buttonConfig.onPress || handleConnect}
              disabled={buttonConfig.disabled}
              style={buttonConfig.disabled ? styles.disabledButton : undefined}
              textStyle={buttonConfig.disabled ? styles.disabledButtonText : undefined}
            />
          )}

          {/* Owner Actions */}
          {isOwnEvent && (
            <>
              <PrimaryButton
                title={t('openGroupChat')}
                onPress={handleOpenGroupChat}
                style={styles.groupChatButton}
              />
              <PrimaryButton
                title={t('deleteEvent')}
                onPress={confirmDelete}
                disabled={isDeleting}
                loading={isDeleting}
                style={styles.deleteButton}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />

      {/* Location Picker Modal */}
      {walk && (
        <LocationPickerModal
          visible={showLocationModal}
          userLocation={userLocation}
          selectedLocation={{ latitude: walk.latitude, longitude: walk.longitude }}
          tempLocation={{ latitude: walk.latitude, longitude: walk.longitude }}
          onMapMove={() => {}}
          onConfirm={() => setShowLocationModal(false)}
          onClose={() => setShowLocationModal(false)}
          viewOnly
          onOpenInMaps={handleOpenInNativeMaps}
        />
      )}

      {/* Contact Request Modal */}
      {walk && userProfile && currentUser && (
        <ContactRequestBottomSheet
          visible={showContactRequestModal}
          onClose={() => setShowContactRequestModal(false)}
          walkId={walk.id}
          requesterId={currentUser.id}
          walkOwnerName={getDisplayName(userProfile)}
          walkOwnerAvatar={userProfile.avatar_url}
          walkTitle={walk.title || ''}
          walkStartTime={walk.start_time}
          walkImageUrl={walk.image_url}
          onRequestSent={handleRequestSent}
          onOwnerPress={() => {
            setShowContactRequestModal(false);
            router.push(`/user/${walk.user_id}`);
          }}
        />
      )}
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
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: COLORS.CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
    lineHeight: 26,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: HERO_IMAGE_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: SIZES.TAB_BAR_HEIGHT + 32,
    gap: 12,
    marginTop: -32,
    zIndex: 10,
  },
  infoCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
  },
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.BORDER_COLOR,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  locationSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.ACCENT_ORANGE,
    textTransform: 'uppercase',
  },
  userCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  userStats: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  attendeesCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
  },
  attendeesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginRight: 8,
  },
  attendeesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  attendeesCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStackItem: {
    marginLeft: -8,
    borderWidth: 2,
    borderColor: COLORS.CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarMore: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.BG_SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
  },
  aboutCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
  },
  aboutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.TEXT_DARK,
  },
  readMoreButton: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.ERROR_RED,
    textAlign: 'center',
  },
  groupChatButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR_RED,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 2,
    borderColor: COLORS.BORDER_COLOR,
    marginTop: 8,
  },
  disabledButtonText: {
    color: COLORS.TEXT_LIGHT,
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
