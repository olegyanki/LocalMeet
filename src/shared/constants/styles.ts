import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

const { BLACK, WHITE, BORDER_COLOR } = COLORS;


export const COMMON_STYLES = StyleSheet.create({
  shadow: {
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shadowLarge: {
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BORDER_COLOR,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: WHITE,
  },
});

export const SIZES = {
  AVATAR_SMALL: 40,
  AVATAR_MEDIUM: 60,
  AVATAR_LARGE: 80,
  AVATAR_XLARGE: 120,
  BORDER_RADIUS: 12,
  BORDER_RADIUS_LARGE: 20,
  BORDER_RADIUS_XLARGE: 24,
  TAB_BAR_HEIGHT: 78,
  CARDS_COLLAPSE_DISTANCE: 250,
  LOCATION_BUTTON_OFFSET: -56,
} as const;
