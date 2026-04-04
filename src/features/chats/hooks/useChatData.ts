import { useState, useEffect, useCallback, useRef } from 'react';
import { getChatDetails, getChatMessages, markChatAsRead } from '@shared/lib/api';
import type { ChatWithDetails, Message } from '@shared/lib/api';

type MessageWithPending = Message & { isPending?: boolean };

export function useChatData(chatId: string, userId: string | undefined) {
  const [chat, setChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  const loadChatData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [chatData, result] = await Promise.all([
        getChatDetails(chatId, userId),
        getChatMessages(chatId, 50),
      ]);

      if (chatData) {
        setChat(chatData);
      }

      setMessages(result.messages);
      setHasMoreMessages(result.hasMore);

      // Set cursor to oldest message's created_at for next page
      if (result.messages.length > 0) {
        cursorRef.current = result.messages[result.messages.length - 1].created_at;
      }

      await markChatAsRead(chatId, userId);
    } catch (err) {
      console.error('Error loading chat:', err);
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [chatId, userId]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages) return;

    try {
      setLoadingMore(true);
      const result = await getChatMessages(chatId, 50, cursorRef.current);

      if (result.messages.length > 0) {
        setMessages(prev => [...prev, ...result.messages]);
        setHasMoreMessages(result.hasMore);
        cursorRef.current = result.messages[result.messages.length - 1].created_at;
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, loadingMore, hasMoreMessages]);

  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  return {
    chat,
    messages,
    setMessages,
    loading,
    loadingMore,
    hasMoreMessages,
    error,
    setError,
    loadMoreMessages,
  };
}
