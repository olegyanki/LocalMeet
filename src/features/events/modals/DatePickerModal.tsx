import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD format
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

export default function DatePickerModal({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
}: DatePickerModalProps) {
  const { t } = useI18n();
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date();
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 100;
        const velocity = gestureState.vy;

        if (gestureState.dy > threshold || velocity > 0.5) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  React.useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      slideAnim.setValue(Dimensions.get('window').height);
    }
  }, [visible]);

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        day: prevMonthDay.getDate(),
        isCurrentMonth: false,
        date: prevMonthDay,
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Add days from next month to fill the grid
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      days.push({
        day: nextMonthDay.getDate(),
        isCurrentMonth: false,
        date: nextMonthDay,
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onDateSelect(dateString);
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    const [year, month, day] = selectedDate.split('-').map(Number);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          ) : (
            <View style={styles.androidBackdrop} />
          )}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [
                { translateY: Animated.add(slideAnim, panY) }
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('selectEventDate')}</Text>
            <TouchableOpacity onPress={() => {
              if (selectedDate) {
                handleClose();
              }
            }} style={styles.headerButton}>
              <Text style={[styles.nextText, !selectedDate && styles.disabledText]}>
                {t('next')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{getMonthName(currentMonth)}</Text>
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth('prev')}
                >
                  <ChevronLeft size={20} color={COLORS.TEXT_LIGHT} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth('next')}
                >
                  <ChevronRight size={20} color={COLORS.TEXT_LIGHT} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.weekDaysHeader}>
              {weekDays.map((day) => (
                <Text key={day} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendar}>
              {days.map((dayInfo, index) => {
                const isSelected = isDateSelected(dayInfo.date);
                const isTodayDate = isToday(dayInfo.date);
                const isPast = isPastDate(dayInfo.date);
                const isDisabled = isPast && !isTodayDate;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      isSelected && styles.selectedDay,
                      isTodayDate && !isSelected && styles.todayDay,
                    ]}
                    onPress={() => !isDisabled && handleDateSelect(dayInfo.date)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !dayInfo.isCurrentMonth && styles.otherMonthText,
                        isSelected && styles.selectedDayText,
                        isTodayDate && !isSelected && styles.todayDayText,
                        isDisabled && styles.disabledDayText,
                      ]}
                    >
                      {dayInfo.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: COLORS.CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    width: '100%',
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
  headerButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  nextText: {
    fontSize: 16,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '700',
    textAlign: 'right',
  },
  disabledText: {
    color: COLORS.TEXT_LIGHT,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  monthNavigation: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: 4,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedDay: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 20,
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  todayDay: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.ACCENT_ORANGE,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  selectedDayText: {
    color: COLORS.WHITE,
    fontWeight: '700',
  },
  todayDayText: {
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '600',
  },
  otherMonthText: {
    color: COLORS.TEXT_LIGHT,
    opacity: 0.5,
  },
  disabledDayText: {
    color: COLORS.TEXT_LIGHT,
    opacity: 0.3,
  },
});