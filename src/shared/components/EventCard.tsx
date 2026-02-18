import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { MapPin, ImageIcon } from 'lucide-react-native';
import Avatar from '@shared/components/Avatar';
import { COLORS, SIZES, CARD_STYLES, SHADOW } from '@shared/constants';
import { NearbyWalk } from '@shared/lib/api';
import { TranslationKey } from '@shared/i18n/translations';

interface EventCardProps {
  // Data
  item: NearbyWalk;
  currentUserId: string;
  
  // Callbacks
  onPress: () => void;
  onAvatarPress: () => void;
  onJoinPress?: (eventId: string) => void;
  
  // Optional customization
  width?: number;
  
  // i18n
  t: (key: TranslationKey, params?: Record<string, any>) => string;
}

export default React.memo(function EventCard({
  item,
  currentUserId,
  onPress,
  onAvatarPress,
  onJoinPress,
  width,
  t,
}: EventCardProps) {
  // State
  const [imageError, setImageError] = useState(false);
  
  // Derived state
  const isOwnEvent = item.walk?.user_id === currentUserId;
  const eventImageUrl = item.walk?.image_url;
  const hostAvatarUrl = item.host?.avatar_url;
  const hostName = item.host?.display_name || item.host?.username || t('unknownHost');
  
  // Time formatting
  const getTimeRange = (startTime: string, duration: number) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return `${formatHHMM(start)} - ${formatHHMM(end)}`;
  };
  
  const formatHHMM = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  
  // Handlers
  const handleAvatarPress = (e: any) => {
    e.stopPropagation();
    onAvatarPress();
  };
  
  const handleJoinPress = (e: any) => {
    e.stopPropagation();
    if (onJoinPress && item.walk?.id) {
      onJoinPress(item.walk.id);
    }
  };
  
  // Dynamic styles
  const cardStyle = [
    styles.card,
    width ? { width } : null,
  ];
  
  return (
    <Pressable
      style={({ pressed }) => [
        cardStyle,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={`Event: ${item.walk?.title}`}
      accessibilityRole="button"
      accessibilityHint="Tap to view event details"
    >
      {/* Top Content - takes remaining space */}
      <View style={styles.topContent}>
        {/* Event Title - inside card at top */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.walk?.title || ''}
        </Text>
        
        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Event Image */}
          <View style={styles.imageContainer}>
            {eventImageUrl && !imageError ? (
              <Image
                source={{ uri: eventImageUrl }}
                style={styles.eventImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.eventImage, styles.imagePlaceholder]}>
                <ImageIcon size={32} color={COLORS.GRAY_PLACEHOLDER} />
              </View>
            )}
          </View>
          
          {/* Info Container */}
          <View style={styles.infoContainer}>
            {/* Description */}
            {item.walk?.description && (
              <Text style={styles.description} numberOfLines={4}>
                {item.walk.description}
              </Text>
            )}
            
            {/* Location & Time Row */}
            <View style={styles.locationTimeRow}>
              {/* Location - always show distance */}
              <View style={styles.locationInfo}>
                <MapPin size={14} color={COLORS.TEXT_DARK} />
                <Text style={styles.locationText}>
                  {(item.distance / 1000).toFixed(1)} km
                </Text>
              </View>
              
              {/* Time Badge */}
              {item.walk?.start_time && item.walk?.duration && (
                <View style={styles.timeBadge}>
                  <View style={styles.blueDot} />
                  <Text style={styles.timeText}>
                    {getTimeRange(item.walk.start_time, item.walk.duration)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      
      {/* Bottom Section - pinned to bottom */}
      <View style={styles.bottomSection}>
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Footer */}
        <View style={styles.footer}>
        {/* Host Info */}
        <Pressable
          onPress={handleAvatarPress}
          style={styles.hostInfo}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityLabel={`View ${hostName}'s profile`}
          accessibilityRole="button"
        >
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={hostAvatarUrl}
              name={hostName}
              size={SIZES.HOST_AVATAR_SIZE}
            />
          </View>
          <View style={styles.hostTextContainer}>
            <Text style={styles.hostedByLabel}>{t('hostedBy')}</Text>
            <Text style={styles.hostName} numberOfLines={1}>
              {hostName}
            </Text>
          </View>
        </Pressable>
        
        {/* Join Button or Own Event Text */}
        {isOwnEvent ? (
          <Text style={styles.ownEventText}>{t('yourEvent')}</Text>
        ) : (
          <Pressable
            onPress={handleJoinPress}
            style={styles.joinButton}
            accessible={true}
            accessibilityLabel="Join event"
            accessibilityRole="button"
          >
            <Text style={styles.joinButtonText}>{t('join')}</Text>
          </Pressable>
        )}
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
  eventTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 12,
  },
  card: {
    ...CARD_STYLES.eventCard,
    backgroundColor: COLORS.CARD_BG,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  topContent: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    width: SIZES.EVENT_IMAGE_SIZE,
    height: SIZES.EVENT_IMAGE_SIZE,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    ...SHADOW.md,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.IMAGE_PLACEHOLDER_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    gap: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.SUBTEXT_LIGHT,
  },
  locationTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.TIME_BADGE_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.TIME_BADGE_TEXT,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TIME_BADGE_TEXT,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: COLORS.GRAY_DIVIDER,
  },
  bottomSection: {
    // Footer section pinned to bottom
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  hostTextContainer: {
    flex: 1,
  },
  hostedByLabel: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 2,
  },
  hostName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  joinButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    ...SHADOW.elevated,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.CARD_BG,
  },
  ownEventText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
  },
});
