import React, { useState } from 'react';
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
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Clock } from 'lucide-react-native';
import { createWalkRequest } from '@shared/lib/api';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';
import { Image } from 'react-native';
import { getEventImage } from '@shared/utils/eventImage';
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
}: ContactRequestBottomSheetProps) {
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const getTimeText = (walkStartTime: string) => {
    const now = new Date();
    const startTime = new Date(walkStartTime);
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return t('alreadyStarted');
    if (diffMins === 0) return t('startingNow');
    if (diffMins < 60) return t('startsInMinutes').replace('{{minutes}}', diffMins.toString());

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (mins === 0) return t('startsInHours').replace('{{hours}}', hours.toString());
    return t('startsInHoursMinutes').replace('{{hours}}', hours.toString()).replace('{{minutes}}', mins.toString());
  };

  React.useEffect(() => {
    if (visible) {
      setMessage('');
      setError(null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
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
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.content}>
            <View style={styles.eventCard}>
              <View style={styles.ownerSection}>
                {(() => {
                  const walk = { image_url: walkImageUrl } as any;
                  const eventImageUrl = getEventImage(walk, walkOwnerAvatar);
                  return eventImageUrl ? (
                    <Image source={{ uri: eventImageUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{walkOwnerName[0]?.toUpperCase()}</Text>
                    </View>
                  );
                })()}
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{walkOwnerName}</Text>
                  <Text style={styles.eventTitle}>{walkTitle}</Text>
                </View>
              </View>
              {walkStartTime && (
                <View style={styles.timeRow}>
                  <Clock size={16} color={COLORS.TEXT_LIGHT} />
                  <Text style={styles.timeText}>{getTimeText(walkStartTime)}</Text>
                </View>
              )}
            </View>

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
    paddingBottom: 40,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.BORDER_COLOR,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.WHITE,
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
