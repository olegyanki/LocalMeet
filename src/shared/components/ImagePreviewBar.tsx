import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { COLORS, SHADOW } from '@shared/constants';

export interface ImagePreview {
  uri: string;
  asset: any; // ImagePicker.ImagePickerAsset
  id: string;
}

interface ImagePreviewBarProps {
  images: ImagePreview[];
  onRemove: (imageId: string) => void;
  maxImages?: number;
}

export default function ImagePreviewBar({ 
  images, 
  onRemove, 
  maxImages = 10 
}: ImagePreviewBarProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {images.map((image) => (
        <View key={image.id} style={styles.thumbnailWrapper}>
          <Image
            source={{ uri: image.uri }}
            style={styles.thumbnail}
            contentFit="cover"
            cachePolicy="memory"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(image.id)}
            activeOpacity={0.7}
          >
            <X size={16} color={COLORS.TEXT_LIGHT} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const THUMBNAIL_SIZE = 56;
const THUMBNAIL_GAP = 8;

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: THUMBNAIL_GAP,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginRight: THUMBNAIL_GAP,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.elevated,
  },
});
