import { Walk } from '@shared/lib/api';

export function getEventImage(walk: Walk | null, userAvatarUrl?: string | null): string | null {
  // First priority: event image
  if (walk?.image_url) {
    return walk.image_url;
  }
  
  // Second priority: user avatar
  if (userAvatarUrl) {
    return userAvatarUrl;
  }
  
  // No image available
  return null;
}