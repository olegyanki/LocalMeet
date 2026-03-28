import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Mic, Plus } from 'lucide-react-native';

import AudioRecorder from '@shared/components/AudioRecorder';
import { COLORS, SHADOW } from '@shared/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CANCEL_THRESHOLD = -SCREEN_WIDTH * 0.6; // 60% of screen width
const LOCK_THRESHOLD = -SCREEN_HEIGHT * 0.2; // 20% of screen height (negative because swipe up)

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSendText: () => void;
  onSendAudio: (uri: string, duration: number) => void;
  onPickImages: () => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  hasImages: boolean;
  placeholder: string;
  maxLength: number;
  paddingBottom: number;
}

export default function ChatInput({
  value,
  onChangeText,
  onSendText,
  onSendAudio,
  onPickImages,
  isRecording,
  setIsRecording,
  hasImages,
  placeholder,
  maxLength,
  paddingBottom,
}: ChatInputProps) {
  const inputRef = useRef<TextInput>(null);
  const buttonColorAnim = useRef(new Animated.Value(0)).current; // 0 = orange, 1 = red
  const buttonScaleAnim = useRef(new Animated.Value(2)).current; // Scale for button in AudioRecorder
  const recorderOpacity = useRef(new Animated.Value(0)).current; // Opacity for recorder appearance
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [shouldStopRecording, setShouldStopRecording] = useState(false);
  const hasReachedThreshold = useRef(false); // Track if we've already vibrated for threshold
  const [isLocked, setIsLocked] = useState(false); // Track if recording is locked (hands-free)
  const isStartingRecording = useRef(false); // Prevent multiple simultaneous starts
  const pressStartTime = useRef<number>(0); // Track when press started
  const isRecordingRef = useRef(isRecording); // Ref to track current recording state
  
  // Keep ref in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Reset shouldStop and slideAnim when recording starts or stops
  useEffect(() => {
    if (isRecording) {
      setShouldStopRecording(false);
      buttonColorAnim.setValue(0); // Reset to orange
      buttonScaleAnim.setValue(2); // Start at 2x
      hasReachedThreshold.current = false;
      setIsLocked(false);
      isStartingRecording.current = false;
      
      // Animate recorder appearance (fade-in only)
      recorderOpacity.setValue(0);
      Animated.timing(recorderOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      buttonColorAnim.setValue(0); // Reset to orange
      buttonScaleAnim.setValue(2); // Reset to 2x
      recorderOpacity.setValue(0); // Reset opacity
      hasReachedThreshold.current = false;
      setIsLocked(false);
      isStartingRecording.current = false;
      setShouldStopRecording(false);
      setIsCancelled(false);
    }
  }, [isRecording, buttonColorAnim, buttonScaleAnim, recorderOpacity]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      // Only capture if touching the mic button area and no text/images
      if (hasImages || value.trim()) return false;
      return true;
    },
    onMoveShouldSetPanResponder: () => isRecording,
    
    onPanResponderGrant: () => {
      if (isStartingRecording.current || isRecordingRef.current) {
        return;
      }
      
      if (!hasImages && !value.trim()) {
        setIsCancelled(false);
        isStartingRecording.current = true;
        pressStartTime.current = Date.now();
        
        longPressTimer.current = setTimeout(() => {
          setIsRecording(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 150);
      }
    },
    
    onPanResponderMove: (_, gestureState) => {
      if (isRecordingRef.current && !isLocked) {
        if (gestureState.dy < LOCK_THRESHOLD) {
          setIsLocked(true);
          // Reset color to orange (no animation needed, instant is fine)
          buttonColorAnim.setValue(0);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return;
        }
        
        // Determine primary swipe direction
        const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        
        if (isVerticalSwipe && gestureState.dy < 0) {
          // Handle vertical swipe (for lock gesture) - scale button up
          // Calculate scale based on vertical distance
          // 0 = 2x (normal), LOCK_THRESHOLD = 2.5x (max scale)
          const scaleProgress = Math.min(Math.abs(gestureState.dy) / Math.abs(LOCK_THRESHOLD), 1);
          const newScale = 2 + (scaleProgress * 0.5); // From 2 to 2.5
          buttonScaleAnim.setValue(newScale);
          // Keep color orange
          buttonColorAnim.setValue(0);
        } else if (!isVerticalSwipe && gestureState.dx < 0) {
          // Handle horizontal swipe (for cancel gesture) - scale button up and change color
          // Calculate scale based on horizontal distance
          const scaleProgress = Math.min(Math.abs(gestureState.dx) / Math.abs(CANCEL_THRESHOLD), 1);
          const newScale = 2 + (scaleProgress * 0.5); // From 2 to 2.5
          buttonScaleAnim.setValue(newScale);
          
          // Interpolate color based on slide distance
          // 0 = orange (at start), 1 = red (at cancel threshold)
          buttonColorAnim.setValue(scaleProgress);
          
          if (gestureState.dx < CANCEL_THRESHOLD && !hasReachedThreshold.current) {
            hasReachedThreshold.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          
          if (gestureState.dx < CANCEL_THRESHOLD && !isCancelled) {
            setIsCancelled(true);
            setShouldStopRecording(true);
          }
        } else if (gestureState.dx > 0) {
          // Swiping back to the right - reset color and scale to normal
          buttonColorAnim.setValue(0);
          buttonScaleAnim.setValue(2);
        }
      }
    },
    
    onPanResponderRelease: (_, gestureState) => {
      const pressDuration = Date.now() - pressStartTime.current;
      const currentlyRecording = isRecordingRef.current;
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        
        if (pressDuration < 150) {
          isStartingRecording.current = false;
          pressStartTime.current = 0;
          return;
        }
        
        if (!currentlyRecording && isStartingRecording.current) {
          setTimeout(() => {
            if (isRecordingRef.current) {
              setIsCancelled(false);
              setShouldStopRecording(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
              isStartingRecording.current = false;
            }
            pressStartTime.current = 0;
          }, 100);
          return;
        }
      }
      
      if (isLocked) {
        return;
      }
      
      if (currentlyRecording) {
        if (gestureState.dx < CANCEL_THRESHOLD) {
          setIsCancelled(true);
          setShouldStopRecording(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          setIsCancelled(false);
          setShouldStopRecording(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
      
      pressStartTime.current = 0;
    },
    
    onPanResponderTerminate: () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      
      isStartingRecording.current = false;
      pressStartTime.current = 0;
      if (isRecordingRef.current) {
        setIsCancelled(true);
        setShouldStopRecording(true);
      }
      slideAnim.setValue(0);
    },
  });

  return (
    <View style={[styles.container, { paddingBottom }]}>
      <View 
        style={styles.inputContainer}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.inputIconButton}
          onPress={onPickImages}
        >
          <Plus size={30} color={COLORS.TEXT_LIGHT} strokeWidth={1.5} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={COLORS.TEXT_LIGHT + '80'}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSendText}
            multiline
            maxLength={maxLength}
          />
        </View>

        <View
          style={styles.sendIconButton}
        >
          <TouchableOpacity
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => {
              if (hasImages || value.trim()) {
                setTimeout(onSendText, 0);
              }
            }}
            disabled={!hasImages && !value.trim()}
          >
            {hasImages || value.trim() ? (
              <ChevronLeft 
                size={30} 
                color={COLORS.ACCENT_ORANGE} 
                strokeWidth={2}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            ) : (
              <Mic size={24} color={COLORS.TEXT_LIGHT} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Audio recorder overlay - covers the input area */}
      {isRecording && (
        <Animated.View 
          style={[
            styles.recorderOverlay,
            isCancelled && styles.recorderHidden,
            {
              opacity: recorderOpacity,
            },
          ]} 
          pointerEvents="box-none"
        >
          <AudioRecorder
            onSend={(uri, duration) => {
              onSendAudio(uri, duration);
              setIsRecording(false);
            }}
            onCancel={() => {
              setIsRecording(false);
            }}
            onStopClick={() => {
              setIsCancelled(false);
              setShouldStopRecording(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            isCancelled={isCancelled}
            shouldStop={shouldStopRecording}
            buttonColorAnim={buttonColorAnim}
            buttonScaleAnim={buttonScaleAnim}
            isLocked={isLocked}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BG_SECONDARY,
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 24,
    paddingHorizontal: 16,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
    ...SHADOW.standard,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    paddingVertical: 12,
  },
  inputIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  sendIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  recorderOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 8,
  },
  recorderHidden: {
    opacity: 0,
  },
});
