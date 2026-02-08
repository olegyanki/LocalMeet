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
  TouchableOpacity,
} from 'react-native';
import MapPreview from '@shared/components/MapPreview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { createWalk, uploadEventImage, getWalksByUserId } from '@shared/lib/api';
import { Clock, MapPin, Camera, ArrowRight, X, Maximize2, AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import TimePickerModal from '@features/events/modals/TimePickerModal';
import DatePickerModal from '@features/events/modals/DatePickerModal';
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
  const [createdWalkId, setCreatedWalkId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
    date?: string;
    time?: string;
  }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const parseDuration = (durationSeconds: number): number => {
    return durationSeconds / 60;
  };

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
    setSelectedDuration('2');
    setTempLocation(null);
    setUserLocationWasManuallyChanged(false);
    setCurrentDateTime();
    setError('');
    setFieldErrors({});
    // Reset location to user's current location
    if (location) {
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
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
    
    // Reset field errors
    setFieldErrors({});
    setError('');
    
    // Validate required fields
    const errors: typeof fieldErrors = {};
    
    if (!title.trim()) {
      errors.title = t('eventTitleRequired');
    }
    
    if (!date || !time.trim()) {
      if (!date) errors.date = t('dateRequired');
      if (!time.trim()) errors.time = t('timeRequired');
    }
    
    if (!description.trim()) {
      errors.description = t('descriptionRequired');
    }
    
    // If there are field errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const walkStartDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

      // Check for time overlap
      const existingWalks = await getWalksByUserId(user.id);
      for (const walk of existingWalks) {
        const walkStart = new Date(walk.start_time);
        const walkEnd = new Date(walkStart.getTime() + walk.duration * 1000);
        const newStart = walkStartDateTime;
        const newEnd = new Date(newStart.getTime() + parseFloat(selectedDuration) * 3600 * 1000);
        
        if (newStart < walkEnd && walkStart < newEnd) {
          throw new Error('TIME_OVERLAP');
        }
      }

      let walkImageUrl: string | undefined;
      if (coverImage) {
        walkImageUrl = await uploadEventImage(user.id, coverImage);
      }

      const newWalk = await createWalk({
        userId: user.id,
        title,
        startTime: walkStartDateTime.toISOString(),
        duration: parseFloat(selectedDuration) * 3600,
        description,
        latitude: selectedLocation!.latitude,
        longitude: selectedLocation!.longitude,
        imageUrl: walkImageUrl,
      });

      setCreatedWalkId(newWalk.id);
      clearForm();
      setShowSuccess(true);
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

  const confirmTime = (finalTime: Date) => {
    const hours = finalTime.getHours().toString().padStart(2, '0');
    const minutes = finalTime.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    setSelectedTime(finalTime);
    setShowTimePicker(false);
    if (error) setError('');
  };

  const onTimeChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedTime(date);
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
    if (error) setError('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>{t('createEvent')}</Text>
        <TouchableOpacity onPress={clearForm} activeOpacity={0.6}>
          <Text style={styles.clearButton}>{t('clear')}</Text>
        </TouchableOpacity>
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
            { paddingBottom: 50 + insets.bottom },
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
                style={[
                  styles.input,
                  fieldErrors.title && styles.inputError
                ]}
                placeholder={t('eventPlaceholder')}
                placeholderTextColor={fieldErrors.title ? COLORS.ERROR_RED : COLORS.GRAY_PLACEHOLDER}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (error) setError('');
                }}
              />
              {fieldErrors.title && (
                <Text style={styles.fieldErrorText}>{fieldErrors.title}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('description')}</Text>
              <TextInput
                ref={descriptionInputRef}
                style={[
                  styles.input,
                  styles.textArea,
                  fieldErrors.description && styles.inputError
                ]}
                placeholder={t('descriptionPlaceholder')}
                placeholderTextColor={fieldErrors.description ? COLORS.ERROR_RED : COLORS.GRAY_PLACEHOLDER}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (error) setError('');
                }}
                multiline
                numberOfLines={4}
              />
              {fieldErrors.description && (
                <Text style={styles.fieldErrorText}>{fieldErrors.description}</Text>
              )}
            </View>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Text style={styles.smallLabel}>{t('date').toUpperCase()}</Text>
                <Pressable style={[
                  styles.dateTimeInput,
                  fieldErrors.date && styles.inputError
                ]} onPress={() => setShowDatePicker(true)}>
                  <Clock size={18} color={fieldErrors.date ? COLORS.ERROR_RED : COLORS.ACCENT_ORANGE} style={styles.inputIcon} />
                  <Text style={[
                    styles.dateTimeInputText,
                    date && styles.filledText,
                    fieldErrors.date && { color: COLORS.ERROR_RED }
                  ]}>
                    {date ? date : t('datePlaceholder')}
                  </Text>
                </Pressable>
                {fieldErrors.date && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.date}</Text>
                )}
              </View>
              
              <View style={styles.dateTimeItem}>
                <Text style={styles.smallLabel}>{t('time').toUpperCase()}</Text>
                <Pressable style={[
                  styles.dateTimeInput,
                  fieldErrors.time && styles.inputError
                ]} onPress={() => setShowTimePicker(true)}>
                  <Clock size={18} color={fieldErrors.time ? COLORS.ERROR_RED : COLORS.ACCENT_ORANGE} style={styles.inputIcon} />
                  <Text style={[
                    styles.dateTimeInputText,
                    time && styles.filledText,
                    fieldErrors.time && { color: COLORS.ERROR_RED }
                  ]}>
                    {time || t('timePlaceholder')}
                  </Text>
                </Pressable>
                {fieldErrors.time && (
                  <Text style={styles.fieldErrorText}>{fieldErrors.time}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.smallLabel}>{t('location').toUpperCase()}</Text>
              <Pressable style={styles.locationContainer} onPress={() => setShowLocationPicker(true)}>
                <View style={styles.locationHeader}>
                  <MapPin size={20} color={COLORS.ACCENT_ORANGE} style={styles.inputIcon} />
                  <Text style={styles.locationPlaceholder}>{t('tapMapToSetLocation')}</Text>
                </View>
                <View style={styles.mapPreview}>
                  <MapPreview
                    latitude={selectedLocation?.latitude || 50.4501}
                    longitude={selectedLocation?.longitude || 30.5234}
                    style={styles.mapWebView}
                  />
                  <View style={styles.setPinButton}>
                    <Text style={styles.setPinText}>{t('setPin')}</Text>
                    <Maximize2 size={14} color={COLORS.ACCENT_ORANGE} />
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.section}>
              <View style={styles.errorBanner}>
                <View style={styles.errorIconContainer}>
                  <AlertTriangle size={18} color={COLORS.ERROR_RED} />
                </View>
                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>{t('actionRequired')}</Text>
                  <Text style={styles.errorDescription}>{error}</Text>
                </View>
              </View>
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
                <ActivityIndicator color={COLORS.WHITE} />
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

      <DatePickerModal
        visible={showDatePicker}
        selectedDate={date}
        onDateSelect={(selectedDate) => {
          setDate(selectedDate);
          // If date is changed to today, update time to current time
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          if (selectedDate === today) {
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            setTime(`${hours}:${minutes}`);
            setSelectedTime(now);
          }
          if (error) setError('');
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />

      <TimePickerModal
        visible={showTimePicker}
        selectedTime={selectedTime}
        selectedDate={date}
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

      <SuccessModal 
        visible={showSuccess} 
        walkId={createdWalkId}
        onClose={() => {
          setShowSuccess(false);
          setCreatedWalkId(null);
        }} 
      />
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
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  coverPhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.GRAY_DARK,
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
    color: COLORS.GRAY_DARK,
    marginBottom: 6,
    marginLeft: 4,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY_DARK,
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
    shadowColor: COLORS.SHADOW_BLACK,
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
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateTimeInputText: {
    fontSize: 14,
    color: COLORS.GRAY_PLACEHOLDER,
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
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
    backgroundColor: '#F9FAFB',
  },
  locationPlaceholder: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
    fontStyle: 'italic',
    marginLeft: 12,
  },
  mapPreview: {
    height: 160,
    position: 'relative',
  },
  mapWebView: {
    width: '100%',
    height: '100%',
  },
  setPinButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.CARD_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    pointerEvents: 'none',
  },
  setPinText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ACCENT_ORANGE,
  },
  inputError: {
    borderColor: COLORS.ERROR_RED,
  },
  fieldErrorText: {
    fontSize: 12,
    color: COLORS.ERROR_RED,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Error Banner
  errorBanner: {
    backgroundColor: COLORS.ERROR_BG,
    borderWidth: 1,
    borderColor: COLORS.ERROR_RED,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  errorIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.ERROR_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  errorDescription: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    lineHeight: 16,
  },
  errorContainer: {
    backgroundColor: COLORS.ERROR_BG,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.ERROR_RED,
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
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});
