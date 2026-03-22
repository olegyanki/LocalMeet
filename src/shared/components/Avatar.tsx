import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../constants/colors';
import GradientView from './GradientView';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  style?: ViewStyle;
  shape?: 'circle' | 'square';
}

export default function Avatar({ uri, name, size = 60, style, shape = 'circle' }: AvatarProps) {
  const borderRadius = shape === 'square' ? size * 0.2 : size / 2;
  const avatarSize = { width: size, height: size, borderRadius };

  if (uri) {
    return (
      <Image 
        source={{ uri }} 
        style={[styles.avatar, avatarSize, style]} 
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }

  const initial = name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';

  return (
    <GradientView style={[styles.avatar, styles.placeholder, avatarSize, style]}>
      <Text style={[styles.text, { fontSize: size / 2.5 }]}>
        {initial}
      </Text>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E8E8E8',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    color: COLORS.WHITE,
  },
});
