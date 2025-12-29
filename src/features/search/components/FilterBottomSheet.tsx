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

import { COLORS } from '@shared/constants';
import { useI18n } from '@shared/i18n';

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
  const translateY = useRef(new Animated.Value(300)).current;
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
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 300,
            duration: 200,
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
        toValue: 300,
        duration: 200,
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
                <Pressable
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter.id && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    onFilterChange(filter.id);
                    setTimeout(onClose, 150);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === filter.id && styles.filterChipTextActive,
                    ]}
                  >
                    {t(filter.label as any)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sorting')}</Text>
            <View style={styles.sortContainer}>
              <Pressable
                style={[
                  styles.sortOption,
                  sortBy === 'distance' && styles.sortOptionActive,
                ]}
                onPress={() => onSortChange('distance')}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === 'distance' && styles.sortOptionTextActive,
                  ]}
                >
                  {t('byDistance')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sortOption,
                  sortBy === 'date' && styles.sortOptionActive,
                ]}
                onPress={() => onSortChange('date')}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === 'date' && styles.sortOptionTextActive,
                  ]}
                >
                  {t('byDate')}
                </Text>
              </Pressable>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.BG_SECONDARY,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.BORDER_COLOR,
    borderRadius: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.CARD_BG,
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  filterChipTextActive: {
    color: WHITE,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.CARD_BG,
    alignItems: 'center',
    shadowColor: BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sortOptionActive: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  sortOptionTextActive: {
    color: WHITE,
  },
});
