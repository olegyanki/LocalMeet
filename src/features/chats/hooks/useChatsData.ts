import { useState, useEffect, useCallback } from 'react';
import { 
  getMyChats, 
  getPendingWalkRequests,
  getPastWalkRequests,
  ChatWithDetails, // Updated to use new interface
  WalkRequestWithProfile 
} from '@shared/lib/api';

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
        getPendingWalkRequests(userId),
        getPastWalkRequests(userId),
      ]);

      setChats(chatsData);
      
      // Combine pending and past requests
      const allRequests = [...pendingRequests, ...pastRequests];
      setRequests(allRequests);
    } catch (err) {
      console.error('Error loading chats data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      }
    }
  }, [userId, shouldLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    chats,
    requests,
    isLoading,
    error,
    refresh: () => loadData(false), // Full refresh with loading spinner
    refreshSilently: () => loadData(true), // Background refresh without loading spinner
  };
}
