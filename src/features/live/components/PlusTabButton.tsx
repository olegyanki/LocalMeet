import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import GradientView from '@shared/components/GradientView';
import { Plus } from 'lucide-react-native';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';

interface PlusTabButtonProps {
  accessibilityState?: { selected?: boolean };
  onPress?: () => void;
  style?: any;
}

const CIRCLE_SIZE = 46;
const BORDER_WIDTH = 3;

export default function PlusTabButton({ accessibilityState, onPress, style }: PlusTabButtonProps) {
  const { t } = useI18n();

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
    >
      <View style={styles.circleOuter}>
        <GradientView style={styles.circleInner}>
          <Plus size={26} color={COLORS.WHITE} strokeWidth={2.5} />
        </GradientView>
      </View>
      <Text style={styles.label}>
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
  circleOuter: {
    width: CIRCLE_SIZE + BORDER_WIDTH * 2,
    height: CIRCLE_SIZE + BORDER_WIDTH * 2,
    borderRadius: (CIRCLE_SIZE + BORDER_WIDTH * 2) / 2,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  circleInner: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
  },
});
