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
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';

interface TimePickerModalProps {
  visible: boolean;
  selectedTime: Date;
  selectedDate: string;
  selectedDuration: string;
  onTimeChange: (event: any, date?: Date) => void;
  onDurationChange: (duration: string) => void;
  onConfirm: (time: Date) => void;
  onClose: () => void;
}

export default function TimePickerModal({
  visible,
  selectedTime,
  selectedDate,
  selectedDuration,
  onTimeChange,
  onDurationChange,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const { t } = useI18n();
  const translateY = useRef(new Animated.Value(0)).current;
  const [sliderValue, setSliderValue] = useState(parseFloat(selectedDuration));
  const [tempTime, setTempTime] = useState(selectedTime);

  useEffect(() => {
    const duration = parseFloat(selectedDuration);
    setSliderValue(duration);
  }, [selectedDuration]);

  useEffect(() => {
    if (visible) {
      setTempTime(selectedTime);
    }
  }, [visible, selectedTime]);

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

  // Map slider position (0-4) to actual duration values
  const sliderToDuration = (sliderPos: number): number => {
    const durations = [0.5, 1, 2, 4, 8];
    return durations[sliderPos];
  };

  // Map duration value to slider position (0-4)
  const durationToSlider = (duration: number): number => {
    const durations = [0.5, 1, 2, 4, 8];
    const index = durations.findIndex(d => d === duration);
    return index !== -1 ? index : 0;
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const handleSliderChange = (sliderPos: number) => {
    const duration = sliderToDuration(sliderPos);
    setSliderValue(duration);
    onDurationChange(duration.toString());
  };

  const handleConfirm = () => {
    onTimeChange(null, tempTime);
    onConfirm(tempTime);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.bottomSheetModal,
            {
              transform: [{ translateY }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle */}
          <Animated.View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.handle} />
          </Animated.View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('time')} & {t('duration')}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.doneButton}>{t('done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Start Time Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('startTime')}</Text>
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    const now = new Date();
                    const today = now.toISOString().split('T')[0];
                    
                    // If selected date is today, check if time is in the past
                    if (selectedDate === today) {
                      const selectedDateTime = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        date.getHours(),
                        date.getMinutes()
                      );
                      
                      if (selectedDateTime < now) {
                        setTempTime(now);
                      } else {
                        setTempTime(date);
                      }
                    } else {
                      // If selected date is not today, any time is valid
                      setTempTime(date);
                    }
                  }
                }}
                textColor={COLORS.TEXT_DARK}
                style={styles.timePicker}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Duration Section */}
            <View style={styles.section}>
              <View style={styles.durationHeader}>
                <Text style={styles.sectionTitle}>{t('duration')}</Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationBadgeText}>{formatDuration(sliderValue)}</Text>
                </View>
              </View>
              
              <View style={styles.sliderContainer}>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={4}
                    step={1}
                    value={durationToSlider(sliderValue)}
                    onValueChange={handleSliderChange}
                    minimumTrackTintColor={COLORS.ACCENT_ORANGE}
                    maximumTrackTintColor={COLORS.BORDER_COLOR}
                    thumbTintColor={COLORS.WHITE}
                  />
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>30m</Text>
                  <Text style={styles.sliderLabel}>1h</Text>
                  <Text style={styles.sliderLabel}>2h</Text>
                  <Text style={styles.sliderLabel}>4h</Text>
                  <Text style={styles.sliderLabel}>8h+</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetModal: {
    backgroundColor: COLORS.CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: COLORS.BORDER_COLOR,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ACCENT_ORANGE,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    paddingVertical: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  timePicker: {
    alignSelf: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER_COLOR,
    marginHorizontal: -24,
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  durationBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ACCENT_ORANGE,
  },
  sliderContainer: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  sliderWrapper: {
    position: 'relative',
    height: 32,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
  },
});