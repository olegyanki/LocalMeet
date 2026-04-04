import { supabase } from '../supabase';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from './profiles';

/**
 * Shared image upload helper
 * Handles reading the file, uploading to the specified bucket, and returning the public URL
 */
async function uploadImage(
  bucket: 'avatars' | 'event-images' | 'chat-images',
  userId: string,
  imageUri: string
): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const reader = new FileReader();

  const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });

  const ext = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileData, {
      contentType: `image/${ext}`,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function uploadEventImage(userId: string, imageUri: string): Promise<string> {
  return uploadImage('event-images', userId, imageUri);
}

export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  return uploadImage('avatars', userId, imageUri);
}

export async function takePhotoAndUploadAvatar(userId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  const avatarUrl = await uploadAvatar(userId, result.assets[0].uri);
  await updateProfile(userId, { avatar_url: avatarUrl });
  
  return avatarUrl;
}
