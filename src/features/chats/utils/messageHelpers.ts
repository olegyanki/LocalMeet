export function getDateLabel(date: Date, t: (key: string) => string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  messageDate.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) {
    return t('today').toUpperCase();
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return t('yesterday').toUpperCase();
  } else {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    }).toUpperCase();
  }
}

export function shouldShowDateSeparator(
  currentMessage: { created_at: string },
  nextMessage: { created_at: string } | undefined,
  isLastMessage: boolean
): boolean {
  if (isLastMessage) {
    return true;
  }
  
  if (!nextMessage) {
    return false;
  }

  return new Date(currentMessage.created_at).toDateString() !== 
    new Date(nextMessage.created_at).toDateString();
}
