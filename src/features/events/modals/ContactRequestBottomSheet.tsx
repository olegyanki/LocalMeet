import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Clock } from 'lucide-react-native';
import { createWalkRequest } from '@shared/lib/api';
import Avatar from '@shared/components/Avatar';
import { useI18n } from '@shared/i18n';
import { COLORS, SIZES } from '@shared/constants';
import { getEventImage } from '@shared/utils/eventImage';
import { formatTime, getTimeColor, getSmartTimeDisplay } from '@shared/utils/time';
import PrimaryButton from '@shared/components/PrimaryButton';

interface ContactRequestBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  walkId: string;
  requesterId: string;
  walkOwnerName: string;
  walkOwnerAvatar?: string | null;
  walkTitle: string;
  walkStartTime?: string;
  walkImageUrl?: string | null;
  onRequestSent?: () => void;
  onOwnerPress?: () => void;
}

export default function ContactRequestBottomSheet({
  visible,
  onClose,
  walkId,
  requesterId,
  walkOwnerName,
  walkOwnerAvatar,
  walkTitle,
  walkStartTime,
  walkImageUrl,
  onRequestSent,
  onOwnerPress,
}: ContactRequestBottomSheetProps) {
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  React.useEffect(() => {
    if (visible) {
      // Скидаємо позицію перед анімацією
      slideAnim.setValue(Dimensions.get('window').height);
      setMessage('');
      setError(null);
      // Використовуємо requestAnimationFrame для кращої синхронізації
      requestAnimationFrame(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError(t('pleaseWriteMessage'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await createWalkRequest({
        walkId,
        requesterId,
        message: message.trim(),
      });

      setIsSubmitting(false);
      setMessage('');

      if (onRequestSent) {
        onRequestSent();
      }

      onClose();
    } catch (err) {
      console.error('Failed to send request:', err);
      setError(t('failedToSendRequest'));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-SIZES.KEYBOARD_OVERLAP}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          ) : (
            <View style={styles.androidBackdrop} />
          )}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              paddingBottom: isKeyboardVisible ? SIZES.KEYBOARD_OVERLAP + 16 : 40,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <View style={styles.handle} />

              <View style={styles.content}>
            <TouchableOpacity
              style={styles.eventCard}
              activeOpacity={onOwnerPress ? 0.6 : 1}
              onPress={onOwnerPress}
            >
              <View style={styles.ownerSection}>
                {(() => {
                  const walk = { image_url: walkImageUrl } as any;
                  const eventImageUrl = getEventImage(walk, walkOwnerAvatar);
                  return (
                    <Avatar 
                      uri={eventImageUrl} 
                      name={walkOwnerName} 
                      size={48}
                    />
                  );
                })()}
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{walkOwnerName}</Text>
                  <Text style={styles.eventTitle}>{walkTitle}</Text>
                </View>
              </View>
              {walkStartTime && (
                <View style={styles.timeRow}>
                  <Clock size={16} color={getTimeColor(walkStartTime)} />
                  <Text style={[styles.timeText, { color: getTimeColor(walkStartTime) }]}>
                    {getSmartTimeDisplay(walkStartTime, t)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('yourMessageLabel')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('messagePlaceholder')}
                placeholderTextColor={COLORS.TEXT_LIGHT}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{message.length}/500</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

                <PrimaryButton
                  title={t('sendRequestButton')}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                />
              </View>
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
  bottomSheet: {
    backgroundColor: COLORS.BG_SECONDARY,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.BORDER_COLOR,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  content: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerInfo: {
    flex: 1,
    gap: 2,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_COLOR,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },
  inputContainer: {},
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: COLORS.TEXT_DARK,
    minHeight: 120,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    textAlign: 'right',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: COLORS.ERROR_BG,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.ERROR_RED,
  },
});
