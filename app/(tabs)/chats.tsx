import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT_ORANGE = '#FF9500';
const TEXT_LIGHT = '#999999';
const TEXT_DARK = '#1C1C1E';

type TabType = 'requests' | 'chats';

export default function ChatsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const insets = useSafeAreaInsets();

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
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
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
