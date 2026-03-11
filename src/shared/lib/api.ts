import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import type { Database } from './database.types';

// Type aliases for RPC function return types
type GetNearbyWalksRow = Database['public']['Functions']['get_nearby_walks']['Returns'][number];
type GetMyChatsOptimizedRow = Database['public']['Functions']['get_my_chats_optimized']['Returns'][number];

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
}

export interface WalkHost {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface NearbyWalk {
  distance: number; // in meters
  walk: Walk | null;
  host?: WalkHost;
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

  return data.map((row: GetNearbyWalksRow) => ({
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

// Get multiple profiles by user IDs
export async function getProfiles(userIds: string[]): Promise<Map<string, WalkHost>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds);

  if (error) {
    throw error;
  }

  const profilesMap = new Map();
  if (data) {
    data.forEach((profile) => {
      profilesMap.set(profile.id, {
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      });
    });
  }

  return profilesMap;
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
      deleted: true
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
    .eq('deleted', false)
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getWalkById(walkId: string): Promise<Walk | null> {
  const { data, error } = await supabase
    .from('walks')
    .select('*')
    .eq('id', walkId)
    .eq('deleted', false)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
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
  const myWalks = await getWalksByUserId(userId);

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

export async function getPendingWalkRequests(
  userId: string
): Promise<WalkRequestWithProfile[]> {
  // Get user's walks
  const myWalks = await getWalksByUserId(userId);

  if (!myWalks || myWalks.length === 0) {
    return [];
  }

  const walkIds = myWalks.map(w => w.id);

  // Query walk_requests with joins
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

  // Get requester profiles
  const requesterIds = [...new Set(requests.map(r => r.requester_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', requesterIds);

  if (profilesError) {
    throw profilesError;
  }

  // Combine data
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

export async function getPastWalkRequests(
  userId: string
): Promise<WalkRequestWithProfile[]> {
  // Get user's walks
  const myWalks = await getWalksByUserId(userId);

  if (!myWalks || myWalks.length === 0) {
    return [];
  }

  const walkIds = myWalks.map(w => w.id);

  // Query walk_requests with status 'accepted' or 'rejected'
  const { data: requests, error: requestsError } = await supabase
    .from('walk_requests')
    .select('*')
    .in('walk_id', walkIds)
    .in('status', ['accepted', 'rejected'])
    .order('updated_at', { ascending: false });

  if (requestsError) {
    throw requestsError;
  }

  if (!requests || requests.length === 0) {
    return [];
  }

  // Get requester profiles
  const requesterIds = [...new Set(requests.map(r => r.requester_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', requesterIds);

  if (profilesError) {
    throw profilesError;
  }

  // Combine data
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

export interface Chat {
  id: string;
  requester_id: string;
  walker_id: string;
  walk_request_id: string | null;
  updated_at: string;
  requester: UserProfile;
  walker: UserProfile;
}

export interface ChatWithLastMessage extends Chat {
  walk_title?: string;
  walk_image_url?: string | null;
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
}

export async function getMyChats(userId: string): Promise<ChatWithLastMessage[]> {
  // Use optimized RPC function to fetch all chat data in a single query
  // Fixes Bug 1.6: N+1 Query Problem (1 query instead of 1 + 3N queries)
  const { data, error } = await supabase.rpc('get_my_chats_optimized', {
    p_user_id: userId,
  });

  if (error) throw error;

  if (!data || data.length === 0) {
    return [];
  }

  // Transform RPC result to ChatWithLastMessage format
  return data.map((row: GetMyChatsOptimizedRow) => ({
    id: row.chat_id,
    requester_id: row.requester_id,
    walker_id: row.walker_id,
    walk_request_id: row.walk_request_id,
    updated_at: row.chat_updated_at,
    requester: {
      id: row.requester_id,
      username: row.requester_username,
      display_name: row.requester_display_name,
      avatar_url: row.requester_avatar_url,
      bio: row.requester_bio,
      status: row.requester_status,
      age: row.requester_age,
      gender: row.requester_gender,
      languages: row.requester_languages,
      interests: row.requester_interests,
      social_instagram: row.requester_social_instagram,
      social_telegram: row.requester_social_telegram,
      looking_for: row.requester_looking_for,
    },
    walker: {
      id: row.walker_id,
      username: row.walker_username,
      display_name: row.walker_display_name,
      avatar_url: row.walker_avatar_url,
      bio: row.walker_bio,
      status: row.walker_status,
      age: row.walker_age,
      gender: row.walker_gender,
      languages: row.walker_languages,
      interests: row.walker_interests,
      social_instagram: row.walker_social_instagram,
      social_telegram: row.walker_social_telegram,
      looking_for: row.walker_looking_for,
    },
    walk_title: row.walk_title ?? undefined,
    walk_image_url: row.walk_image_url ?? null,
    lastMessage: row.last_message_content
      ? {
          content: row.last_message_content,
          created_at: row.last_message_created_at,
          sender_id: row.last_message_sender_id,
          read: row.last_message_read,
        }
      : undefined,
  }));
}

export async function createChatFromRequest(
  requestId: string,
  requesterId: string,
  walkerId: string
): Promise<string> {
  // Use transactional RPC function to create chat and update walk_request atomically
  // Fixes Bug 1.10: Non-Transactional Chat Creation
  const { data: chatId, error } = await supabase.rpc(
    'create_chat_from_request_transactional',
    {
      p_request_id: requestId,
      p_requester_id: requesterId,
      p_walker_id: walkerId,
    }
  );

  if (error) throw error;

  return chatId;
}


export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  audio_url: string | null;
  audio_duration: number | null;
  created_at: string;
  read: boolean;
}

export interface WalkRequestInfo {
  message: string;
  created_at: string;
  walk_id: string;
  walk?: Walk;
}

export interface ChatDetails {
  id: string;
  requester_id: string;
  walker_id: string;
  walk_request_id: string | null;
  requester: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  walker: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  walk_request?: WalkRequestInfo;
}

/**
 * Get chat details with participants and walk request info
 */
export async function getChatById(chatId: string): Promise<ChatDetails | null> {
  const { data: chatData, error: chatError } = await supabase
    .from('chats')
    .select(
      `
      id,
      requester_id,
      walker_id,
      walk_request_id,
      requester:profiles!chats_requester_id_fkey(id, display_name, avatar_url),
      walker:profiles!chats_walker_id_fkey(id, display_name, avatar_url),
      walk_request:walk_requests!chats_walk_request_id_fkey(message, created_at, walk_id)
    `
    )
    .eq('id', chatId)
    .maybeSingle();

  if (chatError) throw chatError;
  if (!chatData) return null;

  // Handle walk_request - it might be an array or single object
  const walkRequest: any = Array.isArray(chatData.walk_request) 
    ? chatData.walk_request[0] 
    : chatData.walk_request;

  if (walkRequest?.walk_id) {
    const { data: walkData } = await supabase
      .from('walks')
      .select('id, title, description, start_time, duration, latitude, longitude, user_id, image_url')
      .eq('id', walkRequest.walk_id)
      .maybeSingle();

    if (walkData) {
      walkRequest.walk = walkData;
    }
  }

  // Normalize the data structure
  return {
    ...chatData,
    requester: Array.isArray(chatData.requester) ? chatData.requester[0] : chatData.requester,
    walker: Array.isArray(chatData.walker) ? chatData.walker[0] : chatData.walker,
    walk_request: walkRequest as WalkRequestInfo | undefined,
  } as ChatDetails;
}

/**
 * Get all messages for a chat
 */
export async function getChatMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Delete a chat and all its messages
 */
export async function deleteChat(chatId: string): Promise<void> {
  // Delete messages first
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId);

  if (messagesError) throw messagesError;

  // Delete chat
  const { error: chatError } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (chatError) throw chatError;
}

/**
 * Send a text message
 */
export async function sendTextMessage(
  chatId: string,
  senderId: string,
  content: string
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    content,
  });

  if (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

/**
 * Send an image message
 */
export async function sendImageMessage(
  chatId: string,
  senderId: string,
  imageUrl: string
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    content: '',
    image_url: imageUrl,
  });

  if (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
}

/**
 * Send an audio message
 */
export async function sendAudioMessage(
  chatId: string,
  senderId: string,
  audioUrl: string,
  duration: number
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    content: '',
    audio_url: audioUrl,
    audio_duration: duration,
  });

  if (error) {
    console.error('Error sending audio message:', error);
    throw error;
  }
}
