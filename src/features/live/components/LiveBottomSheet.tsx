import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Modal,
  Animated,
  PanResponder,
  TouchableOpacity,
  Keyboard,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native';

import { COLORS, SHADOW, SIZES } from '@shared/constants';

import LiveScreen from './LiveScreen';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const SWIPE_THRESHOLD = 80;

interface LiveBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToCreateEvent: () => void;
}

export default function LiveBottomSheet({
  isVisible,
  onClose,
  onNavigateToCreateEvent,
}: LiveBottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
      animateOpen();
    }
  }, [isVisible, animateOpen, translateY]);

  // Keyboard tracking — shift sheet up when keyboard appears
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      Animated.timing(keyboardOffset, {
        toValue: -e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 250,
        useNativeDriver: true,
      }).start();
    });

    const hideListener = Keyboard.addListener(hideEvent, (e) => {
      setKeyboardHeight(0);
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e?.duration ?? 250) : 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [keyboardOffset]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
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
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={animateClose}
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              maxHeight: MAX_SHEET_HEIGHT,
              transform: [
                { translateY: Animated.add(translateY, keyboardOffset) },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <LiveScreen
            onClose={animateClose}
            onNavigateToCreateEvent={onNavigateToCreateEvent}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
