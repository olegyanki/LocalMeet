import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { CheckCircle, Sparkles } from 'lucide-react-native';

const TEXT_DARK = '#1C1C1E';
const TEXT_LIGHT = '#8E8E93';
const SUCCESS_GREEN = '#4CAF50';
const ACCENT_ORANGE = '#FF9500';

interface SuccessModalProps {
  visible: boolean;
}

export default function SuccessModal({ visible }: SuccessModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      sparkleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <CheckCircle size={56} color="#FFF" strokeWidth={2.5} />
            </View>
            <Animated.View
              style={[
                styles.sparkle,
                styles.sparkle1,
                {
                  opacity: sparkleAnim,
                  transform: [
                    {
                      translateY: sparkleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Sparkles size={20} color={ACCENT_ORANGE} fill={ACCENT_ORANGE} />
            </Animated.View>
            <Animated.View
              style={[
                styles.sparkle,
                styles.sparkle2,
                {
                  opacity: sparkleAnim,
                  transform: [
                    {
                      translateY: sparkleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Sparkles size={16} color={ACCENT_ORANGE} fill={ACCENT_ORANGE} />
            </Animated.View>
          </View>
          <Text style={styles.title}>Подія створена! 🎉</Text>
          <Text style={styles.message}>Тепер інші можуть побачити вас на карті</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: SUCCESS_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SUCCESS_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: -5,
    right: -5,
  },
  sparkle2: {
    bottom: 5,
    left: -5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 22,
  },
});
