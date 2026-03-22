import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { COLORS } from '@shared/constants';

interface CachedImageProps {
  uri: string;
  style?: ViewStyle;
  contentFit?: ImageContentFit;
  borderRadius?: number;
  showShimmer?: boolean;
}

const ImageShimmer = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 320],
  });

  return (
    <View style={styles.shimmerContainer}>
      <Animated.View
        style={[
          styles.shimmerWave,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

export default function CachedImage({
  uri,
  style,
  contentFit = 'cover',
  borderRadius = 12,
  showShimmer = true,
}: CachedImageProps) {
  return (
    <View style={[styles.container, style, { borderRadius }]}>
      {showShimmer && (
        <View style={styles.shimmerOverlay}>
          <ImageShimmer />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[styles.image, { borderRadius }]}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        transition={300}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.BG_SECONDARY,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.BG_SECONDARY,
    overflow: 'hidden',
  },
  shimmerWave: {
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-20deg' }],
  },
});
