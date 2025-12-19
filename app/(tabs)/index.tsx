import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { getNearbyUsers, updateLocation, updateWalkStatus } from '../../lib/api';
import { Clock } from 'lucide-react-native';
import WebMap from '../../components/WebMap';
import NativeMap from '../../components/NativeMap';
import EventDetailsBottomSheet from '../../components/EventDetailsBottomSheet';
import ContactRequestBottomSheet from '../../components/ContactRequestBottomSheet';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E8E8E8';

interface UserLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface Walk {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  duration: string;
  description: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  status: string | null;
  distance: number;
  location?: UserLocation | null;
  walk: Walk | null;
  interests: string[];
  isActive?: boolean;
}

export default function SearchScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrollingProgrammatically = useRef(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [mapCenter, setMapCenter] = useState<{latitude: number; longitude: number; paddingBottom?: number} | null>(null);
  const [mapBounds, setMapBounds] = useState<{markers: Array<{latitude: number; longitude: number}>} | null>(null);
  const previousMarkerIdRef = useRef<string | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [contactRequestVisible, setContactRequestVisible] = useState(false);
  const [contactRequestData, setContactRequestData] = useState<{walkId: string; walkOwnerName: string} | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 48;
  const cardGap = 16;

  useEffect(() => {
    if (user) {
      loadLocation();
    }
  }, [user]);

  useEffect(() => {
    if (location && user) {
      loadNearbyUsers();
    }
  }, [location, user]);

  useEffect(() => {
    if (nearbyUsers.length > 0 && user) {
      const myEvent = nearbyUsers.find(u => u.id === user.id);
      if (myEvent && myEvent.location) {
        setMapCenter({
          latitude: myEvent.location.latitude,
          longitude: myEvent.location.longitude,
          paddingBottom: 150
        });
        setMapBounds(null);
        const myIndex = nearbyUsers.findIndex(u => u.id === user.id);
        if (myIndex !== -1) {
          previousMarkerIdRef.current = myEvent.id;
          setSelectedMarkerId(myEvent.id);
          setCurrentCardIndex(myIndex);
          if (scrollViewRef.current) {
            isScrollingProgrammatically.current = true;
            scrollViewRef.current.scrollTo({
              x: myIndex * (cardWidth + cardGap),
              animated: true,
            });
            setTimeout(() => {
              isScrollingProgrammatically.current = false;
            }, 500);
          }
        }
      }
    }
  }, [nearbyUsers, user]);

  const loadLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const defaultValenciaLocation = {
          coords: {
            latitude: 39.4699,
            longitude: -0.3763,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };
        setLocation(defaultValenciaLocation);
        setIsLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);

      if (user) {
        await updateLocation(user.id, loc.coords.latitude, loc.coords.longitude);
      }
    } catch (err) {
      console.error('Location error:', err);
      const defaultValenciaLocation = {
        coords: {
          latitude: 39.4699,
          longitude: -0.3763,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
      setLocation(defaultValenciaLocation);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const checkAndEndWalk = async (profile: UserProfile) => {
    if (!profile.walk) {
      return;
    }

    const now = new Date();
    const startTime = new Date(profile.walk.start_time);
    const durationMinutes = parseDuration(profile.walk.duration);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    if (now >= endTime) {
      await updateWalkStatus(profile.id, { isWalking: false });
    }
  };

  const parseDuration = (duration: string | null): number => {
    if (!duration) return 0;

    const parts = duration.toLowerCase().split(' ');
    let totalMinutes = 0;

    for (let i = 0; i < parts.length; i += 2) {
      const value = parseInt(parts[i]);
      const unit = parts[i + 1];

      if (unit?.includes('hour') || unit?.includes('год')) {
        totalMinutes += value * 60;
      } else if (unit?.includes('minute') || unit?.includes('хв')) {
        totalMinutes += value;
      }
    }

    return totalMinutes;
  };

  const loadNearbyUsers = async () => {
    if (!location || !user) return;

    try {
      setIsLoadingUsers(true);
      const users = await getNearbyUsers(location.coords.latitude, location.coords.longitude);

      // Перевіряємо і завершуємо власну прогулянку, якщо вона закінчилася
      const ownProfile = users.find((u) => u.id === user.id);
      if (ownProfile && ownProfile.walk) {
        const hadWalk = !!ownProfile.walk;
        await checkAndEndWalk(ownProfile);

        if (hadWalk) {
          const now = new Date();
          const startTime = new Date(ownProfile.walk.start_time);
          const durationMinutes = parseDuration(ownProfile.walk.duration);
          const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

          if (now >= endTime) {
            const updatedUsers = await getNearbyUsers(location.coords.latitude, location.coords.longitude);
            const updatedOwnProfile = updatedUsers.find((u) => u.id === user.id);
            const updatedOtherUsers = updatedUsers.filter((u) => u.id !== user.id);
            const updatedSortedUsers = updatedOwnProfile ? [updatedOwnProfile, ...updatedOtherUsers] : updatedOtherUsers;
            setNearbyUsers(updatedSortedUsers);
            return;
          }
        }
      }

      // Відокремлюємо власні івенти від інших користувачів
      const otherUsers = users.filter((u) => u.id !== user.id);

      // Якщо є власний івент, додаємо його першим
      const sortedUsers = ownProfile ? [ownProfile, ...otherUsers] : otherUsers;

      setNearbyUsers(sortedUsers);
    } catch (err) {
      console.error('Failed to load nearby users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const isWalkActive = (walkStartTime: string | null): boolean => {
    if (!walkStartTime) return false;

    const now = new Date();
    const startTime = new Date(walkStartTime);

    return now >= startTime;
  };

  const getTimeColor = (walkStartTime: string | null): string => {
    if (!walkStartTime) return ACCENT_ORANGE;

    const now = new Date();
    const startTime = new Date(walkStartTime);
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) {
      return '#8FD89C'; // зелений - прогулянка вже почалась
    } else if (diffMins <= 15) {
      return ACCENT_ORANGE; // помаранчевий - починається скоро (<=15 хв)
    } else {
      return '#12B7DB'; // голубий - починається пізніше
    }
  };

  const formatTime = (walkStartTime: string | null): string => {
    if (!walkStartTime) return '';

    const now = new Date();
    const startTime = new Date(walkStartTime);

    if (isNaN(startTime.getTime())) return '';

    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) {
      return 'Вже почалась';
    } else if (diffMins === 0) {
      return 'Починається зараз';
    } else if (diffMins < 60) {
      return `Через ${diffMins} хв`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (mins === 0) {
        return `Через ${hours} год`;
      }
      return `Через ${hours} год ${mins} хв`;
    }
  };

  const mapMarkers = nearbyUsers
    .filter((u) => u.location)
    .map((u) => ({
      id: u.id,
      latitude: u.location!.latitude,
      longitude: u.location!.longitude,
      title: u.display_name,
      type: 'user' as const,
      isActive: isWalkActive(u.walk?.start_time || null),
      isOwner: u.id === user?.id,
      avatarUrl: u.avatar_url,
    }));

  if (isLoadingLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ACCENT_ORANGE} />
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Unable to get location</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <WebMap
            latitude={mapCenter?.latitude || location.coords.latitude}
            longitude={mapCenter?.longitude || location.coords.longitude}
            markers={mapMarkers}
            selectedMarkerId={selectedMarkerId}
            bounds={mapBounds}
            onMarkerPress={(id) => {
              setSelectedMarkerId(id);
              const index = nearbyUsers.findIndex((item) => item.id === id);
              if (index !== -1 && scrollViewRef.current) {
                isScrollingProgrammatically.current = true;
                scrollViewRef.current.scrollTo({
                  x: index * (cardWidth + cardGap),
                  animated: true,
                });
                setTimeout(() => {
                  isScrollingProgrammatically.current = false;
                }, 500);
              }
            }}
          />
        ) : (
          <NativeMap
            latitude={mapCenter?.latitude || location.coords.latitude}
            longitude={mapCenter?.longitude || location.coords.longitude}
            paddingBottom={150}
            markers={mapMarkers}
            bounds={mapBounds}
            selectedMarkerId={selectedMarkerId}
            userLatitude={location.coords.latitude}
            userLongitude={location.coords.longitude}
            onMarkerPress={(id) => {
              setSelectedMarkerId(id);
              const index = nearbyUsers.findIndex((item) => item.id === id);
              if (index !== -1 && scrollViewRef.current) {
                isScrollingProgrammatically.current = true;
                scrollViewRef.current.scrollTo({
                  x: index * (cardWidth + cardGap),
                  animated: true,
                });
                setTimeout(() => {
                  isScrollingProgrammatically.current = false;
                }, 500);
              }
            }}
          />
        )}
      </View>

      <View style={[styles.cardsContainer, { bottom: 90 + insets.bottom }]}>
        <View style={styles.cardsHandle} />
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + cardGap}
          snapToAlignment="start"
          contentContainerStyle={[styles.cardsScrollContent, { paddingLeft: (screenWidth - cardWidth) / 2 }]}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (isScrollingProgrammatically.current) return;

            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / (cardWidth + cardGap));
            if (index !== currentCardIndex && index < nearbyUsers.length) {
              setCurrentCardIndex(index);
              const item = nearbyUsers[index];

              if (item.location) {
                const padding = 150;
                setMapCenter({
                  latitude: item.location.latitude,
                  longitude: item.location.longitude,
                  paddingBottom: padding
                });
                setMapBounds(null);
              }

              previousMarkerIdRef.current = item.id;
              setSelectedMarkerId(item.id);
            }
          }}
          scrollEventThrottle={16}
        >
          {isLoadingUsers ? (
            <View style={[styles.loadingCard, { width: cardWidth }]}>
              <ActivityIndicator size="small" color={ACCENT_ORANGE} />
            </View>
          ) : nearbyUsers.length === 0 ? (
            <View style={[styles.emptyCard, { width: cardWidth }]}>
              <Text style={styles.emptyText}>Немає людей які гуляють поблизу</Text>
            </View>
          ) : (
            <>
              {nearbyUsers.map((item) => (
                <Pressable
                  key={`user-${item.id}`}
                  style={[
                    styles.userCard,
                    { width: cardWidth },
                    item.id === user?.id && styles.ownCard
                  ]}
                  onPress={() => {
                    setSelectedUser(item);
                    setDetailsVisible(true);
                  }}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Pressable
                        style={styles.avatarContainer}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/user/${item.id}`);
                        }}
                      >
                        {item.avatar_url ? (
                          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                              {item.display_name[0].toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </Pressable>

                      <View style={styles.cardHeaderInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {item.display_name}
                        </Text>
                      </View>
                    </View>

                    {item.walk?.title && (
                      <Text style={styles.walkTitle} numberOfLines={1}>
                        {item.walk.title}
                      </Text>
                    )}

                    {item.walk?.description && (
                      <Text style={styles.walkDescription} numberOfLines={2}>
                        {item.walk.description}
                      </Text>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.distance}>
                      {item.id === user?.id ? 'Ваш івент' : `${item.distance.toFixed(1)} км від вас`}
                    </Text>
                    {item.walk?.start_time && (
                      <View style={styles.timeInfo}>
                        <Clock size={14} color={getTimeColor(item.walk.start_time)} />
                        <Text style={[styles.timeText, { color: getTimeColor(item.walk.start_time) }]}>
                          {formatTime(item.walk.start_time)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      <EventDetailsBottomSheet
        visible={detailsVisible}
        onClose={() => {
          setDetailsVisible(false);
        }}
        user={selectedUser}
        isOwnEvent={selectedUser?.id === user?.id}
        onDelete={() => {
          loadNearbyUsers();
        }}
        onConnectPress={(walkId, walkOwnerName) => {
          setContactRequestData({ walkId, walkOwnerName });
          setDetailsVisible(false);
          setTimeout(() => {
            setContactRequestVisible(true);
          }, 300);
        }}
      />

      {user && contactRequestData && (
        <ContactRequestBottomSheet
          visible={contactRequestVisible}
          onClose={() => {
            setContactRequestVisible(false);
            setContactRequestData(null);
          }}
          walkId={contactRequestData.walkId}
          requesterId={user.id}
          walkOwnerName={contactRequestData.walkOwnerName}
          onRequestSent={() => {
            loadNearbyUsers();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: TEXT_LIGHT,
    fontSize: 14,
  },
  cardsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  cardsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER_COLOR,
    alignSelf: 'center',
    marginBottom: 12,
  },
  cardsScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingCard: {
    height: 180,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyCard: {
    height: 180,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_LIGHT,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ownCard: {
    borderWidth: 2,
    borderColor: ACCENT_ORANGE,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8E8E8',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  walkTitle: {
    fontSize: 16,
    color: TEXT_DARK,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: ACCENT_ORANGE,
    fontWeight: '600',
  },
  walkDescription: {
    fontSize: 14,
    color: '#4F4F4F',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  distance: {
    fontSize: 12,
    color: 'rgba(60, 60, 67, 0.6)',
  },
});
