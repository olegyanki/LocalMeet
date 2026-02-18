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
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
};

// Common sizes
export const SIZES = {
  AVATAR_SMALL: 32,
  AVATAR_MEDIUM: 48,
  AVATAR_LARGE: 80,
  AVATAR_XLARGE: 100,
  TAB_BAR_HEIGHT: 78,
  CARDS_COLLAPSE_DISTANCE: 250,
  HEADER_SPACER_WIDTH: 60,
  SCREEN_TOP_PADDING: 16,
  INPUT_MIN_HEIGHT: 56,
  TEXTAREA_MIN_HEIGHT: 96,
  BIO_INPUT_MIN_HEIGHT: 100,
  COVER_IMAGE_HEIGHT: 192,
  MAP_PREVIEW_HEIGHT: 160,
  ICON_BUTTON_SIZE: 28,
  ICON_BUTTON_MEDIUM: 32,
  ICON_BUTTON_LARGE: 48,
  HANDLE_WIDTH: 40,
  HANDLE_HEIGHT: 4,
  BORDER_WIDTH: 1,
  BORDER_WIDTH_THICK: 2,
  
  // EventCard redesign sizes
  EVENT_IMAGE_SIZE: 96,
  HOST_AVATAR_SIZE: 40,
  ONLINE_INDICATOR_SIZE: 12,
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

// Navigation bar styles (with back button)
export const NAVBAR_STYLES = {
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.TEXT_DARK,
    flex: 1,
    textAlign: 'center' as const,
  },
  spacer: {
    width: 40,
  },
};

// EventCard styles (redesign)
export const CARD_STYLES = {
  eventCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 34,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    ...SHADOW.xl,
  },
  dragHandle: {
    width: 12,
    height: 1.5,
    backgroundColor: COLORS.GRAY_HANDLE,
    borderRadius: 1,
    alignSelf: 'center' as const,
    marginBottom: 12,
  },
};
