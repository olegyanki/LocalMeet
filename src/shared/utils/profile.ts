import type { UserProfile } from '@shared/lib/api';

/**
 * Get display name from user profile
 * Returns: first_name + last_name or just first_name
 */
export function getDisplayName(profile: UserProfile | null | undefined): string {
  if (!profile) return '';
  
  if (profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  
  return profile.first_name;
}

/**
 * Get short display name (first name only)
 */
export function getShortDisplayName(profile: UserProfile | null | undefined): string {
  if (!profile) return '';
  
  return profile.first_name;
}
