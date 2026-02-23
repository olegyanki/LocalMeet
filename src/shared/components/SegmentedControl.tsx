import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SHADOW } from '@shared/constants';

interface SegmentedControlProps {
  segments: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
}

export default function SegmentedControl({
  segments,
  activeIndex,
  onChange,
  style,
}: SegmentedControlProps) {
  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => {
        const isActive = index === activeIndex;
        
        return (
          <TouchableOpacity
            key={segment}
            style={[
              styles.segment,
              isActive && styles.segmentActive,
            ]}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                isActive ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              {segment}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.BG_SECONDARY,
    borderRadius: 12,
    padding: 3,
    height: 44,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: COLORS.CARD_BG,
    ...SHADOW.standard,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.TEXT_DARK,
  },
  segmentTextInactive: {
    color: COLORS.TEXT_LIGHT,
  },
});
