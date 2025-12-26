import React, { createContext, useEffect, useState } from 'react';
import { onAuthStateChange } from '../lib/auth';
import { getProfile } from '../lib/api';

export interface AuthContextType {
  session: any;
  isLoading: boolean;
  user: any;
  profile: any;
  isProfileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  user: null,
  profile: null,
  isProfileLoading: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const loadProfile = async (userId: string) => {
    try {
      setIsProfileLoading(true);
      const data = await getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange((newSession) => {
      setSession(newSession);
      const newUser = newSession?.user || null;
      setUser(newUser);
      
      if (newUser?.id) {
        loadProfile(newUser.id);
      } else {
        setProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      unsubscribe?.data?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, user, profile, isProfileLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
