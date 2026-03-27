import { useEffect } from 'react';
import { supabase } from '@shared/lib/supabase';
import { markChatAsRead } from '@shared/lib/api';
import type { Message } from '@shared/lib/api';

type MessageWithPending = Message & { isPending?: boolean };

interface UseChatMessagesProps {
  chatId: string;
  userId: string | undefined;
  setMessages: React.Dispatch<React.SetStateAction<MessageWithPending[]>>;
}

export function useChatMessages({ chatId, userId, setMessages }: UseChatMessagesProps) {
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;

            // If this is from current user and we have optimistic message
            if (newMsg.sender_id === userId) {
              const optimisticIndex = prev.findIndex(m => m.id.toString().startsWith('temp-'));
              
              if (optimisticIndex !== -1) {
                const updated = [...prev];
                updated[optimisticIndex] = {
                  ...updated[optimisticIndex],
                  isPending: false,
                };
                return updated;
              }
            }

            return [newMsg, ...prev];
          });

          if (newMsg.sender_id !== userId && userId) {
            markChatAsRead(chatId, userId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId, setMessages]);
}
