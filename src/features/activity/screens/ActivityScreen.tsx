import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Plus } from 'lucide-react-native';
import { useAuth } from '@shared/contexts/AuthContext';
import { getActiveWalksByUserId, getMyWalkRequests, updateWalkRequestStatus, type WalkRequestWithProfile } from '@shared/lib/api';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useRouter } from 'expo-router';

const ACCENT_ORANGE = '#FF9500';
const SUCCESS_GREEN = '#4CAF50';
const ERROR_RED = '#FF3B30';
const TEXT_DARK = '#1C1C1E';
const TEXT_LIGHT = '#8E8E93';
const BG_LIGHT = '#F2F2F7';

export default function ActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [requests, setRequests] = useState<WalkRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      const [eventsData, requestsData] = await Promise.all([
        getActiveWalksByUserId(user.id),
        getMyWalkRequests(user.id),
      ]);
      
      setMyEvents(eventsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT_ORANGE} />
      </View>
    );
  }

  const upcomingEvents = myEvents.filter(e => new Date(e.start_time) > new Date());
  const activeEvents = myEvents.filter(e => {
    const start = new Date(e.start_time);
    const now = new Date();
    return start <= now && now < new Date(start.getTime() + parseDuration(e.duration) * 60000);
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_ORANGE} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Активність</Text>
          <Text style={styles.subtitle}>Ваші події та запити</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/(tabs)/create-event')}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {activeEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.activeDot} />
            <Text style={styles.sectionTitle}>Зараз активно</Text>
          </View>
          {activeEvents.map(event => (
            <EventCard key={event.id} event={event} isActive />
          ))}
        </View>
      )}

      {requests.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color={ACCENT_ORANGE} />
            <Text style={styles.sectionTitle}>Запити ({requests.length})</Text>
          </View>
          {requests.map(request => (
            <RequestCard key={request.id} request={request} onUpdate={loadData} />
          ))}
        </View>
      )}

      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={TEXT_DARK} />
            <Text style={styles.sectionTitle}>Заплановано</Text>
          </View>
          {upcomingEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      )}

      {myEvents.length === 0 && requests.length === 0 && (
        <View style={styles.emptyState}>
          <Calendar size={64} color={TEXT_LIGHT} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Поки що тихо</Text>
          <Text style={styles.emptyText}>Створіть подію щоб почати знайомитись</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/create-event')}>
            <Plus size={20} color="#FFF" />
            <Text style={styles.emptyButtonText}>Створити подію</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function EventCard({ event, isActive = false }: { event: any; isActive?: boolean }) {
  const startTime = new Date(event.start_time);
  
  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{event.title}</Text>
        {isActive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>
      
      {event.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {event.description}
        </Text>
      )}
      
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Clock size={14} color={TEXT_LIGHT} />
          <Text style={styles.infoText}>
            {format(startTime, 'd MMM, HH:mm', { locale: uk })} • {event.duration}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={14} color={TEXT_LIGHT} />
          <Text style={styles.infoText}>
            {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function RequestCard({ request, onUpdate }: { request: WalkRequestWithProfile; onUpdate: () => void }) {
  const [responding, setResponding] = useState(false);

  const handleResponse = async (status: 'accepted' | 'rejected') => {
    setResponding(true);
    try {
      await updateWalkRequestStatus(request.id, status);
      onUpdate();
    } catch (error) {
      console.error('Error responding to request:', error);
    } finally {
      setResponding(false);
    }
  };

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestAvatar}>
          <Text style={styles.requestAvatarText}>
            {request.requester.display_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{request.requester.display_name}</Text>
          <Text style={styles.requestEvent} numberOfLines={1}>
            {request.walk.title}
          </Text>
        </View>
      </View>

      {request.message && (
        <Text style={styles.requestMessage}>"{request.message}"</Text>
      )}

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleResponse('rejected')}
          disabled={responding}
        >
          <XCircle size={18} color={ERROR_RED} />
          <Text style={styles.rejectText}>Відхилити</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleResponse('accepted')}
          disabled={responding}
        >
          <CheckCircle size={18} color="#FFF" />
          <Text style={styles.acceptText}>Прийняти</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function parseDuration(duration: string | null): number {
  if (!duration) return 0;
  const parts = duration.toLowerCase().split(' ');
  let totalMinutes = 0;
  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i]);
    const unit = parts[i + 1];
    if (unit?.includes('hour') || unit?.includes('год')) {
      totalMinutes += value * 60;
    } else if (unit?.includes('minute') || unit?.includes('хв')) {
      totalMinutes += value;
    }
  }
  return totalMinutes;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_LIGHT,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_LIGHT,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SUCCESS_GREEN,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: SUCCESS_GREEN,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_DARK,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SUCCESS_GREEN,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  cardDescription: {
    fontSize: 14,
    color: TEXT_LIGHT,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: TEXT_LIGHT,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  requestEvent: {
    fontSize: 13,
    color: TEXT_LIGHT,
  },
  requestMessage: {
    fontSize: 14,
    color: TEXT_DARK,
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: ERROR_RED,
  },
  acceptButton: {
    backgroundColor: SUCCESS_GREEN,
  },
  rejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: ERROR_RED,
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: TEXT_DARK,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_ORANGE,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
