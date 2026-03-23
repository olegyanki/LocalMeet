import { useState, useEffect, useCallback } from 'react';
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

  const loadChatData = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [chatData, messagesData] = await Promise.all([
        getChatDetails(chatId, userId),
        getChatMessages(chatId, 50),
      ]);

      if (chatData) {
        setChat(chatData);
      }

      setMessages(messagesData);
      setHasMoreMessages(messagesData.length === 50);

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
      const offset = messages.length;
      const olderMessages = await getChatMessages(chatId, 50, offset);

      if (olderMessages.length > 0) {
        setMessages(prev => [...prev, ...olderMessages]);
        setHasMoreMessages(olderMessages.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, loadingMore, hasMoreMessages, messages.length]);

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
