import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import WalkingPersonIcon from '@shared/components/WalkingPersonIcon';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';

interface PlusTabButtonProps {
  accessibilityState?: { selected?: boolean };
  onPress?: () => void;
  style?: any;
  isActive?: boolean;
}

export default function PlusTabButton({ accessibilityState, onPress, style, isActive }: PlusTabButtonProps) {
  const { t } = useI18n();
  const selected = isActive || accessibilityState?.selected;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
    >
      <View style={styles.iconWrapper}>
        <WalkingPersonIcon size={56} />
      </View>
      <Text style={[styles.label, { color: selected ? COLORS.ACCENT_ORANGE : COLORS.TEXT_LIGHT }]}>
        {t('tabGoOnline').toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrapper: {
    marginTop: -26,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 31,
    overflow: 'visible',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
});
