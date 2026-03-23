import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

export interface ImagePreview {
  uri: string;
  asset: ImagePicker.ImagePickerAsset;
  id: string;
}

interface UseImagePickerProps {
  maxImages: number;
  onError: (error: string) => void;
  newMessage: string;
  setNewMessage: (text: string) => void;
  messageTextRef: React.MutableRefObject<string>;
}

export function useImagePicker({
  maxImages,
  onError,
  newMessage,
  setNewMessage,
  messageTextRef,
}: UseImagePickerProps) {
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [captionText, setCaptionText] = useState('');

  const pickImages = useCallback(async () => {
    if (selectedImages.length >= maxImages) {
      onError('maxImagesReached');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        onError('permissionDeniedMessage');
        return;
      }

      const remainingSlots = maxImages - selectedImages.length;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newPreviews: ImagePreview[] = result.assets.map(asset => ({
          uri: asset.uri,
          asset,
          id: `preview-${Date.now()}-${Math.random()}`,
        }));

        if (selectedImages.length === 0 && newMessage.trim()) {
          setCaptionText(newMessage);
          setNewMessage('');
          messageTextRef.current = '';
        }

        setSelectedImages(prev => [...prev, ...newPreviews]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      onError('error');
    }
  }, [selectedImages, maxImages, newMessage, onError, setNewMessage, messageTextRef]);

  const removeImage = useCallback((imageId: string) => {
    setSelectedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      
      if (updated.length === 0 && captionText.trim()) {
        setNewMessage(captionText);
        messageTextRef.current = captionText;
        setCaptionText('');
      }
      
      return updated;
    });
  }, [captionText, setNewMessage, messageTextRef]);

  const clearImages = useCallback(() => {
    setSelectedImages([]);
    setCaptionText('');
  }, []);

  return {
    selectedImages,
    setSelectedImages,
    captionText,
    setCaptionText,
    pickImages,
    removeImage,
    clearImages,
  };
}
