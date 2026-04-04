import { supabase } from '../supabase';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  gender: string | null;
  occupation: string | null;
  languages: string[];
  interests: string[];
  social_instagram: string | null;
  social_telegram: string | null;
}

export interface WalkHost {
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  occupation?: string | null;
}

export async function updateProfile(userId: string, data: Partial<UserProfile>) {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// Get multiple profiles by user IDs
export async function getProfiles(userIds: string[]): Promise<Map<string, WalkHost>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', userIds);

  if (error) {
    throw error;
  }

  const profilesMap = new Map();
  if (data) {
    data.forEach((profile) => {
      profilesMap.set(profile.id, {
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
      });
    });
  }

  return profilesMap;
}
