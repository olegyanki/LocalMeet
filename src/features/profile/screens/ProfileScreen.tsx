import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { updateProfile } from '@shared/lib/api';
import { Plus } from 'lucide-react-native';
import AvatarPicker from '@shared/components/AvatarPicker';
import { COLORS } from '@shared/constants';

const LANGUAGE_OPTIONS = [
  'langUkrainian',
  'langEnglish',
  'langSpanish',
  'langFrench',
  'langGerman',
  'langItalian',
  'langPolish',
  'langRussian',
];

const INTEREST_OPTIONS = [
  'interestSport',
  'interestMusic',
  'interestMovies',
  'interestTravel',
  'interestFood',
  'interestPhotography',
  'interestArt',
  'interestTech',
  'interestBooks',
  'interestGames',
  'interestNature',
  'interestDance',
  'interestYoga',
  'interestCooking',
  'interestFashion',
];

// UI Constants
const AVATAR_SIZE = 128;
const AVATAR_BORDER_RADIUS = 24;
const INPUT_MIN_HEIGHT = 56;
const TEXTAREA_MIN_HEIGHT = 120;
const CHIP_PADDING_VERTICAL = 10;
const CHIP_PADDING_HORIZONTAL = 16;

export default function ProfileScreen() {
  const { user, profile: contextProfile, isProfileLoading, refreshProfile } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');

  useEffect(() => {
    if (contextProfile) {
      setDisplayName(contextProfile.display_name || '');
      setBio(contextProfile.bio || '');
      setAvatarUrl(contextProfile.avatar_url || '');
      setLanguages(contextProfile.languages || []);
      setInterests(contextProfile.interests || []);
      setInstagram(contextProfile.social_instagram || '');
      setTelegram(contextProfile.social_telegram || '');
    }
  }, [contextProfile]);

  const handleCancel = () => {
    if (contextProfile) {
      setDisplayName(contextProfile.display_name || '');
      setBio(contextProfile.bio || '');
      setAvatarUrl(contextProfile.avatar_url || '');
      setLanguages(contextProfile.languages || []);
      setInterests(contextProfile.interests || []);
      setInstagram(contextProfile.social_instagram || '');
      setTelegram(contextProfile.social_telegram || '');
    }
    setError('');
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setError('');

      await updateProfile(user.id, {
        display_name: displayName,
        bio,
        avatar_url: avatarUrl || null,
        languages,
        interests,
        social_instagram: instagram || null,
        social_telegram: telegram || null,
      } as any);

      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  if (isProfileLoading && !contextProfile) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 100 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={{ width: 60 }} />
          <Text style={styles.title}>{t('profile')}</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.avatarSection}>
          <AvatarPicker
            currentAvatar={avatarUrl}
            displayName={displayName || 'User'}
            userId={user?.id || ''}
            onAvatarChange={setAvatarUrl}
            isEditing={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('name').toUpperCase()}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={t('namePlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('aboutMe').toUpperCase()}</Text>
          <View style={[styles.inputWrapper, { minHeight: 'auto' }]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('bioPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('languages').toUpperCase()}</Text>
          <View style={styles.chipsContainer}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={styles.chip}
                onPress={() => toggleLanguage(lang)}
              >
                <Text style={styles.chipText}>{t(lang as any)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addChip}
              onPress={() => {
                const availableLangs = LANGUAGE_OPTIONS.filter(l => !languages.includes(l));
                if (availableLangs.length > 0) {
                  setLanguages([...languages, availableLangs[0]]);
                }
              }}
            >
              <Plus size={14} color={COLORS.ACCENT_ORANGE} />
              <Text style={styles.addChipText}>Add Language</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('interests').toUpperCase()}</Text>
          <View style={styles.chipsContainer}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={styles.chip}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={styles.chipText}>{t(interest as any)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addChip}
              onPress={() => {
                const availableInterests = INTEREST_OPTIONS.filter(i => !interests.includes(i));
                if (availableInterests.length > 0) {
                  setInterests([...interests, availableInterests[0]]);
                }
              }}
            >
              <Plus size={14} color={COLORS.ACCENT_ORANGE} />
              <Text style={styles.addChipText}>Add Interest</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('socialMedia').toUpperCase()}</Text>
          <View style={styles.socialInputsContainer}>
            <View style={styles.socialInputWrapper}>
              <View style={styles.socialIconContainer}>
                <View style={[styles.socialIcon, { backgroundColor: '#FFE7F3' }]}>
                  <Text style={{ fontSize: 18 }}>📷</Text>
                </View>
              </View>
              <TextInput
                style={styles.socialInput}
                placeholder={t('instagramUsername')}
                placeholderTextColor="#9CA3AF"
                value={instagram}
                onChangeText={setInstagram}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.socialInputWrapper}>
              <View style={styles.socialIconContainer}>
                <View style={[styles.socialIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={{ fontSize: 18 }}>✈️</Text>
                </View>
              </View>
              <TextInput
                style={styles.socialInput}
                placeholder={t('telegramUsername')}
                placeholderTextColor="#9CA3AF"
                value={telegram}
                onChangeText={setTelegram}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.CARD_BG} />
          ) : (
            <>
              <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>
              <Text style={styles.saveButtonText}>✓</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  content: {
    paddingHorizontal: 24,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  cancelButton: {
    fontSize: 16,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '500',
    zIndex: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 12,
    fontWeight: '500',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding: 4,
    minHeight: INPUT_MIN_HEIGHT,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  textArea: {
    minHeight: TEXTAREA_MIN_HEIGHT,
    paddingTop: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingHorizontal: CHIP_PADDING_HORIZONTAL,
    paddingVertical: CHIP_PADDING_VERTICAL,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.CARD_BG,
    fontWeight: '500',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    paddingHorizontal: CHIP_PADDING_HORIZONTAL,
    paddingVertical: CHIP_PADDING_VERTICAL,
    borderRadius: 12,
  },
  addChipText: {
    fontSize: 14,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '500',
  },
  socialInputsContainer: {
    gap: 12,
  },
  socialInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    padding: 4,
    minHeight: INPUT_MIN_HEIGHT,
  },
  socialIconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.TEXT_DARK,
  },
  saveButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.CARD_BG,
    fontSize: 16,
    fontWeight: '700',
  },
});
