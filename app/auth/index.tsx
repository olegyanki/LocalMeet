import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { hasLoggedInBefore } from '@shared/lib/authPreference';

/**
 * Auth entry point — redirects to login or register
 * based on whether the user has logged in before on this device.
 */
export default function AuthIndex() {
  const router = useRouter();

  useEffect(() => {
    hasLoggedInBefore().then((hasBefore) => {
      if (hasBefore) {
        router.replace('/auth/login');
      } else {
        router.replace('/auth/register');
      }
    });
  }, []);

  return null;
}
