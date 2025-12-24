import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, RefreshControl, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@shared/contexts/AuthContext';
import { getMyWalkRequests, updateWalkRequestStatus, WalkRequestWithProfile } from '@shared/lib/api';
import { supabase } from '@shared/lib/supabase';
import RequestCard from '@features/chats/components/RequestCard';

const ACCENT_ORANGE = '#FF9500';
const TEXT_LIGHT = '#999999';
const TEXT_DARK = '#1C1C1E';

type TabType = 'requests' | 'chats';

interface ChatWithLastMessage {
  id: string;
  requester_id: string;
  walker_id: string;
  updated_at: string;
  walk_title?: string;
  requester: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  walker: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
}

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

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'requests') {
      await loadRequestsWithoutLoader();
    } else {
      await loadChatsWithoutLoader();
    }
    setRefreshing(false);
  };

  const loadRequestsWithoutLoader = async () => {
    if (!user) return;

    try {
      const data = await getMyWalkRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadChatsWithoutLoader = async () => {
    if (!user) return;

    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select(
          `
          id,
          requester_id,
          walker_id,
          walk_request_id,
          updated_at,
          requester:profiles!chats_requester_id_fkey(id, display_name, avatar_url),
          walker:profiles!chats_walker_id_fkey(id, display_name, avatar_url)
        `
        )
        .or(`requester_id.eq.${user.id},walker_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const chatsWithMessages = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id, read')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let walkTitle: string | undefined;
          if (chat.walk_request_id) {
            const { data: walkRequest } = await supabase
              .from('walk_requests')
              .select('walk_id')
              .eq('id', chat.walk_request_id)
              .maybeSingle();

            if (walkRequest?.walk_id) {
              const { data: walk } = await supabase
                .from('walks')
                .select('title')
                .eq('id', walkRequest.walk_id)
                .maybeSingle();

              walkTitle = walk?.title;
            }
          }

          return {
            ...chat,
            walk_title: walkTitle,
            lastMessage: lastMessage || undefined,
          } as ChatWithLastMessage;
        })
      );

      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getMyWalkRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select(
          `
          id,
          requester_id,
          walker_id,
          walk_request_id,
          updated_at,
          requester:profiles!chats_requester_id_fkey(id, display_name, avatar_url),
          walker:profiles!chats_walker_id_fkey(id, display_name, avatar_url)
        `
        )
        .or(`requester_id.eq.${user.id},walker_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const chatsWithMessages = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id, read')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let walkTitle: string | undefined;
          if (chat.walk_request_id) {
            const { data: walkRequest } = await supabase
              .from('walk_requests')
              .select('walk_id')
              .eq('id', chat.walk_request_id)
              .maybeSingle();

            if (walkRequest?.walk_id) {
              const { data: walk } = await supabase
                .from('walks')
                .select('title')
                .eq('id', walkRequest.walk_id)
                .maybeSingle();

              walkTitle = walk?.title;
            }
          }

          return {
            ...chat,
            walk_title: walkTitle,
            lastMessage: lastMessage || undefined,
          } as ChatWithLastMessage;
        })
      );

      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
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
          await loadChats();
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

      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('walk_request_id', requestId)
        .maybeSingle();

      let chatId = existingChat?.id;

      if (!chatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({
            walk_request_id: requestId,
            requester_id: request.requester_id,
            walker_id: user.id,
          })
          .select('id')
          .single();

        if (chatError) throw chatError;
        chatId = newChat.id;
      }

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
        {otherUser.avatar_url ? (
          <Image source={{ uri: otherUser.avatar_url }} style={styles.chatAvatar} />
        ) : (
          <View style={[styles.chatAvatar, styles.chatAvatarPlaceholder]}>
            <Text style={styles.chatAvatarText}>
              {otherUser.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_ORANGE} />
          }
        >
          <ActivityIndicator size="large" color={ACCENT_ORANGE} />
        </ScrollView>
      );
    }

    if (requests.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_ORANGE} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_ORANGE} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_ORANGE} />
          }
        >
          <ActivityIndicator size="large" color={ACCENT_ORANGE} />
        </ScrollView>
      );
    }

    if (chats.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_ORANGE} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_ORANGE} />
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
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: TEXT_DARK,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 2,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  switchButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_LIGHT,
  },
  switchTextActive: {
    color: TEXT_DARK,
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
    color: TEXT_LIGHT,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  chatAvatarPlaceholder: {
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
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
    color: TEXT_DARK,
  },
  chatTime: {
    fontSize: 14,
    color: TEXT_LIGHT,
  },
  chatMessage: {
    fontSize: 15,
    color: TEXT_LIGHT,
    lineHeight: 20,
  },
  chatMessageUnread: {
    fontWeight: '600',
    color: TEXT_DARK,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_ORANGE,
    marginLeft: 8,
  },
});
