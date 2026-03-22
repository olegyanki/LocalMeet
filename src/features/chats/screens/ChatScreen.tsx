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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, MoreVertical, Mic, Plus, Users, Trash2, User, Info } from 'lucide-react-native';

import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { getDisplayName } from '@shared/utils/profile';
import { 
  sendMessage, // New unified function for both group and direct chats
  getChatMessages, // Updated to work with new schema
  getChatDetails, // New function for getting chat details
  markChatAsRead, // New function for marking messages as read
  leaveChat, // New function for leaving chats
  Message,
  ChatWithDetails, // New interface for group chat system
} from '@shared/lib/api';
import { supabase } from '@shared/lib/supabase';
import { uploadChatImage, uploadChatAudio } from '@shared/utils/upload';
import { getPluralSuffix } from '@shared/utils/pluralization';

import AudioRecorder from '@shared/components/AudioRecorder';
import AudioPlayer from '@shared/components/AudioPlayer';
import Avatar from '@shared/components/Avatar';
import CachedImage from '@shared/components/CachedImage';

import { COLORS, SHADOW } from '@shared/constants';

const MAX_MESSAGE_LENGTH = 1000;

// Extended message type with pending state
type MessageWithPending = Message & { isPending?: boolean };

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const messageTextRef = useRef<string>('');

  const [chat, setChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithPending[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const handleTextChange = useCallback((text: string) => {
    setNewMessage(text);
    messageTextRef.current = text;
  }, []);

  // Determine if this is a group chat and get relevant info
  const isGroupChat = chat?.type === 'group';
  const currentUserParticipant = chat?.participants.find(p => p.user_id === user?.id);
  const isOwner = currentUserParticipant?.role === 'owner';
  const otherParticipants = chat?.participants.filter(p => p.user_id !== user?.id) || [];
  
  // For direct chats, get the other participant
  const otherUser = !isGroupChat && otherParticipants.length > 0 
    ? otherParticipants[0].profile 
    : null;

  useEffect(() => {
    loadChatData();
    const unsubscribe = subscribeToMessages();
    
    return () => {
      unsubscribe();
    };
  }, [chatId]);

  const loadChatData = async () => {
    if (!user) return;
    
    try {
      const [chatData, messagesData] = await Promise.all([
        getChatDetails(chatId, user.id),
        getChatMessages(chatId, 50), // Load last 50 messages
      ]);

      if (chatData) {
        setChat(chatData);
      }

      setMessages(messagesData);
      setHasMoreMessages(messagesData.length === 50); // If we got 50, there might be more

      // Mark messages as read
      await markChatAsRead(chatId, user.id);
    } catch (error) {
      console.error('Error loading chat:', error);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages) return;

    try {
      setLoadingMore(true);
      const offset = messages.length;
      const olderMessages = await getChatMessages(chatId, 50, offset);

      if (olderMessages.length > 0) {
        setMessages(prev => [...prev, ...olderMessages]);
        setHasMoreMessages(olderMessages.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
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

            // If this is from current user and we have optimistic message
            if (newMsg.sender_id === user?.id) {
              const optimisticIndex = prev.findIndex(m => m.id.toString().startsWith('temp-'));
              
              if (optimisticIndex !== -1) {
                // Update only isPending flag in place
                const updated = [...prev];
                updated[optimisticIndex] = {
                  ...updated[optimisticIndex],
                  isPending: false,
                };
                return updated;
              }
            }

            // Add new message at the beginning (DESC order - newest first)
            return [newMsg, ...prev];
          });

          if (newMsg.sender_id !== user?.id && user) {
            markChatAsRead(chatId, user.id);
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
    setUploading(true);

    // Create optimistic message with local image URI
    const optimisticMessage: MessageWithPending = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: user.id,
      content: '',
      created_at: new Date().toISOString(),
      read: false,
      image_url: asset.uri, // Use local URI temporarily
      audio_url: null,
      audio_duration: null,
      isPending: true,
    };

    // Add optimistic message immediately
    setMessages(prev => [optimisticMessage, ...prev]);

    try {
      const imageUrl = await uploadChatImage(chatId, asset);

      if (!imageUrl) {
        throw new Error(t('error'));
      }

      await sendMessage(chatId, user.id, '', imageUrl);
      // Real message will come via real-time subscription
    } catch (error: any) {
      console.error('Error sending image:', error);
      setError(error?.message || t('error'));
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    } finally {
      setUploading(false);
    }
  }, [user, chatId, t]);

  const sendTextMessage = useCallback(async () => {
    if (!user) return;

    // Get current value from ref
    const currentText = messageTextRef.current;
    
    if (!currentText.trim()) return;

    const messageContent = currentText.trim();
    
    // Clear input immediately
    setNewMessage('');
    messageTextRef.current = '';
    inputRef.current?.clear();
    
    setError(null);

    // Create optimistic message
    const optimisticMessage: MessageWithPending = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      read: false,
      image_url: null,
      audio_url: null,
      audio_duration: null,
      isPending: true,
    };

    setMessages(prev => [optimisticMessage, ...prev]);

    try {
      await sendMessage(chatId, user.id, messageContent);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error?.message || t('error'));
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(messageContent);
      messageTextRef.current = messageContent;
    }
  }, [user, chatId, t]);

  const handleSendAudioMessage = useCallback(async (audioUri: string, duration: number) => {
    if (!user) return;

    setError(null);
    setIsRecording(false);
    setUploading(true);

    // Create optimistic message with local audio URI
    const optimisticMessage: MessageWithPending = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: user.id,
      content: '',
      created_at: new Date().toISOString(),
      read: false,
      image_url: null,
      audio_url: audioUri, // Use local URI temporarily
      audio_duration: duration,
      isPending: true,
    };

    // Add optimistic message immediately
    setMessages(prev => [optimisticMessage, ...prev]);

    try {
      const audioUrl = await uploadChatAudio(chatId, audioUri, user.id);

      if (!audioUrl) {
        throw new Error(t('errorUploadingAudio'));
      }

      await sendMessage(chatId, user.id, '', undefined, audioUrl, duration);
      // Real message will come via real-time subscription
    } catch (error: any) {
      console.error('Error sending audio:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      
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
    if (!chatId || deleting || !user) return;

    // Prevent owner from leaving group chat
    if (isGroupChat && isOwner) {
      setError(t('ownerCannotLeaveChat'));
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // For group chats, leave the chat instead of deleting it
      // For direct chats, we can still use the old delete function if available
      if (isGroupChat) {
        await leaveChat(chatId, user.id);
      } else {
        // For direct chats, leaving also works
        await leaveChat(chatId, user.id);
      }
      
      setShowDeleteModal(false);
      router.back();
    } catch (error: any) {
      console.error('Error leaving chat:', error);
      setError(error?.message || t('error'));
      setDeleting(false);
    }
  }, [chatId, deleting, router, t, isGroupChat, user, isOwner]);

  // For group chats, we don't show initial messages since the chat is created when the event is created
  // For direct chats, we also don't need initial messages since they're created when requests are accepted
  const allMessages = messages;

  // API returns messages in DESC order (newest first), perfect for inverted FlatList
  const displayMessages = allMessages;

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

  const renderMessage = useCallback(({ item, index }: { item: MessageWithPending, index: number }) => {
    const message = item;
    const isOwnMessage = message.sender_id === user?.id;
    const messageTime = new Date(message.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Show date separator - for inverted list, check next message (index + 1)
    let showDateSeparator = false;
    if (index === displayMessages.length - 1) {
      // Last message in inverted list (oldest message) - always show date
      showDateSeparator = true;
    } else if (displayMessages[index + 1]) {
      const nextMessage = displayMessages[index + 1];
      showDateSeparator = new Date(message.created_at).toDateString() !== 
        new Date(nextMessage.created_at).toDateString();
    }

    const dateLabel = showDateSeparator ? getDateLabel(new Date(message.created_at)) : '';

    // Get sender info from message.sender profile or from participants
    const senderProfile = message.sender || 
      chat?.participants.find(p => p.user_id === message.sender_id)?.profile;
    
    const senderName = getDisplayName(senderProfile) || t('unknown');
    const senderAvatar = senderProfile?.avatar_url;

    return (
      <>
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          {!isOwnMessage && (
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => {
                if (message.sender_id && message.sender_id !== user?.id) {
                  router.push(`/user/${message.sender_id}`);
                }
              }}
              activeOpacity={0.7}
            >
              <Avatar
                uri={senderAvatar}
                size={32}
                name={senderName}
              />
            </TouchableOpacity>
          )}
          <View style={[styles.messageContent, isOwnMessage && styles.ownMessageContent]}>
            {!isOwnMessage && isGroupChat && (
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
                <CachedImage
                  uri={message.image_url}
                  style={styles.messageImage}
                  contentFit="cover"
                  borderRadius={12}
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
                <View style={styles.messageStatusContainer}>
                  {message.isPending ? (
                    <ActivityIndicator 
                      size={12} 
                      color={COLORS.WHITE} 
                      style={{ width: 12, height: 12 }} 
                    />
                  ) : (
                    <Text style={styles.messageStatus}>
                      {message.read ? '✓✓' : '✓'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
        {showDateSeparator && (
          <View style={styles.dateContainer}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{dateLabel}</Text>
            </View>
          </View>
        )}
      </>
    );
  }, [user, chat, isGroupChat, displayMessages, getDateLabel, t]);

  if (loading || !chat) {
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
          {isGroupChat ? (
            chat.walk_image_url ? (
              <CachedImage
                uri={chat.walk_image_url}
                style={styles.headerEventImage}
                contentFit="cover"
                borderRadius={12}
                showShimmer={false}
              />
            ) : (
              <View style={styles.headerGroupIcon}>
                <Users size={20} color={COLORS.ACCENT_ORANGE} />
              </View>
            )
          ) : (
            <Avatar
              uri={otherUser?.avatar_url}
              size={40}
              name={getDisplayName(otherUser) || ''}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => {
            if (isGroupChat && chat.walk_id) {
              router.push(`/event-details/${chat.walk_id}`);
            } else if (otherUser) {
              router.push(`/user/${otherUser.id}`);
            }
          }}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isGroupChat ? (chat.walk_title || t('groupChat')) : (getDisplayName(otherUser) || t('unknown'))}
          </Text>
          {isGroupChat && (
            <Text style={styles.headerSubtitle}>
              {t(`participantsCount${getPluralSuffix(chat.participants.length, locale)}` as any, { count: chat.participants.length })}
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
              {isGroupChat && chat.walk_id && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      router.push(`/event-details/${chat.walk_id}`);
                    }}
                  >
                    <Info size={20} color={COLORS.TEXT_LIGHT} />
                    <Text style={styles.dropdownOptionText}>{t('eventInfo')}</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                </>
              )}

              {isGroupChat && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      if (chat.walk_id) {
                        // Navigate to EventParticipantsScreen instead of showing modal
                        const hostParticipant = chat.participants.find(p => p.role === 'owner');
                        if (hostParticipant) {
                          router.push(`/event-participants/${chat.walk_id}?hostId=${hostParticipant.user_id}`);
                        }
                      }
                    }}
                  >
                    <Users size={20} color={COLORS.TEXT_LIGHT} />
                    <Text style={styles.dropdownOptionText}>{t('participants')}</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                </>
              )}

              {!isGroupChat && otherUser && (
                <>
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
                </>
              )}

              {/* Show leave/delete option only if not owner of group chat */}
              {!(isGroupChat && isOwner) && (
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 size={20} color={COLORS.ERROR_RED} />
                  <Text style={[styles.dropdownOptionText, styles.dropdownOptionTextDelete]}>
                    {isGroupChat ? t('leaveChat') : t('deleteChat')}
                  </Text>
                </TouchableOpacity>
              )}
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
        data={displayMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
            </View>
          ) : null
        }
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={21}
        removeClippedSubviews={true}
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
                ref={inputRef}
                style={styles.input}
                placeholder={t('message')}
                placeholderTextColor={COLORS.TEXT_LIGHT + '80'}
                value={newMessage}
                onChangeText={handleTextChange}
                onSubmitEditing={sendTextMessage}
                blurOnSubmit={false}
                multiline
                maxLength={MAX_MESSAGE_LENGTH}
                editable={!uploading}
              />
            </View>

            <TouchableOpacity
              style={styles.sendIconButton}
              onPress={() => {
                if (newMessage.trim()) {
                  // Use setTimeout to let React update state after autocorrect
                  setTimeout(sendTextMessage, 0);
                } else {
                  setIsRecording(true);
                }
              }}
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
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
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
  messageStatusContainer: {
    width: 20,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
