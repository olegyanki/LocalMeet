import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  useGradient?: boolean;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  showCheckIcon = false,
  style,
  textStyle,
  useGradient = true,
}: PrimaryButtonProps) {
  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color={COLORS.CARD_BG} />
      ) : (
        <>
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
          {showCheckIcon && <Text style={styles.checkIcon}>✓</Text>}
        </>
      )}
    </>
  );

  if (useGradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.buttonWrapper, style]}
      >
        <LinearGradient
          colors={COLORS.GRADIENT_ORANGE}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

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
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  gradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  button: BUTTON_STYLES.primary,
  buttonText: BUTTON_STYLES.primaryText,
  disabled: BUTTON_STYLES.disabled,
  checkIcon: {
    color: COLORS.CARD_BG,
    fontSize: 20,
    fontWeight: '700',
  },
});
