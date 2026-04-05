import { useState, useEffect, useCallback } from 'react';
import { 
  getMyChats, 
  getWalkRequests,
  ChatWithDetails,
  WalkRequestWithProfile 
} from '@shared/lib/api';
import { supabase } from '@shared/lib/supabase';

export interface WalkRequestWithDetails extends WalkRequestWithProfile {
  // Extends WalkRequestWithProfile with any additional fields if needed
}

interface UseChatsDataParams {
  userId: string;
  shouldLoad?: boolean;
}

interface UseChatsDataReturn {
  chats: ChatWithDetails[]; // Updated to use new interface
  requests: WalkRequestWithDetails[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshSilently: () => Promise<void>; // New method for background refresh
}

export function useChatsData(params: UseChatsDataParams): UseChatsDataReturn {
  const { userId, shouldLoad = true } = params;

  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [requests, setRequests] = useState<WalkRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!userId || !shouldLoad) {
      return;
    }

    try {
      // Only show loading spinner on initial load, not on refresh
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      // Load chats and requests in parallel
      const [chatsData, pendingRequests, pastRequests] = await Promise.all([
        getMyChats(userId),
        getWalkRequests(userId, 'pending'),
        getWalkRequests(userId, 'past'),
      ]);

      setChats(chatsData);
      
      // Combine pending and past requests
      const allRequests = [...pendingRequests, ...pastRequests];
      setRequests(allRequests);
    } catch (err) {
      console.error('Error loading chats data:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to load data';
      if (err instanceof Error) {
        if (err.message.includes('Network request failed')) {
          errorMessage = 'No internet connection. Please check your network.';
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      }
    }
  }, [userId, shouldLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup real-time subscription for messages to update chat list
  useEffect(() => {
    if (!userId || !shouldLoad) return;

    // Debounce timer to batch rapid updates
    let debounceTimer: NodeJS.Timeout | null = null;

    const debouncedRefresh = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        loadData(true);
      }, 500);
    };

    const channel = supabase
      .channel(`chat-list-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'walk_requests',
        },
        () => {
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
        },
        () => {
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'walks',
        },
        () => {
          debouncedRefresh();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      supabase.removeChannel(channel);
    };
  }, [userId, shouldLoad, loadData]);

  return {
    chats,
    requests,
    isLoading,
    error,
    refresh: () => loadData(false), // Full refresh with loading spinner
    refreshSilently: () => loadData(true), // Background refresh without loading spinner
  };
}
