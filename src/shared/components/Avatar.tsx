import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@shared/constants';

const { ACCENT_ORANGE, WHITE, BORDER_COLOR } = COLORS;


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

  return (
    <View style={[styles.avatar, styles.placeholder, avatarSize, style]}>
      <Text style={[styles.text, { fontSize: size / 2.5 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: BORDER_COLOR,
  },
  placeholder: {
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    color: WHITE,
  },
});
