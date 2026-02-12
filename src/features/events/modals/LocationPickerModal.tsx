import React, { useRef, useEffect, useState } from 'react';
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
import LocationPin from '@shared/components/LocationPin';
import NativeMap from '@features/search/maps/NativeMap';
import { calculateDistance } from '@shared/utils/location';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';
import PrimaryButton from '@shared/components/PrimaryButton';

const RADIUS_FOR_CREATING_EVENT_KM = 15;

interface LocationPickerModalProps {
  visible: boolean;
  userLocation: Location.LocationObject | null;
  selectedLocation: { latitude: number; longitude: number } | null;
  tempLocation: { latitude: number; longitude: number } | null;
  onMapMove: (lat: number, lng: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function LocationPickerModal({
  visible,
  userLocation,
  selectedLocation,
  tempLocation,
  onMapMove,
  onConfirm,
  onClose,
}: LocationPickerModalProps) {
  const { t } = useI18n();
  const translateY = useRef(new Animated.Value(0)).current;
  const [initialMapCenter, setInitialMapCenter] = useState<{latitude: number; longitude: number} | null>(null);

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
      setInitialMapCenter(selectedLocation);
      translateY.setValue(500);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      setInitialMapCenter(null);
      setTimeout(() => {
        translateY.setValue(500);
      }, 250);
    }
  }, [visible]);

  const isLocationValid =
    tempLocation && userLocation
      ? calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          tempLocation.latitude,
          tempLocation.longitude
        ) <= RADIUS_FOR_CREATING_EVENT_KM
      : true;

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

          {userLocation && initialMapCenter ? (
            <View style={styles.mapWrapper}>
              <NativeMap
                latitude={initialMapCenter.latitude}
                longitude={initialMapCenter.longitude}
                markers={[]}
                selectedMarkerId={null}
                onMarkerPress={() => {}}
                onMapMove={onMapMove}
                radiusKm={RADIUS_FOR_CREATING_EVENT_KM}
                centerLat={userLocation.coords.latitude}
                centerLng={userLocation.coords.longitude}
                userLatitude={userLocation.coords.latitude}
                userLongitude={userLocation.coords.longitude}
              />
              <View style={styles.centerMarker}>
                <LocationPin size={32} />
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
            </View>
          )}

          <Animated.View {...panResponder.panHandlers} style={styles.locationPickerFooter}>
            <View style={styles.hintCard}>
              <Text style={styles.locationHint}>
                {t('tapMapToSelectLocation')}
              </Text>
            </View>
            <PrimaryButton
              title={t('confirm')}
              onPress={onConfirm}
              disabled={!isLocationValid}
            />
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
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: COLORS.GRAY_HANDLE,
    borderRadius: 3,
  },
  locationPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
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
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_COLOR,
    backgroundColor: COLORS.CARD_BG,
  },
  hintCard: {
    backgroundColor: COLORS.BG_SECONDARY,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  locationHint: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 18,
  },
});
