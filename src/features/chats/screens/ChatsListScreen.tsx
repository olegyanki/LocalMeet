import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Contexts & Hooks
import { useAuth } from '@shared/contexts/AuthContext';

// API & Utils
import { 
  getMyWalkRequests, 
  updateWalkRequestStatus, 
  getMyChats,
  createChatFromRequest,
  WalkRequestWithProfile,
  ChatWithLastMessage 
} from '@shared/lib/api';
import { getEventImage } from '@shared/utils/eventImage';

// Components
import RequestCard from '@features/chats/components/RequestCard';
import Avatar from '@shared/components/Avatar';

// Constants
import { COLORS } from '@shared/constants';

type TabType = 'requests' | 'chats';

export default function ChatsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [requests, setRequests] = useState<WalkRequestWithProfile[]>([]);
  const [chats, setChats] = useState<ChatWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const loadRequests = async (showLoader = true) => {
    if (!user) return;

    try {
      if (showLoader) setLoading(true);
      const data = await getMyWalkRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const loadChats = async (showLoader = true) => {
    if (!user) return;

    try {
      if (showLoader) setLoading(true);
      const data = await getMyChats(user.id);
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'requests') {
      await loadRequests(false);
    } else {
      await loadChats(false);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    const checkRequestsAndLoad = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getMyWalkRequests(user.id);
        setRequests(data);

        if (data.length > 0) {
          setActiveTab('requests');
        } else {
          await loadChats(false);
        }
      } catch (error) {
        console.error('Error loading requests:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRequestsAndLoad();
  }, [user]);

  const handleAccept = async (requestId: string) => {
    if (!user) return;

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const chatId = await createChatFromRequest(
        requestId,
        request.requester_id,
        user.id
      );

      await updateWalkRequestStatus(requestId, 'accepted');
      
      setRequests(prev => {
        const updated = prev.filter(r => r.id !== requestId);
        if (updated.length === 0) {
          setActiveTab('chats');
        }
        return updated;
      });

      router.push({
        pathname: `/chat/${chatId}`,
        params: {
          otherUserName: request.requester.display_name,
          otherUserAvatar: request.requester.avatar_url || '',
        },
      });
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateWalkRequestStatus(requestId, 'rejected');
      setRequests(prev => {
        const updated = prev.filter(r => r.id !== requestId);
        if (updated.length === 0) {
          setActiveTab('chats');
        }
        return updated;
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const renderChatItem = ({ item }: { item: ChatWithLastMessage }) => {
    const otherUser = item.requester_id === user?.id ? item.walker : item.requester;
    const displayName = item.walk_title || otherUser.display_name;
    const lastMessageText = item.lastMessage?.content || otherUser.display_name;
    const isUnread = item.lastMessage && !item.lastMessage.read && item.lastMessage.sender_id !== user?.id;

    const walk = { image_url: item.walk_image_url } as any;
    const eventImageUrl = getEventImage(walk, otherUser.avatar_url);

    const timeAgo = item.lastMessage ? (() => {
      const date = new Date(item.lastMessage.created_at);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      return `${diffDays}d`;
    })() : '';

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push({
          pathname: `/chat/${item.id}`,
          params: {
            otherUserName: otherUser.display_name,
            otherUserAvatar: otherUser.avatar_url || '',
          },
        })}
      >
        <Avatar 
          uri={eventImageUrl} 
          name={otherUser.display_name} 
          size={56}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{displayName}</Text>
            {timeAgo && <Text style={styles.chatTime}>{timeAgo}</Text>}
          </View>
          <Text
            style={[styles.chatMessage, isUnread && styles.chatMessageUnread]}
            numberOfLines={1}
          >
            {lastMessageText}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
    );
  };

  const renderRequestsContent = () => {
    if (loading) {
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

    if (requests.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
          }
        >
          <Text style={styles.emptyText}>No requests yet</Text>
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onReject={handleReject}
            onAccept={handleAccept}
            onSwipeStart={() => setScrollEnabled(false)}
            onSwipeEnd={() => setScrollEnabled(true)}
            onCardPress={(userId) => router.push(`/user/${userId}`)}
          />
        )}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
        }
      />
    );
  };

  const renderChatsContent = () => {
    if (loading) {
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

    if (chats.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
          }
        >
          <Text style={styles.emptyText}>No chats yet</Text>
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ACCENT_ORANGE} />
        }
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Messages</Text>

      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            activeTab === 'chats' && styles.switchButtonActive,
          ]}
          onPress={() => setActiveTab('chats')}
        >
          <Text
            style={[
              styles.switchText,
              activeTab === 'chats' && styles.switchTextActive,
            ]}
          >
            Chats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchButton,
            activeTab === 'requests' && styles.switchButtonActive,
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles.switchText,
              activeTab === 'requests' && styles.switchTextActive,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>
      </View>

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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 12,
    padding: 3,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  switchButtonActive: {
    backgroundColor: COLORS.CARD_BG,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  switchTextActive: {
    color: COLORS.TEXT_DARK,
  },
  content: {
    flex: 1,
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.CARD_BG,
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  chatTime: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },
  chatMessage: {
    fontSize: 15,
    color: COLORS.TEXT_LIGHT,
    lineHeight: 20,
  },
  chatMessageUnread: {
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ACCENT_ORANGE,
    marginLeft: 8,
  },
});
