import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WalkRequestWithProfile } from '@shared/lib/api';
import { Calendar } from 'lucide-react-native';
import { COLORS, SHADOW } from '@shared/constants';
import { formatRelativeTime } from '@shared/utils/time';
import { useI18n } from '@shared/i18n';
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
  const { t } = useI18n();

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

  const avatarSize = isPast ? 40 : 44;
  const statusBadgeText = request.status === 'accepted' ? t('joined') : t('declined');
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
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {requester.display_name || requester.username}
                </Text>
                <Text style={styles.timestamp}>
                  {formatRelativeTime(request.created_at).toUpperCase()}
                </Text>
              </View>

              {!isPast && (
                <Text style={styles.subtitle}>{t('wantsToJoinEvent')}</Text>
              )}
              
              {isPast && (
                <Text style={styles.pastSubtitle}>
                  {t('acceptedFor')} "{walk.title}"
                </Text>
              )}
            </View>

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

          {!isPast && request.message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>"{request.message}"</Text>
            </View>
          )}

          {!isPast && (
            <View style={styles.eventRow}>
              <Calendar size={16} color={COLORS.ACCENT_ORANGE} />
              <Text style={styles.eventName} numberOfLines={1}>
                {walk.title}
              </Text>
            </View>
          )}

          {!isPast && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclinePress}
                activeOpacity={0.7}
              >
                <Text style={styles.declineButtonText}>{t('decline')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButtonWrapper}
                onPress={handleAcceptPress}
                activeOpacity={0.7}
              >
                <GradientView style={styles.acceptButton}>
                  <Text style={styles.acceptButtonText}>{t('accept')}</Text>
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
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
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  pastAvatar: {
    opacity: 0.5,
  },
  infoContainer: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    lineHeight: 16,
  },
  pastSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  messageBox: {
    backgroundColor: 'rgba(242, 242, 247, 0.6)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  eventName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  joinedBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  declinedBadge: {
    backgroundColor: '#E8E8E8',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  joinedBadgeText: {
    color: '#34C759',
  },
  declinedBadgeText: {
    color: COLORS.TEXT_LIGHT,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
  },
  acceptButtonWrapper: {
    flex: 1,
  },
  acceptButton: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
});
