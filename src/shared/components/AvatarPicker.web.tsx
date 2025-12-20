import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Camera } from 'lucide-react-native';

const AVATAR_PLACEHOLDER = 'https://api.dicebear.com/7.x/initials/svg?seed=';

interface AvatarPickerProps {
  currentAvatar: string | null;
  displayName: string;
  onAvatarChange: (uri: string) => void;
  isEditing: boolean;
}

export default function AvatarPicker({
  currentAvatar,
  displayName,
  onAvatarChange,
  isEditing,
}: AvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onAvatarChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarPress = () => {
    if (!isEditing) return;
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
        disabled={!isEditing}
        style={styles.avatarContainer}
      >
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        {isEditing && (
          <View style={styles.editBadge}>
            <Camera size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
      {isEditing && (
        <Text style={styles.hint}>Натисніть, щоб змінити</Text>
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
