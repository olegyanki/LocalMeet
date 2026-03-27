import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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

  return (
    <View style={[styles.inputContainer, { paddingBottom }]}>
      {isRecording ? (
        <AudioRecorder
          onSend={onSendAudio}
          onCancel={() => setIsRecording(false)}
        />
      ) : (
        <>
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
              blurOnSubmit={false}
              multiline
              maxLength={maxLength}
            />
          </View>

          <TouchableOpacity
            style={styles.sendIconButton}
            onPress={() => {
              if (hasImages || value.trim()) {
                setTimeout(onSendText, 0);
              } else {
                setIsRecording(true);
              }
            }}
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: COLORS.BG_SECONDARY,
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
});
