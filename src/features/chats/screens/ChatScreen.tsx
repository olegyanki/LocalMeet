import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, MoreVertical, Mic, Plus, Users, Trash2, User, Info } from 'lucide-react-native';

import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { 
  sendTextMessage, 
  sendImageMessage, 
  sendAudioMessage,
  getChatById,
  getChatMessages,
  markMessagesAsRead,
  deleteChat as deleteChatApi,
  Message,
  ChatDetails,
} from '@shared/lib/api';
import { supabase } from '@shared/lib/supabase';
import { uploadChatImage, uploadChatAudio } from '@shared/utils/upload';

import AudioRecorder from '@shared/components/AudioRecorder';
import AudioPlayer from '@shared/components/AudioPlayer';
import Avatar from '@shared/components/Avatar';

import { COLORS, SHADOW } from '@shared/constants';

const SCROLL_DELAY = 100;
const MAX_MESSAGE_LENGTH = 1000;

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useI18n();
  const flatListRef = useRef<FlatList>(null);

  const [chat, setChat] = useState<ChatDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const otherUser =
    chat && user
      ? chat.requester_id === user.id
        ? chat.walker
        : chat.requester
      : null;

  useEffect(() => {
    loadChatData();
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, SCROLL_DELAY);
    }
  }, [loading, messages.length]);

  const loadChatData = async () => {
    try {
      const [chatData, messagesData] = await Promise.all([
        getChatById(chatId),
        getChatMessages(chatId),
      ]);

      if (chatData) {
        setChat(chatData);
      }

      setMessages(messagesData);

      if (user) {
        await markMessagesAsRead(chatId, user.id);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setError(t('error'));
    } finally {
      setLoading(false);
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
          }, SCROLL_DELAY);

          if (newMsg.sender_id !== user?.id && user) {
            markMessagesAsRead(chatId, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      setError(t('error'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleSendImageMessage(result.assets[0]);
    }
  }, [t]);

  const handleSendImageMessage = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) return;

    setError(null);

    try {
      setUploading(true);
      const imageUrl = await uploadChatImage(chatId, asset);

      if (!imageUrl) {
        throw new Error(t('error'));
      }

      await sendImageMessage(chatId, user.id, imageUrl);
    } catch (error: any) {
      console.error('Error sending image:', error);
      setError(error?.message || t('error'));
    } finally {
      setUploading(false);
    }
  }, [user, chatId, t]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setError(null);

    try {
      await sendTextMessage(chatId, user.id, messageContent);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error?.message || t('error'));
      setNewMessage(messageContent);
    }
  }, [newMessage, user, chatId, t]);

  const handleSendAudioMessage = useCallback(async (audioUri: string, duration: number) => {
    if (!user) return;

    setError(null);
    setIsRecording(false);

    try {
      setUploading(true);
      const audioUrl = await uploadChatAudio(chatId, audioUri, user.id);

      if (!audioUrl) {
        throw new Error(t('errorUploadingAudio'));
      }

      await sendAudioMessage(chatId, user.id, audioUrl, duration);
    } catch (error: any) {
      console.error('Error sending audio:', error);
      
      // Check if it's a bucket not found error
      if (error?.message?.includes('Bucket not found')) {
        setError('Audio bucket not configured. Please contact support.');
      } else {
        setError(error?.message || t('error'));
      }
    } finally {
      setUploading(false);
    }
  }, [user, chatId, t]);

  const handleDeleteChat = useCallback(async () => {
    if (!chatId || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteChatApi(chatId);
      setShowDeleteModal(false);
      router.back();
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      setError(error?.message || t('error'));
      setDeleting(false);
    }
  }, [chatId, deleting, router, t]);

  const allMessages = chat?.walk_request
    ? [{ id: 'initial-message', isInitial: true as const }, ...messages]
    : messages;

  const getDateLabel = useCallback((date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    messageDate.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
      return t('today').toUpperCase();
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return t('yesterday').toUpperCase();
    } else {
      return new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      }).toUpperCase();
    }
  }, [t]);

  const renderMessage = useCallback(({ item, index }: { item: Message | { id: string; isInitial: true }, index: number }) => {
    if ('isInitial' in item && item.isInitial && chat?.walk_request) {
      const requestDate = new Date(chat.walk_request.created_at);
      const dateLabel = getDateLabel(requestDate);

      return (
        <>
          <View style={styles.dateContainer}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{dateLabel}</Text>
            </View>
          </View>
          <View style={[styles.messageContainer, styles.otherMessage]}>
            <View style={styles.avatarContainer}>
              <Avatar
                uri={otherUser?.avatar_url}
                size={32}
                name={otherUser?.display_name || ''}
              />
            </View>
            <View style={styles.messageContent}>
              <Text style={styles.senderName}>{otherUser?.display_name}</Text>
              <View style={[styles.messageBubble, styles.otherBubble]}>
                <Text style={[styles.messageText, styles.otherMessageText]}>
                  {chat.walk_request.message}
                </Text>
              </View>
              <Text style={styles.messageTime}>
                {new Date(chat.walk_request.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
            </View>
          </View>
        </>
      );
    }

    const message = item as Message;
    const isOwnMessage = message.sender_id === user?.id;
    const messageTime = new Date(message.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Show date separator for first message or when date changes
    // Skip if previous item is initial message with same date
    let showDateSeparator = false;
    if (index === 0) {
      showDateSeparator = false; // Never show for first item (initial message already has date)
    } else if (allMessages[index - 1]) {
      const prevItem = allMessages[index - 1];
      if ('isInitial' in prevItem && prevItem.isInitial) {
        // Previous is initial message - check if dates are different
        const prevDate = chat?.walk_request?.created_at;
        if (prevDate) {
          showDateSeparator = new Date(message.created_at).toDateString() !== new Date(prevDate).toDateString();
        }
      } else {
        // Previous is regular message
        showDateSeparator = new Date(message.created_at).toDateString() !== 
          new Date((prevItem as Message).created_at).toDateString();
      }
    }

    const dateLabel = showDateSeparator ? getDateLabel(new Date(message.created_at)) : '';

    const senderName = isOwnMessage 
      ? (user?.id === chat?.requester_id ? chat?.requester.display_name : chat?.walker.display_name)
      : (message.sender_id === chat?.requester_id ? chat?.requester.display_name : chat?.walker.display_name);

    const senderAvatar = isOwnMessage
      ? (user?.id === chat?.requester_id ? chat?.requester.avatar_url : chat?.walker.avatar_url)
      : (message.sender_id === chat?.requester_id ? chat?.requester.avatar_url : chat?.walker.avatar_url);

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateContainer}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{dateLabel}</Text>
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              <Avatar
                uri={senderAvatar}
                size={32}
                name={senderName || ''}
              />
            </View>
          )}
          <View style={[styles.messageContent, isOwnMessage && styles.ownMessageContent]}>
            {!isOwnMessage && (
              <Text style={styles.senderName}>{senderName}</Text>
            )}
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
                <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
                  {message.content}
                </Text>
              ) : null}
            </View>
            <View style={[styles.messageTimeContainer, isOwnMessage && styles.ownMessageTimeContainer]}>
              <Text style={styles.messageTime}>{messageTime}</Text>
              {isOwnMessage && (
                <Text style={styles.messageStatus}>
                  {message.read ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }, [user, chat, otherUser, allMessages, getDateLabel]);

  if (loading || !chat || !otherUser) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.headerAvatarContainer}>
          {chat.walk_request?.walk ? (
            chat.walk_request.walk.image_url ? (
              <Image
                source={{ uri: chat.walk_request.walk.image_url }}
                style={styles.headerEventImage}
              />
            ) : (
              <View style={styles.headerGroupIcon}>
                <Users size={20} color={COLORS.ACCENT_ORANGE} />
              </View>
            )
          ) : (
            <Avatar
              uri={otherUser.avatar_url}
              size={40}
              name={otherUser.display_name}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => {
            if (chat.walk_request?.walk) {
              router.push(`/event/${chat.walk_request.walk.id}`);
            } else {
              router.push(`/user/${otherUser.id}`);
            }
          }}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chat.walk_request?.walk ? chat.walk_request.walk.title : otherUser.display_name}
          </Text>
          {chat.walk_request?.walk && (
            <Text style={styles.headerSubtitle}>
              {/* TODO: Get actual participant count */}
              8 PARTICIPANTS
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
          >
            <MoreVertical size={24} color={COLORS.TEXT_DARK} />
          </TouchableOpacity>

          {showOptionsMenu && (
            <View style={styles.dropdownMenu}>
              {chat.walk_request?.walk && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      if (chat.walk_request?.walk) {
                        router.push(`/event/${chat.walk_request.walk.id}`);
                      }
                    }}
                  >
                    <Info size={20} color={COLORS.TEXT_LIGHT} />
                    <Text style={styles.dropdownOptionText}>{t('eventInfo')}</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                </>
              )}

              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setShowOptionsMenu(false);
                  router.push(`/user/${otherUser.id}`);
                }}
              >
                <User size={20} color={COLORS.TEXT_LIGHT} />
                <Text style={styles.dropdownOptionText}>{t('showProfile')}</Text>
              </TouchableOpacity>

              <View style={styles.dropdownDivider} />

              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setShowOptionsMenu(false);
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 size={20} color={COLORS.ERROR_RED} />
                <Text style={[styles.dropdownOptionText, styles.dropdownOptionTextDelete]}>
                  {t('deleteChat')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {showOptionsMenu && (
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>{t('dismiss')}</Text>
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

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
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
                <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
              ) : (
                <Plus size={30} color={COLORS.TEXT_LIGHT} strokeWidth={1.5} />
              )}
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={t('message')}
                placeholderTextColor={COLORS.TEXT_LIGHT + '80'}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={MAX_MESSAGE_LENGTH}
                editable={!uploading}
              />
            </View>

            <TouchableOpacity
              style={styles.sendIconButton}
              onPress={newMessage.trim() ? sendMessage : () => setIsRecording(true)}
              disabled={uploading}
            >
              {newMessage.trim() ? (
                <ChevronLeft 
                  size={30} 
                  color={COLORS.ACCENT_ORANGE} 
                  strokeWidth={2}
                  style={{ transform: [{ rotate: '180deg' }] }}
                />
              ) : (
                <Mic size={24} color={COLORS.TEXT_LIGHT} />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

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
                onPress={handleDeleteChat}
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

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BG_SECONDARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.BG_SECONDARY,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
    marginLeft: -8,
  },
  headerAvatarContainer: {
    marginRight: 12,
  },
  headerEventImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  headerGroupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.ACCENT_ORANGE + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    lineHeight: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  headerRight: {
    position: 'relative',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 224,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    ...SHADOW.elevated,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    overflow: 'hidden',
    paddingVertical: 4,
    zIndex: 1000,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  dropdownOptionTextDelete: {
    color: COLORS.ERROR_RED,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER_COLOR + '80',
  },
  errorContainer: {
    backgroundColor: COLORS.ERROR_BG,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
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
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateBadge: {
    backgroundColor: COLORS.TEXT_LIGHT + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '700',
    letterSpacing: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    maxWidth: '90%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  ownMessageContent: {
    marginLeft: 0,
    marginRight: 0,
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    ...SHADOW.standard,
  },
  audioBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ownBubble: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderBottomRightRadius: 4,
    shadowColor: COLORS.ACCENT_ORANGE,
    shadowOpacity: 0.2,
  },
  otherBubble: {
    backgroundColor: COLORS.CARD_BG,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR + '80',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  ownMessageText: {
    color: COLORS.WHITE,
  },
  otherMessageText: {
    color: COLORS.TEXT_DARK,
  },
  messageTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 4,
  },
  ownMessageTimeContainer: {
    marginLeft: 0,
    marginRight: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.TEXT_LIGHT,
  },
  messageStatus: {
    fontSize: 12,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '600',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: COLORS.BG_SECONDARY,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 24,
    paddingHorizontal: 16,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
    ...SHADOW.standard,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    paddingVertical: 12,
  },
  inputIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  sendIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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
    borderRadius: 20,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
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
    backgroundColor: COLORS.BG_SECONDARY,
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
});
