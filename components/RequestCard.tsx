import { View, Text, StyleSheet, Image, Dimensions, Animated, PanResponder } from 'react-native';
import { WalkRequestWithProfile } from '../lib/api';
import { Check, X } from 'lucide-react-native';
import { useRef } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

const ACCENT_ORANGE = '#FF9500';
const TEXT_LIGHT = '#999999';
const TEXT_DARK = '#1C1C1E';
const RED = '#FF3B30';
const GREEN = '#34C759';

interface RequestCardProps {
  request: WalkRequestWithProfile;
  onReject: (requestId: string) => void;
}

export default function RequestCard({ request, onReject }: RequestCardProps) {
  const { requester } = request;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const cardHeight = useRef(new Animated.Value(1)).current;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleDismiss = () => {
    onReject(request.id);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldDismiss =
          Math.abs(gestureState.dx) > SWIPE_THRESHOLD ||
          Math.abs(gestureState.vx) > 1;

        if (shouldDismiss) {
          const direction = gestureState.dx > 0 ? 1 : -1;
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: direction * SCREEN_WIDTH,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(cardHeight, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start(() => {
            handleDismiss();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 20,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const absTranslateX = Animated.multiply(translateX, translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  }));

  const scale = absTranslateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * SWIPE_THRESHOLD],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const leftIndicatorScale = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const leftIndicatorOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const rightIndicatorScale = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rightIndicatorOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicatorLeft,
          {
            transform: [{ scale: leftIndicatorScale }],
            opacity: leftIndicatorOpacity,
          },
        ]}
      >
        <View style={styles.indicatorCircle}>
          <Check size={32} color="#FFFFFF" strokeWidth={3} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.indicatorRight,
          {
            transform: [{ scale: rightIndicatorScale }],
            opacity: rightIndicatorOpacity,
          },
        ]}
      >
        <View style={[styles.indicatorCircle, styles.indicatorCircleReject]}>
          <X size={32} color="#FFFFFF" strokeWidth={3} />
        </View>
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [
              { translateX: translateX },
              { rotate: rotate },
              { scale: Animated.multiply(scale, cardHeight) },
            ],
            opacity: opacity,
          },
        ]}
      >
          <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {requester.avatar_url ? (
              <Image source={{ uri: requester.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {requester.display_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {requester.display_name || requester.username}
              </Text>
              {requester.age && (
                <Text style={styles.age}>, {requester.age}</Text>
              )}
            </View>

            {requester.interests && requester.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {requester.interests.slice(0, 3).map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
                {requester.interests.length > 3 && (
                  <Text style={styles.moreInterests}>
                    +{requester.interests.length - 3}
                  </Text>
                )}
              </View>
            )}

            {requester.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {requester.bio}
              </Text>
            )}
          </View>

          <Text style={styles.time}>{formatTimeAgo(request.created_at)}</Text>
        </View>

          {request.message && (
            <Text style={styles.message} numberOfLines={2}>
              {request.message}
            </Text>
          )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  indicatorLeft: {
    position: 'absolute',
    left: 40,
    top: '50%',
    marginTop: -32,
    zIndex: -1,
  },
  indicatorRight: {
    position: 'absolute',
    right: 40,
    top: '50%',
    marginTop: -32,
    zIndex: -1,
  },
  indicatorCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorCircleReject: {
    backgroundColor: RED,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  age: {
    fontSize: 17,
    fontWeight: '400',
    color: TEXT_DARK,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  interestTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    lineHeight: 18,
    color: TEXT_LIGHT,
    marginTop: 6,
  },
  time: {
    fontSize: 13,
    color: TEXT_LIGHT,
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_DARK,
  },
});
