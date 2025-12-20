import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '@shared/contexts/AuthContext';
import { updateWalkStatus } from '@shared/lib/api';
import { Clock, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import TimePickerModal from '@features/events/modals/TimePickerModal';
import LocationPickerModal from '@features/events/modals/LocationPickerModal';
import SuccessModal from '@features/events/modals/SuccessModal';
import { calculateDistance } from '@shared/utils/location';

const BG_COLOR = '#F5F5F5';
const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
const INPUT_BG = '#FFFFFF';
const BORDER_COLOR = '#E8E8E8';

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
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDuration, setSelectedDuration] = useState('2');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tempLocation, setTempLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [initialMapCenter, setInitialMapCenter] = useState<{latitude: number; longitude: number} | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadCurrentLocation();
    setCurrentTime();
  }, []);

  useEffect(() => {
    if (showLocationPicker) {
      setInitialMapCenter(selectedLocation || {
        latitude: location?.coords.latitude || 39.4699,
        longitude: location?.coords.longitude || -0.3763
      });
    } else {
      setInitialMapCenter(null);
    }
  }, [showLocationPicker]);

  const setCurrentTime = () => {
    const now = new Date();
    setSelectedTime(now);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
  };

  const loadCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const defaultLocation: Location.LocationObject = {
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
        setLocation(defaultLocation);
        setSelectedLocation({
          latitude: defaultLocation.coords.latitude,
          longitude: defaultLocation.coords.longitude,
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
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
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

      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const walkStartDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

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
    } catch (err: any) {
      if (err.message === 'TIME_OVERLAP') {
        setError('Цей час перетинається з іншим вашим івентом');
      } else {
        setError('Не вдалося опублікувати статус');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmTime = () => {
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    setShowTimePicker(false);
  };

  const onTimeChange = (event: any, date?: Date) => {
    if (date) {
      const now = new Date();
      const selectedDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        date.getHours(),
        date.getMinutes()
      );
      
      if (selectedDateTime < now) {
        setSelectedTime(now);
      } else {
        setSelectedTime(date);
      }
      
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
        const finalTime = selectedDateTime < now ? now : date;
        const hours = finalTime.getHours().toString().padStart(2, '0');
        const minutes = finalTime.getMinutes().toString().padStart(2, '0');
        setTime(`${hours}:${minutes}`);
      }
    }
  };

  const handleMapMove = (lat: number, lng: number) => {
    if (location) {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        lat,
        lng
      );
      if (distance <= 15) {
        setTempLocation({ latitude: lat, longitude: lng });
      }
    }
  };

  const confirmLocation = () => {
    if (tempLocation) {
      setSelectedLocation(tempLocation);
    }
    setShowLocationPicker(false);
    setTempLocation(null);
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
          <Text style={styles.headerTitle}>Створити активність</Text>
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

        <Text style={styles.label}>Коли починається ваша активність?</Text>
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

      <TimePickerModal
        visible={showTimePicker}
        selectedTime={selectedTime}
        selectedDuration={selectedDuration}
        onTimeChange={onTimeChange}
        onDurationChange={setSelectedDuration}
        onConfirm={confirmTime}
        onClose={() => setShowTimePicker(false)}
      />

      <LocationPickerModal
        visible={showLocationPicker}
        location={location}
        initialMapCenter={initialMapCenter}
        tempLocation={tempLocation}
        onMapMove={handleMapMove}
        onConfirm={confirmLocation}
        onClose={() => {
          setShowLocationPicker(false);
          setTempLocation(null);
        }}
      />

      <SuccessModal visible={showSuccess} />
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
});
