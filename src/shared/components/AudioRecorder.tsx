import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, ChevronLeft } from 'lucide-react-native';
import { COLORS, SHADOW } from '@shared/constants';
import { useI18n } from '@shared/i18n';

// Global flag to prevent multiple recordings
let isRecordingGlobally = false;

interface AudioRecorderProps {
  onSend: (audioUri: string, duration: number) => void;
  onCancel: () => void;
  isCancelled?: boolean;
  shouldStop?: boolean;
}

export default function AudioRecorder({ onSend, onCancel, isCancelled = false, shouldStop = false }: AudioRecorderProps) {
  const { t } = useI18n();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStoppedRef = useRef(false);
  
  // Waveform animation
  const waveAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(4))
  ).current;
  
  // Pulsing dot animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  


  useEffect(() => {
    hasStoppedRef.current = false; // Reset on mount
    setRecordingDuration(0); // Reset duration
    
    // Wait a bit to ensure previous recording is cleaned up
    const initTimer = setTimeout(() => {
      startRecording();
      startWaveformAnimation();
      startPulseAnimation();
    }, 100);

    return () => {
      console.log('AudioRecorder unmounting, cleaning up');
      clearTimeout(initTimer);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Clean up recording on unmount
      if (recording && !hasStoppedRef.current) {
        console.log('Cleaning up recording on unmount');
        recording.stopAndUnloadAsync().catch(err => {
          console.log('Error stopping recording on unmount:', err);
        });
      }
      
      // Always reset audio mode and global flag
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      }).catch(err => {
        console.log('Error resetting audio mode on unmount:', err);
      });
      
      isRecordingGlobally = false;
    };
  }, []);

  // Handle stop signal from parent
  useEffect(() => {
    if (shouldStop && !hasStoppedRef.current && recording) {
      console.log('shouldStop triggered, isCancelled:', isCancelled);
      stopRecording(!isCancelled);
    }
  }, [shouldStop, isCancelled, recording]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveformAnimation = () => {
    const animations = waveAnims.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 16,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 4,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ])
      );
    });

    animations.forEach((anim, index) => {
      setTimeout(() => anim.start(), index * 50);
    });
  };

  const startRecording = async () => {
    try {
      // Check global flag first
      if (isRecordingGlobally) {
        console.log('Another recording is already in progress globally, aborting');
        onCancel();
        return;
      }

      // Clean up any existing recording first
      if (recording) {
        console.log('Cleaning up existing recording before starting new one');
        try {
          const status = await recording.getStatusAsync();
          if (status.canRecord || status.isRecording || status.isDoneRecording === false) {
            await recording.stopAndUnloadAsync();
          }
        } catch (err) {
          console.log('Error cleaning up old recording:', err);
          // Try to unload anyway
          try {
            await recording.stopAndUnloadAsync();
          } catch (e) {
            console.log('Could not unload:', e);
          }
        }
        setRecording(null);
      }

      // Reset audio mode to ensure clean state
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
        // Small delay to ensure mode is reset
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        console.log('Error resetting audio mode:', err);
      }

      if (permissionResponse?.status !== 'granted') {
        const permission = await requestPermission();
        if (!permission.granted) {
          alert('Permission to access microphone is required!');
          onCancel();
          return;
        }
      }

      // Set global flag before starting
      isRecordingGlobally = true;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);

      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      isRecordingGlobally = false;
      onCancel();
    }
  };

  const stopRecording = async (shouldSend: boolean) => {
    if (!recording || hasStoppedRef.current) return;
    
    hasStoppedRef.current = true;
    console.log('stopRecording called:', { shouldSend, duration: recordingDuration });

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const status = await recording.getStatusAsync();
      console.log('Recording status:', status);
      
      // Only stop if recording is still active
      if (status.isRecording || status.isDoneRecording === false) {
        await recording.stopAndUnloadAsync();
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log('Recording URI:', uri);

      if (shouldSend && uri && recordingDuration > 0) {
        console.log('Calling onSend with:', { uri, duration: recordingDuration });
        onSend(uri, recordingDuration);
      } else {
        console.log('Calling onCancel, shouldSend:', shouldSend, 'uri:', uri, 'duration:', recordingDuration);
        onCancel();
      }

      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecording(null);
      onCancel();
    } finally {
      // Always reset global flag
      isRecordingGlobally = false;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Pulsing Record Dot */}
      <Animated.View
        style={[
          styles.recordingDot,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Timer */}
      <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>

      {/* Waveform Visualizer */}
      <View style={styles.waveformContainer}>
        {waveAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveBar,
              {
                height: anim,
              },
            ]}
          />
        ))}
      </View>

      {/* Slide to Cancel */}
      <View style={styles.cancelHint}>
        <ChevronLeft size={14} color={COLORS.TEXT_LIGHT} />
        <Text style={styles.cancelText}>
          {t('slideToCancel')}
        </Text>
      </View>

      {/* Microphone Icon */}
      <View style={styles.micIcon}>
        <Mic size={24} color={COLORS.ACCENT_ORANGE} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...SHADOW.standard,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.ERROR_RED,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    minWidth: 40,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 24,
    paddingHorizontal: 8,
  },
  waveBar: {
    width: 3,
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 2,
  },
  cancelHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
  },
  micIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
});
