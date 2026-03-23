import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoreVertical, Users, Trash2, User, Info } from 'lucide-react-native';

import Avatar from '@shared/components/Avatar';
import CachedImage from '@shared/components/CachedImage';
import { getDisplayName } from '@shared/utils/profile';
import { getPluralSuffix } from '@shared/utils/pluralization';
import { COLORS, SHADOW } from '@shared/constants';
import type { ChatWithDetails } from '@shared/lib/api';

interface ChatHeaderProps {
  chat: ChatWithDetails;
  isGroupChat: boolean;
  isOwner: boolean;
  otherUser: any;
  showOptionsMenu: boolean;
  setShowOptionsMenu: (show: boolean) => void;
  setShowDeleteModal: (show: boolean) => void;
  paddingTop: number;
  t: (key: string, params?: any) => string;
  locale: string;
}

export default function ChatHeader({
  chat,
  isGroupChat,
  isOwner,
  otherUser,
  showOptionsMenu,
  setShowOptionsMenu,
  setShowDeleteModal,
  paddingTop,
  t,
  locale,
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <>
      <View style={[styles.header, { paddingTop }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.headerAvatarContainer}>
          {isGroupChat ? (
            chat.walk_image_url ? (
              <CachedImage
                uri={chat.walk_image_url}
                style={styles.headerEventImage}
                contentFit="cover"
                borderRadius={12}
                showShimmer={false}
              />
            ) : (
              <View style={styles.headerGroupIcon}>
                <Users size={20} color={COLORS.ACCENT_ORANGE} />
              </View>
            )
          ) : (
            <Avatar
              uri={otherUser?.avatar_url}
              size={40}
              name={getDisplayName(otherUser) || ''}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => {
            if (isGroupChat && chat.walk_id) {
              router.push(`/event-details/${chat.walk_id}`);
            } else if (otherUser) {
              router.push(`/user/${otherUser.id}`);
            }
          }}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isGroupChat ? (chat.walk_title || t('groupChat')) : (getDisplayName(otherUser) || t('unknown'))}
          </Text>
          {isGroupChat && (
            <Text style={styles.headerSubtitle}>
              {t(`participantsCount${getPluralSuffix(chat.participants.length, locale as any)}` as any, { count: chat.participants.length })}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
          >
            <MoreVertical size={24} color={COLORS.TEXT_DARK} />
          </TouchableOpacity>

          {showOptionsMenu && (
            <View style={styles.dropdownMenu}>
              {isGroupChat && chat.walk_id && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      router.push(`/event-details/${chat.walk_id}`);
                    }}
                  >
                    <Info size={20} color={COLORS.TEXT_LIGHT} />
                    <Text style={styles.dropdownOptionText}>{t('eventInfo')}</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                </>
              )}

              {isGroupChat && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      if (chat.walk_id) {
                        const hostParticipant = chat.participants.find(p => p.role === 'owner');
                        if (hostParticipant) {
                          router.push(`/event-participants/${chat.walk_id}?hostId=${hostParticipant.user_id}`);
                        }
                      }
                    }}
                  >
                    <Users size={20} color={COLORS.TEXT_LIGHT} />
                    <Text style={styles.dropdownOptionText}>{t('participants')}</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                </>
              )}

              {!isGroupChat && otherUser && (
                <>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      router.push(`/user/${otherUser.id}`);
                    }}
                  >
                    <User size={20} color={COLORS.TEXT_LIGHT} />
                    <Text style={styles.dropdownOptionText}>{t('showProfile')}</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                </>
              )}

              {!(isGroupChat && isOwner) && (
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 size={20} color={COLORS.ERROR_RED} />
                  <Text style={[styles.dropdownOptionText, styles.dropdownOptionTextDelete]}>
                    {isGroupChat ? t('leaveChat') : t('deleteChat')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {showOptionsMenu && (
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.BG_SECONDARY,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
    marginLeft: -8,
  },
  headerAvatarContainer: {
    marginRight: 12,
  },
  headerEventImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  headerGroupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.ACCENT_ORANGE + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    lineHeight: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  headerRight: {
    position: 'relative',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 224,
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    ...SHADOW.elevated,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    overflow: 'hidden',
    paddingVertical: 4,
    zIndex: 1000,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  dropdownOptionTextDelete: {
    color: COLORS.ERROR_RED,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER_COLOR + '80',
  },
});
