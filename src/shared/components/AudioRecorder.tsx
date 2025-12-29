import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, X, Send } from 'lucide-react-native';
import { COLORS } from '@shared/constants';

const { ACCENT_ORANGE, TEXT_DARK, TEXT_LIGHT } = COLORS;

interface AudioRecorderProps {
  onSend: (audioUri: string, duration: number) => void;
  onCancel: () => void;
}

export default function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startRecording();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        const permission = await requestPermission();
        if (!permission.granted) {
          alert('Permission to access microphone is required!');
          onCancel();
          return;
        }
      }

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
      onCancel();
    }
  };

  const stopRecording = async (shouldSend: boolean) => {
    if (!recording) return;

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();

      if (shouldSend && uri) {
        onSend(uri, recordingDuration);
      } else {
        onCancel();
      }

      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      onCancel();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => stopRecording(false)}
      >
        <X size={24} color={TEXT_LIGHT} />
      </TouchableOpacity>

      <View style={styles.recordingInfo}>
        <View style={styles.recordingDot} />
        <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
      </View>

      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => stopRecording(true)}
      >
        <Send size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BG_SECONDARY,
    borderRadius: 24,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ERROR_RED,
  },
  duration: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
