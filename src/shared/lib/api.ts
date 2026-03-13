import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import type { Database } from './database.types';

// Type aliases for RPC function return types
type GetNearbyWalksRow = Database['public']['Functions']['get_nearby_walks']['Returns'][number];
type GetNearbyWalksFilteredRow = Database['public']['Functions']['get_nearby_walks_filtered']['Returns'][number];
type GetMyChatsOptimizedRow = Database['public']['Functions']['get_my_chats_optimized']['Returns'][number];
type GetBadgeCountsOptimizedRow = Database['public']['Functions']['get_badge_counts_optimized']['Returns'][number];

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

export interface BadgeCountData {
  unreadMessages: number;
  pendingRequests: number;
  totalCount: number;
  lastUpdated: Date;
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

export async function getNearbyWalksFiltered(
  latitude: number,
  longitude: number,
  radiusKm: number = 15,
  interests?: string[],
  timeFilter?: 'now' | 'today' | 'tomorrow' | 'this_week' | 'all',
  maxDistanceKm?: number
): Promise<NearbyWalk[]> {
  try {
    const { data, error } = await supabase.rpc('get_nearby_walks_filtered', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_radius_km: radiusKm,
      p_interests: interests,
      p_time_filter: timeFilter,
      p_max_distance_km: maxDistanceKm,
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform RPC result to NearbyWalk format
    return data.map((row: GetNearbyWalksFilteredRow) => ({
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
      host: {
        username: row.host_username,
        display_name: row.host_display_name ?? null,
        avatar_url: row.host_avatar_url ?? null,
      },
    }));
  } catch (error) {
    console.error('Error fetching filtered nearby walks:', error);
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
  // Insert the walk - the database trigger will automatically create a group chat
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
  // Update the request status - the database trigger will automatically add participant to group chat if accepted
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
  type: 'group' | 'direct';
  walk_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Chat participant with profile information
 */
export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile: UserProfile;
}

/**
 * Chat with participants, last message, and unread count
 * Used for chat list display
 */
export interface ChatWithDetails {
  id: string;
  type: 'group' | 'direct';
  walk_id: string | null;
  walk_title?: string;
  walk_image_url?: string | null;
  walk_start_time?: string;
  participants: ChatParticipant[];
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
  unread_count: number;
}

// Legacy interface for backward compatibility
export interface ChatWithLastMessage {
  id: string;
  requester_id: string;
  walker_id: string;
  walk_request_id: string | null;
  updated_at: string;
  requester: UserProfile;
  walker: UserProfile;
  walk_title?: string;
  walk_image_url?: string | null;
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
}

/*
// LEGACY FUNCTION - DEPRECATED
// This function uses the old schema and will be removed in a future version
export async function getMyChatsLegacy(userId: string): Promise<ChatWithLastMessage[]> {
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
*/

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
  sender?: UserProfile; // Added sender profile information
}

/**
 * Get all messages for a chat (legacy function)
 */
export async function getChatMessagesLegacy(chatId: string): Promise<Message[]> {
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
// ============================================================================
// NEW GROUP CHAT SYSTEM API FUNCTIONS
// ============================================================================

/**
 * Get all chats for a user (both group and direct chats)
 * Uses optimized RPC function to fetch all data in a single query
 * 
 * @param userId - The user ID to get chats for
 * @returns Promise<ChatWithDetails[]> - Array of chats with details
 */
export async function getMyChats(userId: string): Promise<ChatWithDetails[]> {
  const { data, error } = await supabase.rpc('get_my_chats_optimized', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching user chats:', error);
    throw new Error(`Failed to fetch chats: ${error.message}`);
  }

  if (!data) return [];

  return data.map((row: any) => ({
    id: row.chat_id,
    type: row.chat_type,
    walk_id: row.walk_id,
    walk_title: row.walk_title,
    walk_image_url: row.walk_image_url,
    walk_start_time: row.walk_start_time,
    participants: row.participant_ids.map((id: string, index: number) => ({
      id: `${row.chat_id}-${id}`, // Generate participant record ID
      chat_id: row.chat_id,
      user_id: id,
      role: 'member', // Role info not available in optimized query
      joined_at: '', // Join date not available in optimized query
      profile: {
        id: id,
        username: row.participant_usernames[index],
        display_name: row.participant_display_names[index],
        avatar_url: row.participant_avatar_urls[index],
        bio: '',
        interests: [],
        languages: [],
        created_at: '',
        updated_at: '',
      },
    })),
    lastMessage: row.last_message_content ? {
      content: row.last_message_content,
      created_at: row.last_message_created_at,
      sender_id: row.last_message_sender_id,
      read: row.last_message_read,
    } : undefined,
    unread_count: row.unread_count,
  }));
}

/**
 * Get messages for a chat (works for both group and direct chats)
 * 
 * @param chatId - The chat ID to get messages for
 * @returns Promise<Message[]> - Array of messages with sender profiles
 */
export async function getChatMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(*)
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return data || [];
}

/**
 * Send a message to a chat (works for both group and direct chats)
 * 
 * @param chatId - The chat ID to send message to
 * @param senderId - The sender's user ID
 * @param content - The message content
 * @param imageUrl - Optional image URL
 * @param audioUrl - Optional audio URL
 * @param audioDuration - Optional audio duration in seconds
 * @returns Promise<Message> - The created message with sender profile
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  imageUrl?: string,
  audioUrl?: string,
  audioDuration?: number
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content,
      image_url: imageUrl,
      audio_url: audioUrl,
      audio_duration: audioDuration,
    })
    .select(`
      *,
      sender:profiles!sender_id(*)
    `)
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data;
}

/**
 * Leave a chat (works for both group and direct chats)
 * Removes the user from chat_participants table
 * 
 * @param chatId - The chat ID to leave
 * @param userId - The user ID who is leaving
 * @returns Promise<void>
 */
export async function leaveChat(chatId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error leaving chat:', error);
    throw new Error(`Failed to leave chat: ${error.message}`);
  }
}

/**
 * Remove a participant from a chat (typically for group chats)
 * Only owners can remove other participants
 * 
 * @param chatId - The chat ID to remove participant from
 * @param removedUserId - The user ID to remove
 * @returns Promise<void>
 */
export async function removeChatParticipant(
  chatId: string,
  removedUserId: string
): Promise<void> {
  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('chat_id', chatId)
    .eq('user_id', removedUserId);

  if (error) {
    console.error('Error removing chat participant:', error);
    throw new Error(`Failed to remove participant: ${error.message}`);
  }
}

/**
 * Mark all unread messages in a chat as read for a user
 * Updates all messages where sender_id != userId and read = false
 * 
 * @param chatId - The chat ID to mark as read
 * @param userId - The user ID who is marking messages as read
 * @returns Promise<void>
 */
export async function markChatAsRead(chatId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking chat as read:', error);
    throw new Error(`Failed to mark chat as read: ${error.message}`);
  }
}

