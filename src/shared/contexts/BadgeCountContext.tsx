import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { getBadgeCounts, setupBadgeSubscriptions, type BadgeCountData } from '@shared/lib/api';

interface BadgeCountContextType {
  unreadMessagesCount: number;
  pendingRequestsCount: number;
  totalBadgeCount: number;
  isLoading: boolean;
  error: string | null;
  refreshCounts: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

interface BadgeCountProviderProps {
  children: React.ReactNode;
  userId: string;
}

const BadgeCountContext = createContext<BadgeCountContextType | undefined>(undefined);

// Cache for badge counts with 30-second TTL
const CACHE_TTL = 30 * 1000;
let badgeCountCache: { data: BadgeCountData; timestamp: number } | null = null;

export function BadgeCountProvider({ children, userId }: BadgeCountProviderProps) {
  const [counts, setCounts] = useState<BadgeCountData>({
    unreadMessages: 0,
    pendingRequests: 0,
    totalCount: 0,
    lastUpdated: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup and debouncing
  const subscriptionCleanupRef = useRef<(() => void) | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced update function to batch rapid changes
  const debouncedUpdate = useCallback((newCounts: BadgeCountData) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setCounts(newCounts);
      badgeCountCache = { data: newCounts, timestamp: Date.now() };
    }, 100);
  }, []);

  // Load initial badge counts with caching
  const loadInitialCounts = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      
      // Check cache first
      if (badgeCountCache && (Date.now() - badgeCountCache.timestamp) < CACHE_TTL) {
        setCounts(badgeCountCache.data);
        setIsLoading(false);
        return;
      }

      const newCounts = await getBadgeCounts(userId);
      setCounts(newCounts);
      badgeCountCache = { data: newCounts, timestamp: Date.now() };
      
    } catch (err) {
      console.error('Failed to load badge counts:', err);
      setError('Failed to load notifications');
      
      // Use cached data if available, even if stale
      if (badgeCountCache) {
        setCounts(badgeCountCache.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Refresh counts manually (respects cache)
  const refreshCounts = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      
      // Check cache first
      if (badgeCountCache && (Date.now() - badgeCountCache.timestamp) < CACHE_TTL) {
        return; // Use cached data
      }

      const newCounts = await getBadgeCounts(userId);
      setCounts(newCounts);
      badgeCountCache = { data: newCounts, timestamp: Date.now() };
    } catch (err) {
      console.error('Failed to refresh badge counts:', err);
      setError('Failed to refresh notifications');
    }
  }, [userId]);

  // Force refresh (always bypasses cache)
  const forceRefresh = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      const newCounts = await getBadgeCounts(userId);
      setCounts(newCounts);
      badgeCountCache = { data: newCounts, timestamp: Date.now() };
    } catch (err) {
      console.error('Failed to force refresh badge counts:', err);
      setError('Failed to refresh notifications');
    }
  }, [userId]);

  // Setup real-time subscriptions with fallback polling
  const setupSubscriptions = useCallback(() => {
    if (!userId) return;

    try {
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
      }

      const cleanup = setupBadgeSubscriptions(userId, debouncedUpdate);
      
      // Setup fallback polling
      const pollInterval = setInterval(async () => {
        try {
          if (!badgeCountCache || (Date.now() - badgeCountCache.timestamp) > CACHE_TTL) {
            const newCounts = await getBadgeCounts(userId);
            debouncedUpdate(newCounts);
          }
        } catch (err) {
          console.error('Polling failed:', err);
        }
      }, 30000);

      subscriptionCleanupRef.current = () => {
        cleanup();
        clearInterval(pollInterval);
      };

    } catch (err) {
      console.error('Failed to setup badge subscriptions:', err);
      setError('Real-time updates unavailable');
    }
  }, [userId, debouncedUpdate]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground - refresh counts
        refreshCounts();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [refreshCounts]);

  // Initialize badge counts and subscriptions
  useEffect(() => {
    if (!userId) {
      setCounts({ unreadMessages: 0, pendingRequests: 0, totalCount: 0, lastUpdated: new Date() });
      setIsLoading(false);
      return;
    }

    loadInitialCounts();
    setupSubscriptions();

    return () => {
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [userId, loadInitialCounts, setupSubscriptions]);

  const contextValue: BadgeCountContextType = {
    unreadMessagesCount: counts.unreadMessages,
    pendingRequestsCount: counts.pendingRequests,
    totalBadgeCount: counts.totalCount,
    isLoading,
    error,
    refreshCounts,
    forceRefresh,
  };

  return (
    <BadgeCountContext.Provider value={contextValue}>
      {children}
    </BadgeCountContext.Provider>
  );
}

export function useBadgeCount(): BadgeCountContextType {
  const context = useContext(BadgeCountContext);
  if (context === undefined) {
    return {
      unreadMessagesCount: 0,
      pendingRequestsCount: 0,
      totalBadgeCount: 0,
      isLoading: false,
      error: null,
      refreshCounts: async () => {},
      forceRefresh: async () => {},
    };
  }
  return context;
}