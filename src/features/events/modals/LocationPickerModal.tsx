import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  PanResponder,
  Animated,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Check } from 'lucide-react-native';
import LocationPin from '@shared/components/LocationPin';
import WebMap from '@features/search/maps/WebMap';
import NativeMap from '@features/search/maps/NativeMap';
import { calculateDistance } from '@shared/utils/location';
import { useI18n } from '@shared/i18n';

const ACCENT_ORANGE = '#FF9500';
const TEXT_LIGHT = '#999999';
const BORDER_COLOR = '#E8E8E8';
const SUCCESS_GREEN = '#4CAF50';

interface LocationPickerModalProps {
  visible: boolean;
  location: Location.LocationObject | null;
  initialMapCenter: { latitude: number; longitude: number } | null;
  tempLocation: { latitude: number; longitude: number } | null;
  onMapMove: (lat: number, lng: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function LocationPickerModal({
  visible,
  location,
  initialMapCenter,
  tempLocation,
  onMapMove,
  onConfirm,
  onClose,
}: LocationPickerModalProps) {
  const { t } = useI18n();
  const translateY = useRef(new Animated.Value(0)).current;

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
            toValue: 1000,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            onClose();
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

  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  const isLocationValid =
    tempLocation && location
      ? calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          tempLocation.latitude,
          tempLocation.longitude
        ) <= 15
      : false;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
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
            <Text style={styles.pickerTitle}>{t('selectWalkLocation')}</Text>
          </Animated.View>

          {location && initialMapCenter ? (
            <View style={styles.mapWrapper}>
              {Platform.OS === 'web' ? (
                <WebMap
                  latitude={initialMapCenter.latitude}
                  longitude={initialMapCenter.longitude}
                  markers={[]}
                  selectedMarkerId={null}
                  onMarkerPress={() => {}}
                  onMapMove={onMapMove}
                  radiusKm={15}
                  centerLat={location.coords.latitude}
                  centerLng={location.coords.longitude}
                  userLatitude={location.coords.latitude}
                  userLongitude={location.coords.longitude}
                />
              ) : (
                <NativeMap
                  latitude={initialMapCenter.latitude}
                  longitude={initialMapCenter.longitude}
                  markers={[]}
                  selectedMarkerId={null}
                  onMarkerPress={() => {}}
                  onMapMove={onMapMove}
                  radiusKm={15}
                  centerLat={location.coords.latitude}
                  centerLng={location.coords.longitude}
                  userLatitude={location.coords.latitude}
                  userLongitude={location.coords.longitude}
                />
              )}
              <View style={styles.centerMarker}>
                <LocationPin size={32} />
              </View>
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
              style={[styles.confirmButton, !isLocationValid && styles.buttonDisabled]}
              onPress={onConfirm}
              disabled={!isLocationValid}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  mapWrapper: {
    height: 400,
    position: 'relative',
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
    zIndex: 1000,
    pointerEvents: 'none',
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS_GREEN,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
