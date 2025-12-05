import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getMyWalkRequests, updateWalkRequestStatus, WalkRequestWithProfile } from '../../lib/api';
import RequestCard from '../../components/RequestCard';

const ACCENT_ORANGE = '#FF9500';
const TEXT_LIGHT = '#999999';
const TEXT_DARK = '#1C1C1E';

type TabType = 'requests' | 'chats';

export default function ChatsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [requests, setRequests] = useState<WalkRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const loadRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getMyWalkRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleReject = async (requestId: string) => {
    try {
      await updateWalkRequestStatus(requestId, 'rejected');
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const renderRequestsContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={ACCENT_ORANGE} />
        </View>
      );
    }

    if (requests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No requests yet</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onReject={handleReject}
            onSwipeStart={() => setScrollEnabled(false)}
            onSwipeEnd={() => setScrollEnabled(true)}
          />
        )}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Messages</Text>

        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[
              styles.switchButton,
              activeTab === 'requests' && styles.switchButtonActive,
            ]}
            onPress={() => setActiveTab('requests')}
          >
            <Text
              style={[
                styles.switchText,
                activeTab === 'requests' && styles.switchTextActive,
              ]}
            >
              Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchButton,
              activeTab === 'chats' && styles.switchButtonActive,
            ]}
            onPress={() => setActiveTab('chats')}
          >
            <Text
              style={[
                styles.switchText,
                activeTab === 'chats' && styles.switchTextActive,
              ]}
            >
              Chats
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'requests' ? (
            renderRequestsContent()
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No chats yet</Text>
            </View>
          )}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: TEXT_DARK,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 2,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  switchButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_LIGHT,
  },
  switchTextActive: {
    color: TEXT_DARK,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: TEXT_LIGHT,
  },
});
