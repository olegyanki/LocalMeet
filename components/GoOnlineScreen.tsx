import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Platform,
  PanResponder,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { updateWalkStatus } from '../lib/api';
import { Check, X, Clock, MapPin } from 'lucide-react-native';
import WebMap from './WebMap';
import NativeMap from './NativeMap';
import { router } from 'expo-router';

const BG_COLOR = '#F5F5F5';
const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
const INPUT_BG = '#FFFFFF';
const BORDER_COLOR = '#E8E8E8';
const SUCCESS_GREEN = '#4CAF50';

export default function GoOnlineScreen() {
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
  const translateY = useRef(new Animated.Value(0)).current;
  const translateYTime = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputRef = useRef<TextInput>(null);


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
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowLocationPicker(false);
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

  const panResponderTime = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy >= 0) {
          translateYTime.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateYTime, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowTimePicker(false);
          });
        } else {
          Animated.spring(translateYTime, {
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
    loadCurrentLocation();
    setCurrentTime();
  }, []);

  useEffect(() => {
    if (showLocationPicker) {
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
  }, [showLocationPicker]);

  useEffect(() => {
    if (showTimePicker) {
      translateYTime.setValue(500);
      Animated.spring(translateYTime, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      setTimeout(() => {
        translateYTime.setValue(500);
      }, 250);
    }
  }, [showTimePicker]);

  const setCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setSelectedHour(hours);
    setSelectedMinute(minutes);
    setTime(`${hours}:${minutes}`);
  };

  const loadCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        const defaultValenciaLocation: Location.LocationObject = {
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
        setSelectedLocation({
          latitude: defaultValenciaLocation.coords.latitude,
          longitude: defaultValenciaLocation.coords.longitude,
        });
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setSelectedLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      const defaultValenciaLocation: Location.LocationObject = {
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
      setSelectedLocation({
        latitude: defaultValenciaLocation.coords.latitude,
        longitude: defaultValenciaLocation.coords.longitude,
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Назва івенту обов'язкова");
      return;
    }

    if (!time.trim()) {
      setError("Час початку обов'язковий");
      return;
    }

    if (!description.trim()) {
      setError("Опис прогулянки обов'язковий");
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Створюємо timestamp з обраного часу
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const walkStartDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

      // Не переносимо на завтра - залишаємо обраний час як є
      // Користувач сам вибирає, коли хоче почати прогулянку

      console.log('Time debug:', {
        now: now.toLocaleString('uk-UA'),
        selectedTime: `${hours}:${minutes}`,
        walkStartDateTime: walkStartDateTime.toLocaleString('uk-UA'),
        walkStartDateTimeISO: walkStartDateTime.toISOString(),
      });

      await updateWalkStatus(user.id, {
        isWalking: true,
        walkTitle: title,
        walkStartTime: walkStartDateTime.toISOString(),
        walkDuration: `${selectedDuration} год`,
        walkDescription: description,
        walkLatitude: selectedLocation?.latitude,
        walkLongitude: selectedLocation?.longitude,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setTitle('');
        setDescription('');
        setCurrentTime();
        setError('');
        router.push({
          pathname: '/(tabs)',
          params: { reloadEvents: 'true' }
        });
      }, 1500);
    } catch (err) {
      console.error('Failed to go online:', err);
      setError('Не вдалося опублікувати статус');
    } finally {
      setIsSubmitting(false);
    }
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

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 40 + insets.top, paddingBottom: 100 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Іду гуляти</Text>
        </View>

        <Text style={styles.subtitle}>Розкажіть іншим коли і куди ви йдете гуляти</Text>

        <Text style={styles.label}>Назва івенту</Text>
        <TextInput
          style={styles.input}
          placeholder="Наприклад: Прогулянка центром міста"
          placeholderTextColor={TEXT_LIGHT}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Коли починаєте?</Text>
        <Pressable style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
          <Clock size={20} color={ACCENT_ORANGE} />
          <Text style={styles.timeButtonText}>
            {time || 'Оберіть час початку'}
            {time && selectedDuration && ` (${selectedDuration}г)`}
          </Text>
        </Pressable>

        <Text style={styles.label}>Локація прогулянки</Text>
        <Pressable
          style={styles.locationButton}
          onPress={() => setShowLocationPicker(true)}
        >
          <MapPin size={20} color={ACCENT_ORANGE} />
          <Text style={styles.locationButtonText}>
            {selectedLocation ? 'Локація обрана' : 'Оберіть локацію'}
          </Text>
        </Pressable>

        <Text style={styles.label}>Опис прогулянки</Text>
        <TextInput
          ref={descriptionInputRef}
          style={[styles.input, styles.descriptionInput]}
          placeholder="Розкажіть, куди йдете і чим плануєте займатися..."
          placeholderTextColor={TEXT_LIGHT}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          onFocus={() => {
            setTimeout(() => {
              descriptionInputRef.current?.measure((x, y, width, height, pageX, pageY) => {
                const keyboardHeight = Keyboard.metrics()?.height || 300;
                const screenHeight = Dimensions.get('window').height;
                const inputBottom = pageY + height;
                const visibleHeight = screenHeight - keyboardHeight;
                
                if (inputBottom > visibleHeight) {
                  scrollViewRef.current?.scrollTo({ y: pageY - 50, animated: true });
                }
              });
            }, 300);
          }}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Опублікувати</Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.bottomSheetModal,
              {
                transform: [{ translateY: translateYTime }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Animated.View {...panResponderTime.panHandlers} style={styles.handleContainer}>
              <View style={styles.handle} />
            </Animated.View>
            <Animated.View {...panResponderTime.panHandlers} style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Коли ви починаєте гуляти?</Text>
            </Animated.View>

            <Animated.View {...panResponderTime.panHandlers} style={styles.pickerContent}>
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>Час початку</Text>
                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputWrapper}>
                    <Text style={styles.timeInputLabel}>Година</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={selectedHour}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 0;
                        if (num >= 0 && num < 24)
                          setSelectedHour(num.toString().padStart(2, '0'));
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeInputWrapper}>
                    <Text style={styles.timeInputLabel}>Хвилини</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={selectedMinute}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 0;
                        if (num >= 0 && num < 60)
                          setSelectedMinute(num.toString().padStart(2, '0'));
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>Скільки будете гуляти?</Text>
                <View style={styles.durationOptions}>
                  {['1', '2', '3', '4', '5', '6'].map((duration) => (
                    <Pressable
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
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>

            <Animated.View {...panResponderTime.panHandlers} style={styles.pickerFooter}>
              <Pressable style={styles.confirmButton} onPress={confirmTime}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Підтвердити</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={showLocationPicker}
        transparent
        animationType="none"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.backdrop}>
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
            <Animated.View {...panResponder.panHandlers} style={styles.locationPickerHeader}>
              <Text style={styles.pickerTitle}>Оберіть локацію прогулянки</Text>
            </Animated.View>

            {location ? (
              <View style={styles.mapWrapper}>
                {Platform.OS === 'web' ? (
                  <WebMap
                    latitude={selectedLocation?.latitude || location.coords.latitude}
                    longitude={selectedLocation?.longitude || location.coords.longitude}
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
                    latitude={selectedLocation?.latitude || location.coords.latitude}
                    longitude={selectedLocation?.longitude || location.coords.longitude}
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
                  />
                )}
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ACCENT_ORANGE} />
              </View>
            )}

            <Animated.View {...panResponder.panHandlers} style={styles.locationPickerFooter}>
              <Text style={styles.locationHint}>
                Натисніть на карту щоб обрати локацію (до 15 км від вас)
              </Text>
              <Pressable
                style={styles.confirmButton}
                onPress={() => setShowLocationPicker(false)}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Підтвердити</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Check size={40} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Успішно!</Text>
            <Text style={styles.successMessage}>Ваш статус оновлено</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_LIGHT,
    marginBottom: 24,
    lineHeight: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 15,
    color: TEXT_LIGHT,
    textAlign: 'center',
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
  locationButtonText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
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
  locationPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  mapWrapper: {
    height: 400,
  },
  loadingContainer: {
    height: 400,
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
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timeInputWrapper: {
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 13,
    color: TEXT_LIGHT,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: INPUT_BG,
    borderWidth: 2,
    borderColor: ACCENT_ORANGE,
    borderRadius: 12,
    width: 80,
    paddingVertical: 16,
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 24,
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 70,
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: ACCENT_ORANGE,
    borderColor: ACCENT_ORANGE,
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
