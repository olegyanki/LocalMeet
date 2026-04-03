import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';

import { createLiveWalk } from '@shared/lib/api';

import PrimaryButton from '@shared/components/PrimaryButton';

import { COLORS, SHADOW, SIZES } from '@shared/constants';

interface LiveScreenProps {
  onClose: () => void;
  onNavigateToCreateEvent: () => void;
  onPublishSuccess?: (walkId: string) => void;
}

export default function LiveScreen({ onClose, onNavigateToCreateEvent, onPublishSuccess }: LiveScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuth();

  const [statusText, setStatusText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    loadLocation();
  }, []);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (err) {
      console.error('Error getting location:', err);
    }
  };

  const handlePublish = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const loc = location ?? await Location.getCurrentPositionAsync({});

      const walk = await createLiveWalk({
        userId: user.id,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        statusText,
      });

      onClose();
      if (onPublishSuccess) {
        onPublishSuccess(walk.id);
      }
    } catch (err) {
      console.error('Failed to publish live walk:', err);
      setError(t('livePublishError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecondaryAction = () => {
    onClose();
    onNavigateToCreateEvent();
  };

  return (
    <View
      style={[
        styles.content,
        { paddingBottom: isKeyboardVisible ? SIZES.KEYBOARD_OVERLAP + 16 : insets.bottom + 16 },
      ]}
    >
      <Text style={styles.title}>{t('liveTitle')}</Text>
      <Text style={styles.subtitle}>{t('liveSubtitle')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('livePlaceholder')}
        placeholderTextColor={COLORS.GRAY_PLACEHOLDER}
        value={statusText}
        onChangeText={(text) => {
          setStatusText(text);
          if (error) setError(null);
        }}
        multiline
        autoFocus={true}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton
        title={t('livePublishButton')}
        onPress={handlePublish}
        disabled={isSubmitting}
        loading={isSubmitting}
      />

      <View style={styles.secondaryRow}>
        <Text style={styles.secondaryText}>{t('liveSecondaryText')}</Text>
        <TouchableOpacity onPress={handleSecondaryAction} activeOpacity={0.6}>
          <Text style={styles.secondaryButton}>{t('liveSecondaryButton')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 20,
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
    minHeight: 96,
    textAlignVertical: 'top',
    marginBottom: 20,
    ...SHADOW.standard,
  },
  errorContainer: {
    backgroundColor: COLORS.ERROR_BG,
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.ERROR_RED,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
  },
  secondaryButton: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
  },
});
