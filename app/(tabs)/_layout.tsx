import { Tabs } from 'expo-router';
import { Search, Plus, User, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT_ORANGE = '#FF9500';
const TEXT_LIGHT = '#999999';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [isLoading, user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT_ORANGE,
        tabBarInactiveTintColor: TEXT_LIGHT,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SEARCH',
          tabBarIcon: ({ size, color }) => <Search size={20} color={color} />,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'GO ONLINE',
          tabBarIcon: ({ size, color }) => <Plus size={20} color={color} />,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'CHATS',
          tabBarIcon: ({ size, color }) => <MessageCircle size={20} color={color} />,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ size, color }) => <User size={20} color={color} />,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
