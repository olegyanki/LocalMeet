import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@shared/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@shared/contexts/AuthContext';
import { CreateEventProvider } from '@shared/contexts/CreateEventContext';
import { BadgeCountProvider } from '@shared/contexts/BadgeCountContext';
import { I18nProvider } from '@shared/i18n';

function AppWithBadgeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Don't render BadgeCountProvider if no user
  if (!user?.id) {
    return <>{children}</>;
  }
  
  return (
    <BadgeCountProvider userId={user.id}>
      {children}
    </BadgeCountProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <I18nProvider>
      <AuthProvider>
        <AppWithBadgeProvider>
          <CreateEventProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="chat" 
                options={{ 
                  headerShown: false,
                  presentation: 'card',
                }} 
              />
              <Stack.Screen 
                name="user" 
                options={{ 
                  headerShown: false,
                  presentation: 'card',
                }} 
              />
              <Stack.Screen 
                name="event-details" 
                options={{ 
                  headerShown: false,
                  presentation: 'card',
                }} 
              />
            </Stack>
            <StatusBar style="auto" />
          </CreateEventProvider>
        </AppWithBadgeProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
