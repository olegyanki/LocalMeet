import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
}

export default function GradientView({
  children,
  style,
  colors = ['#FFB84D', '#FF8C26', '#FF5500'],
}: GradientViewProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
