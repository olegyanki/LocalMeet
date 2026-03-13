import React from 'react';
import { View, StyleSheet } from 'react-native';
import ChatTabBadge from './ChatTabBadge';

interface TabIconWithBadgeProps {
  icon: React.ComponentType<any>;
  size: number;
  color: string;
  badgeCount?: number;
  unreadMessages?: number;
  pendingRequests?: number;
  maxDisplayCount?: number;
}

export default function TabIconWithBadge({
  icon: Icon,
  size,
  color,
  badgeCount = 0,
  unreadMessages = 0,
  pendingRequests = 0,
  maxDisplayCount = 99,
}: TabIconWithBadgeProps) {
  return (
    <View style={styles.container}>
      <Icon size={size} color={color} />
      {badgeCount > 0 && (
        <ChatTabBadge
          count={badgeCount}
          unreadMessages={unreadMessages}
          pendingRequests={pendingRequests}
          maxDisplayCount={maxDisplayCount}
          size="small"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
    height: 28,
  },
});