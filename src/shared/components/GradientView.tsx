import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@shared/constants';

interface GradientViewProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  colors?: readonly string[];
}

export default function GradientView({
  children,
  style,
  colors = COLORS.GRADIENT_ORANGE,
}: GradientViewProps) {
  return (
    <LinearGradient
      colors={colors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
