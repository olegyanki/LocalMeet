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
import { ChevronLeft, MoreVertical, Mic, Image as ImageIcon, Trash2 } from 'lucide-react-native';

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

import { COLORS } from '@shared/constants';

const SCROLL_DELAY = 100;
const MAX_MESSAGE_LENGTH = 1000;

export default function ChatScreen() {
  const { id, otherUserName } = useLocalSearchParams();
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

  const preloadedUserName = Array.isArray(otherUserName) ? otherUserName[0] : otherUserName;

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
      const audioUrl = await uploadChatAudio(chatId, audioUri);

      if (!audioUrl) {
        throw new Error(t('error'));
      }

      await sendAudioMessage(chatId, user.id, audioUrl, duration);
    } catch (error: any) {
      console.error('Error sending audio:', error);
      setError(error?.message || t('error'));
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

  const renderMessage = useCallback(({ item }: { item: Message | { id: string; isInitial: true } }) => {
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
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <View style={[styles.messageContainer, styles.otherMessage]}>
            <View style={[styles.messageBubble, styles.otherBubble]}>
              <Text style={[styles.messageText, styles.otherMessageText]}>
                {chat.walk_request.message}
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
            <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
              {message.content}
            </Text>
          ) : null}
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {messageTime}
          </Text>
        </View>
        {isOwnMessage && (
          <Text style={styles.messageStatus}>
            {message.read ? t('read') : t('sent')}
          </Text>
        )}
      </View>
    );
  }, [user, chat, t]);

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
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
          </TouchableOpacity>

          {preloadedUserName ? (
            <Text style={styles.headerTitle}>{preloadedUserName}</Text>
          ) : (
            <View style={{ flex: 1 }}>
              <ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
            </View>
          )}

          <View style={styles.iconButton}>
            <MoreVertical size={24} color="transparent" />
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => {
            if (chat.walk_request?.walk?.id) {
              router.push(`/event/${chat.walk_request.walk.id}`);
            } else {
              router.push(`/user/${otherUser.id}`);
            }
          }}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chat.walk_request?.walk?.title || otherUser.display_name}
          </Text>
          {chat.walk_request?.walk && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {otherUser.display_name}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowOptionsMenu(true)}
        >
          <MoreVertical size={20} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>
      </View>

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
                <ImageIcon size={22} color={COLORS.TEXT_LIGHT} />
              )}
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={t('message')}
                placeholderTextColor={COLORS.TEXT_LIGHT}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={MAX_MESSAGE_LENGTH}
                editable={!uploading}
              />
            </View>

            {newMessage.trim() ? (
              <TouchableOpacity
                style={styles.sendIconButton}
                onPress={sendMessage}
                disabled={uploading}
              >
                <View style={styles.sendIconCircle}>
                  <ChevronLeft 
                    size={20} 
                    color={COLORS.WHITE} 
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.inputIconButton}
                onPress={() => setIsRecording(true)}
                disabled={uploading}
              >
                <Mic size={22} color={COLORS.TEXT_LIGHT} />
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
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateBadge: {
    backgroundColor: COLORS.BG_SECONDARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '75%',
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
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
    backgroundColor: COLORS.BG_SECONDARY,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: COLORS.WHITE,
  },
  otherMessageText: {
    color: COLORS.TEXT_DARK,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageStatus: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    marginTop: 4,
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_COLOR,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BG_SECONDARY,
    borderRadius: 20,
    paddingHorizontal: 14,
    marginHorizontal: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.TEXT_DARK,
    paddingVertical: 10,
  },
  inputIconButton: {
    padding: 8,
    alignSelf: 'center',
  },
  sendIconButton: {
    padding: 4,
    alignSelf: 'center',
  },
  sendIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.ACCENT_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
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
  optionsMenu: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 'auto',
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  optionButton: {
    paddingVertical: 18,
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
    backgroundColor: COLORS.BORDER_COLOR,
  },
});
