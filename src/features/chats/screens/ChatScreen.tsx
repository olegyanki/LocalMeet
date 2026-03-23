import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { leaveChat } from '@shared/lib/api';
import ImagePreviewBar from '@shared/components/ImagePreviewBar';
import { COLORS } from '@shared/constants';

import {
  ChatHeader,
  ChatMessage,
  ChatInput,
  ImageViewerModal,
  DeleteChatModal,
} from '../components';

import {
  useChatData,
  useChatMessages,
  useImagePicker,
  useSendMessage,
} from '../hooks';

import { getDateLabel, shouldShowDateSeparator } from '../utils/messageHelpers';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_IMAGES = 10;

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  
  const flatListRef = useRef<FlatList>(null);
  const messageTextRef = useRef<string>('');

  // State
  const [newMessage, setNewMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Image viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Custom hooks
  const {
    chat,
    messages,
    setMessages,
    loading,
    loadingMore,
    error,
    setError,
    loadMoreMessages,
  } = useChatData(chatId, user?.id);

  useChatMessages({ chatId, userId: user?.id, setMessages });

  const {
    selectedImages,
    setSelectedImages,
    captionText,
    setCaptionText,
    pickImages,
    removeImage,
    clearImages,
  } = useImagePicker({
    maxImages: MAX_IMAGES,
    onError: (key) => setError(t(key as any)),
    newMessage,
    setNewMessage,
    messageTextRef,
  });

  const {
    sendTextMessage,
    sendImagesWithCaption,
    sendAudioMessage,
  } = useSendMessage({
    chatId,
    userId: user?.id,
    setMessages,
    setError,
    t: t as any,
  });

  // Derived state
  const isGroupChat = chat?.type === 'group';
  const currentUserParticipant = chat?.participants.find(p => p.user_id === user?.id);
  const isOwner = currentUserParticipant?.role === 'owner';
  const otherParticipants = chat?.participants.filter(p => p.user_id !== user?.id) || [];
  const otherUser = !isGroupChat && otherParticipants.length > 0 
    ? otherParticipants[0].profile 
    : null;

  // Handlers
  const handleTextChange = useCallback((text: string) => {
    if (selectedImages.length > 0) {
      setCaptionText(text);
    } else {
      setNewMessage(text);
      messageTextRef.current = text;
    }
  }, [selectedImages.length, setCaptionText]);

  const handleSendMessage = useCallback(async () => {
    try {
      if (selectedImages.length > 0) {
        const imagesToSend = selectedImages;
        const captionToSend = captionText.trim();
        
        // Clear preview bar immediately
        clearImages();
        
        // Send images in background
        await sendImagesWithCaption(imagesToSend, captionToSend);
      } else if (messageTextRef.current.trim()) {
        await sendTextMessage(messageTextRef.current);
        setNewMessage('');
        messageTextRef.current = '';
      }
    } catch (error) {
      // Error already handled in useSendMessage
    }
  }, [selectedImages, captionText, sendImagesWithCaption, sendTextMessage, clearImages]);

  const handleSendAudio = useCallback(async (audioUri: string, duration: number) => {
    try {
      await sendAudioMessage(audioUri, duration);
      setIsRecording(false);
    } catch (error) {
      // Error already handled
    }
  }, [sendAudioMessage]);

  const handleDeleteChat = useCallback(async () => {
    if (!chatId || deleting || !user) return;

    if (isGroupChat && isOwner) {
      setError(t('ownerCannotLeaveChat'));
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await leaveChat(chatId, user.id);
      setShowDeleteModal(false);
      router.back();
    } catch (error: any) {
      console.error('Error leaving chat:', error);
      setError(error?.message || t('error'));
      setDeleting(false);
    }
  }, [chatId, deleting, router, t, isGroupChat, user, isOwner]);

  const handleImagePress = useCallback((images: string[], index: number) => {
    setViewerImages(images);
    setViewerIndex(index);
    setViewerVisible(true);
  }, []);

  const renderMessage = useCallback(({ item, index }: { item: any, index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const isLastMessage = index === messages.length - 1;
    const nextMessage = messages[index + 1];
    
    const showDateSeparator = shouldShowDateSeparator(item, nextMessage, isLastMessage);
    const dateLabel = showDateSeparator ? getDateLabel(new Date(item.created_at), t as any) : '';

    return (
      <ChatMessage
        message={item}
        isOwnMessage={isOwnMessage}
        isGroupChat={isGroupChat}
        showDateSeparator={showDateSeparator}
        dateLabel={dateLabel}
        onImagePress={handleImagePress}
        t={t as any}
      />
    );
  }, [user, messages, isGroupChat, handleImagePress, t]);

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
      <ChatHeader
        chat={chat}
        isGroupChat={isGroupChat}
        isOwner={isOwner}
        otherUser={otherUser}
        showOptionsMenu={showOptionsMenu}
        setShowOptionsMenu={setShowOptionsMenu}
        setShowDeleteModal={setShowDeleteModal}
        paddingTop={insets.top + 12}
        t={t as any}
        locale={locale}
      />

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
        data={messages}
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

      {selectedImages.length > 0 && (
        <View style={styles.previewBarContainer}>
          <ImagePreviewBar
            images={selectedImages}
            onRemove={removeImage}
            maxImages={MAX_IMAGES}
          />
        </View>
      )}

      <ChatInput
        value={selectedImages.length > 0 ? captionText : newMessage}
        onChangeText={handleTextChange}
        onSendText={handleSendMessage}
        onSendAudio={handleSendAudio}
        onPickImages={pickImages}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
        hasImages={selectedImages.length > 0}
        placeholder={selectedImages.length > 0 ? t('addCaption') : t('message')}
        maxLength={MAX_MESSAGE_LENGTH}
        paddingBottom={insets.bottom + 8}
      />

      <DeleteChatModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteChat}
        isDeleting={deleting}
        t={t as any}
      />

      <ImageViewerModal
        visible={viewerVisible}
        images={viewerImages}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />
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
  previewBarContainer: {
    backgroundColor: COLORS.BG_SECONDARY,
  },
});
