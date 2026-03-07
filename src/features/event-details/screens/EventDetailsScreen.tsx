import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
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
  WalkRequest, 
  Walk,
  UserProfile 
} from '@shared/lib/api';
import { getTimeText, getTimeColor } from '@shared/utils/time';
import { getEventImage } from '@shared/utils/eventImage';

// Components
import Avatar from '@shared/components/Avatar';
import PrimaryButton from '@shared/components/PrimaryButton';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import LocationPickerModal from '@features/events/modals/LocationPickerModal';
import ContactRequestBottomSheet from '@features/events/modals/ContactRequestBottomSheet';

// Constants
import { COLORS, NAVBAR_STYLES } from '@shared/constants';

const HERO_IMAGE_HEIGHT = 224;

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
  const [hasLoadedRequest, setHasLoadedRequest] = useState(false);
  const [walk, setWalk] = useState<Walk | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [descriptionLineCount, setDescriptionLineCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showContactRequestModal, setShowContactRequestModal] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

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

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const handleTextLayout = (e: any) => {
    const { lines } = e.nativeEvent;
    setDescriptionLineCount(lines.length);
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
        text: t('joinEvent'),
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
          text: t('joinEvent'),
          color: COLORS.ACCENT_ORANGE,
          disabled: false,
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
        <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={NAVBAR_STYLES.backButton}>
              <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>
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
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={NAVBAR_STYLES.backButton}>
            <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
          </TouchableOpacity>
          <Text 
            style={NAVBAR_STYLES.title} 
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {walk.title}
          </Text>
          <View style={NAVBAR_STYLES.spacer} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 56 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {heroImage && <Image source={{ uri: heroImage }} style={styles.heroImage} />}
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

          {/* User Card */}
          <TouchableOpacity style={styles.userCard} onPress={handleUserPress} activeOpacity={0.7}>
            <Avatar 
              uri={userProfile.avatar_url} 
              name={userProfile.display_name} 
              size={40}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userProfile.display_name}</Text>
              <Text style={styles.userStats}>Local Expert</Text>
            </View>
            <ChevronRight size={20} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>

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
              onPress={handleConnect}
              disabled={buttonConfig.disabled}
              style={buttonConfig.disabled ? styles.disabledButton : undefined}
              textStyle={buttonConfig.disabled ? styles.disabledButtonText : undefined}
            />
          )}

          {/* Delete Button for Own Events */}
          {isOwnEvent && (
            <PrimaryButton
              title={t('deleteEvent')}
              onPress={confirmDelete}
              disabled={isDeleting}
              loading={isDeleting}
              style={styles.deleteButton}
            />
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
          walkOwnerName={userProfile.display_name}
          walkOwnerAvatar={userProfile.avatar_url}
          walkTitle={walk.title}
          walkStartTime={walk.start_time}
          walkImageUrl={walk.image_url}
          onRequestSent={handleRequestSent}
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingBottom: 32,
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
    marginBottom: 20,
  },
});
