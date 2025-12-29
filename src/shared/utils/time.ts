import { COLORS } from '../constants/colors';

export const parseDuration = (duration: string | null): number => {
  if (!duration) return 0;

  const parts = duration.toLowerCase().split(' ');
  let totalMinutes = 0;

  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i]);
    const unit = parts[i + 1];

    if (unit?.includes('hour') || unit?.includes('год')) {
      totalMinutes += value * 60;
    } else if (unit?.includes('minute') || unit?.includes('хв')) {
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

export const formatTime = (walkStartTime: string | null): string => {
  if (!walkStartTime) return '';

  const now = new Date();
  const startTime = new Date(walkStartTime);

  if (isNaN(startTime.getTime())) return '';

  const diffMs = startTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) {
    return 'Вже почалась';
  } else if (diffMins === 0) {
    return 'Починається зараз';
  } else if (diffMins < 60) {
    return `Через ${diffMins} хв`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (mins === 0) {
      return `Через ${hours} год`;
    }
    return `Через ${hours} год ${mins} хв`;
  }
};

export const getTimeText = (walkStartTime: string | null): string => {
  if (!walkStartTime) return 'Час не вказано';

  const now = new Date();
  const startTime = new Date(walkStartTime);
  const diffMs = startTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) return 'Вже почалась';
  if (diffMins === 0) return 'Починається зараз';
  if (diffMins < 60) return `Починається через ${diffMins} хв`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (mins === 0) return `Починається через ${hours} год`;
  return `Починається через ${hours} год ${mins} хв`;
};
