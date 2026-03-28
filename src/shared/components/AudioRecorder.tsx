import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS } from '@shared/constants';
import { useI18n } from '@shared/i18n';

// Global state to prevent multiple recordings
let isRecordingGlobally = false;
let globalRecordingInstance: Audio.Recording | null = null;
let cleanupPromise: Promise<void> | null = null;

interface AudioRecorderProps {
  onSend: (audioUri: string, duration: number) => void;
  onCancel: () => void;
  onStopClick: () => void;
  isCancelled?: boolean;
  shouldStop?: boolean;
  buttonColorAnim: Animated.Value;
  buttonScaleAnim: Animated.Value;
  isLocked: boolean;
  exitAnim: Animated.Value;
}

export default function AudioRecorder({ onSend, onCancel, onStopClick, isCancelled = false, shouldStop = false, buttonColorAnim, buttonScaleAnim, isLocked, exitAnim }: AudioRecorderProps) {
  const { t } = useI18n();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStoppedRef = useRef(false);
  
  // Waveform animation
  const waveAnims = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(4))
  ).current;
  
  // Pulsing dot animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Lock mode animations
  const lockModeOpacity = useRef(new Animated.Value(0)).current;
  const normalModeOpacity = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);
  const prevIsLocked = useRef(false);
  
  // Component visibility animation
  const componentOpacity = useRef(new Animated.Value(1)).current;
  const componentScale = useRef(new Animated.Value(1)).current;
  
  // Left section opacity (independent from buttonColorAnim)
  const leftSectionAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    hasStoppedRef.current = false;
    setRecordingDuration(0);
    
    let mounted = true;
    let initTimer: ReturnType<typeof setTimeout> | null = null;
    
    const init = async () => {
      if (cleanupPromise) {
        try {
          await cleanupPromise;
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      if (!mounted) return;
      
      startRecording();
      startWaveformAnimation();
      startPulseAnimation();
    };
    
    init();

    return () => {
      mounted = false;
      
      if (initTimer) {
        clearTimeout(initTimer);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      cleanupPromise = (async () => {
        try {
          const recordingToClean = recording || globalRecordingInstance;
          if (recordingToClean && !hasStoppedRef.current) {
            try {
              const status = await recordingToClean.getStatusAsync();
              if (status.canRecord || status.isRecording || status.isDoneRecording === false) {
                await recordingToClean.stopAndUnloadAsync();
              }
            } catch (err) {
              try {
                await recordingToClean.stopAndUnloadAsync();
              } catch (e) {
                // Ignore
              }
            }
          }
          
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
          });
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          // Ignore cleanup errors
        } finally {
          isRecordingGlobally = false;
          globalRecordingInstance = null;
        }
      })();
    };
  }, []);

  // Handle stop signal from parent
  useEffect(() => {
    if (shouldStop && !hasStoppedRef.current && recording) {
      if (isCancelled) {
        setTimeout(() => stopRecording(false), 220);
      } else {
        stopRecording(true);
      }
    }
  }, [shouldStop, isCancelled, recording]);
  
  useEffect(() => {
    if (isCancelled) {
      Animated.parallel([
        Animated.timing(exitAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(leftSectionAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCancelled, exitAnim, leftSectionAnim]);

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
      const heights = [10, 6, 14, 8, 12, 4, 10, 8, 12, 6];
      
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: heights[index],
            duration: 400 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 4,
            duration: 400 + Math.random() * 200,
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
      if (isRecordingGlobally) {
        onCancel();
        return;
      }

      const existingRecording = recording || globalRecordingInstance;
      if (existingRecording) {
        try {
          const status = await existingRecording.getStatusAsync();
          if (status.canRecord || status.isRecording || status.isDoneRecording === false) {
            await existingRecording.stopAndUnloadAsync();
          }
        } catch (err) {
          try {
            await existingRecording.stopAndUnloadAsync();
          } catch (e) {
            // Ignore
          }
        }
        setRecording(null);
        globalRecordingInstance = null;
      }

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        // Ignore
      }

      if (permissionResponse?.status !== 'granted') {
        const permission = await requestPermission();
        if (!permission.granted) {
          alert('Permission to access microphone is required!');
          onCancel();
          return;
        }
      }

      isRecordingGlobally = true;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      globalRecordingInstance = newRecording;

      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      isRecordingGlobally = false;
      globalRecordingInstance = null;
      onCancel();
    }
  };

  const stopRecording = async (shouldSend: boolean) => {
    if (!recording || hasStoppedRef.current) return;
    hasStoppedRef.current = true;

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const status = await recording.getStatusAsync();
      if (status.isRecording || status.isDoneRecording === false) {
        await recording.stopAndUnloadAsync();
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      if (shouldSend && uri && recordingDuration > 0) {
        onSend(uri, recordingDuration);
      } else {
        onCancel();
      }
      setRecording(null);
      globalRecordingInstance = null;
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecording(null);
      globalRecordingInstance = null;
      onCancel();
    } finally {
      isRecordingGlobally = false;
    }
  };

  const handleCancelClick = () => {
    Animated.parallel([
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(leftSectionAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => stopRecording(false));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Interpolate button color from orange to red
  const buttonBackgroundColor = buttonColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.ACCENT_ORANGE, COLORS.ERROR_RED],
  });

  // Left section fades out as swipe progresses, but also controlled directly on cancel
  const leftSectionOpacity = Animated.multiply(
    buttonColorAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.2, 0],
    }),
    leftSectionAnim
  );

  // Animate button scale and mode transition when locked state changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (prevIsLocked.current === isLocked) return;
    prevIsLocked.current = isLocked;
    if (isLocked) {
      Animated.parallel([
        Animated.spring(buttonScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(lockModeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(normalModeOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(lockModeOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(normalModeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLocked, buttonScaleAnim, lockModeOpacity, normalModeOpacity]);

  return (
    <View style={styles.container}>
      {/* Left: Recording Status and Waveform */}
      <View style={styles.leftContent}>
        <Animated.View style={[styles.leftSection, { opacity: leftSectionOpacity }]}>
          <Animated.View
            style={[
              styles.recordingDot,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
        </Animated.View>

        {/* Center: Waveform Visualizer */}
        <Animated.View style={[styles.waveformContainer, { opacity: leftSectionOpacity }]}>
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
        </Animated.View>
      </View>

      {/* Right: Action Area */}
      <View style={styles.rightSection}>
        {/* Normal mode: show slide to cancel hint */}
        <Animated.View 
          style={[
            styles.normalModeContainer,
            { 
              opacity: normalModeOpacity,
              pointerEvents: isLocked ? 'none' : 'auto',
            }
          ]}
        >
          <View style={styles.cancelHint}>
            <ChevronLeft size={14} color={COLORS.TEXT_LIGHT} strokeWidth={2} />
            <Text style={styles.cancelText}>{t('slideToCancel')}</Text>
          </View>
          
          {/* Stop Recording Button */}
          <TouchableOpacity 
            style={styles.stopButton}
            disabled={true}
          >
            <Animated.View 
              style={[
                styles.stopButtonBackground,
                {
                  backgroundColor: buttonBackgroundColor,
                  transform: [{ scale: buttonScaleAnim }],
                },
              ]}
            >
              <View style={styles.stopIcon} />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Locked mode: show cancel button and send button */}
        <Animated.View 
          style={[
            styles.lockModeContainer,
            { 
              opacity: lockModeOpacity,
              pointerEvents: isLocked ? 'auto' : 'none',
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelClick}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>
          
          {/* Send Recording Button */}
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={onStopClick}
          >
            <Animated.View
              style={[
                styles.stopButtonBackground,
                {
                  backgroundColor: COLORS.ACCENT_ORANGE,
                  transform: [{ scale: buttonScaleAnim }],
                },
              ]}
            >
              <ChevronLeft 
                size={24} 
                color={COLORS.CARD_BG} 
                strokeWidth={2}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.ERROR_RED,
    shadowColor: COLORS.ERROR_RED,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  duration: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    minWidth: 35,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 16,
    paddingHorizontal: 8,
    flex: 1,
  },
  waveBar: {
    width: 2,
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 1,
    opacity: 0.8,
  },
  rightSection: {
    position: 'relative',
    height: 40,
    width: 160,
    flexShrink: 0,
  },
  normalModeContainer: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  lockModeContainer: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.8,
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  stopIcon: {
    width: 14,
    height: 14,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 2,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    lineHeight: 18,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
