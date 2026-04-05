import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'auth_has_logged_in';

/** Returns true if the user has previously logged in on this device */
export async function hasLoggedInBefore(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/** Call after successful login or registration */
export async function markLoggedIn(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {}
}
