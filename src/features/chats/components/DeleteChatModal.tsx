import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';

import { COLORS } from '@shared/constants';

interface DeleteChatModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  t: (key: string) => string;
}

export default function DeleteChatModal({
  visible,
  onClose,
  onConfirm,
  isDeleting,
  t,
}: DeleteChatModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Trash2 size={32} color={COLORS.ERROR_RED} />
          </View>
          <Text style={styles.title}>{t('deleteChatConfirm')}</Text>
          <Text style={styles.message}>
            {t('deleteChatMessage')}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={onClose}
              disabled={isDeleting}
            >
              <Text style={styles.buttonTextCancel}>{t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonDelete]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.WHITE} />
              ) : (
                <Text style={styles.buttonTextDelete}>{t('delete')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: COLORS.BG_SECONDARY,
  },
  buttonDelete: {
    backgroundColor: COLORS.ERROR_RED,
  },
  buttonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  buttonTextDelete: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});
