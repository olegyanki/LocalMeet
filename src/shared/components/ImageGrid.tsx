import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import CachedImage from './CachedImage';
import { COLORS } from '@shared/constants';

interface ImageGridProps {
  images: string[];
  maxWidth: number;
  onImagePress?: (images: string[], index: number) => void;
}

export default function ImageGrid({ images, maxWidth, onImagePress }: ImageGridProps) {
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

  // Single image - square layout
  if (images.length === 1) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleImagePress(0)}
      >
        <CachedImage
          uri={images[0]}
          style={{ ...styles.image, ...layout.imageStyle }}
          contentFit="cover"
          borderRadius={8}
        />
      </TouchableOpacity>
    );
  }

  // 2-3 images - horizontal row
  if (images.length === 2 || images.length === 3) {
    return (
      <View style={styles.rowContainer}>
        {images.map((uri, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            onPress={() => handleImagePress(index)}
          >
            <CachedImage
              uri={uri}
              style={{ ...styles.image, ...layout.imageStyle }}
              contentFit="cover"
              borderRadius={8}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // 4+ images - 2x2 grid
  return (
    <View style={styles.gridContainer}>
      <View style={styles.gridRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(0)}
        >
          <CachedImage
            uri={displayImages[0]}
            style={{ ...styles.image, ...layout.imageStyle }}
            contentFit="cover"
            borderRadius={8}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(1)}
        >
          <CachedImage
            uri={displayImages[1]}
            style={{ ...styles.image, ...layout.imageStyle }}
            contentFit="cover"
            borderRadius={8}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.gridRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(2)}
        >
          <CachedImage
            uri={displayImages[2]}
            style={{ ...styles.image, ...layout.imageStyle }}
            contentFit="cover"
            borderRadius={8}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleImagePress(3)}
          style={styles.lastImageContainer}
        >
          <CachedImage
            uri={displayImages[3]}
            style={{ ...styles.image, ...layout.imageStyle }}
            contentFit="cover"
            borderRadius={8}
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
  const GAP = 4; // Gap between images

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
    gap: 4,
  },
  gridContainer: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
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
    borderRadius: 8,
  },
  overlayText: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: '700',
  },
});
