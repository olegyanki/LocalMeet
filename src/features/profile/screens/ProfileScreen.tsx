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
import PrimaryButton from '@shared/components/PrimaryButton';
import LanguagePickerModal from '@features/profile/modals/LanguagePickerModal';
import InterestPickerModal from '@features/profile/modals/InterestPickerModal';
import { COLORS, getLanguageByCode, getInterestByKey } from '@shared/constants';

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
const INPUT_MIN_HEIGHT = 56;
const TEXTAREA_MIN_HEIGHT = 120;

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
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showInterestPicker, setShowInterestPicker] = useState(false);

  // Track if there are any changes
  const hasChanges = React.useMemo(() => {
    if (!contextProfile) return false;
    
    return (
      displayName !== (contextProfile.display_name || '') ||
      bio !== (contextProfile.bio || '') ||
      avatarUrl !== (contextProfile.avatar_url || '') ||
      instagram !== (contextProfile.social_instagram || '') ||
      telegram !== (contextProfile.social_telegram || '') ||
      JSON.stringify(languages) !== JSON.stringify(contextProfile.languages || []) ||
      JSON.stringify(interests) !== JSON.stringify(contextProfile.interests || [])
    );
  }, [displayName, bio, avatarUrl, instagram, telegram, languages, interests, contextProfile]);

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
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
          {hasChanges ? (
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelButton}>{t('cancel')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
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
            {languages.map((langCode) => {
              const lang = getLanguageByCode(langCode);
              if (!lang) return null;
              return (
                <TouchableOpacity
                  key={langCode}
                  style={styles.chip}
                  onPress={() => toggleLanguage(langCode)}
                >
                  <Text style={styles.chipText}>
                    {lang.flag} {t(lang.nameKey as any)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.addChip}
              onPress={() => setShowLanguagePicker(true)}
            >
              <Plus size={14} color={COLORS.ACCENT_ORANGE} />
              <Text style={styles.addChipText}>{t('addLanguage')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('interests').toUpperCase()}</Text>
          <View style={styles.chipsContainer}>
            {interests.map((interestKey) => {
              const interest = getInterestByKey(interestKey);
              if (!interest) return null;
              return (
                <TouchableOpacity
                  key={interestKey}
                  style={styles.chip}
                  onPress={() => toggleInterest(interestKey)}
                >
                  <Text style={styles.chipText}>
                    {interest.emoji} {t(interest.key as any)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.addChip}
              onPress={() => setShowInterestPicker(true)}
            >
              <Plus size={14} color={COLORS.ACCENT_ORANGE} />
              <Text style={styles.addChipText}>{t('addInterest')}</Text>
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

        {hasChanges && (
          <PrimaryButton
            title={t('saveChanges')}
            onPress={handleSave}
            disabled={isSaving}
            loading={isSaving}
            style={{ marginTop: 16 }}
          />
        )}
      </ScrollView>

      <LanguagePickerModal
        visible={showLanguagePicker}
        selectedLanguages={languages}
        onClose={() => setShowLanguagePicker(false)}
        onConfirm={(selectedLangs) => setLanguages(selectedLangs)}
      />

      <InterestPickerModal
        visible={showInterestPicker}
        selectedInterests={interests}
        onClose={() => setShowInterestPicker(false)}
        onConfirm={(selectedInterests) => setInterests(selectedInterests)}
      />
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
    borderRadius: 16,
    fontWeight: '500',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
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
    borderRadius: 24,
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
    borderRadius: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
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
    borderRadius: 24,
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
});
