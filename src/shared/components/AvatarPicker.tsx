import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { Camera, ImageIcon } from 'lucide-react-native';
import { pickAndUploadAvatar, takePhotoAndUploadAvatar } from '@shared/lib';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';

const AVATAR_PLACEHOLDER = 'https://api.dicebear.com/7.x/initials/svg?seed=';

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
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        {isEditing && (
          <View style={styles.editBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.WHITE} />
            ) : (
              <Camera size={16} color={COLORS.WHITE} />
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
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E8E8',
    borderWidth: 4,
    borderColor: COLORS.WHITE,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#999999',
  },
});
