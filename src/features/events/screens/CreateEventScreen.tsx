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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { updateWalkStatus } from '@shared/lib/api';
import { Clock, MapPin, Camera, ArrowRight, X } from 'lucide-react-native';
import { router } from 'expo-router';
import TimePickerModal from '@features/events/modals/TimePickerModal';
import LocationPickerModal from '@features/events/modals/LocationPickerModal';
import SuccessModal from '@features/events/modals/SuccessModal';
import { COLORS } from '@shared/constants';
export default function CreateEventScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [locationText, setLocationText] = useState('');
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

  useEffect(() => {
    loadCurrentLocation();
    setCurrentDateTime();
  }, []);

  const setCurrentDateTime = () => {
    const now = new Date();
    setSelectedTime(now);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
  };

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setCoverImage(null);
    setLocationText('');
    setCurrentDateTime();
    setError('');
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

    if (!date || !time.trim()) {
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

      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const walkStartDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

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
        clearForm();
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
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>{t('createEvent')}</Text>
        <Pressable onPress={clearForm}>
          <Text style={styles.clearButton}>{t('clear')}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContent}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 120 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Photo Section */}
          <View style={styles.section}>
            <Pressable style={styles.coverPhotoContainer} onPress={pickCoverImage}>
              {coverImage ? (
                <>
                  <Image source={{ uri: coverImage }} style={styles.coverImage} />
                  <Pressable style={styles.removeCoverButton} onPress={() => setCoverImage(null)}>
                    <X size={16} color="#FFF" />
                  </Pressable>
                </>
              ) : (
                <>
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop&crop=entropy&auto=format&q=60' }}
                    style={styles.backgroundImage}
                  />
                  <View style={styles.coverPhotoOverlay}>
                    <View style={styles.coverPhotoIcon}>
                      <Camera size={24} color={COLORS.ACCENT_ORANGE} />
                    </View>
                    <Text style={styles.coverPhotoText}>{t('addCoverPhoto')}</Text>
                  </View>
                </>
              )}
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={[styles.section, { marginBottom: 0 }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('eventName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('eventPlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('description')}</Text>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.input, styles.textArea]}
                placeholder={t('descriptionPlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.smallLabel}>{t('date').toUpperCase()}</Text>
                <View style={styles.dateTimeInput}>
                  <Clock size={18} color={COLORS.ACCENT_ORANGE} style={styles.inputIcon} />
                  <TextInput
                    style={styles.dateTimeInputText}
                    value={date}
                    onChangeText={setDate}
                    placeholder={t('datePlaceholder')}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              
              <View style={styles.dateTimeItem}>
                <Text style={styles.smallLabel}>{t('time').toUpperCase()}</Text>
                <Pressable style={styles.dateTimeInput} onPress={() => setShowTimePicker(true)}>
                  <Clock size={18} color={COLORS.ACCENT_ORANGE} style={styles.inputIcon} />
                  <Text style={[styles.dateTimeInputText, time && styles.filledText]}>
                    {time || t('timePlaceholder')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.smallLabel}>{t('location').toUpperCase()}</Text>
              <View style={styles.locationContainer}>
                <View style={styles.locationInput}>
                  <MapPin size={20} color={COLORS.ACCENT_ORANGE} style={styles.inputIcon} />
                  <TextInput
                    style={styles.locationInputText}
                    placeholder={t('searchLocationPlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    value={locationText}
                    onChangeText={setLocationText}
                  />
                </View>
                <View style={styles.mapPreview}>
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=150&fit=crop&crop=entropy&auto=format&q=60' }}
                    style={styles.mapImage}
                  />
                  <View style={styles.mapPin}>
                    <View style={styles.mapPinInner} />
                  </View>
                  <Pressable style={styles.expandMapButton} onPress={() => setShowLocationPicker(true)}>
                    <Text style={styles.expandMapText}>{t('expandMap')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Publish Button */}
          <View style={styles.section}>
            <Pressable
              style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.publishButtonText}>{t('publishEvent')}</Text>
                  <ArrowRight size={20} color="#FFF" />
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 20,
  },
  // Cover Photo
  coverPhotoContainer: {
    height: 192,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: COLORS.BORDER_COLOR,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPhotoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  coverPhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  removeCoverButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Form Fields
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    marginLeft: 4,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  // Date/Time Row
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  dateTimeItem: {
    flex: 1,
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateTimeInputText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
  filledText: {
    color: COLORS.TEXT_DARK,
  },
  inputIcon: {
    marginRight: 4,
  },
  // Location
  locationContainer: {
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
  },
  locationInputText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    flex: 1,
    marginLeft: 8,
  },
  mapPreview: {
    height: 128,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  mapPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 32,
    height: 32,
    marginTop: -16,
    marginLeft: -16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  expandMapButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.CARD_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expandMapText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  // Error
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Publish Button
  publishButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
