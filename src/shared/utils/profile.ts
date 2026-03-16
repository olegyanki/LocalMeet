import type { UserProfile, WalkHost } from '@shared/lib/api';

type ProfileLike = UserProfile | WalkHost | null | undefined;

/**
 * Get display name from user profile or walk host
 * Returns: first_name + last_name or just first_name
 */
export function getDisplayName(profile: ProfileLike): string {
  if (!profile) return '';
  
  if (profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  
  return profile.first_name;
}

/**
 * Get short display name (first name only)
 */
export function getShortDisplayName(profile: ProfileLike): string {
  if (!profile) return '';
  
  return profile.first_name;
}
