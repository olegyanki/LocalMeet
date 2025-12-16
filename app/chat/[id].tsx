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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, MoreVertical, Mic, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AudioRecorder from '@/components/AudioRecorder';
import AudioPlayer from '@/components/AudioPlayer';
import EventDetailsBottomSheet from '@/components/EventDetailsBottomSheet';

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
  image_url?: string | null;
  audio_url?: string | null;
  audio_duration?: number | null;
  created_at: string;
  read: boolean;
}

interface Walk {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  duration: string;
  latitude: number;
  longitude: number;
  user_id: string;
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
    walk_id: string;
    walk?: Walk;
  };
}

export default function ChatScreen() {
  const { id, otherUserName, otherUserAvatar } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const preloadedUserName = Array.isArray(otherUserName) ? otherUserName[0] : otherUserName;
  const preloadedUserAvatar = Array.isArray(otherUserAvatar) ? otherUserAvatar[0] : otherUserAvatar;

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

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [loading, messages.length]);

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
          walk_request:walk_requests!chats_walk_request_id_fkey(message, created_at, walk_id)
        `
        )
        .eq('id', chatId)
        .maybeSingle();

      if (chatError) throw chatError;
      if (chatData) {
        if (chatData.walk_request?.walk_id) {
          const { data: walkData } = await supabase
            .from('walks')
            .select('id, title, description, start_time, duration, latitude, longitude, user_id')
            .eq('id', chatData.walk_request.walk_id)
            .maybeSingle();

          if (walkData) {
            chatData.walk_request.walk = walkData;
          }
        }
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      setError('Need permission to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      await sendImageMessage(result.assets[0]);
    }
  };

  const uploadImage = async (
    asset: ImagePicker.ImagePickerAsset
  ): Promise<string | null> => {
    try {
      setUploading(true);
      console.log('Starting upload for:', asset.uri);

      let uint8Array: Uint8Array;

      // Use base64 if available (for web), otherwise fetch
      if (asset.base64) {
        console.log('Using base64 data');
        const binaryString = atob(asset.base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        uint8Array = bytes;
      } else {
        console.log('Fetching image from URI');
        const response = await fetch(asset.uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        uint8Array = new Uint8Array(arrayBuffer);
      }

      console.log('Data size:', uint8Array.length);

      const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${chatId}/${Date.now()}.${ext}`;
      console.log('Uploading to:', fileName);

      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, uint8Array, {
          contentType: `image/${ext}`,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error,
        });
        throw new Error(error.message || 'Upload failed');
      }

      console.log('Upload successful:', data);

      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error in uploadImage:', {
        message: error?.message,
        error: error,
      });
      setError(error?.message || 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const sendImageMessage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) return;

    setError(null);

    try {
      const imageUrl = await uploadImage(asset);

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        content: '',
        image_url: imageUrl,
      });

      if (error) {
        console.error('Error sending image message:', error);
        throw error;
      }

      setSelectedImage(null);
    } catch (error: any) {
      console.error('Error sending image:', error);
      setError(error?.message || 'Failed to send image');
      setSelectedImage(null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setError(null);

    try {
      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        content: messageContent,
      });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error?.message || 'Failed to send message');
      setNewMessage(messageContent);
    }
  };

  const uploadAudio = async (audioUri: string): Promise<string | null> => {
    try {
      if (!user) return null;

      const response = await fetch(audioUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const fileName = `${user.id}/${chatId}/${Date.now()}.m4a`;

      const { data, error } = await supabase.storage
        .from('audio-messages')
        .upload(fileName, uint8Array, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (error) {
        console.error('Supabase audio upload error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('audio-messages')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      setError(error?.message || 'Failed to upload audio');
      return null;
    }
  };

  const sendAudioMessage = async (audioUri: string, duration: number) => {
    if (!user) return;

    setError(null);
    setIsRecording(false);

    try {
      setUploading(true);
      const audioUrl = await uploadAudio(audioUri);

      if (!audioUrl) {
        throw new Error('Failed to upload audio');
      }

      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: user.id,
        content: '',
        audio_url: audioUrl,
        audio_duration: duration,
      });

      if (error) {
        console.error('Error sending audio message:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending audio:', error);
      setError(error?.message || 'Failed to send audio');
    } finally {
      setUploading(false);
    }
  };

  const deleteChat = async () => {
    if (!chatId || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw messagesError;
      }

      const { error: chatError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (chatError) {
        console.error('Error deleting chat:', chatError);
        throw chatError;
      }

      setShowDeleteModal(false);
      router.back();
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      setError(error?.message || 'Failed to delete chat');
      setDeleting(false);
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
            message.audio_url && styles.audioBubble,
          ]}
        >
          {message.image_url && (
            <Image
              source={{ uri: message.image_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          {message.audio_url && message.audio_duration ? (
            <AudioPlayer
              audioUrl={message.audio_url}
              duration={message.audio_duration}
              isOwnMessage={isOwnMessage}
            />
          ) : null}
          {message.content ? (
            <Text style={styles.messageText}>{message.content}</Text>
          ) : null}
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

            {preloadedUserAvatar ? (
              <Image
                source={{ uri: preloadedUserAvatar }}
                style={styles.avatar}
              />
            ) : preloadedUserName ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {preloadedUserName.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}

            {preloadedUserName ? (
              <Text style={styles.headerName}>{preloadedUserName}</Text>
            ) : (
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ActivityIndicator size="small" color={ACCENT_ORANGE} />
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={styles.iconButton}>
              <MoreVertical size={24} color="transparent" />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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

          <TouchableOpacity
            style={styles.userInfoContainer}
            onPress={() => {
              if (chat.walk_request?.walk) {
                setShowEventDetails(true);
              } else {
                router.push(`/user/${otherUser.id}`);
              }
            }}
          >
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

            <Text style={styles.headerName}>
              {chat.walk_request?.walk?.title || otherUser.display_name}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowOptionsMenu(true)}
          >
            <MoreVertical size={24} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

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
        {isRecording ? (
          <AudioRecorder
            onSend={sendAudioMessage}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <>
            <TouchableOpacity
              style={styles.inputIconButton}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={ACCENT_ORANGE} />
              ) : (
                <ImageIcon size={24} color={TEXT_LIGHT} />
              )}
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Aa"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
                editable={!uploading}
              />
            </View>

            {newMessage.trim() ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={uploading}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.inputIconButton}
                onPress={() => setIsRecording(true)}
                disabled={uploading}
              >
                <Mic size={24} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptionsMenu(false);
                router.push(`/user/${otherUser.id}`);
              }}
            >
              <Text style={styles.optionButtonText}>Показати профіль</Text>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setShowOptionsMenu(false);
                setShowDeleteModal(true);
              }}
            >
              <Text style={[styles.optionButtonText, styles.optionButtonTextDelete]}>
                Видалити чат
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Trash2 size={32} color="#FF3B30" />
            </View>
            <Text style={styles.modalTitle}>Видалити чат?</Text>
            <Text style={styles.modalMessage}>
              Усі повідомлення будуть видалені назавжди
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.modalButtonTextCancel}>Скасувати</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={deleteChat}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>Видалити</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {chat?.walk_request?.walk && otherUser && (
        <EventDetailsBottomSheet
          visible={showEventDetails}
          onClose={() => setShowEventDetails(false)}
          user={{
            id: otherUser.id,
            username: otherUser.display_name,
            display_name: otherUser.display_name,
            bio: null,
            avatar_url: otherUser.avatar_url,
            status: null,
            distance: 0,
            location: null,
            walk: {
              id: chat.walk_request.walk.id,
              user_id: chat.walk_request.walk.user_id,
              title: chat.walk_request.walk.title,
              start_time: chat.walk_request.walk.start_time || '',
              duration: chat.walk_request.walk.duration,
              description: chat.walk_request.walk.description,
              latitude: chat.walk_request.walk.latitude,
              longitude: chat.walk_request.walk.longitude,
              is_active: true,
              deleted: false,
              created_at: '',
              updated_at: '',
            },
            interests: [],
            isActive: true,
          }}
          isOwnEvent={false}
        />
      )}
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
    overflow: 'hidden',
  },
  audioBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: BACKGROUND,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: TEXT_LIGHT,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F0F0F0',
  },
  modalButtonDelete: {
    backgroundColor: '#FF3B30',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  modalButtonTextDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionsMenu: {
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 'auto',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_DARK,
  },
  optionButtonTextDelete: {
    color: '#FF3B30',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
});
