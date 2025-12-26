import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';
import { useI18n } from '@shared/i18n';
import { useRouter } from 'expo-router';
import { getProfile, updateProfile } from '@shared/lib/api';
import { signOut } from '@shared/lib/auth';
import { LogOut, Instagram, Send, Plus, X, ChevronDown } from 'lucide-react-native';
import AvatarPicker from '@shared/components/AvatarPicker';
import InterestPicker from '@shared/components/InterestPicker';
import { COLORS } from '@shared/constants';

const AGE_OPTIONS = Array.from({ length: 63 }, (_, i) => (i + 18).toString());
const GENDER_OPTIONS = [
  'genderMale',
  'genderFemale',
  'genderOther',
  'genderNotSpecified',
];
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

export default function ProfileScreen() {
  const { user, profile: contextProfile, isProfileLoading, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  const [showAgePicker, setShowAgePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showInstagramInput, setShowInstagramInput] = useState(false);
  const [showTelegramInput, setShowTelegramInput] = useState(false);

  useEffect(() => {
    if (contextProfile) {
      setDisplayName(contextProfile.display_name || '');
      setBio(contextProfile.bio || '');
      setAvatarUrl(contextProfile.avatar_url || '');
      setAge(contextProfile.age?.toString() || '');
      setGender(contextProfile.gender || '');
      setLanguages(contextProfile.languages || []);
      setInterests(contextProfile.interests || []);
      setInstagram(contextProfile.social_instagram || '');
      setTelegram(contextProfile.social_telegram || '');
      setLookingFor(contextProfile.looking_for || '');
    }
  }, [contextProfile]);

  const handleCancel = () => {
    if (contextProfile) {
      setDisplayName(contextProfile.display_name || '');
      setBio(contextProfile.bio || '');
      setAvatarUrl(contextProfile.avatar_url || '');
      setAge(contextProfile.age?.toString() || '');
      setGender(contextProfile.gender || '');
      setLanguages(contextProfile.languages || []);
      setInterests(contextProfile.interests || []);
      setInstagram(contextProfile.social_instagram || '');
      setTelegram(contextProfile.social_telegram || '');
      setLookingFor(contextProfile.looking_for || '');
    }
    setIsEditing(false);
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
        age: age ? parseInt(age) : null,
        gender: gender || null,
        languages,
        interests,
        social_instagram: instagram || null,
        social_telegram: telegram || null,
        looking_for: lookingFor || null,
      } as any);

      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
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
          { paddingTop: 40 + insets.top, paddingBottom: 100 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.header}>
        <Text style={styles.title}>{t('myProfile')}</Text>
        <TouchableOpacity onPress={() => isEditing ? handleCancel() : setIsEditing(true)}>
          <Text style={styles.editButton}>{isEditing ? t('cancel') : t('edit')}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('languages')}</Text>
        <View style={styles.languageSwitcher}>
          <Pressable
            style={[styles.langButton, language === 'uk' && styles.langButtonActive]}
            onPress={() => setLanguage('uk')}
          >
            <Text style={[styles.langButtonText, language === 'uk' && styles.langButtonTextActive]}>
              {t('langUkrainian')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langButton, language === 'en' && styles.langButtonActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langButtonText, language === 'en' && styles.langButtonTextActive]}>
              {t('langEnglish')}
            </Text>
          </Pressable>
        </View>
      </View>

      <AvatarPicker
        currentAvatar={avatarUrl}
        displayName={displayName || 'User'}
        userId={user?.id || ''}
        onAvatarChange={setAvatarUrl}
        isEditing={isEditing}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('basicInfo')}</Text>

        <Text style={styles.label}>{t('name')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('enterName')}
          placeholderTextColor="#AAAAAA"
          value={displayName}
          onChangeText={setDisplayName}
          editable={isEditing}
        />

        <Text style={styles.label}>{t('aboutMe')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('enterBio')}
          placeholderTextColor="#AAAAAA"
          value={bio}
          onChangeText={setBio}
          editable={isEditing}
          multiline
          numberOfLines={4}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t('age')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => isEditing && setShowAgePicker(true)}
              disabled={!isEditing}
            >
              <Text style={[styles.pickerText, !age && styles.placeholderText]}>
                {age || t('selectAge')}
              </Text>
              {isEditing && <ChevronDown size={16} color={COLORS.TEXT_LIGHT} />}
            </TouchableOpacity>
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>{t('gender')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => isEditing && setShowGenderPicker(true)}
              disabled={!isEditing}
            >
              <Text style={[styles.pickerText, !gender && styles.placeholderText]}>
                {gender ? t(gender as any) : t('selectGender')}
              </Text>
              {isEditing && <ChevronDown size={16} color={COLORS.TEXT_LIGHT} />}
            </TouchableOpacity>
          </View>
        </View>

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('languages')}</Text>
        <View style={styles.chipsContainer}>
          {languages.map((lang) => (
            <View key={lang} style={styles.chip}>
              <Text style={styles.chipText}>{t(lang as any)}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => toggleLanguage(lang)}>
                  <X size={14} color={COLORS.CARD_BG} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity
              style={styles.addChip}
              onPress={() => setShowLanguagePicker(true)}
            >
              <Plus size={16} color={COLORS.ACCENT_ORANGE} />
              <Text style={styles.addChipText}>{t('addLanguage')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <InterestPicker
          selectedInterests={interests}
          onInterestsChange={setInterests}
          isEditing={isEditing}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('lookingFor')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('enterLookingFor')}
          placeholderTextColor="#AAAAAA"
          value={lookingFor}
          onChangeText={setLookingFor}
          editable={isEditing}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('socialNetworks')}</Text>
        <View style={styles.chipsContainer}>
          {instagram && (
            <View style={styles.socialChip}>
              <Instagram size={16} color="#E4405F" />
              <Text style={styles.socialChipText}>{instagram}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => setInstagram('')}>
                  <X size={14} color={COLORS.TEXT_DARK} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {telegram && (
            <View style={styles.socialChip}>
              <Send size={16} color="#0088cc" />
              <Text style={styles.socialChipText}>{telegram}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => setTelegram('')}>
                  <X size={14} color={COLORS.TEXT_DARK} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {isEditing && !instagram && (
            <TouchableOpacity
              style={styles.addSocialChip}
              onPress={() => setShowInstagramInput(true)}
            >
              <Instagram size={16} color="#E4405F" />
              <Text style={styles.addSocialChipText}>Instagram</Text>
            </TouchableOpacity>
          )}
          {isEditing && !telegram && (
            <TouchableOpacity
              style={styles.addSocialChip}
              onPress={() => setShowTelegramInput(true)}
            >
              <Send size={16} color="#0088cc" />
              <Text style={styles.addSocialChipText}>Telegram</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isEditing && (
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.CARD_BG} />
          ) : (
            <Text style={styles.saveButtonText}>{t('saveChanges')}</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={18} color="#FF3B30" strokeWidth={2.5} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>

      <Modal visible={showAgePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectAge')}</Text>
              <TouchableOpacity onPress={() => setShowAgePicker(false)}>
                <X size={24} color={COLORS.TEXT_DARK} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {AGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, age === option && styles.optionSelected]}
                  onPress={() => {
                    setAge(option);
                    setShowAgePicker(false);
                  }}
                >
                  <Text
                    style={[styles.optionText, age === option && styles.optionTextSelected]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showGenderPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectGender')}</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <X size={24} color={COLORS.TEXT_DARK} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, gender === option && styles.optionSelected]}
                  onPress={() => {
                    setGender(option);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text
                    style={[styles.optionText, gender === option && styles.optionTextSelected]}
                  >
                    {t(option as any)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showLanguagePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguages')}</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <X size={24} color={COLORS.TEXT_DARK} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {LANGUAGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    languages.includes(option) && styles.optionSelected,
                  ]}
                  onPress={() => toggleLanguage(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      languages.includes(option) && styles.optionTextSelected,
                    ]}
                  >
                    {t(option as any)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={styles.doneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showInstagramInput} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Instagram</Text>
              <TouchableOpacity onPress={() => setShowInstagramInput(false)}>
                <X size={24} color={COLORS.TEXT_DARK} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="instagram_username"
                placeholderTextColor="#AAAAAA"
                value={instagram}
                onChangeText={setInstagram}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowInstagramInput(false)}
              >
                <Text style={styles.doneButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTelegramInput} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Telegram</Text>
              <TouchableOpacity onPress={() => setShowTelegramInput(false)}>
                <X size={24} color={COLORS.TEXT_DARK} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="@telegram_username"
                placeholderTextColor="#AAAAAA"
                value={telegram}
                onChangeText={setTelegram}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowTelegramInput(false)}
              >
                <Text style={styles.doneButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  editButton: {
    fontSize: 15,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '600',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  section: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#AAAAAA',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.CARD_BG,
    fontWeight: '500',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_ORANGE,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: 13,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '500',
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.INPUT_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
  },
  socialChipText: {
    fontSize: 13,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  addSocialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.INPUT_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    borderStyle: 'dashed',
  },
  addSocialChipText: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.CARD_BG,
    fontSize: 17,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: COLORS.CARD_BG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_COLOR,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  modalScroll: {
    padding: 20,
  },
  modalBody: {
    padding: 20,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  optionSelected: {
    backgroundColor: '#FFF3E0',
  },
  optionText: {
    fontSize: 15,
    color: COLORS.TEXT_DARK,
  },
  optionTextSelected: {
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '600',
  },
  doneButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.CARD_BG,
  },
  languageSwitcher: {
    flexDirection: 'row',
    gap: 12,
  },
  langButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.BG_SECONDARY,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  langButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  langButtonTextActive: {
    color: COLORS.CARD_BG,
  },
});
