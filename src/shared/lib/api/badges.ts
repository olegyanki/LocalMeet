import { supabase } from '../supabase';
import type { Database } from '../database.types';

type GetBadgeCountsOptimizedRow = Database['public']['Functions']['get_badge_counts_optimized']['Returns'][number];

export interface BadgeCountData {
  unreadMessages: number;
  pendingRequests: number;
  totalCount: number;
  lastUpdated: Date;
}

/**
 * Get badge counts for chat tab (unread messages + pending requests)
 * Uses optimized RPC function for single-query performance
 * 
 * @param userId - The user ID to get badge counts for
 * @returns Promise<BadgeCountData> - Badge count data with totals
 */
export async function getBadgeCounts(userId: string): Promise<BadgeCountData> {
  try {
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
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof Error && 
        (error.message.includes('Network request failed') || 
         error.message.includes('fetch'))) {
      // Return default values for network errors
      return {
        unreadMessages: 0,
        pendingRequests: 0,
        totalCount: 0,
        lastUpdated: new Date(),
      };
    }
    // Re-throw other errors
    throw error;
  }
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

  console.log('Setting up badge count subscriptions for user:', userId);

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
        // Silently handle network errors in subscriptions
        if (error instanceof Error && 
            !error.message.includes('Network request failed') && 
            !error.message.includes('fetch')) {
          console.error('Error updating badge counts from message change:', error);
        }
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
        // Silently handle network errors in subscriptions
        if (error instanceof Error && 
            !error.message.includes('Network request failed') && 
            !error.message.includes('fetch')) {
          console.error('Error updating badge counts from request change:', error);
        }
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
        // Silently handle network errors in subscriptions
        if (error instanceof Error && 
            !error.message.includes('Network request failed') && 
            !error.message.includes('fetch')) {
          console.error('Error updating badge counts from participant change:', error);
        }
      }
    })
    .subscribe();

  channels.push(participantsChannel);

  // Return cleanup function
  return () => {
    console.log('Cleaning up badge count subscriptions');
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
  };
}
