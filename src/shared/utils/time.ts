import { COLORS } from '../constants/colors';

/**
 * Format time as HH:MM in 24-hour format
 * @param date - Date object
 * @returns Time string in HH:MM format
 */
export const formatHHMM = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Format date and time as DD.MM HH:MM
 * @param date - Date object
 * @returns Formatted string like "25.02 14:30"
 */
export const formatDateAndTime = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const time = formatHHMM(date);
  return `${day}.${month} ${time}`;
};

/**
 * Get smart time display - shows relative time for near events, date+time for far events
 * @param walkStartTime - ISO date string
 * @param t - Translation function from useI18n()
 * @returns Formatted time string
 */
export const getSmartTimeDisplay = (
  walkStartTime: string | null,
  t: (key: any, params?: Record<string, any>) => string
): string => {
  if (!walkStartTime) return '';

  const start = new Date(walkStartTime);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const isToday = now.toDateString() === start.toDateString();
  
  // If event is not today AND more than 6 hours away, show date + time
  if (!isToday && diffHours > 6) {
    return formatDateAndTime(start);
  }
  
  // Otherwise show relative time
  return formatTime(walkStartTime, t);
};

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

/**
 * Get color for time display based on event proximity
 * @param walkStartTime - ISO date string
 * @returns Color constant from COLORS
 */
export const getTimeColor = (walkStartTime: string | null): string => {
  if (!walkStartTime) return COLORS.TIME_BLUE;

  const now = new Date();
  const startTime = new Date(walkStartTime);
  const diffMs = startTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Check if event is today
  const isToday = now.toDateString() === startTime.toDateString();
  
  if (diffMs < 0) {
    // Event already started - green
    return COLORS.SUCCESS_GREEN;
  } else if (isToday || diffHours <= 6) {
    // Event starts today OR within 6 hours - blue
    return COLORS.TIME_BLUE;
  } else {
    // Event starts later - gray
    return COLORS.TEXT_LIGHT;
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
  t: (key: any, params?: Record<string, any>) => string
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
  t: (key: any, params?: Record<string, any>) => string
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

/**
 * Format date as Today/Yesterday/short date for display labels
 * @param dateString - ISO date string
 * @param t - Translation function from useI18n()
 * @returns "Today"/"Yesterday" or short date like "25.02"
 */
export const formatDateLabel = (
  dateString: string | undefined | null,
  t: (key: any, params?: Record<string, any>) => string
): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('today');
  if (diffDays === 1) return t('yesterday');

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}`;
};

/**
 * Format relative time for display (e.g., "2m ago", "3h ago", "5d ago")
 * Used for displaying timestamps in chat requests and other relative time contexts
 * @param dateString - ISO date string
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};
