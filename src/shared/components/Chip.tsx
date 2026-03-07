import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Components
import GradientView from './GradientView';

// Constants
import { COLORS, CHIP_STYLES } from '@shared/constants';

interface ChipProps {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  emoji?: string;
}

export default function Chip({
  label,
  isActive = false,
  onPress,
  style,
  textStyle,
  emoji,
}: ChipProps) {
  const chipContent = (
    <>
      <Text style={[
        isActive ? CHIP_STYLES.activeText : CHIP_STYLES.inactiveText,
        textStyle
      ]}>
        {emoji && `${emoji} `}{label}
      </Text>
    </>
  );

  if (isActive) {
    return (
      <TouchableOpacity
        style={[styles.chipWrapper, style]}
        onPress={onPress}
        disabled={!onPress}
      >
        <GradientView style={[CHIP_STYLES.active, styles.chip]}>
          {chipContent}
        </GradientView>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.chipWrapper, CHIP_STYLES.inactive, styles.chip, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      {chipContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chipWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  chip: {
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
