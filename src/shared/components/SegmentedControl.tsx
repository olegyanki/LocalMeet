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
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    padding: 4,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    ...SHADOW.standard,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: COLORS.CARD_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.ACCENT_ORANGE,
  },
  segmentTextInactive: {
    color: COLORS.TEXT_LIGHT,
  },
});
