import { useCallback } from 'react';
import { sendMessage } from '@shared/lib/api';
import { uploadChatImage, uploadChatAudio, uploadChatImages } from '@shared/utils/upload';
import type { Message } from '@shared/lib/api';
import type { ImagePreview } from './useImagePicker';

type MessageWithPending = Message & { isPending?: boolean };

interface UseSendMessageProps {
  chatId: string;
  userId: string | undefined;
  setMessages: React.Dispatch<React.SetStateAction<MessageWithPending[]>>;
  setError: (error: string | null) => void;
  t: (key: string) => string;
}

export function useSendMessage({
  chatId,
  userId,
  setMessages,
  setError,
  t,
}: UseSendMessageProps) {
  
  const createOptimisticMessage = useCallback((
    content: string,
    imageUrls?: string[] | null,
    audioUrl?: string | null,
    audioDuration?: number | null
  ): MessageWithPending => {
    return {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: userId!,
      content,
      created_at: new Date().toISOString(),
      read: false,
      image_urls: imageUrls || null,
      audio_url: audioUrl || null,
      audio_duration: audioDuration || null,
      isPending: true,
    };
  }, [chatId, userId]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!userId || !text.trim()) return;

    const messageContent = text.trim();
    const optimisticMessage = createOptimisticMessage(messageContent);

    setMessages(prev => [optimisticMessage, ...prev]);
    setError(null);

    try {
      await sendMessage(chatId, userId, messageContent);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error?.message || t('error'));
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      throw error;
    }
  }, [userId, chatId, createOptimisticMessage, setMessages, setError, t]);

  const sendImagesWithCaption = useCallback(async (
    images: ImagePreview[],
    caption: string
  ) => {
    if (!userId || images.length === 0) return;

    const assets = images.map(p => p.asset);
    const localUris = images.map(p => p.uri);
    const optimisticMessage = createOptimisticMessage(caption, localUris);

    setMessages(prev => [optimisticMessage, ...prev]);
    setError(null);

    try {
      const imageUrls = await uploadChatImages(chatId, assets);

      if (!imageUrls || imageUrls.length === 0) {
        throw new Error(t('errorUploadingImages'));
      }

      await sendMessage(chatId, userId, caption, undefined, undefined, imageUrls);
    } catch (error: any) {
      console.error('Error sending images:', error);
      setError(error?.message || t('errorUploadingImages'));
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      throw error;
    }
  }, [userId, chatId, createOptimisticMessage, setMessages, setError, t]);

  const sendAudioMessage = useCallback(async (audioUri: string, duration: number) => {
    if (!userId) return;

    const optimisticMessage = createOptimisticMessage('', null, audioUri, duration);

    setMessages(prev => [optimisticMessage, ...prev]);
    setError(null);

    try {
      const audioUrl = await uploadChatAudio(chatId, audioUri, userId);

      if (!audioUrl) {
        throw new Error(t('errorUploadingAudio'));
      }

      await sendMessage(chatId, userId, '', audioUrl, duration);
    } catch (error: any) {
      console.error('Error sending audio:', error);
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      
      if (error?.message?.includes('Bucket not found')) {
        setError('Audio bucket not configured. Please contact support.');
      } else {
        setError(error?.message || t('error'));
      }
      throw error;
    }
  }, [userId, chatId, createOptimisticMessage, setMessages, setError, t]);

  return {
    sendTextMessage,
    sendImagesWithCaption,
    sendAudioMessage,
  };
}
