import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../constants/colors';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  style?: ViewStyle;
}

export default function Avatar({ uri, name, size = 60, style }: AvatarProps) {
  const avatarSize = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, avatarSize, style]} />;
  }

  const initial = name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.avatar, styles.placeholder, avatarSize, style]}>
      <Text style={[styles.text, { fontSize: size / 2.5 }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E8E8E8',
  },
  placeholder: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    color: COLORS.WHITE,
  },
});
