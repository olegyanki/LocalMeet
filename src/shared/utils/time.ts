import { COLORS } from '../constants/colors';

export const parseDuration = (duration: string | null): number => {
  if (!duration) return 0;

  const parts = duration.toLowerCase().split(' ');
  let totalMinutes = 0;

  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i]);
    const unit = parts[i + 1];

    if (unit?.includes('hour') || unit?.includes('год') || unit?.includes('h')) {
      totalMinutes += value * 60;
    } else if (unit?.includes('minute') || unit?.includes('хв') || unit?.includes('min')) {
      totalMinutes += value;
    }
  }

  return totalMinutes;
};

export const isWalkActive = (walkStartTime: string | null): boolean => {
  if (!walkStartTime) return false;

  const now = new Date();
  const startTime = new Date(walkStartTime);

  return now >= startTime;
};

export const getTimeColor = (walkStartTime: string | null): string => {
  if (!walkStartTime) return COLORS.TIME_BLUE;

  const now = new Date();
  const startTime = new Date(walkStartTime);
  const diffMs = startTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) {
    return COLORS.SUCCESS_GREEN;
  } else if (diffMins <= 15) {
    return COLORS.ACCENT_ORANGE;
  } else {
    return COLORS.TIME_BLUE;
  }
};

/**
 * Format time difference for display
 * @param walkStartTime - ISO date string
 * @param t - Translation function from useI18n()
 * @returns Formatted time string using i18n keys
 */
export const formatTime = (
  walkStartTime: string | null,
  t: (key: string, params?: Record<string, any>) => string
): string => {
  if (!walkStartTime) return '';

  const now = new Date();
  const startTime = new Date(walkStartTime);

  if (isNaN(startTime.getTime())) return '';

  const diffMs = startTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) {
    return t('alreadyStarted');
  } else if (diffMins === 0) {
    return t('startingNow');
  } else if (diffMins < 60) {
    return t('startsInMinutes', { minutes: diffMins });
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (mins === 0) {
      return t('startsInHours', { hours });
    }
    return t('startsInHoursMinutes', { hours, minutes: mins });
  }
};

/**
 * Get detailed time text for display
 * @param walkStartTime - ISO date string
 * @param t - Translation function from useI18n()
 * @returns Detailed time string using i18n keys
 */
export const getTimeText = (
  walkStartTime: string | null,
  t: (key: string, params?: Record<string, any>) => string
): string => {
  if (!walkStartTime) return t('timeNotSpecified');

  const now = new Date();
  const startTime = new Date(walkStartTime);
  const diffMs = startTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) return t('alreadyStarted');
  if (diffMins === 0) return t('startingNow');
  if (diffMins < 60) return t('startsInMinutes', { minutes: diffMins });

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (mins === 0) return t('startsInHours', { hours });
  return t('startsInHoursMinutes', { hours, minutes: mins });
};
