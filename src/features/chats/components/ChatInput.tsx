import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, PanResponder, Animated, Keyboard } from 'react-native';
import { ChevronLeft, Mic, Plus } from 'lucide-react-native';

import AudioRecorder from '@shared/components/AudioRecorder';
import { COLORS, SHADOW } from '@shared/constants';

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

  // Reset shouldStop when recording starts
  useEffect(() => {
    if (isRecording) {
      setShouldStopRecording(false);
    }
  }, [isRecording]);

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
        }, 150);
      }
    },
    
    onPanResponderMove: (_, gestureState) => {
      if (isRecording && gestureState.dx < 0) {
        // Don't animate button position
        
        // Close audio recording if sliding far left
        if (gestureState.dx < -80 && !isCancelled) {
          console.log('Sliding left - closing audio recording, dx:', gestureState.dx);
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
        if (gestureState.dx < -80) {
          // Cancelled by sliding left
          console.log('Release - cancelled by slide, dx:', gestureState.dx);
          setIsCancelled(true);
        } else {
          // Send recording by releasing
          console.log('Release - sending recording, dx:', gestureState.dx);
          setIsCancelled(false);
        }
        console.log('Setting shouldStopRecording to true');
        setShouldStopRecording(true);
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
        <View style={styles.recorderOverlay} pointerEvents="box-none">
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
});
