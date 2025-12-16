import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const AVATAR_PLACEHOLDER = 'https://api.dicebear.com/7.x/initials/svg?seed=';

interface AvatarPickerProps {
  currentAvatar: string | null;
  displayName: string;
  onAvatarChange: (uri: string) => void;
  isEditing: boolean;
  userId: string;
}

export default function AvatarPicker({
  currentAvatar,
  displayName,
  onAvatarChange,
  isEditing,
  userId,
}: AvatarPickerProps) {
  const [uploading, setUploading] = useState(false);

  const handleAvatarPress = async () => {
    if (!isEditing) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Доступ заборонено', 'Потрібен доступ до галереї для вибору фото');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onAvatarChange(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Помилка', 'Не вдалося завантажити фото');
    } finally {
      setUploading(false);
    }
  };

  const avatarUri = currentAvatar || `${AVATAR_PLACEHOLDER}${encodeURIComponent(displayName)}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleAvatarPress}
        disabled={!isEditing || uploading}
        style={styles.avatarContainer}
      >
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        {isEditing && (
          <View style={styles.editBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Camera size={16} color="#FFFFFF" />
            )}
          </View>
        )}
      </TouchableOpacity>
      {isEditing && (
        <Text style={styles.hint}>
          {uploading ? 'Завантаження...' : 'Натисніть, щоб змінити'}
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
    borderColor: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#999999',
  },
});
