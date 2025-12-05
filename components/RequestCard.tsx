import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { WalkRequestWithProfile } from '../lib/api';
import { Swipeable } from 'react-native-gesture-handler';
import { X } from 'lucide-react-native';

const ACCENT_ORANGE = '#FF9500';
const TEXT_LIGHT = '#999999';
const TEXT_DARK = '#1C1C1E';
const RED = '#FF3B30';

interface RequestCardProps {
  request: WalkRequestWithProfile;
  onReject: (requestId: string) => void;
}

export default function RequestCard({ request, onReject }: RequestCardProps) {
  const { requester } = request;

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

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <X size={24} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>Reject</Text>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => onReject(request.id)}
      overshootRight={false}
      friction={2}
    >
      <View style={styles.card}>
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
          </View>

          <Text style={styles.time}>{formatTimeAgo(request.created_at)}</Text>
        </View>

        {request.message && (
          <Text style={styles.message} numberOfLines={2}>
            {request.message}
          </Text>
        )}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
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
  swipeAction: {
    backgroundColor: RED,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
