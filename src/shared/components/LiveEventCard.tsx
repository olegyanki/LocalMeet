import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import Avatar from '@shared/components/Avatar';
import GradientView from '@shared/components/GradientView';
import { COLORS, SHADOW } from '@shared/constants';
import { NearbyWalk } from '@shared/lib/api';
import { TranslationKey } from '@shared/i18n/translations';
import { getShortDisplayName } from '@shared/utils/profile';
import { formatDistance } from '@shared/utils/location';

interface LiveEventCardProps {
  item: NearbyWalk;
  currentUserId: string;
  onPress: () => void;
  onButtonPress?: () => void;
  onAvatarPress: () => void;
  requestStatus?: 'pending' | 'accepted' | 'rejected' | null;
  width?: number;
  t: (key: TranslationKey, params?: Record<string, any>) => string;
}

export default React.memo(function LiveEventCard({
  item,
  currentUserId,
  onPress,
  onButtonPress,
  onAvatarPress,
  requestStatus,
  width,
  t,
}: LiveEventCardProps) {
  const isOwnEvent = item.walk?.user_id === currentUserId;
  const hasRequest = requestStatus === 'pending' || requestStatus === 'accepted' || requestStatus === 'rejected';
  const hostAvatarUrl = item.host?.avatar_url;
  const hostName = item.host ? getShortDisplayName(item.host) : t('unknownHost');
  const description = item.walk?.description || '';
  const distanceText = formatDistance(item.distance, t as any);

  const handleAvatarPress = (e: any) => {
    e.stopPropagation();
    onAvatarPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        width ? { width } : null,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={`${hostName} - ${t('liveActiveNow')}`}
      accessibilityRole="button"
    >
      {/* Main Content Area — same layout as EventCard */}
      <View style={styles.mainContent}>
        {/* Avatar instead of event image */}
        <View style={styles.imageContainer}>
          <Pressable onPress={handleAvatarPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Avatar uri={hostAvatarUrl} name={hostName} size={96} />
          </Pressable>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          {/* Active Now badge instead of title */}
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>{t('liveActiveNow')}</Text>
          </View>

          {/* Description */}
          {description ? (
            <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom bar — name + distance on left, join button on right */}
      <View style={styles.metadataBar}>
        {isOwnEvent ? (
          <Text style={styles.ownEventText}>{t('yourEvent')}</Text>
        ) : (
          <>
            <View style={styles.hostRow}>
              <Text style={styles.hostName} numberOfLines={1}>{hostName}</Text>
              <Text style={styles.metadataText}>{distanceText} {t('fromYou')}</Text>
            </View>
            {hasRequest ? (
              <View style={styles.sentButton}>
                <Text style={styles.sentButtonText}>{t('requestSentStatus')}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={(e) => {
                  e.stopPropagation();
                  if (onButtonPress) onButtonPress();
                  else onPress();
                }}
                activeOpacity={0.6}
              >
                <GradientView style={styles.joinGradient}>
                  <Text style={styles.joinButtonText}>{t('liveWrite')}</Text>
                </GradientView>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.walk?.id === nextProps.item.walk?.id &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.requestStatus === nextProps.requestStatus
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    ...SHADOW.standard,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  mainContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: 20,
    overflow: 'hidden',
  },
  detailsContainer: {
    flex: 1,
    gap: 8,
    maxHeight: 96,
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(139, 216, 156, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.SUCCESS_GREEN,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.SUCCESS_GREEN,
  },
  description: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER_COLOR,
  },
  metadataBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  hostRow: {
    flex: 1,
    gap: 2,
  },
  hostName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  metadataText: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  ownEventText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  joinGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.CARD_BG,
  },
  sentButton: {
    borderRadius: 16,
    backgroundColor: COLORS.BG_SECONDARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
});
