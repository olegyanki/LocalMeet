import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Clock } from 'lucide-react-native';
import Avatar from '@shared/components/Avatar';
import { COLORS, SIZES } from '@shared/constants';
import { getTimeColor, formatTime } from '@shared/utils/time';
import { NearbyWalk } from '@shared/lib/api';
import { TranslationKey } from '@shared/i18n/translations';

interface EventCardProps {
  item: NearbyWalk;
  currentUserId: string;
  onPress: () => void;
  onAvatarPress: () => void;
  width?: number;
  t: (key: TranslationKey, params?: Record<string, any>) => string;
}

export default function EventCard({
  item,
  currentUserId,
  onPress,
  onAvatarPress,
  width,
  t,
}: EventCardProps) {
  const isOwnEvent = item.walk?.user_id === currentUserId;

  return (
    <Pressable
      style={[styles.card, width && { width }]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Pressable
            style={styles.avatarContainer}
            onPress={(e) => {
              e.stopPropagation();
              onAvatarPress();
            }}
          >
            <Avatar 
              uri={item.walk?.image_url} 
              name="" 
              size={SIZES.AVATAR_MEDIUM} 
            />
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
        <Text style={[styles.distance, isOwnEvent && styles.ownEventText]}>
          {isOwnEvent 
            ? t('yourEvent') 
            : `${(item.distance / 1000).toFixed(1)} ${t('kmFromYou')}`
          }
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
  );
}

const styles = StyleSheet.create({
  card: {
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
});
