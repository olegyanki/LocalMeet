import { supabase } from '../supabase';
import type { Database } from '../database.types';

import type { UserProfile } from './profiles';

/** Generated type for get_my_chats_optimized RPC rows */
type GetMyChatsRow = Database['public']['Functions']['get_my_chats_optimized']['Returns'][number];

/** Generated type for get_chat_details RPC rows */
type GetChatDetailsRow = Database['public']['Functions']['get_chat_details']['Returns'][number];

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
  walk_type?: string;
  walk_user_id?: string;
  creator_avatar_url?: string | null;
  creator_first_name?: string;
  participants: ChatParticipant[];
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
    image_urls?: string[] | null;
    audio_url?: string | null;
  };
  unread_count: number;
  created_at: string;
}

/**
 * Delete a chat (messages and participants are removed via ON DELETE CASCADE)
 */
export async function deleteChat(chatId: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) throw error;
}

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

  return data.map((row: GetMyChatsRow) => ({
    id: row.chat_id,
    type: row.chat_type,
    walk_id: row.walk_id,
    walk_title: row.walk_title,
    walk_image_url: row.walk_image_url,
    walk_start_time: row.walk_start_time,
    walk_type: row.walk_type,
    walk_user_id: row.walk_user_id,
    creator_avatar_url: row.creator_avatar_url,
    creator_first_name: row.creator_first_name,
    participants: row.participant_ids.map((id: string, index: number) => ({
      id: `${row.chat_id}-${id}`, // Generate participant record ID
      chat_id: row.chat_id,
      user_id: id,
      role: 'member', // Role info not available in optimized query
      joined_at: '', // Join date not available in optimized query
      profile: {
        id: id,
        first_name: row.participant_first_names?.[index] ?? '',
        last_name: row.participant_last_names?.[index] ?? null,
        avatar_url: row.participant_avatar_urls[index],
        bio: null,
        gender: null,
        occupation: null,
        interests: [],
        languages: [],
        social_instagram: null,
        social_telegram: null,
      },
    })),
    lastMessage: row.last_message_content || row.last_message_image_urls || row.last_message_audio_url ? {
      content: row.last_message_content,
      created_at: row.last_message_created_at,
      sender_id: row.last_message_sender_id,
      read: row.last_message_read,
      image_urls: row.last_message_image_urls,
      audio_url: row.last_message_audio_url,
    } : undefined,
    unread_count: row.unread_count,
    created_at: row.chat_updated_at,
  }));
}

/**
 * Get detailed chat information including participants
 * Uses the get_chat_details RPC function (includes created_at)
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
  const firstRow: GetChatDetailsRow = data[0];
  
  return {
    id: firstRow.chat_id,
    type: firstRow.chat_type,
    walk_id: firstRow.walk_id,
    walk_title: firstRow.walk_title,
    walk_image_url: firstRow.walk_image_url,
    walk_start_time: firstRow.walk_start_time,
    walk_type: firstRow.walk_type,
    walk_user_id: firstRow.walk_user_id,
    creator_avatar_url: firstRow.creator_avatar_url,
    creator_first_name: firstRow.creator_first_name,
    participants: data.map((row: GetChatDetailsRow) => ({
      id: row.participant_id,
      chat_id: firstRow.chat_id,
      user_id: row.participant_id,
      role: row.participant_role,
      joined_at: row.participant_joined_at,
      profile: {
        id: row.participant_id,
        first_name: row.participant_first_name,
        last_name: row.participant_last_name ?? null,
        avatar_url: row.participant_avatar_url,
        bio: null,
        gender: null,
        occupation: null,
        interests: [],
        languages: [],
        social_instagram: null,
        social_telegram: null,
      },
    })),
    unread_count: 0, // Not available in this query
    created_at: firstRow.chat_created_at,
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
 * Get or create a group chat for a walk (used for live events).
 * 
 * For live events, group chats are created lazily — only when the owner
 * explicitly opens the chat or when the first walk request is accepted.
 * This function handles the "owner opens chat" path.
 * 
 * 1. Tries to find an existing group chat for the walk
 * 2. If found, returns the existing chat_id
 * 3. If not found, creates a new group chat and adds the user as owner
 * 
 * @param walkId - The walk/event ID to get or create chat for
 * @param userId - The user ID (walk owner) to add as chat owner
 * @returns Promise<string> - The chat ID (existing or newly created)
 * @throws Error if chat creation or participant insertion fails
 */
export async function getOrCreateChatForWalk(
  walkId: string,
  userId: string
): Promise<string> {
  // 1. Try to find existing group chat
  const existingChatId = await getChatByWalkId(walkId);
  if (existingChatId) return existingChatId;

  // 2. Create new group chat linked to the walk
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert({ type: 'group', walk_id: walkId })
    .select('id')
    .single();

  if (chatError || !chat) {
    console.error('Error creating chat for walk:', chatError);
    throw new Error(`Failed to create chat: ${chatError?.message ?? 'No data returned'}`);
  }

  // 3. Add the user as chat owner
  const { error: participantError } = await supabase
    .from('chat_participants')
    .insert({ chat_id: chat.id, user_id: userId, role: 'owner' });

  if (participantError) {
    console.error('Error adding owner to chat:', participantError);
    throw new Error(`Failed to add owner to chat: ${participantError.message}`);
  }

  return chat.id;
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
