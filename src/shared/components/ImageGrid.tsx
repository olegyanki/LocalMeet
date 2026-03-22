import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import CachedImage from './CachedImage';
import { COLORS } from '@shared/constants';

interface ImageGridProps {
  images: string[];
  maxWidth: number;
  onImagePress?: (images: string[], index: number) => void;
  hasCaption?: boolean;
}

export default function ImageGrid({ images, maxWidth, onImagePress, hasCaption = false }: ImageGridProps) {
  if (!images || images.length === 0) {
    return null;
  }

  const layout = calculateGridLayout(images.length, maxWidth);
  const displayImages = images.slice(0, 4); // Show max 4 images
  const remainingCount = images.length - 4;

  const handleImagePress = (index: number) => {
    if (onImagePress) {
      onImagePress(images, index);
    }
  };

  const cornerRadius = 20;

  // Single image - apply border radius based on caption
  if (images.length === 1) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleImagePress(0)}
        style={{ 
          overflow: 'hidden', 
          borderTopLeftRadius: cornerRadius,
          borderTopRightRadius: cornerRadius,
          borderBottomLeftRadius: hasCaption ? 0 : cornerRadius,
          borderBottomRightRadius: hasCaption ? 0 : cornerRadius,
        }}
      >
        <CachedImage
          uri={images[0]}
          style={{ ...styles.image, ...layout.imageStyle }}
          contentFit="cover"
          borderRadius={0}
        />
      </TouchableOpacity>
    );
  }

  // 2-3 images - horizontal row
  if (images.length === 2 || images.length === 3) {
    return (
      <View style={styles.rowContainer}>
        {images.map((uri, index) => {
          // First image gets top-left corner, last image gets top-right corner
          let borderRadiusStyle = {};
          if (index === 0) {
            borderRadiusStyle = {
              borderTopLeftRadius: cornerRadius,
              borderBottomLeftRadius: hasCaption ? 0 : cornerRadius,
            };
          } else if (index === images.length - 1) {
            borderRadiusStyle = {
              borderTopRightRadius: cornerRadius,
              borderBottomRightRadius: hasCaption ? 0 : cornerRadius,
            };
          }

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => handleImagePress(index)}
              style={{ overflow: 'hidden', ...borderRadiusStyle }}
            >
              <CachedImage
                uri={uri}
                style={{ ...styles.image, ...layout.imageStyle }}
                contentFit="cover"
                borderRadius={0}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // 4+ images - 2x2 grid
  return (
    <View style={styles.gridContainer}>
      <View style={styles.gridRow}>
        {/* Top-left image */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(0)}
          style={{ overflow: 'hidden', borderTopLeftRadius: cornerRadius }}
        >
          <CachedImage
            uri={displayImages[0]}
            style={{ ...styles.image, ...layout.imageStyle }}
            contentFit="cover"
            borderRadius={0}
          />
        </TouchableOpacity>
        {/* Top-right image */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(1)}
          style={{ overflow: 'hidden', borderTopRightRadius: cornerRadius }}
        >
          <CachedImage
            uri={displayImages[1]}
            style={{ ...styles.image, ...layout.imageStyle }}
            contentFit="cover"
            borderRadius={0}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.gridRow}>
        {/* Bottom-left image */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(2)}
          style={{ overflow: 'hidden', borderBottomLeftRadius: hasCaption ? 0 : cornerRadius }}
        >
          <CachedImage
            uri={displayImages[2]}
            style={{ ...styles.image, ...layout.imageStyle }}
            contentFit="cover"
            borderRadius={0}
          />
        </TouchableOpacity>
        {/* Bottom-right image */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(3)}
          style={[styles.lastImageContainer, { overflow: 'hidden', borderBottomRightRadius: hasCaption ? 0 : cornerRadius }]}
        >
          <CachedImage
            uri={displayImages[3]}
            style={{ ...styles.image, ...layout.imageStyle }}
            contentFit="cover"
            borderRadius={0}
          />
          {remainingCount > 0 && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>+{remainingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Layout algorithm for image grid
function calculateGridLayout(count: number, maxWidth: number) {
  const GAP = 2; // Gap between images (reduced from 4px to 2px)

  if (count === 1) {
    return {
      imageStyle: {
        width: maxWidth,
        height: maxWidth,
      },
    };
  }

  if (count === 2) {
    return {
      imageStyle: {
        width: (maxWidth - GAP) / 2,
        height: (maxWidth - GAP) / 2,
      },
    };
  }

  if (count === 3) {
    return {
      imageStyle: {
        width: (maxWidth - GAP * 2) / 3,
        height: (maxWidth - GAP * 2) / 3,
      },
    };
  }

  // 4+ images: 2x2 grid
  return {
    imageStyle: {
      width: (maxWidth - GAP) / 2,
      height: (maxWidth - GAP) / 2,
    },
  };
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.BG_SECONDARY,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  gridContainer: {
    gap: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 2,
  },
  lastImageContainer: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: '700',
  },
});
