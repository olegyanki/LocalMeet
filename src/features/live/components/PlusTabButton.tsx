import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';

interface PlusTabButtonProps {
  accessibilityState?: { selected?: boolean };
  onPress?: () => void;
  style?: any;
}

export default function PlusTabButton({ accessibilityState, onPress, style }: PlusTabButtonProps) {
  const { t } = useI18n();
  const isActive = accessibilityState?.selected ?? false;
  const color = isActive ? COLORS.ACCENT_ORANGE : COLORS.TEXT_LIGHT;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
    >
      <Plus size={20} color={color} />
      <Text style={[styles.label, { color }]}>
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
    gap: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
  },
});
