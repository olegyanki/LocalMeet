import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@shared/hooks/useFrameworkReady';
import { AuthProvider } from '@shared/contexts/AuthContext';
import { CreateEventProvider } from '@shared/contexts/CreateEventContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <CreateEventProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat" options={{ headerShown: false }} />
          <Stack.Screen name="user" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </CreateEventProvider>
    </AuthProvider>
  );
}
