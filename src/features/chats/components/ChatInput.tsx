import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Mic, Plus } from 'lucide-react-native';

import AudioRecorder from '@shared/components/AudioRecorder';
import { COLORS, SHADOW } from '@shared/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CANCEL_THRESHOLD = -SCREEN_WIDTH * 0.6; // 60% of screen width

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
  const slideAnim = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [shouldStopRecording, setShouldStopRecording] = useState(false);
  const hasReachedThreshold = useRef(false); // Track if we've already vibrated for threshold

  // Reset shouldStop and slideAnim when recording starts or stops
  useEffect(() => {
    if (isRecording) {
      setShouldStopRecording(false);
      slideAnim.setValue(0);
      hasReachedThreshold.current = false; // Reset threshold flag
    } else {
      // Reset animation immediately when recording stops (without animation)
      slideAnim.setValue(0);
      hasReachedThreshold.current = false;
    }
  }, [isRecording, slideAnim]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      // Only capture if touching the mic button area and no text/images
      if (hasImages || value.trim()) return false;
      
      // Check if touch is in the mic button area (right side)
      const touchX = evt.nativeEvent.locationX;
      const touchY = evt.nativeEvent.locationY;
      console.log('onStartShouldSetPanResponder, touch:', { touchX, touchY });
      return true;
    },
    onMoveShouldSetPanResponder: () => isRecording,
    
    onPanResponderGrant: () => {
      console.log('onPanResponderGrant, hasImages:', hasImages, 'value:', value.trim());
      if (!hasImages && !value.trim()) {
        setIsCancelled(false);
        
        longPressTimer.current = setTimeout(() => {
          console.log('Long press timer - starting recording');
          setIsRecording(true);
          // Vibrate when recording starts
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 150);
      }
    },
    
    onPanResponderMove: (_, gestureState) => {
      if (isRecording && gestureState.dx < 0) {
        // Animate button position with finger
        slideAnim.setValue(gestureState.dx);
        
        // Vibrate when reaching cancel threshold (only once)
        if (gestureState.dx < CANCEL_THRESHOLD && !hasReachedThreshold.current) {
          hasReachedThreshold.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        // Close audio recording if sliding 70% of screen width
        if (gestureState.dx < CANCEL_THRESHOLD && !isCancelled) {
          console.log('Sliding left - closing audio recording, dx:', gestureState.dx, 'threshold:', CANCEL_THRESHOLD);
          setIsCancelled(true);
          setShouldStopRecording(true);
        }
      }
    },
    
    onPanResponderRelease: (_, gestureState) => {
      console.log('onPanResponderRelease, isRecording:', isRecording, 'dx:', gestureState.dx, 'isCancelled:', isCancelled);
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        
        // If timer was still running, it means it was a quick tap, not a long press
        if (!isRecording) {
          console.log('Quick tap detected, not starting recording');
          return;
        }
      }
      
      if (isRecording) {
        if (gestureState.dx < CANCEL_THRESHOLD) {
          // Cancelled by sliding left 70% of screen
          console.log('Release - cancelled by slide, dx:', gestureState.dx, 'threshold:', CANCEL_THRESHOLD);
          setIsCancelled(true);
          setShouldStopRecording(true);
          // Vibrate for cancellation
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          // Send recording by releasing
          console.log('Release - sending recording, dx:', gestureState.dx);
          setIsCancelled(false);
          setShouldStopRecording(true);
          // Vibrate for success
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    
    onPanResponderTerminate: () => {
      console.log('onPanResponderTerminate');
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (isRecording) {
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
        <View 
          style={[
            styles.recorderOverlay,
            isCancelled && styles.recorderHidden,
          ]} 
          pointerEvents="box-none"
        >
          <AudioRecorder
            onSend={(uri, duration) => {
              console.log('AudioRecorder onSend called');
              onSendAudio(uri, duration);
              setIsRecording(false);
            }}
            onCancel={() => {
              console.log('AudioRecorder onCancel called');
              setIsRecording(false);
            }}
            isCancelled={isCancelled}
            shouldStop={shouldStopRecording}
            slideAnim={slideAnim}
          />
        </View>
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
