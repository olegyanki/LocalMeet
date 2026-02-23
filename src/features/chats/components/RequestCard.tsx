import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WalkRequestWithProfile } from '@shared/lib/api';
import { Calendar } from 'lucide-react-native';
import { COLORS, SIZES, SHADOW } from '@shared/constants';
import { formatRelativeTime } from '@shared/utils/time';
import Avatar from '@shared/components/Avatar';
import GradientView from '@shared/components/GradientView';

interface RequestCardProps {
  request: WalkRequestWithProfile;
  isPast?: boolean;
  onReject?: (requestId: string) => void;
  onAccept?: (requestId: string) => void;
  onCardPress?: (userId: string) => void;
}

export default function RequestCard({ request, isPast = false, onReject, onAccept, onCardPress }: RequestCardProps) {
  const { requester, walk } = request;

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
      <View style={[styles.card, isPast && styles.pastCard]}>
        <TouchableOpacity
          onPress={handleCardPress}
          activeOpacity={1}
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
                style={styles.acceptButtonWrapper}
                onPress={handleAcceptPress}
                activeOpacity={0.7}
              >
                <GradientView style={styles.acceptButton}>
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </GradientView>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  acceptButtonWrapper: {
    flex: 1,
  },
  acceptButton: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.elevated,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});
