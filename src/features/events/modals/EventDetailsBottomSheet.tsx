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
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Clock, MapPin, X, Trash2 } from 'lucide-react-native';
import { deleteWalk, getMyRequestForWalk, WalkRequest, NearbyWalk, UserProfile } from '@shared/lib/api';
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { COLORS } from '@shared/constants';
import { router } from 'expo-router';



interface EventDetailsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  walk: NearbyWalk | null;
  userProfile: UserProfile | null;
  isOwnEvent: boolean;
  onDelete?: () => void;
  onConnectPress?: (walkId: string, walkOwnerName: string) => void;
}

export default function EventDetailsBottomSheet({
  visible,
  onClose,
  walk,
  userProfile,
  isOwnEvent,
  onDelete,
  onConnectPress,
}: EventDetailsBottomSheetProps) {
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const panY = React.useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [existingRequest, setExistingRequest] = React.useState<WalkRequest | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = React.useState(false);
  const { user: currentUser } = useAuth();
  const { t } = useI18n();

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 100;
        const velocity = gestureState.vy;

        if (gestureState.dy > threshold || velocity > 0.5) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(panY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  React.useEffect(() => {
    if (visible) {
      panY.setValue(0);
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

  React.useEffect(() => {
    const loadExistingRequest = async () => {
      if (!currentUser || !walk?.walk) return;

      try {
        setIsLoadingRequest(true);
        const request = await getMyRequestForWalk(walk.walk.id, currentUser.id);
        setExistingRequest(request);
      } catch (error) {
        console.error('Failed to load request:', error);
      } finally {
        setIsLoadingRequest(false);
      }
    };

    if (visible && currentUser && walk?.walk && !isOwnEvent) {
      loadExistingRequest();
    } else if (!visible) {
      setExistingRequest(null);
      setIsLoadingRequest(false);
    }
  }, [visible, currentUser, walk?.walk?.id, isOwnEvent]);

  const getTimeText = (walkStartTime: string | null) => {
    if (!walkStartTime) return t('timeNotSpecified');

    const now = new Date();
    const startTime = new Date(walkStartTime);
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return t('alreadyStarted');
    if (diffMins === 0) return t('startingNow');
    if (diffMins < 60) return t('startsInMinutes').replace('{{minutes}}', diffMins.toString());

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (mins === 0) return t('startsInHours').replace('{{hours}}', hours.toString());
    return t('startsInHoursMinutes').replace('{{hours}}', hours.toString()).replace('{{minutes}}', mins.toString());
  };

  const getTimeColor = (walkStartTime: string | null) => {
    if (!walkStartTime) return COLORS.TEXT_LIGHT;

    const now = new Date();
    const startTime = new Date(walkStartTime);
    const diffMs = startTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return COLORS.SUCCESS_GREEN;
    if (diffMins <= 15) return COLORS.ACCENT_ORANGE;
    return '#12B7DB';
  };

  const handleConnect = () => {
    if (!existingRequest && walk?.walk && userProfile && onConnectPress) {
      onConnectPress(walk.walk.id, userProfile.display_name);
    }
  };

  const getConnectButtonConfig = () => {
    if (isLoadingRequest) {
      return {
        text: t('loading'),
        icon: null,
        color: COLORS.BORDER_COLOR,
        disabled: true,
      };
    }

    if (!existingRequest) {
      return {
        text: t('connecting'),
        icon: null,
        color: COLORS.ACCENT_ORANGE,
        disabled: false,
      };
    }

    switch (existingRequest.status) {
      case 'pending':
      case 'rejected':
        return {
          text: t('requestSentStatus'),
          icon: null,
          color: COLORS.TEXT_LIGHT,
          disabled: true,
        };
      case 'accepted':
        return {
          text: t('requestAccepted'),
          icon: null,
          color: COLORS.SUCCESS_GREEN,
          disabled: true,
        };
      default:
        return {
          text: t('connecting'),
          icon: null,
          color: COLORS.ACCENT_ORANGE,
          disabled: false,
        };
    }
  };

  const handleDelete = async () => {
    if (!walk?.walk?.id) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteWalk(walk.walk.id);
      setIsDeleting(false);
      handleClose();
      setTimeout(() => {
        if (onDelete) {
          onDelete();
        }
      }, 300);
    } catch (error) {
      console.error('Failed to delete walk:', error);
      setIsDeleting(false);
    }
  };

  if (!walk || !userProfile) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
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
              transform: [
                { translateY: Animated.add(slideAnim, panY) }
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <TouchableOpacity
            style={styles.header}
            onPress={() => {
              handleClose();
              setTimeout(() => {
                if (walk?.walk?.user_id) {
                  router.push(`/user/${walk.walk.user_id}`);
                }
              }, 300);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.avatarSection}>
              {walk.walk?.image_url ? (
                <Image source={{ uri: walk.walk.image_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{userProfile.display_name[0].toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.name}>{userProfile.display_name}</Text>
              {!isOwnEvent && (
                <View style={styles.distanceContainer}>
                  <MapPin size={16} color={COLORS.TEXT_LIGHT} />
                  <Text style={styles.distanceText}>{(walk.distance / 1000).toFixed(1)} {t('kmFromYou')}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {walk.walk?.title && (
            <View style={styles.infoCard}>
              <View>
                <Text style={styles.label}>{t('eventTitleLabel')}</Text>
                <Text style={styles.eventTitle}>{walk.walk.title}</Text>
              </View>
              
              {walk.walk?.description && (
                <View>
                  <Text style={styles.label}>{t('walkDescription')}</Text>
                  <Text style={styles.description}>{walk.walk.description}</Text>
                </View>
              )}
              
              {walk.walk?.start_time && (
                <View style={styles.timeSection}>
                  <Text style={styles.label}>{t('startTimeLabel')}</Text>
                  <View style={styles.timeContainer}>
                    <Clock size={18} color={getTimeColor(walk.walk.start_time)} />
                    <Text style={[styles.timeText, { color: getTimeColor(walk.walk.start_time) }]}>
                      {getTimeText(walk.walk.start_time)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {!isOwnEvent && (() => {
            const buttonConfig = getConnectButtonConfig();
            return (
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  { backgroundColor: buttonConfig.color },
                  buttonConfig.disabled && styles.connectButtonDisabled,
                ]}
                onPress={handleConnect}
                disabled={buttonConfig.disabled}
              >
                <Text style={styles.connectButtonText}>{buttonConfig.text}</Text>
              </TouchableOpacity>
            );
          })()}

          {isOwnEvent && (
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.WHITE} />
              ) : (
                <>
                  <Trash2 size={20} color={COLORS.WHITE} />
                  <Text style={styles.deleteButtonText}>{t('deleteEvent')}</Text>
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
    backgroundColor: COLORS.BG_SECONDARY,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.BORDER_COLOR,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
    backgroundColor: COLORS.CARD_BG,
    padding: 16,
    borderRadius: 20,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarSection: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.BORDER_COLOR,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.ACCENT_ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.SUCCESS_GREEN,
    borderWidth: 3,
    borderColor: COLORS.CARD_BG,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: COLORS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: COLORS.TEXT_DARK,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT_DARK,
    opacity: 0.8,
  },
  timeSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_COLOR,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 4,
  },
  connectButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  connectButtonDisabled: {
    opacity: 0.8,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR_RED,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 4,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
});
