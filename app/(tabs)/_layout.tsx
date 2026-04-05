import { Tabs, useRouter, useSegments } from 'expo-router';
import { MapPin, User, MessageCircle, Settings } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@shared/contexts/AuthContext';
import { useBadgeCount } from '@shared/contexts/BadgeCountContext';
import { useI18n } from '@shared/i18n';
import TabIconWithBadge from '@shared/components/TabIconWithBadge';
import PlusTabButton from '@features/live/components/PlusTabButton';
import LiveBottomSheet from '@features/live/components/LiveBottomSheet';

import { COLORS } from '@shared/constants';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { totalBadgeCount, unreadMessagesCount, pendingRequestsCount } = useBadgeCount();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(false);
  const segments = useSegments();
  const isCreateEventActive = isVisible || segments.includes('create-event' as never);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/register');
    }
  }, [isLoading, user]);

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.ACCENT_ORANGE,
        tabBarInactiveTintColor: COLORS.TEXT_LIGHT,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: COLORS.WHITE,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: COLORS.SHADOW_BLACK,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'visible',
        },
      }}
    >
      <Tabs.Screen
        name="(search)"
        options={{
          title: t('tabSearch').toUpperCase(),
          tabBarIcon: ({ size, color }) => <MapPin size={20} color={color} />,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: t('tabChats').toUpperCase(),
          tabBarIcon: ({ size, color }) => (
            <TabIconWithBadge
              icon={MessageCircle}
              size={20}
              color={color}
              badgeCount={totalBadgeCount}
              unreadMessages={unreadMessagesCount}
              pendingRequests={pendingRequestsCount}
            />
          ),
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="create-event"
        options={{
          title: '',
          tabBarButton: (props) => (
            <PlusTabButton {...props} isActive={isCreateEventActive} onPress={() => setIsVisible(true)} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: t('tabProfile').toUpperCase(),
          tabBarIcon: ({ size, color }) => <User size={20} color={color} />,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabSettings').toUpperCase(),
          tabBarIcon: ({ size, color }) => <Settings size={20} color={color} />,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
    <LiveBottomSheet
      isVisible={isVisible}
      onClose={() => setIsVisible(false)}
      onNavigateToCreateEvent={() => router.push('/create-event')}
      onPublishSuccess={(walkId) => {
        router.push({
          pathname: '/(tabs)/(search)',
          params: { reloadEvents: 'true', selectWalkId: walkId },
        });
      }}
    />
    </View>
  );
}
