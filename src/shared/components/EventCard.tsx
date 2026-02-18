import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { MapPin, ImageIcon, Clock } from 'lucide-react-native';
import Avatar from '@shared/components/Avatar';
import { COLORS, SIZES, SHADOW } from '@shared/constants';
import { NearbyWalk } from '@shared/lib/api';
import { TranslationKey } from '@shared/i18n/translations';

interface EventCardProps {
  // Data
  item: NearbyWalk;
  currentUserId: string;
  
  // Callbacks
  onPress: () => void;
  onAvatarPress: () => void;
  
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
  width,
  t,
}: EventCardProps) {
  // State
  const [imageError, setImageError] = useState(false);
  
  // Derived state
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
      {/* Main Content Area */}
      <View style={styles.mainContent}>
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
        
        {/* Event Details Container */}
        <View style={styles.detailsContainer}>
          {/* Event Title */}
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.walk?.title || ''}
          </Text>
          
          {/* Description */}
          {item.walk?.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.walk.description}
            </Text>
          )}
        </View>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Metadata Bar */}
      <View style={styles.metadataBar}>
        {/* Host Info */}
        <Pressable
          onPress={handleAvatarPress}
          style={styles.hostInfo}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityLabel={`View ${hostName}'s profile`}
          accessibilityRole="button"
        >
          <Avatar
            uri={hostAvatarUrl}
            name={hostName}
            size={24}
          />
          <View style={styles.hostTextContainer}>
            <Text style={styles.hostLabel}>{t('host').toUpperCase()}</Text>
            <Text style={styles.hostName} numberOfLines={1}>
              {hostName}
            </Text>
          </View>
        </Pressable>
        
        {/* Event Metadata */}
        <View style={styles.eventMetadata}>
          {/* Distance */}
          <View style={styles.metadataItem}>
            <MapPin size={14} color={COLORS.TEXT_LIGHT} />
            <Text style={styles.metadataText}>
              {(item.distance / 1000).toFixed(1)} km
            </Text>
          </View>
          
          {/* Vertical Divider */}
          <View style={styles.verticalDivider} />
          
          {/* Time */}
          {item.walk?.start_time && item.walk?.duration && (
            <View style={styles.metadataItem}>
              <Clock size={14} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.metadataText}>
                {getTimeRange(item.walk.start_time, item.walk.duration)}
              </Text>
            </View>
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
  card: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
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
    borderRadius: 40,
    overflow: 'hidden',
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
  detailsContainer: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    lineHeight: 24,
  },
  description: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    lineHeight: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hostTextContainer: {
    gap: 2,
  },
  hostLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
  },
  hostName: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  eventMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  verticalDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.BORDER_COLOR,
  },
});
