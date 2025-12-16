import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Camera } from 'lucide-react-native';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Type:', file.type);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL:', urlData.publicUrl);
      onAvatarChange(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Не вдалося завантажити фото');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarPress = () => {
    if (!isEditing || uploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const avatarUri = currentAvatar || `${AVATAR_PLACEHOLDER}${encodeURIComponent(displayName)}`;

  return (
    <View style={styles.container}>
      <input
        ref={fileInputRef as any}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
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
