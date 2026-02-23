import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { WalkRequestWithProfile } from '@shared/lib/api';
import { useRef } from 'react';
import { Check, X, Calendar } from 'lucide-react-native';
import { COLORS, SIZES, SHADOW } from '@shared/constants';
import { formatRelativeTime } from '@shared/utils/time';
import Avatar from '@shared/components/Avatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface RequestCardProps {
  request: WalkRequestWithProfile;
  isPast?: boolean;
  onReject?: (requestId: string) => void;
  onAccept?: (requestId: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onCardPress?: (userId: string) => void;
}

export default function RequestCard({ request, isPast = false, onReject, onAccept, onSwipeStart, onSwipeEnd, onCardPress }: RequestCardProps) {
  const { requester, walk } = request;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handleDismiss = (direction: number) => {
    if (direction > 0) {
      onAccept?.(request.id);
    } else {
      onReject?.(request.id);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Disable swipe for past requests
        if (isPast) return false;
        
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

  const handleCardPress = () => {
    onCardPress?.(requester.id);
  };

  const handleAcceptPress = (e: any) => {
    e.stopPropagation();
    onAccept?.(request.id);
  };

  const handleDeclinePress = (e: any) => {
    e.stopPropagation();
    onReject?.(request.id);
  };

  const avatarSize = isPast ? 40 : SIZES.AVATAR_MEDIUM;
  const statusBadgeText = request.status === 'accepted' ? 'Joined' : 'Declined';
  const statusBadgeStyle = request.status === 'accepted' ? styles.joinedBadge : styles.declinedBadge;

  return (
    <View style={styles.container}>
      {!isPast && (
        <>
          <Animated.View style={[styles.acceptBackground, { opacity: acceptOpacity }]}>
            <Check size={28} color={COLORS.WHITE} strokeWidth={3} />
          </Animated.View>

          <Animated.View style={[styles.rejectBackground, { opacity: rejectOpacity }]}>
            <X size={28} color={COLORS.WHITE} strokeWidth={3} />
          </Animated.View>
        </>
      )}

      <Animated.View
        {...(!isPast ? panResponder.panHandlers : {})}
        style={[
          styles.card,
          isPast && styles.pastCard,
          !isPast && {
            transform: [{ translateX: translateX }],
            opacity: opacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleCardPress}
          activeOpacity={0.7}
          style={styles.cardContent}
        >
          <View style={styles.header}>
            <View style={[styles.avatarContainer, isPast && styles.pastAvatar]}>
              <Avatar 
                uri={requester.avatar_url} 
                name={requester.display_name || requester.username} 
                size={avatarSize}
              />
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.name}>
                {requester.display_name || requester.username}
              </Text>

              {!isPast && (
                <Text style={styles.subtitle}>Wants to join your event</Text>
              )}

              <View style={styles.eventRow}>
                <Calendar size={16} color={COLORS.TEXT_DARK} />
                <Text style={styles.eventName} numberOfLines={1}>
                  {walk.title}
                </Text>
                {isPast && (
                  <View style={[styles.statusBadge, statusBadgeStyle]}>
                    <Text style={[
                      styles.statusBadgeText,
                      request.status === 'accepted' ? styles.joinedBadgeText : styles.declinedBadgeText
                    ]}>
                      {statusBadgeText}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.timestamp}>
              {formatRelativeTime(request.created_at)}
            </Text>
          </View>

          {!isPast && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclinePress}
                activeOpacity={0.7}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptPress}
                activeOpacity={0.7}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
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
    borderRadius: 20,
    ...SHADOW.standard,
  },
  pastCard: {
    opacity: 0.6,
  },
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 12,
  },
  pastAvatar: {
    opacity: 0.5, // Grayscale effect approximation
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 4,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  timestamp: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  joinedBadge: {
    backgroundColor: COLORS.SUCCESS_GREEN,
  },
  declinedBadge: {
    backgroundColor: '#E8E8E8',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinedBadgeText: {
    color: COLORS.WHITE,
  },
  declinedBadgeText: {
    color: COLORS.TEXT_LIGHT,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOW.elevated,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});
