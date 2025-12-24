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
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '@shared/contexts/AuthContext';
import { getNearbyUsers, updateLocation, updateWalkStatus } from '@shared/lib/api';
import { Clock } from 'lucide-react-native';
import Svg, { Rect, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeBlend, G } from 'react-native-svg';
import { COLORS, SIZES } from '@shared/constants';
import { parseDuration, isWalkActive, getTimeColor, formatTime } from '@shared/utils/time';
import Avatar from '@shared/components/Avatar';
import LocationPin from '@shared/components/LocationPin';
import FilterBottomSheet, { TimeFilter } from '@features/search/components/FilterBottomSheet';
import WebMap from '@features/search/maps/WebMap';
import NativeMap from '@features/search/maps/NativeMap';
import EventDetailsBottomSheet from '@features/events/modals/EventDetailsBottomSheet';
import ContactRequestBottomSheet from '@features/events/modals/ContactRequestBottomSheet';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';



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
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrollingProgrammatically = useRef(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [nearbyWalks, setNearbyWalks] = useState<UserProfile[]>([]);
  const [isLoadingWalks, setIsLoadingWalks] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [mapCenter, setMapCenter] = useState<{latitude: number; longitude: number; paddingBottom?: number} | null>(null);
  const [mapBounds, setMapBounds] = useState<{markers: Array<{latitude: number; longitude: number}>} | null>(null);
  const previousMarkerIdRef = useRef<string | null>(null);
  const initialBoundsSet = useRef(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [contactRequestVisible, setContactRequestVisible] = useState(false);
  const [contactRequestData, setContactRequestData] = useState<{walkId: string; walkOwnerName: string} | null>(null);
  const [isCardsCollapsed, setIsCardsCollapsed] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const cardsTranslateY = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 48;
  const cardGap = 16;
  const containerTranslateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isCardsCollapsed) {
          if (gestureState.dy < 0) {
            containerTranslateY.setValue(gestureState.dy);
          }
        } else {
          if (gestureState.dy > 0) {
            containerTranslateY.setValue(gestureState.dy);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isCardsCollapsed) {
          if (gestureState.dy < -50) {
            Animated.spring(containerTranslateY, {
              toValue: 100,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
            setIsCardsCollapsed(false);
          } else {
            Animated.spring(containerTranslateY, {
              toValue: 250,
              useNativeDriver: true,
            }).start();
          }
        } else {
          if (gestureState.dy > 50) {
            Animated.spring(containerTranslateY, {
              toValue: 250,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
            setIsCardsCollapsed(true);
          } else {
            Animated.spring(containerTranslateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    if (params.reloadEvents === 'true' && location && user) {
      loadNearbyWalks();
    }
  }, [params.reloadEvents]);

  useEffect(() => {
    if (user) {
      loadLocation();
    }
  }, [user]);

  useEffect(() => {
    if (location && user) {
      loadNearbyWalks();
    }
  }, [location, user]);

  useEffect(() => {
    if (nearbyWalks.length > 0 && user && location && !initialBoundsSet.current) {
      const myWalk = nearbyWalks.find(w => w.id === user.id);
      
      const allMarkers = [
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        ...nearbyWalks.filter(w => w.walk).map(w => ({
          latitude: w.walk!.latitude,
          longitude: w.walk!.longitude
        }))
      ];
      
      if (allMarkers.length > 1) {
        setMapBounds({ markers: allMarkers });
        setMapCenter(null);
        initialBoundsSet.current = true;
      }
      
      if (myWalk && myWalk.walk) {
        const myIndex = 0;
        previousMarkerIdRef.current = myWalk.walk.id;
        setSelectedMarkerId(myWalk.walk.id);
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
  }, [nearbyWalks, user, location]);

  const loadLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted')
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

  const loadNearbyWalks = async () => {
    if (!location || !user) return;

    try {
      setIsLoadingWalks(true);
      initialBoundsSet.current = false;
      const walks = await getNearbyUsers(location.coords.latitude, location.coords.longitude);

      const ownWalk = walks.find((w) => w.id === user.id);
      if (ownWalk && ownWalk.walk) {
        const hadWalk = !!ownWalk.walk;
        await checkAndEndWalk(ownWalk);

        if (hadWalk) {
          const now = new Date();
          const startTime = new Date(ownWalk.walk.start_time);
          const durationMinutes = parseDuration(ownWalk.walk.duration);
          const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

          if (now >= endTime) {
            const updatedWalks = await getNearbyUsers(location.coords.latitude, location.coords.longitude);
            const updatedOwnWalks = updatedWalks.filter((w) => w.id === user.id);
            const updatedOtherWalks = updatedWalks.filter((w) => w.id !== user.id);
            const updatedSortedWalks = [...updatedOwnWalks, ...updatedOtherWalks];
            setNearbyWalks(updatedSortedWalks);
            return;
          }
        }
      }

      const otherWalks = walks.filter((w) => w.id !== user.id);
      const ownWalks = walks.filter((w) => w.id === user.id);
      const sortedWalks = [...ownWalks, ...otherWalks];

      setNearbyWalks(sortedWalks);
    } catch (err) {
      console.error('Failed to load nearby walks:', err);
    } finally {
      setIsLoadingWalks(false);
    }
  };

  const filterWalks = (walks: UserProfile[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);

    return walks.filter((walk) => {
      if (!walk.walk?.start_time) return false;
      const startTime = new Date(walk.walk.start_time);

      switch (timeFilter) {
        case 'started':
          return startTime <= now;
        case 'today':
          return startTime >= todayStart && startTime < todayEnd;
        case 'tomorrow':
          return startTime >= todayEnd && startTime < tomorrowEnd;
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredWalks = filterWalks(nearbyWalks);

  const mapMarkers = filteredWalks
    .filter((w) => w.walk)
    .map((w) => ({
      id: w.walk!.id,
      latitude: w.walk!.latitude,
      longitude: w.walk!.longitude,
      title: w.display_name,
      type: 'event' as const,
      isActive: isWalkActive(w.walk?.start_time || null),
      isOwner: w.id === user?.id,
      avatarUrl: w.avatar_url,
    }));

  if (isLoadingLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
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
              const index = filteredWalks.findIndex((item) => item.walk?.id === id);
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
              const index = filteredWalks.findIndex((item) => item.walk?.id === id);
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

      <View style={[styles.mapButtons, { top: insets.top + 16 }]}>
        <Pressable style={styles.filterButton} onPress={() => setShowFilterSheet(true)}>
          <Svg width="32" height="32" viewBox="11 11 32 32" fill="none">
            <G filter="url(#filter0_d_3223_2156)">
              <Rect x="11" y="11" width="32" height="32" rx="16" fill="white"/>
            </G>
            <Rect x="18" y="22" width="9" height="3" rx="1" fill="#E0E0E0"/>
            <Rect x="27" y="30" width="9" height="3" rx="1" fill="#E0E0E0"/>
            <Rect x="30" y="20" width="6" height="6" rx="3" fill="#F2994A"/>
            <Rect x="18" y="28" width="6" height="6" rx="3" fill="#F2994A"/>
            <Defs>
              <Filter id="filter0_d_3223_2156" x="0" y="0" width="54" height="54" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
                <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <FeOffset/>
                <FeGaussianBlur stdDeviation="5.5"/>
                <FeColorMatrix type="matrix" values="0 0 0 0 0.2125 0 0 0 0 0.191728 0 0 0 0 0.167344 0 0 0 0.1 0"/>
                <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3223_2156"/>
                <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3223_2156" result="shape"/>
              </Filter>
            </Defs>
          </Svg>
        </Pressable>
      </View>

      <FilterBottomSheet
        visible={showFilterSheet}
        selectedFilter={timeFilter}
        onFilterChange={setTimeFilter}
        onClose={() => setShowFilterSheet(false)}
      />

      <Animated.View
        style={[
          styles.myLocationButton,
          {
            bottom: SIZES.TAB_BAR_HEIGHT + insets.bottom + 270,
            transform: [{ translateY: containerTranslateY }]
          }
        ]}
      >
        <Pressable
          onPress={() => {
            if (location) {
              setMapCenter({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              setMapBounds(null);
            }
          }}
          style={styles.locationButtonInner}
        >
          <LocationPin size={24} />
        </Pressable>
      </Animated.View>

      <Animated.View 
        style={[
          styles.cardsContainer, 
          { 
            bottom: SIZES.TAB_BAR_HEIGHT + insets.bottom,
            transform: [{ translateY: containerTranslateY }]
          }
        ]}
      >
        <View style={styles.cardsBackdrop} />
        <LinearGradient
          colors={['rgba(243, 248, 255, 0)', 'rgba(243, 248, 255, 0.7)']}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
        <View 
          style={styles.handleWrapper}
          {...panResponder.panHandlers}
        >
          <View style={styles.cardsHandle} />
        </View>
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
            if (index !== currentCardIndex && index < filteredWalks.length) {
              setCurrentCardIndex(index);
              const item = filteredWalks[index];

              if (item.location) {
                const padding = 150;
                setMapCenter({
                  latitude: item.location.latitude,
                  longitude: item.location.longitude,
                  paddingBottom: padding
                });
                setMapBounds(null);
              }

              previousMarkerIdRef.current = item.walk!.id;
              setSelectedMarkerId(item.walk!.id);
            }
          }}
          scrollEventThrottle={16}
        >
          {isLoadingWalks ? (
            <View style={[styles.loadingCard, { width: cardWidth }]}>
              <ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
            </View>
          ) : filteredWalks.length === 0 ? (
            <View style={[styles.emptyCard, { width: cardWidth }]}>
              <Text style={styles.emptyText}>Немає людей які гуляють поблизу</Text>
            </View>
          ) : (
            <>
              {filteredWalks.map((item) => (
                <Pressable
                  key={`walk-${item.walk?.id}`}
                  style={[
                    styles.userCard,
                    { width: cardWidth }
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
                        <Avatar uri={item.avatar_url} name={item.display_name} size={SIZES.AVATAR_MEDIUM} />
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
                    <Text style={[styles.distance, item.id === user?.id && styles.ownEventText]}>
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
      </Animated.View>

      <EventDetailsBottomSheet
        visible={detailsVisible}
        onClose={() => {
          setDetailsVisible(false);
        }}
        user={selectedUser}
        isOwnEvent={selectedUser?.id === user?.id}
        onDelete={() => {
          loadNearbyWalks();
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
            loadNearbyWalks();
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
    color: COLORS.TEXT_LIGHT,
    fontSize: 14,
  },
  cardsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  cardsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -100,
    backgroundColor: 'rgba(243, 248, 255, 0.7)',
    ...(Platform.OS === 'ios' && {
      backdropFilter: 'blur(10px)',
    }),
  },
  gradientOverlay: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
  },
  handleWrapper: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardsHandle: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  cardsScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingCard: {
    height: 180,
    backgroundColor: COLORS.CARD_BG,
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
    backgroundColor: COLORS.CARD_BG,
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
    color: COLORS.TEXT_LIGHT,
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
    overflow: 'hidden',
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
  cardHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 6,
  },
  walkTitle: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
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
    color: 'rgba(60, 60, 67, 0.6)',
    fontWeight: '500',
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
    borderTopColor: COLORS.BORDER_COLOR,
  },
  distance: {
    fontSize: 12,
    color: 'rgba(60, 60, 67, 0.6)',
  },
  ownEventText: {
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '600',
  },
  mapButtons: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  filterButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
  },
  locationButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
