import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

// Common button styles
export const BUTTON_STYLES = {
  primary: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryText: {
    color: COLORS.CARD_BG,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  disabled: {
    opacity: 0.6,
  },
};

// Common input styles
export const INPUT_STYLES = {
  wrapper: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding: 4,
    minHeight: 56,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.TEXT_DARK,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
};

// Common chip styles
export const CHIP_STYLES = {
  active: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activeText: {
    fontSize: 14,
    color: COLORS.CARD_BG,
    fontWeight: '500' as const,
  },
  inactive: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  inactiveText: {
    fontSize: 14,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '500' as const,
  },
};

// Common shadow
export const SHADOW = {
  standard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Common sizes
export const SIZES = {
  AVATAR_SMALL: 32,
  AVATAR_MEDIUM: 48,
  AVATAR_LARGE: 80,
  TAB_BAR_HEIGHT: 78,
  CARDS_COLLAPSE_DISTANCE: 250,
  HEADER_SPACER_WIDTH: 60,
  SCREEN_TOP_PADDING: 16,
};

// Common header styles
export const HEADER_STYLES = {
  container: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
  },
  spacer: {
    width: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.TEXT_DARK,
    flex: 1,
    textAlign: 'center' as const,
  },
  headerTextButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.ACCENT_ORANGE,
    width: 60,
    textAlign: 'right' as const,
  },
};
