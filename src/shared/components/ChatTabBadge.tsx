import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '@shared/constants';
import { useI18n } from '@shared/i18n';

interface ChatTabBadgeProps {
  count: number;
  unreadMessages?: number;
  pendingRequests?: number;
  maxDisplayCount?: number;
  size?: 'small' | 'medium';
  color?: string;
  textColor?: string;
}

export default function ChatTabBadge({
  count,
  unreadMessages = 0,
  pendingRequests = 0,
  maxDisplayCount = 99,
  size = 'small',
  color = COLORS.ACCENT_ORANGE,
  textColor = '#FFFFFF',
}: ChatTabBadgeProps) {
  const { t } = useI18n();
  const scaleAnim = useRef(new Animated.Value(count > 0 ? 1 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(count > 0 ? 1 : 0)).current;

  // Animate badge appearance/disappearance
  useEffect(() => {
    if (count > 0) {
      // Show badge with scale and fade in animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide badge with scale and fade out animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [count, scaleAnim, opacityAnim]);

  // Don't render if count is 0
  if (count <= 0) {
    return null;
  }

  // Format count display
  const displayCount = count > maxDisplayCount ? `${maxDisplayCount}+` : count.toString();

  // Generate accessibility label
  const accessibilityLabel = t('badgeAccessibilityLabel', {
    count,
    unread: unreadMessages,
    pending: pendingRequests,
  });

  // Size-based styling
  const sizeStyles = size === 'small' ? styles.small : styles.medium;
  const textSizeStyles = size === 'small' ? styles.textSmall : styles.textMedium;

  return (
    <Animated.View
      style={[
        styles.badge,
        sizeStyles,
        {
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      accessibilityHint={t('badgeNotifications', { count })}
    >
      <Text
        style={[
          styles.text,
          textSizeStyles,
          { color: textColor },
        ]}
        numberOfLines={1}
      >
        {displayCount}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  small: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
  },
  medium: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  textSmall: {
    fontSize: 11,
    lineHeight: 13,
  },
  textMedium: {
    fontSize: 12,
    lineHeight: 14,
  },
});