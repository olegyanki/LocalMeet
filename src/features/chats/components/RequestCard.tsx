import { View, Text, StyleSheet, Image, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { WalkRequestWithProfile } from '../lib/api';
import { useRef } from 'react';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '@shared/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface RequestCardProps {
  request: WalkRequestWithProfile;
  onReject: (requestId: string) => void;
  onAccept: (requestId: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onCardPress?: (userId: string) => void;
}

export default function RequestCard({ request, onReject, onAccept, onSwipeStart, onSwipeEnd, onCardPress }: RequestCardProps) {
  const { requester } = request;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

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

  const handleDismiss = (direction: number) => {
    if (direction > 0) {
      onAccept(request.id);
    } else {
      onReject(request.id);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 1.5);
        const hasMovedEnough = Math.abs(gestureState.dx) > 3;
        if (isHorizontal && hasMovedEnough) {
          onSwipeStart?.();
          return true;
        }
        return false;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        onSwipeEnd?.();
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        if (isHorizontal) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        onSwipeEnd?.();
        const shouldDismiss =
          Math.abs(gestureState.dx) > SWIPE_THRESHOLD ||
          Math.abs(gestureState.vx) > 0.5;

        if (shouldDismiss) {
          const direction = gestureState.dx > 0 ? 1 : -1;
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: direction * SCREEN_WIDTH * 1.5,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            handleDismiss(direction);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const acceptOpacity = translateX.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rejectOpacity = translateX.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.acceptBackground, { opacity: acceptOpacity }]}>
        <Check size={28} color={COLORS.WHITE} strokeWidth={3} />
      </Animated.View>

      <Animated.View style={[styles.rejectBackground, { opacity: rejectOpacity }]}>
        <X size={28} color={COLORS.WHITE} strokeWidth={3} />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [{ translateX: translateX }],
            opacity: opacity,
          },
        ]}
      >
          <TouchableOpacity
            style={styles.header}
            onPress={() => onCardPress?.(requester.id)}
            activeOpacity={0.7}
          >
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
        </TouchableOpacity>

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
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  acceptBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.SUCCESS_GREEN,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 30,
  },
  rejectBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.ERROR_RED,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 30,
  },
  card: {
    backgroundColor: COLORS.CARD_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: COLORS.ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.WHITE,
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
    color: COLORS.TEXT_DARK,
  },
  age: {
    fontSize: 17,
    fontWeight: '400',
    color: COLORS.TEXT_DARK,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  interestTag: {
    backgroundColor: COLORS.INPUT_BG,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.TEXT_LIGHT,
    marginTop: 6,
  },
  time: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.TEXT_DARK,
  },
});
