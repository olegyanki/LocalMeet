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
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { updateWalkStatus } from '@shared/lib/api';
import { Clock, MapPin, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import TimePickerModal from '@features/events/modals/TimePickerModal';
import LocationPickerModal from '@features/events/modals/LocationPickerModal';
import SuccessModal from '@features/events/modals/SuccessModal';
import { calculateDistance } from '@shared/utils/location';

const BG_COLOR = '#F2F2F7';
const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#1C1C1E';
const TEXT_LIGHT = '#8E8E93';
const INPUT_BG = '#FFFFFF';
const CARD_BG = '#FFFFFF';

export default function GoOnlineScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
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
  const [userLocationWasManuallyChanged, setUserLocationWasManuallyChanged] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadCurrentLocation();
    setCurrentTime();
  }, []);

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
        console.log(`Access to location is not granted`)
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
      setError(t('eventTitleRequired'));
      return;
    }

    if (!time.trim()) {
      setError(t('startTimeRequired'));
      return;
    }

    if (!description.trim()) {
      setError(t('descriptionRequired'));
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
        walkDuration: `${selectedDuration} ${t("hoursShort")}`,
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
        setError(t('timeOverlap'));
      } else {
        setError(t('publishError'));
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
    setTempLocation({ latitude: lat, longitude: lng });
  };

  const confirmLocation = () => {
    if (tempLocation) {
      setSelectedLocation(tempLocation);
      setUserLocationWasManuallyChanged(true);
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
          { paddingTop: 20 + insets.top, paddingBottom: 100 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Sparkles size={24} color={ACCENT_ORANGE} />
            </View>
            <Text style={styles.headerTitle}>{t('createEventTitle')}</Text>
            <Text style={styles.headerSubtitle}>{t('createEventSubtitle')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('eventName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('eventPlaceholder')}
                placeholderTextColor={TEXT_LIGHT}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('startTime')}</Text>
              <Pressable style={styles.selectButton} onPress={() => setShowTimePicker(true)}>
                <View style={styles.selectIcon}>
                  <Clock size={20} color={ACCENT_ORANGE} />
                </View>
                <Text style={[styles.selectText, time && styles.selectTextFilled]}>
                  {time ? `${time} (${selectedDuration}${t('hours')})` : t('selectTimeButton')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('location')}</Text>
              <Pressable
                style={styles.selectButton}
                onPress={() => setShowLocationPicker(true)}
              >
                <View style={styles.selectIcon}>
                  <MapPin size={20} color={ACCENT_ORANGE} />
                </View>
                <Text style={[styles.selectText, selectedLocation && styles.selectTextFilled]}>
                  {userLocationWasManuallyChanged ? t('locationSelected') : t('usingCurrentLocation')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('description')}</Text>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.input, styles.textArea]}
                placeholder={t('descriptionPlaceholder')}
                placeholderTextColor={TEXT_LIGHT}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
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
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={20} color="#FFF" />
                <Text style={styles.publishButtonText}>{t('publishEvent')}</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
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
        userLocation={location}
        selectedLocation={selectedLocation}
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: TEXT_LIGHT,
    textAlign: 'center',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: BG_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT_DARK,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  selectIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: TEXT_LIGHT,
    flex: 1,
  },
  selectTextFilled: {
    color: TEXT_DARK,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  publishButton: {
    flexDirection: 'row',
    backgroundColor: ACCENT_ORANGE,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
