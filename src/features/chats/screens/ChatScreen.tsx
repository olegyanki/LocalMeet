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
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';
import { sendTextMessage, sendImageMessage, sendAudioMessage, Walk } from '@shared/lib/api';
import { uploadChatImage, uploadChatAudio } from '@shared/utils/upload';
import AudioRecorder from '@shared/components/AudioRecorder';
import AudioPlayer from '@shared/components/AudioPlayer';
import Avatar from '@shared/components/Avatar';
import EventDetailsBottomSheet from '@features/events/modals/EventDetailsBottomSheet';
import PrimaryButton from '@shared/components/PrimaryButton';

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
  const { t } = useI18n();
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
      await handleSendImageMessage(result.assets[0]);
    }
  };

  const handleSendImageMessage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) return;

    setError(null);

    try {
      setUploading(true);
      const imageUrl = await uploadChatImage(chatId, asset);

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      await sendImageMessage(chatId, user.id, imageUrl);

      setSelectedImage(null);
    } catch (error: any) {
      console.error('Error sending image:', error);
      setError(error?.message || 'Failed to send image');
      setSelectedImage(null);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setError(null);

    try {
      await sendTextMessage(chatId, user.id, messageContent);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error?.message || 'Failed to send message');
      setNewMessage(messageContent);
    }
  };

  const handleSendAudioMessage = async (audioUri: string, duration: number) => {
    if (!user) return;

    setError(null);
    setIsRecording(false);

    try {
      setUploading(true);
      const audioUrl = await uploadChatAudio(chatId, audioUri);

      if (!audioUrl) {
        throw new Error('Failed to upload audio');
      }

      await sendAudioMessage(chatId, user.id, audioUrl, duration);
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
              <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
            </TouchableOpacity>

            {preloadedUserName ? (
              <Avatar 
                uri={preloadedUserAvatar} 
                name={preloadedUserName} 
                size={40}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator size="small" color={COLORS.WHITE} />
              </View>
            )}

            {preloadedUserName ? (
              <Text style={styles.headerName}>{preloadedUserName}</Text>
            ) : (
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
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
            <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
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
            <Avatar 
              uri={otherUser.avatar_url} 
              name={otherUser.display_name} 
              size={40}
            />

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
            <MoreVertical size={24} color={COLORS.TEXT_DARK} />
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
            onSend={handleSendAudioMessage}
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
                <ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
              ) : (
                <ImageIcon size={24} color={COLORS.TEXT_LIGHT} />
              )}
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Message..."
                placeholderTextColor={COLORS.TEXT_LIGHT}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
                editable={!uploading}
              />
            </View>

            {newMessage.trim() ? (
              <View style={styles.sendButtonWrapper}>
                <PrimaryButton
                  title="Send"
                  onPress={sendMessage}
                  disabled={uploading}
                  style={styles.sendButton}
                  textStyle={styles.sendButtonText}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.inputIconButton}
                onPress={() => setIsRecording(true)}
                disabled={uploading}
              >
                <Mic size={24} color={COLORS.TEXT_LIGHT} />
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
              <Text style={styles.optionButtonText}>{t('showProfile')}</Text>
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
                {t('deleteChat')}
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
              <Trash2 size={32} color={COLORS.ERROR_RED} />
            </View>
            <Text style={styles.modalTitle}>{t('deleteChatConfirm')}</Text>
            <Text style={styles.modalMessage}>
              {t('deleteChatMessage')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={deleteChat}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>{t('delete')}</Text>
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
    backgroundColor: COLORS.BG_SECONDARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.CARD_BG,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
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
    backgroundColor: COLORS.ERROR_BG,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.ERROR_RED,
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: COLORS.ERROR_RED,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
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
    padding: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  audioBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ownBubble: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.CARD_BG,
    borderBottomLeftRadius: 4,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    lineHeight: 22,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  messageStatus: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 4,
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.CARD_BG,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INPUT_BG,
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    paddingVertical: 8,
  },
  inputIconButton: {
    padding: 4,
    alignSelf: 'center',
  },
  sendButtonWrapper: {
    alignSelf: 'center',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
  },
  sendButtonText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.CARD_BG,
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
    color: COLORS.TEXT_DARK,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
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
    backgroundColor: COLORS.INPUT_BG,
  },
  modalButtonDelete: {
    backgroundColor: COLORS.ERROR_RED,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  modalButtonTextDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  optionsMenu: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 'auto',
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW_BLACK,
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
    color: COLORS.TEXT_DARK,
  },
  optionButtonTextDelete: {
    color: COLORS.ERROR_RED,
  },
  optionDivider: {
    height: 1,
    backgroundColor: COLORS.GRAY_DIVIDER,
  },
});
