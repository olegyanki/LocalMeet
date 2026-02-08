import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { Camera, ImageIcon } from 'lucide-react-native';
import { pickAndUploadAvatar, takePhotoAndUploadAvatar } from '@shared/lib';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';
import { LinearGradient } from 'expo-linear-gradient';

const AVATAR_PLACEHOLDER = 'https://api.dicebear.com/7.x/initials/svg?seed=';
const AVATAR_SIZE = 128;
const AVATAR_BORDER_RADIUS = 24;
const CAMERA_ICON_SIZE = 40;
const CAMERA_ICON_BORDER_RADIUS = 20;
const HINT_MARGIN_TOP = 12;
const GRADIENT_COLORS = ['#F5F5F5', '#E0E0E0'] as const;
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };
const PLACEHOLDER_OPACITY = 0.3;

interface AvatarPickerProps {
  currentAvatar: string | null;
  displayName: string;
  userId: string;
  onAvatarChange: (uri: string) => void;
  isEditing: boolean;
}

export default function AvatarPicker({
  currentAvatar,
  displayName,
  userId,
  onAvatarChange,
  isEditing,
}: AvatarPickerProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);

  const handleChooseSource = () => {
    if (!isEditing || uploading) return;
    
    Alert.alert(
      t('selectSource'),
      '',
      [
        {
          text: t('camera'),
          onPress: handleTakePhoto,
        },
        {
          text: t('gallery'),
          onPress: handlePickImage,
        },
        {
          text: t('cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      setUploading(true);
      const avatarUrl = await takePhotoAndUploadAvatar(userId);
      if (avatarUrl) {
        onAvatarChange(avatarUrl);
      }
    } catch (error: any) {
      Alert.alert('Помилка', error.message || t('error'));
    } finally {
      setUploading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      const avatarUrl = await pickAndUploadAvatar(userId);
      if (avatarUrl) {
        onAvatarChange(avatarUrl);
      }
    } catch (error: any) {
      Alert.alert('Помилка', error.message || t('error'));
    } finally {
      setUploading(false);
    }
  };

  const avatarUri = currentAvatar || `${AVATAR_PLACEHOLDER}${encodeURIComponent(displayName)}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleChooseSource}
        disabled={!isEditing || uploading}
        style={styles.avatarContainer}
      >
        {currentAvatar ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={GRADIENT_START}
            end={GRADIENT_END}
            style={styles.gradientBackground}
          >
            <Image 
              source={{ uri: avatarUri }} 
              style={[styles.avatar, { opacity: PLACEHOLDER_OPACITY }]} 
            />
          </LinearGradient>
        )}
        {isEditing && !currentAvatar && (
          <View style={styles.editBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.WHITE} />
            ) : (
              <View style={styles.cameraIconContainer}>
                <Camera size={24} color={COLORS.ACCENT_ORANGE} />
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
      {isEditing && (
        <Text style={styles.hint}>
          {uploading ? t('uploading') : t('tapToChange')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 0,
  },
  avatarContainer: {
    position: 'relative',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_BORDER_RADIUS,
    backgroundColor: COLORS.CARD_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    width: CAMERA_ICON_SIZE,
    height: CAMERA_ICON_SIZE,
    borderRadius: CAMERA_ICON_BORDER_RADIUS,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    marginTop: HINT_MARGIN_TOP,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.ACCENT_ORANGE,
  },
});