/**
 * Get detailed chat information including participants
 * Uses the get_chat_details RPC function
 * 
 * @param chatId - The chat ID to get details for
 * @param userId - The user ID requesting the details (must be a participant)
 * @returns Promise<ChatWithDetails | null> - Chat details with participants
 */
export async function getChatDetails(chatId: string, userId: string): Promise<ChatWithDetails | null> {
  const { data, error } = await supabase.rpc('get_chat_details', {
    p_chat_id: chatId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching chat details:', error);
    throw new Error(`Failed to fetch chat details: ${error.message}`);
  }

  if (!data || data.length === 0) return null;

  // Transform RPC result to ChatWithDetails format
  const firstRow = data[0];
  
  return {
    id: firstRow.chat_id,
    type: firstRow.chat_type,
    walk_id: firstRow.walk_id,
    walk_title: firstRow.walk_title,
    walk_image_url: firstRow.walk_image_url,
    walk_start_time: firstRow.walk_start_time,
    participants: data.map((row: any) => ({
      id: row.participant_id,
      chat_id: firstRow.chat_id,
      user_id: row.participant_id,
      role: row.participant_role,
      joined_at: row.participant_joined_at,
      profile: {
        id: row.participant_id,
        username: row.participant_username,
        display_name: row.participant_display_name,
        avatar_url: row.participant_avatar_url,
        bio: '',
        interests: [],
        languages: [],
        created_at: '',
        updated_at: '',
      },
    })),
    unread_count: 0, // Not available in this query
  };
}

/**
 * Get group chat ID for an event/walk
 * 
 * @param walkId - The walk/event ID to get chat for
 * @returns Promise<string | null> - The chat ID or null if not found
 */
export async function getChatByWalkId(walkId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('id')
    .eq('walk_id', walkId)
    .eq('type', 'group')
    .maybeSingle();

  if (error) {
    console.error('Error fetching chat by walk_id:', error);
    throw new Error(`Failed to fetch chat: ${error.message}`);
  }

  return data?.id || null;
}

/**
 * Get badge counts for chat tab (unread messages + pending requests)
 * Uses optimized RPC function for single-query performance
 * 
 * @param userId - The user ID to get badge counts for
 * @returns Promise<BadgeCountData> - Badge count data with totals
 */
export async function getBadgeCounts(userId: string): Promise<BadgeCountData> {
  const { data, error } = await supabase.rpc('get_badge_counts_optimized', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching badge counts:', error);
    throw new Error(`Failed to fetch badge counts: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      unreadMessages: 0,
      pendingRequests: 0,
      totalCount: 0,
      lastUpdated: new Date(),
    };
  }

  const result = data[0] as GetBadgeCountsOptimizedRow;
  
  const badgeData = {
    unreadMessages: result.unread_messages,
    pendingRequests: result.pending_requests,
    totalCount: result.unread_messages + result.pending_requests,
    lastUpdated: new Date(),
  };
  
  return badgeData;
}

/**
 * Setup real-time subscriptions for badge count updates
 * @param userId - The user ID to setup subscriptions for
 * @param onUpdate - Callback function called when badge counts change
 * @returns Cleanup function to remove subscriptions
 */
export function setupBadgeSubscriptions(
  userId: string,
  onUpdate: (counts: BadgeCountData) => void
): () => void {
  const channels: any[] = [];

  // Subscribe to message changes (new messages, read status changes)
  const messagesChannel = supabase
    .channel('badge-messages')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
    }, async (payload) => {
      // Refresh badge counts when messages change
      try {
        const newCounts = await getBadgeCounts(userId);
        onUpdate(newCounts);
      } catch (error) {
        console.error('Error updating badge counts from message change:', error);
      }
    })
    .subscribe();

  channels.push(messagesChannel);

  // Subscribe to walk request changes (new requests, status changes)
  const requestsChannel = supabase
    .channel('badge-requests')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'walk_requests',
    }, async (payload) => {
      // Refresh badge counts when walk requests change
      try {
        const newCounts = await getBadgeCounts(userId);
        onUpdate(newCounts);
      } catch (error) {
        console.error('Error updating badge counts from request change:', error);
      }
    })
    .subscribe();

  channels.push(requestsChannel);

  // Subscribe to chat participant changes (user added/removed from chats)
  const participantsChannel = supabase
    .channel('badge-participants')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chat_participants',
      filter: `user_id=eq.${userId}`,
    }, async (payload) => {
      // Refresh badge counts when user's chat membership changes
      try {
        const newCounts = await getBadgeCounts(userId);
        onUpdate(newCounts);
      } catch (error) {
        console.error('Error updating badge counts from participant change:', error);
      }
    })
    .subscribe();

  channels.push(participantsChannel);

  // Return cleanup function
  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
  };
}