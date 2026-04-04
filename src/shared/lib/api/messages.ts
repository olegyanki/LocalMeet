import { supabase } from '../supabase';
import type { Database } from '../database.types';

type GetChatMessagesCursorRow = Database['public']['Functions']['get_chat_messages_cursor']['Returns'][number];

import type { UserProfile } from './profiles';

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  image_urls: string[] | null;
  audio_url: string | null;
  audio_duration: number | null;
  created_at: string;
  read: boolean;
  sender?: UserProfile; // Added sender profile information
}

/**
 * Get messages for a chat (works for both group and direct chats)
 * Uses cursor-based pagination via RPC for stable performance on large tables.
 * 
 * @param chatId - The chat ID to get messages for
 * @param limit - Max number of messages to return (default 50)
 * @param cursor - ISO timestamp cursor; messages older than this are returned. NULL for first page.
 * @returns Promise<{ messages: Message[]; hasMore: boolean }>
 */
export async function getChatMessages(
  chatId: string, 
  limit?: number, 
  cursor?: string
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const { data, error } = await supabase.rpc('get_chat_messages_cursor', {
    p_chat_id: chatId,
    p_limit: limit ?? 50,
    p_cursor: cursor ?? undefined,
  });

  if (error) {
    console.error('Error fetching chat messages:', error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { messages: [], hasMore: false };
  }

  const hasMore = data[0].has_more;

  const messages: Message[] = data.map((row: GetChatMessagesCursorRow) => ({
    id: row.id,
    chat_id: row.chat_id,
    sender_id: row.sender_id,
    content: row.content,
    image_urls: row.image_urls as string[] | null,
    audio_url: row.audio_url,
    audio_duration: row.audio_duration,
    created_at: row.created_at,
    read: row.read,
    sender: {
      id: row.sender_id,
      first_name: row.sender_first_name,
      last_name: row.sender_last_name ?? null,
      bio: row.sender_bio ?? null,
      avatar_url: row.sender_avatar_url ?? null,
      gender: row.sender_gender ?? null,
      occupation: row.sender_occupation ?? null,
      languages: row.sender_languages ?? [],
      interests: row.sender_interests ?? [],
      social_instagram: row.sender_social_instagram ?? null,
      social_telegram: row.sender_social_telegram ?? null,
    },
  }));

  return { messages, hasMore };
}

/**
 * Send a message to a chat (works for both group and direct chats)
 * 
 * @param chatId - The chat ID to send message to
 * @param senderId - The sender's user ID
 * @param content - The message content
 * @param audioUrl - Optional audio URL
 * @param audioDuration - Optional audio duration in seconds
 * @param imageUrls - Optional array of image URLs
 * @returns Promise<Message> - The created message with sender profile
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  audioUrl?: string,
  audioDuration?: number,
  imageUrls?: string[]
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content,
      image_urls: imageUrls || null,
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
