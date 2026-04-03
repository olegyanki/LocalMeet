import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Modal,
  Animated,
  PanResponder,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';

import { COLORS, SHADOW, SIZES } from '@shared/constants';

import LiveScreen from './LiveScreen';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_THRESHOLD = 80;

interface LiveBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToCreateEvent: () => void;
  onPublishSuccess?: (walkId: string) => void;
}

export default function LiveBottomSheet({
  isVisible,
  onClose,
  onNavigateToCreateEvent,
  onPublishSuccess,
}: LiveBottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const animateOpen = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const animateClose = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [translateY, onClose]);

  useEffect(() => {
    if (isVisible) {
      translateY.setValue(SCREEN_HEIGHT);
      requestAnimationFrame(() => {
        animateOpen();
      });
    }
  }, [isVisible, animateOpen, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) {
          animateClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={animateClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-SIZES.KEYBOARD_OVERLAP}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={animateClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          ) : (
            <View style={styles.androidBackdrop} />
          )}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              <LiveScreen
                onClose={animateClose}
                onNavigateToCreateEvent={onNavigateToCreateEvent}
                onPublishSuccess={onPublishSuccess}
              />
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: COLORS.BG_SECONDARY,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOW.modal,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: SIZES.HANDLE_WIDTH,
    height: SIZES.HANDLE_HEIGHT,
    backgroundColor: COLORS.GRAY_HANDLE,
    borderRadius: SIZES.HANDLE_HEIGHT / 2,
  },
});
