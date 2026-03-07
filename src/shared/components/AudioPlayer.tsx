import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { COLORS } from '@shared/constants';

interface AudioPlayerProps {
  audioUrl: string;
  duration: number;
  isOwnMessage: boolean;
}

export default function AudioPlayer({ audioUrl, duration, isOwnMessage }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [sound]);

  // Animate progress smoothly
  useEffect(() => {
    if (isPlaying && sound) {
      const startAnimation = async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          const currentPosition = status.positionMillis;
          const totalDuration = duration * 1000;
          const remainingTime = totalDuration - currentPosition;

          // Stop any existing animation
          if (animationRef.current) {
            animationRef.current.stop();
          }

          // Animate from current position to end
          animationRef.current = Animated.timing(progressAnim, {
            toValue: totalDuration,
            duration: remainingTime,
            useNativeDriver: false,
          });

          animationRef.current.start();
        }
      };

      startAnimation();
    } else {
      // Pause animation
      if (animationRef.current) {
        animationRef.current.stop();
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isPlaying, sound, duration, progressAnim]);

  // Update position for display
  useEffect(() => {
    const listener = progressAnim.addListener(({ value }) => {
      setPosition(value);
    });

    return () => {
      progressAnim.removeListener(listener);
    };
  }, [progressAnim]);

  const loadAndPlayAudio = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            if (status.positionMillis >= status.durationMillis! - 100) {
              await sound.setPositionAsync(0);
              setPosition(0);
              progressAnim.setValue(0);
            }
            await sound.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }

      setIsLoading(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = async (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        progressAnim.setValue(0);
        if (sound) {
          await sound.setPositionAsync(0);
        }
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, duration * 1000],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.playButton,
          isOwnMessage ? styles.playButtonOwn : styles.playButtonOther,
        ]}
        onPress={loadAndPlayAudio}
        disabled={isLoading}
      >
        {isPlaying ? (
          <Pause size={20} color={isOwnMessage ? COLORS.WHITE : COLORS.ACCENT_ORANGE} fill={isOwnMessage ? COLORS.WHITE : COLORS.ACCENT_ORANGE} />
        ) : (
          <Play size={20} color={isOwnMessage ? COLORS.WHITE : COLORS.ACCENT_ORANGE} fill={isOwnMessage ? COLORS.WHITE : COLORS.ACCENT_ORANGE} />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <View style={styles.waveformBackground}>
          <Animated.View
            style={[
              styles.waveformProgress,
              {
                width: progressWidth,
                backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.5)' : COLORS.ACCENT_ORANGE,
              },
            ]}
          />
        </View>
        <Text style={[styles.duration, isOwnMessage && styles.durationOwn]}>
          {formatTime(position || 0)} / {formatTime(duration * 1000)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOwn: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonOther: {
    backgroundColor: COLORS.BG_SECONDARY,
  },
  waveformContainer: {
    flex: 1,
    gap: 4,
  },
  waveformBackground: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  waveformProgress: {
    height: '100%',
    borderRadius: 1.5,
  },
  duration: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  durationOwn: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
