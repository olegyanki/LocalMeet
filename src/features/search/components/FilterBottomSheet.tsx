import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  PanResponder,
} from 'react-native';

// Contexts & Hooks
import { useI18n } from '@shared/i18n';

// Components
import Chip from '@shared/components/Chip';

// Constants
import { COLORS, SIZES } from '@shared/constants';

export type TimeFilter = 'all' | 'started' | 'today' | 'tomorrow';
export type SortBy = 'distance' | 'date';

interface FilterBottomSheetProps {
  visible: boolean;
  selectedFilter: TimeFilter;
  sortBy: SortBy;
  onFilterChange: (filter: TimeFilter) => void;
  onSortChange: (sort: SortBy) => void;
  onClose: () => void;
}

const FILTERS = [
  { id: 'all' as TimeFilter, label: 'all' },
  { id: 'started' as TimeFilter, label: 'started' },
  { id: 'today' as TimeFilter, label: 'today' },
  { id: 'tomorrow' as TimeFilter, label: 'tomorrow' },
];

export default function FilterBottomSheet({
  visible,
  selectedFilter,
  sortBy,
  onFilterChange,
  onSortChange,
  onClose,
}: FilterBottomSheetProps) {
  const translateY = useRef(new Animated.Value(400)).current;
  const { t } = useI18n();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy >= 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 400,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onClose());
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
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('time')}</Text>
            <View style={styles.filtersContainer}>
              {FILTERS.map((filter) => (
                <Chip
                  key={filter.id}
                  label={t(filter.label as any)}
                  isActive={selectedFilter === filter.id}
                  onPress={() => {
                    onFilterChange(filter.id);
                    setTimeout(onClose, 150);
                  }}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sorting')}</Text>
            <View style={styles.sortContainer}>
              <Chip
                label={t('byDistance')}
                isActive={sortBy === 'distance'}
                onPress={() => onSortChange('distance')}
              />
              <Chip
                label={t('byDate')}
                isActive={sortBy === 'date'}
                onPress={() => onSortChange('date')}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: SIZES.HANDLE_WIDTH,
    height: SIZES.HANDLE_HEIGHT,
    backgroundColor: COLORS.BORDER_COLOR,
    borderRadius: 2,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER_COLOR,
    marginVertical: 24,
    marginHorizontal: 24,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
