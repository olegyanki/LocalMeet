import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@shared/lib/supabase';

/**
 * Upload image to Supabase storage (chat-images bucket)
 * @param chatId - Chat ID for organizing files
 * @param asset - Image asset from ImagePicker
 * @returns Public URL of uploaded image or null on error
 */
export async function uploadChatImage(
  chatId: string,
  asset: ImagePicker.ImagePickerAsset
): Promise<string | null> {
  try {
    let uint8Array: Uint8Array;

    // Use base64 if available (for web), otherwise fetch
    if (asset.base64) {
      const binaryString = atob(asset.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      uint8Array = bytes;
    } else {
      const response = await fetch(asset.uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      uint8Array = new Uint8Array(arrayBuffer);
    }

    const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${chatId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, uint8Array, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

/**
 * Upload audio to Supabase storage (audio-messages bucket)
 * @param chatId - Chat ID for organizing files
 * @param audioUri - Local URI of audio file
 * @param userId - User ID for folder structure (required by RLS policy)
 * @returns Public URL of uploaded audio or null on error
 */
export async function uploadChatAudio(
  chatId: string,
  audioUri: string,
  userId: string
): Promise<string | null> {
  try {
    // For React Native, we need to use XMLHttpRequest to read the file as ArrayBuffer
    const uint8Array = await new Promise<Uint8Array>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        if (xhr.status === 200) {
          const arrayBuffer = xhr.response;
          resolve(new Uint8Array(arrayBuffer));
        } else {
          reject(new Error(`Failed to fetch audio: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.responseType = 'arraybuffer';
      xhr.open('GET', audioUri, true);
      xhr.send();
    });

    // Use userId as first folder to match RLS policy
    const fileName = `${userId}/${chatId}_${Date.now()}.m4a`;

    const { data, error } = await supabase.storage
      .from('audio-messages')
      .upload(fileName, uint8Array, {
        contentType: 'audio/m4a',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('audio-messages')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading audio:', error);
    return null;
  }
}
