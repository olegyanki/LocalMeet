import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { BUTTON_STYLES } from '@shared/constants/styles';
import { COLORS } from '@shared/constants';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  showCheckIcon?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  showCheckIcon = false,
  style,
  textStyle,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.CARD_BG} />
      ) : (
        <>
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
          {showCheckIcon && <Text style={styles.checkIcon}>✓</Text>}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: BUTTON_STYLES.primary,
  buttonText: BUTTON_STYLES.primaryText,
  disabled: BUTTON_STYLES.disabled,
  checkIcon: {
    color: COLORS.CARD_BG,
    fontSize: 20,
    fontWeight: '700',
  },
});
