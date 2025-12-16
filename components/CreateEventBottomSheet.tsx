import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { updateWalkStatus, updateLocation } from '../lib/api';
import { Check, X, Clock, MapPin } from 'lucide-react-native';
import WebMap from './WebMap';
import NativeMap from './NativeMap';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BG_COLOR = '#F5F5F5';
const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
const INPUT_BG = '#FFFFFF';
const BORDER_COLOR = '#E8E8E8';
const SUCCESS_GREEN = '#4CAF50';

interface CreateEventBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

export default function CreateEventBottomSheet({
  visible,
  onClose,
  onEventCreated,
}: CreateEventBottomSheetProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('18');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedDuration, setSelectedDuration] = useState('2');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    name?: string;
  } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;

  useEffect(() => {
    if (visible) {
      // Скидаємо позицію перед показом
      translateY.setValue(SCREEN_HEIGHT);
      loadCurrentLocation();
      setCurrentTime();
      // Невелика затримка щоб modal встиг відрендеритись
      setTimeout(() => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }, 50);
    }
  }, [visible]);

  const setCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setSelectedHour(hours);
    setSelectedMinute(minutes);
    setTime(`${hours}:${minutes}`);
  };

  const loadCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const defaultValenciaLocation = {
          coords: {
            latitude: 39.4699,
            longitude: -0.3763,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };
        setLocation(defaultValenciaLocation);
        setSelectedLocation(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);
      setSelectedLocation(null);

      if (user) {
        await updateLocation(user.id, loc.coords.latitude, loc.coords.longitude);
      }
    } catch (err) {
      console.error('Location error:', err);
      const defaultValenciaLocation = {
        coords: {
          latitude: 39.4699,
          longitude: -0.3763,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
      setLocation(defaultValenciaLocation);
      setSelectedLocation(null);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const resetState = () => {
    setTitle('');
    setDescription('');
    setTime('');
    setError('');
    setShowTimePicker(false);
    setShowLocationPicker(false);
    setSelectedHour('18');
    setSelectedMinute('00');
    setSelectedDuration('2');
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Викликаємо onClose після завершення анімації
      resetState();
      onClose();
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Назва івенту обов\'язкова');
      return;
    }

    if (!time.trim()) {
      setError('Час початку обов\'язковий');
      return;
    }

    if (!selectedLocation) {
      setError('Оберіть локацію прогулянки на карті');
      return;
    }

    if (!description.trim()) {
      setError('Опис прогулянки обов\'язковий');
      return;
    }

    if (!user) {
      setError('Користувач не знайдений');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      await updateWalkStatus(user.id, {
        isWalking: true,
        walkTitle: title,
        walkStartTime: time,
        walkDuration: `${selectedDuration} год`,
        walkDescription: description,
        walkLatitude: selectedLocation?.latitude,
        walkLongitude: selectedLocation?.longitude,
      });

      if (onEventCreated) {
        onEventCreated();
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        closeSheet();
      }, 2000);
    } catch (err) {
      console.error('Failed to go online:', err);
      setError('Не вдалося опублікувати статус');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTimePicker = () => {
    setShowTimePicker(true);
  };

  const confirmTime = () => {
    const timeString = `${selectedHour}:${selectedMinute}`;
    setTime(timeString);
    setShowTimePicker(false);
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
        key={`modal-${visible}`}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeSheet}
          />
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                height: SHEET_HEIGHT,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.container} pointerEvents="box-none">
              <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Text style={styles.headerTitle}>Іду гуляти</Text>
                <TouchableOpacity onPress={closeSheet} style={styles.closeButton}>
                  <X size={24} color={TEXT_DARK} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={[
                  styles.content,
                  { paddingBottom: 100 + insets.bottom },
                ]}
              >
                <Text style={styles.subtitle}>
                  Розкажіть іншим коли і куди ви йдете гуляти
                </Text>

                <Text style={styles.label}>Назва івенту</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Наприклад: Прогулянка центром міста"
                  placeholderTextColor={TEXT_LIGHT}
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.label}>Коли починаєте?</Text>
                <Pressable style={styles.timeButton} onPress={openTimePicker}>
                  <Clock size={20} color={ACCENT_ORANGE} />
                  <Text style={styles.timeButtonText}>{time || 'Виберіть час'}</Text>
                </Pressable>

                <Text style={styles.label}>Локація прогулянки</Text>
                <Pressable
                  style={[
                    styles.locationButton,
                    selectedLocation && styles.locationButtonSelected,
                  ]}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <MapPin size={20} color={selectedLocation ? SUCCESS_GREEN : ACCENT_ORANGE} />
                  <Text
                    style={[
                      styles.locationButtonText,
                      selectedLocation && styles.locationButtonTextSelected,
                    ]}
                  >
                    {selectedLocation ? '✓ Локацію обрано' : 'Оберіть локацію'}
                  </Text>
                </Pressable>

                <Text style={styles.label}>Опис прогулянки</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  placeholder="Наприклад: Іду гуляти до парку Тарас Шевченко, можемо познайомитись біля фонтану"
                  placeholderTextColor={TEXT_LIGHT}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={6}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.button, isSubmitting && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Опублікувати</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setShowTimePicker(false)}
        >
          <View
            style={styles.bottomSheetModal}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Коли ви починаєте гуляти?</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.closeButton}>
                <X size={24} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>

          <View style={styles.pickerContent}>
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Час початку1</Text>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>Година</Text>
                  <ScrollView
                    style={styles.timePickerScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                      const hourStr = hour.toString().padStart(2, '0');
                      return (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timePickerItem,
                            selectedHour === hourStr && styles.timePickerItemSelected,
                          ]}
                          onPress={() => setSelectedHour(hourStr)}
                        >
                          <Text
                            style={[
                              styles.timePickerItemText,
                              selectedHour === hourStr && styles.timePickerItemTextSelected,
                            ]}
                          >
                            {hourStr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <Text style={styles.timePickerSeparator}>:</Text>
                <View style={styles.timePickerColumn}>
                  <Text style={styles.timePickerLabel}>Хвилини</Text>
                  <ScrollView
                    style={styles.timePickerScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map((minute) => {
                      const minuteStr = minute.toString().padStart(2, '0');
                      return (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.timePickerItem,
                            selectedMinute === minuteStr && styles.timePickerItemSelected,
                          ]}
                          onPress={() => setSelectedMinute(minuteStr)}
                        >
                          <Text
                            style={[
                              styles.timePickerItemText,
                              selectedMinute === minuteStr && styles.timePickerItemTextSelected,
                            ]}
                          >
                            {minuteStr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Скільки будете гуляти?</Text>
              <View style={styles.durationOptions}>
                {['1', '2', '3', '4', '5', '6'].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationOption,
                      selectedDuration === duration && styles.durationOptionSelected,
                    ]}
                    onPress={() => setSelectedDuration(duration)}
                  >
                    <Text
                      style={[
                        styles.durationOptionText,
                        selectedDuration === duration && styles.durationOptionTextSelected,
                      ]}
                    >
                      {duration}г
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

            <View style={styles.pickerFooter}>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmTime}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Підтвердити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showLocationPicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setShowLocationPicker(false)}
        >
          <View
            style={styles.bottomSheetModal}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            <View style={styles.locationPickerHeader}>
              <Text style={styles.pickerTitle}>Оберіть локацію прогулянки</Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                style={styles.closeButton}
              >
                <X size={24} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>

          {location ? (
            <View style={styles.mapWrapper}>
              {Platform.OS === 'web' ? (
                <WebMap
                  latitude={location.coords.latitude}
                  longitude={location.coords.longitude}
                  markers={[]}
                  selectedMarkerId={null}
                  onMarkerPress={() => {}}
                  onMapClick={(lat, lng) => {
                    const distance = calculateDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      lat,
                      lng
                    );
                    if (distance <= 15) {
                      setSelectedLocation({ latitude: lat, longitude: lng });
                    }
                  }}
                  radiusKm={15}
                  centerLat={location.coords.latitude}
                  centerLng={location.coords.longitude}
                />
              ) : (
                <NativeMap
                  latitude={location.coords.latitude}
                  longitude={location.coords.longitude}
                  markers={[]}
                  selectedMarkerId={null}
                  onMarkerPress={() => {}}
                  onMapPress={(lat, lng) => {
                    const distance = calculateDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      lat,
                      lng
                    );
                    if (distance <= 15) {
                      setSelectedLocation({ latitude: lat, longitude: lng });
                    }
                  }}
                  radiusKm={15}
                  centerLat={location.coords.latitude}
                  centerLng={location.coords.longitude}
                />
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ACCENT_ORANGE} />
            </View>
          )}

            <View style={styles.locationPickerFooter}>
              <Text style={styles.locationHint}>
                Натисніть на карту щоб обрати локацію (до 15 км від вас)
              </Text>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowLocationPicker(false)}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Підтвердити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Check size={48} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Ви онлайн!</Text>
            <Text style={styles.successMessage}>
              Тепер інші користувачі можуть побачити що ви гуляєте
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
  },
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_LIGHT,
    marginBottom: 32,
    lineHeight: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 10,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: TEXT_DARK,
    marginBottom: 24,
  },
  descriptionInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#F44336',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: ACCENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SUCCESS_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 15,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 22,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 10,
  },
  timeButtonText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 10,
  },
  locationButtonSelected: {
    borderColor: SUCCESS_GREEN,
    backgroundColor: '#E8F5E9',
  },
  locationButtonText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  locationButtonTextSelected: {
    color: SUCCESS_GREEN,
    fontWeight: '600',
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
  locationPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  mapWrapper: {
    height: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPickerFooter: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    backgroundColor: '#FFFFFF',
  },
  locationHint: {
    fontSize: 13,
    color: TEXT_LIGHT,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timePickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 13,
    color: TEXT_LIGHT,
    marginBottom: 12,
    fontWeight: '500',
  },
  timePickerScroll: {
    maxHeight: 180,
    width: '100%',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
  },
  timePickerItem: {
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  timePickerItemSelected: {
    backgroundColor: ACCENT_ORANGE,
  },
  timePickerItemText: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  timePickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timePickerSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 28,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationOption: {
    backgroundColor: INPUT_BG,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: ACCENT_ORANGE,
    borderColor: ACCENT_ORANGE,
  },
  durationOptionText: {
    fontSize: 17,
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
