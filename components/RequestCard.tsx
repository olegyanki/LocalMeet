import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { WalkRequestWithProfile } from '../lib/api';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Check, X } from 'lucide-react-native';

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
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const cardHeight = useSharedValue(1);

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

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldDismiss =
        Math.abs(translateX.value) > SWIPE_THRESHOLD ||
        Math.abs(event.velocityX) > 1000;

      if (shouldDismiss) {
        const direction = translateX.value > 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        cardHeight.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(handleDismiss)();
        });
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.95],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
        { scale: scale * cardHeight.value },
      ],
      opacity: opacity.value,
      height: cardHeight.value === 0 ? 0 : undefined,
    };
  });

  const leftIndicatorStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );

    const opacityValue = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity: opacityValue,
    };
  });

  const rightIndicatorStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    const opacityValue = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2, 0],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity: opacityValue,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicatorLeft, leftIndicatorStyle]}>
        <View style={styles.indicatorCircle}>
          <Check size={32} color="#FFFFFF" strokeWidth={3} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.indicatorRight, rightIndicatorStyle]}>
        <View style={[styles.indicatorCircle, styles.indicatorCircleReject]}>
          <X size={32} color="#FFFFFF" strokeWidth={3} />
        </View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
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
      </GestureDetector>
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
