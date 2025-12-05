import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Camera,
  Smile,
  Mic,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const BACKGROUND = '#FFFFFF';
const TEXT_DARK = '#1C1C1E';
const TEXT_LIGHT = '#999999';
const MESSAGE_INCOMING = '#F0F0F0';
const MESSAGE_OUTGOING = '#FFE066';
const ACCENT_ORANGE = '#FF9500';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Chat {
  id: string;
  requester_id: string;
  walker_id: string;
  walk_request_id: string | null;
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
  walk_request?: {
    message: string;
    created_at: string;
  };
}

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const otherUser =
    chat && user
      ? chat.requester_id === user.id
        ? chat.walker
        : chat.requester
      : null;

  useEffect(() => {
    loadChatData();
    subscribeToMessages();
  }, [chatId]);

  const loadChatData = async () => {
    try {
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(
          `
          id,
          requester_id,
          walker_id,
          walk_request_id,
          requester:profiles!chats_requester_id_fkey(id, display_name, avatar_url),
          walker:profiles!chats_walker_id_fkey(id, display_name, avatar_url),
          walk_request:walk_requests!chats_walk_request_id_fkey(message, created_at)
        `
        )
        .eq('id', chatId)
        .maybeSingle();

      if (chatError) throw chatError;
      if (chatData) {
        setChat(chatData as unknown as Chat);
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      await markMessagesAsRead();
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', user.id)
        .eq('read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = () => {
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

            const hasTempMsg = prev.some(m => m.id.toString().startsWith('temp-'));
            if (hasTempMsg && newMsg.sender_id === user?.id) {
              return prev;
            }

            return [...prev, newMsg];
          });

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          if (newMsg.sender_id !== user?.id) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      chat_id: chatId as string,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const { data, error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        content: messageContent,
      }).select().single();

      if (error) throw error;

      if (data) {
        setMessages((prev) =>
          prev.map(m => m.id === tempMessage.id ? data as Message : m)
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageContent);
    }
  };

  const renderMessage = ({ item, index }: { item: Message | { id: string; isInitial: true }; index: number }) => {
    if ('isInitial' in item && item.isInitial && chat?.walk_request) {
      const requestDate = new Date(chat.walk_request.created_at);
      const dateString = requestDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      return (
        <>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>
          <View style={[styles.messageContainer, styles.otherMessage]}>
            <View style={[styles.messageBubble, styles.otherBubble]}>
              <Text style={styles.messageText}>{chat.walk_request.message}</Text>
            </View>
          </View>
        </>
      );
    }

    const message = item as Message;
    const isOwnMessage = message.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text style={styles.messageText}>{message.content}</Text>
        </View>
        {isOwnMessage && (
          <Text style={styles.messageStatus}>
            {message.read ? 'Read' : 'Delivered'}
          </Text>
        )}
      </View>
    );
  };

  const allMessages = chat?.walk_request
    ? [{ id: 'initial-message', isInitial: true as const }, ...messages]
    : messages;

  if (loading || !chat || !otherUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={28} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={28} color={TEXT_DARK} />
          </TouchableOpacity>

          {otherUser.avatar_url ? (
            <Image
              source={{ uri: otherUser.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {otherUser.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.headerName}>{otherUser.display_name}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Phone size={24} color={TEXT_DARK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Video size={24} color={TEXT_DARK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MoreVertical size={24} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={allMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.inputIconButton}>
          <Camera size={24} color={TEXT_LIGHT} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Aa"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={styles.inputIconButton}>
            <Smile size={24} color={TEXT_LIGHT} />
          </TouchableOpacity>
        </View>

        {newMessage.trim() ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.inputIconButton}>
            <Mic size={24} color={TEXT_LIGHT} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: BACKGROUND,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: MESSAGE_OUTGOING,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: MESSAGE_INCOMING,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: TEXT_DARK,
    lineHeight: 22,
  },
  messageStatus: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginTop: 4,
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: BACKGROUND,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: TEXT_DARK,
    paddingVertical: 8,
  },
  inputIconButton: {
    padding: 4,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: ACCENT_ORANGE,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
