import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check } from 'lucide-react-native';
import { useI18n } from '@shared/i18n';

const TEXT_DARK = '#333333';
const BORDER_COLOR = '#E8E8E8';
const SUCCESS_GREEN = '#4CAF50';

interface TimePickerModalProps {
  visible: boolean;
  selectedTime: Date;
  selectedDuration: string;
  onTimeChange: (event: any, date?: Date) => void;
  onDurationChange: (duration: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function TimePickerModal({
  visible,
  selectedTime,
  selectedDuration,
  onTimeChange,
  onDurationChange,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const { t } = useI18n();
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy >= 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(500);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      setTimeout(() => {
        translateY.setValue(500);
      }, 250);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.bottomSheetModal,
            {
              transform: [{ translateY }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <Animated.View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.handle} />
          </Animated.View>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View {...panResponder.panHandlers} style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('whenStartsActivity')}</Text>
            </Animated.View>
          </TouchableWithoutFeedback>

          <Animated.View {...panResponder.panHandlers} style={styles.pickerContent}>
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>{t('startTime')}</Text>
              <View style={styles.timePickerWrapper}>
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={onTimeChange}
                  textColor={TEXT_DARK}
                  locale="uk-UA"
                />
              </View>
            </View>

            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>{t('howLongWalk')}</Text>
              <View style={styles.durationOptions}>
                {['1', '2', '3', '4', '5', '6'].map((duration) => (
                  <Pressable
                    key={duration}
                    style={[
                      styles.durationOption,
                      selectedDuration === duration && styles.durationOptionSelected,
                    ]}
                    onPress={() => onDurationChange(duration)}
                  >
                    <Text
                      style={[
                        styles.durationOptionText,
                        selectedDuration === duration && styles.durationOptionTextSelected,
                      ]}
                    >
                      {duration}г
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View {...panResponder.panHandlers} style={styles.pickerFooter}>
            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: '#D1D1D1',
    borderRadius: 3,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  pickerContent: {
    padding: 24,
    maxHeight: 500,
  },
  pickerSection: {
    marginBottom: 32,
  },
  pickerLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 16,
  },
  timePickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 70,
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  durationOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  durationOptionTextSelected: {
    color: '#FFFFFF',
  },
  pickerFooter: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    backgroundColor: '#FFFFFF',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS_GREEN,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
