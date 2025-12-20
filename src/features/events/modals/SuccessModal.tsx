import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Check } from 'lucide-react-native';

const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
const SUCCESS_GREEN = '#4CAF50';

interface SuccessModalProps {
  visible: boolean;
}

export default function SuccessModal({ visible }: SuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
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
  );
}

const styles = StyleSheet.create({
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
});
