import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Contexts & Hooks
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { useChatsData } from '@features/chats/hooks/useChatsData';

// API & Utils
import { 
  updateWalkRequestStatus, 
  ChatWithDetails,
} from '@shared/lib/api';
import { formatRelativeTime } from '@shared/utils/time';
import { getDisplayName } from '@shared/utils/profile';

// Components
import RequestCard from '@features/chats/components/RequestCard';
import Avatar from '@shared/components/Avatar';
import SegmentedControl from '@shared/components/SegmentedControl';

// Constants
import { COLORS, SHADOW } from '@shared/constants';

type TabType = 'messages' | 'requests';

export default function ChatsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [refreshing, setRefreshing] = useState(false);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  // Use custom hook for data loading
  const { chats, requests, isLoading, refresh, refreshSilently } = useChatsData({
    userId: user?.id || '',
    shouldLoad: !!user,
  });

  // Sort chats by last message time (newest first)
  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const timeA = a.lastMessage?.created_at 
        ? new Date(a.lastMessage.created_at).getTime() 
        : new Date(a.created_at).getTime();
      const timeB = b.lastMessage?.created_at 
        ? new Date(b.lastMessage.created_at).getTime() 
        : new Date(b.created_at).getTime();
      return timeB - timeA; // DESC order (newest first)
    });
  }, [chats]);

  // Separate pending and past requests
  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status === 'pending');
  }, [requests]);

  const pastRequests = useMemo(() => {
    return requests.filter(r => r.status !== 'pending');
  }, [requests]);

  // Sort pending requests by created_at DESC (newest first)
  const sortedPendingRequests = useMemo(() => {
    return [...pendingRequests].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [pendingRequests]);

  // Sort past requests by updated_at DESC (most recently processed first)
  const sortedPastRequests = useMemo(() => {
    return [...pastRequests].sort((a, b) => {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return dateB - dateA;
    });
  }, [pastRequests]);

  // Count unread messages using the new unread_count field
  const unreadCount = useMemo(() => {
    return sortedChats.reduce((total, chat) => total + (chat.unread_count || 0), 0);
  }, [sortedChats]);

  // Count pending requests
  const pendingCount = useMemo(() => {
    return pendingRequests.length;
  }, [pendingRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    if (!user) return;

    try {
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update request status - database trigger will automatically add participant to group chat
      await updateWalkRequestStatus(requestId, 'accepted');
      
      // Refresh data to update the UI
      await refresh();

      // Navigate to the group chat for this event
      const { getChatByWalkId } = await import('@shared/lib/api');
      const chatId = await getChatByWalkId(request.walk_id);
      
      if (chatId) {
        router.push(`/chat/${chatId}`);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateWalkRequestStatus(requestId, 'rejected');
      
      // Refresh data to update the UI
      await refresh();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const renderChatItem = ({ item }: { item: ChatWithDetails }) => {
    // For group chats, show event title and multiple participant avatars
    // For direct chats, show the other participant's name and avatar
    const isGroupChat = item.type === 'group';
    
    let displayName: string;
    let avatarUrl: string | null = null;
    let participantAvatars: string[] = [];
    
    if (isGroupChat) {
      // Group chat: show event title
      displayName = item.walk_title || t('groupChat');
      avatarUrl = item.walk_image_url || null;
      // Get participant avatars (excluding current user)
      participantAvatars = item.participants
        .filter(p => p.user_id !== user?.id)
        .map(p => p.profile.avatar_url)
        .filter(Boolean) as string[];
    } else {
      // Direct chat: show other participant's name
      const otherParticipant = item.participants.find(p => p.user_id !== user?.id);
      displayName = getDisplayName(otherParticipant?.profile) || t('unknown');
      avatarUrl = otherParticipant?.profile.avatar_url || null;
    }

    const lastMessageText = item.lastMessage?.content 
      || (item.lastMessage?.image_url ? '📷 ' + t('photo') : '')
      || (item.lastMessage?.audio_url ? '🎤 ' + t('voiceMessage') : '')
      || (isGroupChat ? t('groupChatCreated') : displayName);
    const isUnread = item.lastMessage && !item.lastMessage.read && item.lastMessage.sender_id !== user?.id;

    // For group chats, use event image or first participant avatar
    // For direct chats, use other participant's avatar
    const imageUrl = isGroupChat 
      ? (item.walk_image_url || participantAvatars[0] || null)
      : avatarUrl;

    const timeAgo = item.lastMessage ? formatRelativeTime(item.lastMessage.created_at) : '';

    const handleChatPress = () => {
      router.push({
        pathname: `/chat/${item.id}` as any,
        params: {
          chatType: item.type,
          chatTitle: displayName,
        },
      });
    };

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={handleChatPress}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Avatar 
            uri={imageUrl} 
            name={displayName} 
            size={52}
          />
          {/* Show unread count badge if there are unread messages */}
          {item.unread_count > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>
                {item.unread_count > 99 ? '99+' : item.unread_count.toString()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{displayName}</Text>
            {timeAgo && <Text style={styles.chatTime}>{timeAgo}</Text>}
          </View>
          
          <Text
            style={[styles.chatMessage, isUnread && styles.chatMessageUnread]}
            numberOfLines={1}
          >
            {lastMessageText}
          </Text>
        </View>
        
        {/* Show small unread indicator dot */}
        {isUnread && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
    );
  };

  const renderRequestsContent = () => {
    if (isLoading) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
          }
        >
          <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
        </ScrollView>
      );
    }

    if (sortedPendingRequests.length === 0 && sortedPastRequests.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
          }
        >
          <Text style={styles.emptyText}>{t('noRequestsYet')}</Text>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
        }
      >
        {sortedPendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('pending')}</Text>
            {sortedPendingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onReject={handleReject}
                onAccept={handleAccept}
                onCardPress={(userId) => router.push(`/user/${userId}`)}
              />
            ))}
          </View>
        )}

        {sortedPastRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('past')}</Text>
            {sortedPastRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isPast={true}
                onCardPress={(userId) => router.push(`/user/${userId}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderChatsContent = () => {
    if (isLoading) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
          }
        >
          <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
        </ScrollView>
      );
    }

    if (sortedChats.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
          }
        >
          <Text style={styles.emptyText}>{t('noChatsYet')}</Text>
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={sortedChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
        }
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('messages')}</Text>
      </View>

      <SegmentedControl
        segments={[t('messages'), t('requests')]}
        activeIndex={activeTab === 'messages' ? 0 : 1}
        onChange={(index) => setActiveTab(index === 0 ? 'messages' : 'requests')}
        badges={[unreadCount, pendingCount]}
        style={styles.segmentedControl}
      />

      <View style={styles.content}>
        {activeTab === 'requests' ? (
          renderRequestsContent()
        ) : (
          renderChatsContent()
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  segmentedControl: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    gap: 16,
    ...SHADOW.standard,
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.CARD_BG,
  },
  unreadCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.CARD_BG,
    paddingHorizontal: 4,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingTop: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    flexShrink: 0,
  },
  chatMessage: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    lineHeight: 18,
    paddingRight: 16,
  },
  chatMessageUnread: {
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.ACCENT_ORANGE,
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: 16,
    borderWidth: 2,
    borderColor: COLORS.CARD_BG,
  },
});
