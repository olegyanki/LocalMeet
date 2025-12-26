import React, { useRef, useEffect, useState } from 'react';
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
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, Clock, Timer } from 'lucide-react-native';
import { useI18n } from '@shared/i18n';

const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
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
  const [sliderValue, setSliderValue] = useState(parseFloat(selectedDuration));

  useEffect(() => {
    setSliderValue(parseFloat(selectedDuration));
  }, [selectedDuration]);

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

  const formatDuration = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    
    if (minutes === 0) {
      return `${hours} ${t('hoursShort')} 00 ${t('minutes')}`;
    }
    return `${hours} ${t('hoursShort')} ${minutes} ${t('minutes')}`;
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    onDurationChange(value.toString());
  };

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

          <View style={styles.pickerContent}>
            <View style={styles.card}>
              <View style={styles.labelRow}>
                <Clock size={20} color={ACCENT_ORANGE} />
                <Text style={styles.pickerLabel}>{t('startTime')}</Text>
              </View>
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

            <View style={styles.card}>
              <View style={styles.labelRow}>
                <Timer size={20} color={ACCENT_ORANGE} />
                <Text style={styles.pickerLabel}>{t('howLongWalk')}</Text>
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.durationValue}>{formatDuration(sliderValue)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={6}
                  step={0.5}
                  value={sliderValue}
                  onValueChange={handleSliderChange}
                  minimumTrackTintColor={ACCENT_ORANGE}
                  maximumTrackTintColor={BORDER_COLOR}
                  thumbTintColor="#FFFFFF"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>30{t('minutes')}</Text>
                  <Text style={styles.sliderLabel}>6{t('hoursShort')}</Text>
                </View>
              </View>
            </View>
          </View>

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
    paddingVertical: 12,
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
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  pickerContent: {
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  timePickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  sliderContainer: {
    paddingVertical: 4,
  },
  durationValue: {
    fontSize: 28,
    fontWeight: '700',
    color: ACCENT_ORANGE,
    textAlign: 'center',
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
    minWidth: 200,
  },
  slider: {
    width: '100%',
    height: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  pickerFooter: {
    padding: 16,
    paddingBottom: 24,
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
