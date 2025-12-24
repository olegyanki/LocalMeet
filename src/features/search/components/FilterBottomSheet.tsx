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
  { id: 'all' as TimeFilter, label: 'Всі' },
  { id: 'started' as TimeFilter, label: 'Вже почались' },
  { id: 'today' as TimeFilter, label: 'Сьогодні' },
  { id: 'tomorrow' as TimeFilter, label: 'Завтра' },
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
            <Text style={styles.sectionTitle}>Час</Text>
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
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сортування</Text>
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
                  По відстані
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
                  По даті
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#F8F8F8',
  },
  filterChipActive: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  filterChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
  },
  sortOptionActive: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
  },
});
