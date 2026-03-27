import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@shared/lib/supabase';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const IMAGE_QUALITY = 0.8; // 80% quality for compression

/**
 * Upload multiple images to Supabase storage in parallel with validation and rollback
 * @param chatId - Chat ID for organizing files in chat-specific folders
 * @param assets - Array of image assets from ImagePicker
 * @returns Array of public URLs in same order as input
 * @throws Error if validation fails or any upload fails (with automatic rollback)
 */
export async function uploadChatImages(
  chatId: string,
  assets: ImagePicker.ImagePickerAsset[]
): Promise<string[]> {
  // Validate inputs
  if (!chatId || assets.length === 0) {
    throw new Error('Invalid input: chatId and assets are required');
  }

  if (assets.length > 10) {
    throw new Error('Maximum 10 images allowed per message');
  }

  // Validate each asset
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    
    // Validate file type
    const fileType = asset.mimeType || getFileTypeFromUri(asset.uri);
    if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      throw new Error(`Invalid file type for image ${i + 1}. Allowed types: JPEG, PNG, GIF, WebP`);
    }

    // Validate file size
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      throw new Error(`Image ${i + 1} exceeds maximum file size of 10MB`);
    }
  }

  const uploadedUrls: string[] = [];
  const uploadedPaths: string[] = [];

  try {
    // Upload all images in parallel using Promise.all
    const uploadPromises = assets.map(async (asset, index) => {
      try {
        // Compress and convert image to Uint8Array
        let uint8Array: Uint8Array;

        if (asset.base64) {
          // Use base64 if available (for web)
          const binaryString = atob(asset.base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          uint8Array = bytes;
        } else {
          // Fetch image data
          const response = await fetch(asset.uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image ${index + 1}: ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          uint8Array = new Uint8Array(arrayBuffer);
        }

        // Generate unique filename in chat-specific folder
        const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${chatId}/${Date.now()}_${index}.${ext}`;

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from('chat-images')
          .upload(fileName, uint8Array, {
            contentType: asset.mimeType || `image/${ext}`,
            upsert: false,
          });

        if (error) {
          console.error(`Upload error for image ${index + 1}:`, error);
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        return {
          url: urlData.publicUrl,
          path: fileName,
          index,
        };
      } catch (error) {
        console.error(`Error uploading image ${index + 1}:`, error);
        throw new Error(`Failed to upload image ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);

    // Sort results by original index to maintain order
    results.sort((a, b) => a.index - b.index);

    // Extract URLs and paths
    results.forEach(result => {
      uploadedUrls.push(result.url);
      uploadedPaths.push(result.path);
    });

    // Verify all uploads succeeded
    if (uploadedUrls.length !== assets.length) {
      throw new Error('Upload count mismatch');
    }

    return uploadedUrls;
  } catch (error) {
    // Rollback: Delete all successfully uploaded images
    console.error('Upload failed, rolling back...', error);
    
    if (uploadedPaths.length > 0) {
      try {
        await supabase.storage
          .from('chat-images')
          .remove(uploadedPaths);
        console.log(`Rolled back ${uploadedPaths.length} uploaded images`);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    throw error;
  }
}

/**
 * Helper function to get file type from URI
 */
function getFileTypeFromUri(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

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
