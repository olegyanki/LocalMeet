import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Dimensions,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Clock, MapPin, MessageCircle, X, Trash2 } from 'lucide-react-native';
import { deleteWalk } from '../lib/api';

const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';

interface UserLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface Walk {
  id: string;
  user_id: string;
  start_time: string;
  duration: string;
  description: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  status: string | null;
  distance: number;
  location?: UserLocation | null;
  walk: Walk | null;
  interests: string[];
  isActive?: boolean;
}

interface EventDetailsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  isOwnEvent: boolean;
  onDelete?: () => void;
}

export default function EventDetailsBottomSheet({
  visible,
  onClose,
  user,
  isOwnEvent,
  onDelete,
}: EventDetailsBottomSheetProps) {
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!user) return null;

  const getTimeText = (walkStartTime: string | null) => {
    if (!walkStartTime) return 'Час не вказано';

    const now = new Date();
    const startTime = new Date(walkStartTime);
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Вже почалась';
    if (diffMins === 0) return 'Починається зараз';
    if (diffMins < 60) return `Починається через ${diffMins} хв`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (mins === 0) return `Починається через ${hours} год`;
    return `Починається через ${hours} год ${mins} хв`;
  };

  const getTimeColor = (walkStartTime: string | null) => {
    if (!walkStartTime) return TEXT_LIGHT;

    const now = new Date();
    const startTime = new Date(walkStartTime);
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return '#8FD89C';
    if (diffMins <= 15) return ACCENT_ORANGE;
    return '#12B7DB';
  };

  const handleConnect = () => {
    const message = encodeURIComponent(
      `Привіт! Побачив твій івент в додатку для прогулянок. Давай погуляємо разом! 🚶‍♂️`
    );
    const telegramUrl = `https://t.me/share/url?url=${message}`;
    Linking.openURL(telegramUrl);
  };

  const handleDelete = async () => {
    if (!user?.walk?.id) return;

    try {
      setIsDeleting(true);
      await deleteWalk(user.walk.id);
      onClose();
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete walk:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          ) : (
            <View style={styles.androidBackdrop} />
          )}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={TEXT_DARK} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.avatarSection}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user.display_name[0].toUpperCase()}</Text>
                </View>
              )}
              {user.isActive && <View style={styles.activeIndicator} />}
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.name}>{user.display_name}</Text>
              {!isOwnEvent && (
                <View style={styles.distanceContainer}>
                  <MapPin size={16} color={TEXT_LIGHT} />
                  <Text style={styles.distanceText}>{user.distance.toFixed(1)} км від вас</Text>
                </View>
              )}
            </View>
          </View>

          {user.walk?.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Опис прогулянки</Text>
              <Text style={styles.description}>{user.walk.description}</Text>
            </View>
          )}

          {user.walk?.start_time && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Час початку</Text>
              <View style={styles.timeContainer}>
                <Clock size={20} color={getTimeColor(user.walk.start_time)} />
                <Text style={[styles.timeText, { color: getTimeColor(user.walk.start_time) }]}>
                  {getTimeText(user.walk.start_time)}
                </Text>
              </View>
            </View>
          )}

          {user.interests && user.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Інтереси</Text>
              <View style={styles.interestsContainer}>
                {user.interests.map((interest, index) => (
                  <View key={index} style={styles.interestBadge}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!isOwnEvent && (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <MessageCircle size={20} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Зв'язатися</Text>
            </TouchableOpacity>
          )}

          {isOwnEvent && (
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={20} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Видалити івент</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  avatarSection: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E8E8',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8FD89C',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 14,
    color: TEXT_LIGHT,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_DARK,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 14,
    color: TEXT_DARK,
  },
  connectButton: {
    backgroundColor: ACCENT_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
