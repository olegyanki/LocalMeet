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
  duration: number;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  is_active: boolean;
  deleted: boolean;
}

export interface NearbyWalk extends UserProfile {
  distance: number; // in meters
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

export async function getNearbyWalks(
  latitude: number,
  longitude: number,
  radiusKm: number = 15
): Promise<NearbyWalk[]> {
  const { data, error } = await supabase.rpc('get_nearby_walks', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radiusKm,
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: any) => ({
    distance: row.distance,
    walk: {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      start_time: row.start_time,
      duration: row.duration,
      description: row.description ?? null,
      latitude: row.latitude,
      longitude: row.longitude,
      image_url: row.image_url ?? null,
    },
  }));
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

export async function createWalk(data: {
  userId: string;
  title: string;
  startTime: string;
  duration: number;
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

export async function deleteWalk(walkId: string) {
  const { data, error } = await supabase
    .from('walks')
    .update({
      deleted: true,
      is_active: false
    })
    .eq('id', walkId)
    .select();

  if (error) {
    throw error;
  }
}

export async function getWalksByUserId(userId: string): Promise<Walk[]> {
  const { data, error } = await supabase
    .from('walks')
    .select('*')
    .eq('user_id', userId)
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
    .update({ status })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
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