import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin } from 'lucide-react-native';
import Avatar from '@shared/components/Avatar';
import { COLORS, SHADOW } from '@shared/constants';
import { NearbyWalk } from '@shared/lib/api';
import { TranslationKey } from '@shared/i18n/translations';
import { getShortDisplayName } from '@shared/utils/profile';

interface LiveEventCardProps {
  item: NearbyWalk;
  currentUserId: string;
  onPress: () => void;
  onAvatarPress: () => void;
  width?: number;
  t: (key: TranslationKey, params?: Record<string, any>) => string;
}

export default React.memo(function LiveEventCard({
  item,
  currentUserId,
  onPress,
  onAvatarPress,
  width,
  t,
}: LiveEventCardProps) {
  const isOwnEvent = item.walk?.user_id === currentUserId;
  const hostAvatarUrl = item.host?.avatar_url;
  const hostName = item.host ? getShortDisplayName(item.host) : t('unknownHost');
  const occupation = item.host?.occupation || '';
  const description = item.walk?.description || '';
  const distanceKm = (item.distance / 1000).toFixed(1);

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
            <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom bar — name + occupation on left, distance on right */}
      <View style={styles.metadataBar}>
        {isOwnEvent ? (
          <Text style={styles.ownEventText}>{t('yourEvent')}</Text>
        ) : (
          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>{hostName}</Text>
            {occupation ? (
              <Text style={styles.hostOccupation} numberOfLines={1}>{occupation}</Text>
            ) : null}
          </View>
        )}

        <View style={styles.metadataItem}>
          <MapPin size={14} color={COLORS.TEXT_LIGHT} />
          <Text style={styles.metadataText}>{distanceKm} km</Text>
        </View>
      </View>
    </Pressable>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.walk?.id === nextProps.item.walk?.id &&
    prevProps.currentUserId === nextProps.currentUserId
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
  hostInfo: {
    flex: 1,
    gap: 2,
  },
  hostName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  hostOccupation: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
});
