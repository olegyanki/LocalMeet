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
  const { data: chatsData, error } = await supabase
    .from('chats')
    .select(
      `
      id,
      requester_id,
      walker_id,
      walk_request_id,
      updated_at,
      requester:profiles!chats_requester_id_fkey(id, username, display_name, avatar_url, bio, status, age, gender, languages, interests, social_instagram, social_telegram, looking_for),
      walker:profiles!chats_walker_id_fkey(id, username, display_name, avatar_url, bio, status, age, gender, languages, interests, social_instagram, social_telegram, looking_for)
    `
    )
    .or(`requester_id.eq.${userId},walker_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const chatsWithMessages = await Promise.all(
    (chatsData || []).map(async (chat: any) => {
      // Get last message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('content, created_at, sender_id, read')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get walk info if exists
      let walkTitle: string | undefined;
      let walkImageUrl: string | null = null;
      
      if (chat.walk_request_id) {
        const { data: walkRequest } = await supabase
          .from('walk_requests')
          .select('walk_id')
          .eq('id', chat.walk_request_id)
          .maybeSingle();

        if (walkRequest?.walk_id) {
          const { data: walk } = await supabase
            .from('walks')
            .select('title, image_url')
            .eq('id', walkRequest.walk_id)
            .maybeSingle();

          walkTitle = walk?.title;
          walkImageUrl = walk?.image_url ?? null;
        }
      }

      return {
        id: chat.id,
        requester_id: chat.requester_id,
        walker_id: chat.walker_id,
        walk_request_id: chat.walk_request_id,
        updated_at: chat.updated_at,
        requester: Array.isArray(chat.requester) ? chat.requester[0] : chat.requester,
        walker: Array.isArray(chat.walker) ? chat.walker[0] : chat.walker,
        walk_title: walkTitle,
        walk_image_url: walkImageUrl,
        lastMessage: lastMessage || undefined,
      } as ChatWithLastMessage;
    })
  );

  return chatsWithMessages;
}

export async function createChatFromRequest(
  requestId: string,
  requesterId: string,
  walkerId: string
): Promise<string> {
  // Check if chat already exists
  const { data: existingChat } = await supabase
    .from('chats')
    .select('id')
    .eq('walk_request_id', requestId)
    .maybeSingle();

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat
  const { data: newChat, error } = await supabase
    .from('chats')
    .insert({
      walk_request_id: requestId,
      requester_id: requesterId,
      walker_id: walkerId,
    })
    .select('id')
    .single();

  if (error) throw error;

  return newChat.id;
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
      .select('id, title, description, start_time, duration, latitude, longitude, user_id')
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
