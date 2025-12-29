import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  status: string | null;
  age: number | null;
  gender: string | null;
  languages: string[];
  interests: string[];
  social_instagram: string | null;
  social_telegram: string | null;
  looking_for: string | null;
}

export interface Walk {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  duration: string;
  description: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface NearbyWalk extends UserProfile {
  distance: number;
  walk: Walk | null;
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

function parseDuration(duration: string | null): number {
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
}

function isWalkStillActive(walkStartTime: string | null, walkDuration: string | null): boolean {
  if (!walkStartTime) return false;

  const now = new Date();
  const startTime = new Date(walkStartTime);

  if (isNaN(startTime.getTime())) return false;

  const durationMinutes = parseDuration(walkDuration);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  return now < endTime;
}

export async function getNearbyWalks(latitude: number, longitude: number, radiusKm: number = 5): Promise<NearbyWalk[]> {
  // Call database function to auto-deactivate expired walks
  await supabase.rpc('deactivate_expired_walks');

  const { data: walks, error: walksError } = await supabase
    .from('walks')
    .select('*')
    .eq('is_active', true)
    .or('deleted.is.null,deleted.eq.false');

  if (walksError) {
    throw walksError;
  }

  if (!walks || walks.length === 0) {
    return [];
  }

  const userIds = [...new Set(walks.map(w => w.user_id))];
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (profileError) {
    throw profileError;
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  const walksWithDistance = walks
    .map((walk) => {
      const profile = profiles.find(p => p.id === walk.user_id);
      if (!profile) return null;

      const distance = calculateDistance(latitude, longitude, walk.latitude, walk.longitude);

      return {
        ...profile,
        distance,
        walk,
      };
    })
    .filter((walk): walk is NonNullable<typeof walk> =>
      walk !== null && walk.distance <= radiusKm
    );

  return walksWithDistance?.sort((a, b) => a.distance - b.distance) || [];
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

export async function sendConnectionRequest(fromUserId: string, toUserId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'pending',
    })
    .select();

  if (error) {
    throw error;
  }

  return data?.[0];
}

export async function respondToConnectionRequest(
  requestId: string,
  status: 'accepted' | 'rejected'
) {
  const { error } = await supabase
    .from('connection_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
}

export async function getConnectionRequests(userId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('to_user_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getConnectionRequestsSent(userId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('from_user_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return data || [];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export async function createWalk(data: {
  userId: string;
  title: string;
  startTime: string;
  duration: string;
  description?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}) {
  const { data: walk, error } = await supabase
    .from('walks')
    .insert({
      user_id: data.userId,
      title: data.title,
      start_time: data.startTime,
      duration: data.duration,
      description: data.description || null,
      latitude: data.latitude,
      longitude: data.longitude,
      image_url: data.imageUrl || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return walk;
}

export async function endWalk(walkId: string) {
  const { error } = await supabase
    .from('walks')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', walkId);

  if (error) {
    throw error;
  }
}

export async function deleteWalk(walkId: string) {
  const { data, error } = await supabase
    .from('walks')
    .update({
      deleted: true,
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', walkId)
    .select();

  if (error) {
    throw error;
  }
}

export async function getActiveWalkByUserId(userId: string): Promise<Walk | null> {
  const { data, error } = await supabase
    .from('walks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or('deleted.is.null,deleted.eq.false')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getActiveWalksByUserId(userId: string): Promise<Walk[]> {
  const { data, error } = await supabase
    .from('walks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or('deleted.is.null,deleted.eq.false')
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export interface WalkRequest {
  id: string;
  walk_id: string;
  requester_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export async function createWalkRequest(data: {
  walkId: string;
  requesterId: string;
  message: string;
}) {
  const { data: request, error } = await supabase
    .from('walk_requests')
    .insert({
      walk_id: data.walkId,
      requester_id: data.requesterId,
      message: data.message,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return request;
}

export async function updateWalkRequestStatus(
  requestId: string,
  status: 'accepted' | 'rejected'
) {
  const { error } = await supabase
    .from('walk_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
}

export async function getWalkRequestsForWalk(walkId: string): Promise<WalkRequest[]> {
  const { data, error } = await supabase
    .from('walk_requests')
    .select('*')
    .eq('walk_id', walkId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getMyRequestForWalk(
  walkId: string,
  requesterId: string
): Promise<WalkRequest | null> {
  const { data, error } = await supabase
    .from('walk_requests')
    .select('*')
    .eq('walk_id', walkId)
    .eq('requester_id', requesterId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export interface WalkRequestWithProfile extends WalkRequest {
  requester: UserProfile;
  walk: Walk;
}

export async function getMyWalkRequests(userId: string): Promise<WalkRequestWithProfile[]> {
  const { data: myWalks, error: walksError } = await supabase
    .from('walks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or('deleted.is.null,deleted.eq.false');

  if (walksError) {
    throw walksError;
  }

  if (!myWalks || myWalks.length === 0) {
    return [];
  }

  const walkIds = myWalks.map(w => w.id);

  const { data: requests, error: requestsError } = await supabase
    .from('walk_requests')
    .select('*')
    .in('walk_id', walkIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (requestsError) {
    throw requestsError;
  }

  if (!requests || requests.length === 0) {
    return [];
  }

  const requesterIds = [...new Set(requests.map(r => r.requester_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', requesterIds);

  if (profilesError) {
    throw profilesError;
  }

  const requestsWithProfiles = requests.map(request => {
    const requester = profiles?.find(p => p.id === request.requester_id);
    const walk = myWalks.find(w => w.id === request.walk_id);

    return {
      ...request,
      requester: requester!,
      walk: walk!,
    };
  }).filter(r => r.requester && r.walk);

  return requestsWithProfiles;
}

export async function uploadEventImage(userId: string, imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const reader = new FileReader();
    
    const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    const ext = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(fileName, fileData, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading event image:', error);
    throw error;
  }
}

export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const reader = new FileReader();
    
    const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    const ext = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, fileData, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

export async function takePhotoAndUploadAvatar(userId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  const avatarUrl = await uploadAvatar(userId, result.assets[0].uri);
  await updateProfile(userId, { avatar_url: avatarUrl });
  
  return avatarUrl;
}

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  const avatarUrl = await uploadAvatar(userId, result.assets[0].uri);
  await updateProfile(userId, { avatar_url: avatarUrl });
  
  return avatarUrl;
}

export const getNearbyUsers = getNearbyWalks;
