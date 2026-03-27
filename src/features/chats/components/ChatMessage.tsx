import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import Avatar from '@shared/components/Avatar';
import AudioPlayer from '@shared/components/AudioPlayer';
import ImageGrid from '@shared/components/ImageGrid';
import { getDisplayName } from '@shared/utils/profile';
import { COLORS, SHADOW } from '@shared/constants';
import type { Message } from '@shared/lib/api';

type MessageWithPending = Message & { isPending?: boolean };

interface ChatMessageProps {
  message: MessageWithPending;
  isOwnMessage: boolean;
  isGroupChat: boolean;
  showDateSeparator: boolean;
  dateLabel: string;
  onImagePress: (images: string[], index: number) => void;
  t: (key: string) => string;
}

export default function ChatMessage({
  message,
  isOwnMessage,
  isGroupChat,
  showDateSeparator,
  dateLabel,
  onImagePress,
  t,
}: ChatMessageProps) {
  const router = useRouter();

  const messageTime = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const senderProfile = message.sender;
  const senderName = getDisplayName(senderProfile) || t('unknown');
  const senderAvatar = senderProfile?.avatar_url;

  return (
    <>
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => {
              if (message.sender_id) {
                router.push(`/user/${message.sender_id}`);
              }
            }}
            activeOpacity={0.7}
          >
            <Avatar
              uri={senderAvatar}
              size={32}
              name={senderName}
            />
          </TouchableOpacity>
        )}
        <View style={[
          styles.messageContent, 
          isOwnMessage && styles.ownMessageContent,
          message.image_urls && message.image_urls.length > 0 && styles.imageMessageContent,
        ]}>
          {!isOwnMessage && isGroupChat && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
              message.audio_url && styles.audioBubble,
              message.image_urls && message.image_urls.length > 0 && styles.imageBubble,
              message.image_urls && message.image_urls.length > 0 && !message.content && styles.imageBubbleOnly,
            ]}
          >
            {message.image_urls && message.image_urls.length > 0 && (
              <ImageGrid
                images={message.image_urls}
                maxWidth={260}
                hasCaption={!!message.content}
                onImagePress={onImagePress}
              />
            )}
            
            {message.audio_url && message.audio_duration && (
              <AudioPlayer
                audioUrl={message.audio_url}
                duration={message.audio_duration}
                isOwnMessage={isOwnMessage}
              />
            )}
            
            {message.content && (
              <View style={message.image_urls && message.image_urls.length > 0 ? styles.captionTextContainer : undefined}>
                <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
                  {message.content}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.messageTimeContainer, isOwnMessage && styles.ownMessageTimeContainer]}>
            <Text style={styles.messageTime}>{messageTime}</Text>
            {isOwnMessage && (
              <View style={styles.messageStatusContainer}>
                {message.isPending ? (
                  <ActivityIndicator 
                    size={12} 
                    color={COLORS.WHITE} 
                    style={{ width: 12, height: 12 }} 
                  />
                ) : (
                  <Text style={styles.messageStatus}>
                    {message.read ? '✓✓' : '✓'}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
      {showDateSeparator && (
        <View style={styles.dateContainer}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    maxWidth: '90%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  messageContent: {
    marginLeft: 12,
    alignSelf: 'flex-start',
  },
  ownMessageContent: {
    marginLeft: 0,
    marginRight: 0,
    alignItems: 'flex-end',
  },
  imageMessageContent: {
    flex: 0,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    overflow: 'visible',
    alignSelf: 'flex-start',
    ...SHADOW.standard,
  },
  audioBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageBubble: {
    width: 260,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  imageBubbleOnly: {
    padding: 0,
    width: 260,
    overflow: 'hidden',
  },
  ownBubble: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderBottomRightRadius: 4,
    shadowColor: COLORS.ACCENT_ORANGE,
    shadowOpacity: 0.2,
  },
  otherBubble: {
    backgroundColor: COLORS.CARD_BG,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR + '80',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  captionTextContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  ownMessageText: {
    color: COLORS.WHITE,
  },
  otherMessageText: {
    color: COLORS.TEXT_DARK,
  },
  messageTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 4,
  },
  ownMessageTimeContainer: {
    marginLeft: 0,
    marginRight: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.TEXT_LIGHT,
  },
  messageStatusContainer: {
    width: 20,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageStatus: {
    fontSize: 12,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '600',
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateBadge: {
    backgroundColor: COLORS.TEXT_LIGHT + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
