import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { getNearbyWalks, NearbyWalk } from '@shared/lib/api';
import { Clock } from 'lucide-react-native';
import Svg, { Rect, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeBlend, G } from 'react-native-svg';
import { COLORS, SIZES } from '@shared/constants';
import { isWalkActive, getTimeColor, formatTime } from '@shared/utils/time';
import Avatar from '@shared/components/Avatar';
import LocationPin from '@shared/components/LocationPin';
import FilterBottomSheet, { TimeFilter, SortBy } from '@features/search/components/FilterBottomSheet';
import NativeMap from '@features/search/maps/NativeMap';
import ContactRequestBottomSheet from '@features/events/modals/ContactRequestBottomSheet';
import { router, useLocalSearchParams } from 'expo-router';





export default function SearchScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrollingProgrammatically = useRef(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [nearbyWalks, setNearbyWalks] = useState<NearbyWalk[]>([]);
  const [isLoadingWalks, setIsLoadingWalks] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [mapCenter, setMapCenter] = useState<{latitude: number; longitude: number; paddingBottom?: number} | null>(null);
  const previousMarkerIdRef = useRef<string | null>(null);
  const [contactRequestVisible, setContactRequestVisible] = useState(false);
  const [contactRequestData, setContactRequestData] = useState<{
    walkId: string;
    walkOwnerName: string;
    walkOwnerAvatar?: string | null;
    walkTitle: string;
    walkStartTime?: string;
    walkImageUrl?: string | null;
  } | null>(null);
  const [isCardsCollapsed, setIsCardsCollapsed] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('distance');
  const [cardsContainerHeight, setCardsContainerHeight] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 48;
  const cardGap = 16;
  const containerTranslateY = useRef(new Animated.Value(0)).current;

  const HANDLE_HEIGHT = 40;
  const COLLAPSED_VISIBLE_HEIGHT = 60;
  const collapsedOffset = cardsContainerHeight > 0 ? cardsContainerHeight - COLLAPSED_VISIBLE_HEIGHT : 220;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isCardsCollapsed) {
          if (gestureState.dy < 0) {
            const newValue = collapsedOffset + gestureState.dy;
            containerTranslateY.setValue(Math.max(0, newValue));
          }
        } else {
          if (gestureState.dy > 0) {
            containerTranslateY.setValue(Math.min(collapsedOffset, gestureState.dy));
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isCardsCollapsed) {
          if (gestureState.dy < -50 || gestureState.vy < -0.5) {
            Animated.spring(containerTranslateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
            setIsCardsCollapsed(false);
          } else {
            Animated.spring(containerTranslateY, {
              toValue: collapsedOffset,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }
        } else {
          if (gestureState.dy > 50 || gestureState.vy > 0.5) {
            Animated.spring(containerTranslateY, {
              toValue: collapsedOffset,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
            setIsCardsCollapsed(true);
          } else {
            Animated.spring(containerTranslateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
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
    if (params.refresh && location && user) {
      loadNearbyWalks();
    }
  }, [params.refresh]);

  useEffect(() => {
    if (params.selectWalkId && nearbyWalks.length > 0) {
      const walkIndex = sortedWalks.findIndex((w) => w.walk?.id === params.selectWalkId);
      if (walkIndex !== -1) {
        const walk = sortedWalks[walkIndex];
        setSelectedMarkerId(walk.walk!.id);
        setCurrentCardIndex(walkIndex);
        
        if (scrollViewRef.current) {
          isScrollingProgrammatically.current = true;
          scrollViewRef.current.scrollTo({
            x: walkIndex * (cardWidth + cardGap),
            animated: true,
          });
          setTimeout(() => {
            isScrollingProgrammatically.current = false;
          }, 500);
        }

        if (walk.walk) {
          setMapCenter({
            latitude: walk.walk.latitude,
            longitude: walk.walk.longitude,
            paddingBottom: 150,
          });
        }
      }
    }
  }, [params.selectWalkId, nearbyWalks]);

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
    if (nearbyWalks.length > 0 && user && location) {
      const myWalk = nearbyWalks.find(w => w.walk?.user_id === user.id);
      
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
        setIsLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);
    } catch (err) {
      console.error('Location error:', err);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const loadNearbyWalks = async () => {
    if (!location || !user) return;

    try {
      setIsLoadingWalks(true);
      const walks = await getNearbyWalks(location.coords.latitude, location.coords.longitude);

      const otherWalks = walks.filter((w) => w.walk?.user_id !== user.id);
      const ownWalks = walks.filter((w) => w.walk?.user_id === user.id);
      const sortedWalks = [...ownWalks, ...otherWalks];

      setNearbyWalks(sortedWalks);
    } catch (err) {
      console.error('Failed to load nearby walks:', err);
    } finally {
      setIsLoadingWalks(false);
    }
  };

  const filterWalks = (walks: NearbyWalk[]) => {
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

  const sortedWalks = [...filteredWalks].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    } else {
      const timeA = a.walk?.start_time ? new Date(a.walk.start_time).getTime() : 0;
      const timeB = b.walk?.start_time ? new Date(b.walk.start_time).getTime() : 0;
      return timeA - timeB;
    }
  });

  const mapMarkers = sortedWalks
    .filter((w) => w.walk)
    .map((w) => ({
      id: w.walk!.id,
      latitude: w.walk!.latitude,
      longitude: w.walk!.longitude,
      type: 'event' as const,
      isActive: isWalkActive(w.walk?.start_time || null),
      isOwner: w.walk!.user_id === user?.id,
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
        <NativeMap
          latitude={mapCenter ? mapCenter.latitude : location.coords.latitude}
          longitude={mapCenter ? mapCenter.longitude : location.coords.longitude}
          paddingBottom={mapCenter?.paddingBottom || 150}
          markers={mapMarkers}
          bounds={null}
          selectedMarkerId={selectedMarkerId}
          userLatitude={location.coords.latitude}
          userLongitude={location.coords.longitude}
          onMarkerPress={(id) => {
            setSelectedMarkerId(id);
            const index = sortedWalks.findIndex((item) => item.walk?.id === id);
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
      </View>

      <View style={[styles.mapButtons, { top: insets.top + 16 }]}>
        <Pressable style={styles.filterButton} onPress={() => setShowFilterSheet(true)}>
          <Svg width="32" height="32" viewBox="11 11 32 32" fill="none">
            <G filter="url(#filter0_d_3223_2156)">
              <Rect x="11" y="11" width="32" height="32" rx="16" fill="white"/>
            </G>
            <Rect x="18" y="22" width="9" height="3" rx="1" fill={COLORS.GRAY_ICON}/>
            <Rect x="27" y="30" width="9" height="3" rx="1" fill={COLORS.GRAY_ICON}/>
            <Rect x="30" y="20" width="6" height="6" rx="3" fill={COLORS.ORANGE_ICON}/>
            <Rect x="18" y="28" width="6" height="6" rx="3" fill={COLORS.ORANGE_ICON}/>
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
        sortBy={sortBy}
        onFilterChange={setTimeFilter}
        onSortChange={setSortBy}
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
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setCardsContainerHeight(height);
        }}
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
            if (index !== currentCardIndex && index < sortedWalks.length) {
              setCurrentCardIndex(index);
              const item = sortedWalks[index];

              if (item.walk) {
                const padding = 150;
                setMapCenter({
                  latitude: item.walk.latitude,
                  longitude: item.walk.longitude,
                  paddingBottom: padding,
                });
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
          ) : sortedWalks.length === 0 ? (
            <View style={[styles.emptyCard, { width: cardWidth }]}>
              <Text style={styles.emptyText}>{t('noEventsNearby')}</Text>
            </View>
          ) : (
            <>
              {sortedWalks.map((item) => (
                <Pressable
                  key={`walk-${item.walk?.id}`}
                  style={[
                    styles.userCard,
                    { width: cardWidth }
                  ]}
                  onPress={() => {
                    if (item.walk?.id) {
                      router.push(`/event/${item.walk.id}`);
                    }
                  }}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Pressable
                        style={styles.avatarContainer}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (item.walk) {
                            router.push(`/user/${item.walk.user_id}`);
                          }
                        }}
                      >
                        <Avatar uri={item.walk?.image_url} name="" size={SIZES.AVATAR_MEDIUM} />
                      </Pressable>

                      <View style={styles.cardHeaderInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {item.walk?.title || ''}
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
                    <Text style={[styles.distance, item.walk?.user_id === user?.id && styles.ownEventText]}>
                      {item.walk?.user_id === user?.id ? t('yourEvent') : `${(item.distance / 1000).toFixed(1)} ${t('kmFromYou')}`}
                    </Text>
                    {item.walk?.start_time && (
                      <View style={styles.timeInfo}>
                        <Clock size={14} color={getTimeColor(item.walk.start_time)} />
                        <Text style={[styles.timeText, { color: getTimeColor(item.walk.start_time) }]}>
                          {formatTime(item.walk.start_time, t)}
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
          walkOwnerAvatar={contactRequestData.walkOwnerAvatar}
          walkTitle={contactRequestData.walkTitle}
          walkStartTime={contactRequestData.walkStartTime}
          walkImageUrl={contactRequestData.walkImageUrl}
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
    height: 220,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyCard: {
    height: 220,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    shadowColor: COLORS.SHADOW_BLACK,
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
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.SHADOW_BLACK,
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
    color: COLORS.TEXT_SECONDARY,
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
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
