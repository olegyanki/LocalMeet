import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getProfile, updateProfile } from '../../lib/api';
import { signOut } from '../../lib/auth';
import { LogOut, Instagram, Send, Plus, X, ChevronDown } from 'lucide-react-native';
import AvatarPicker from '../../components/AvatarPicker';
import InterestPicker from '../../components/InterestPicker';

const BG_COLOR = '#F5F5F5';
const ACCENT_ORANGE = '#FF9500';
const TEXT_DARK = '#333333';
const TEXT_LIGHT = '#999999';
const INPUT_BG = '#FFFFFF';
const BORDER_COLOR = '#E8E8E8';

const AGE_OPTIONS = Array.from({ length: 63 }, (_, i) => (i + 18).toString());
const GENDER_OPTIONS = ['Чоловік', 'Жінка', 'Інше', 'Не вказано'];
const LANGUAGE_OPTIONS = [
  '🇺🇦 Українська',
  '🇬🇧 English',
  '🇪🇸 Español',
  '🇫🇷 Français',
  '🇩🇪 Deutsch',
  '🇮🇹 Italiano',
  '🇵🇱 Polski',
  '🇷🇺 Русский',
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await getProfile(user.id);
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setAge(data.age?.toString() || '');
        setGender(data.gender || '');
        setLanguages(data.languages || []);
        setInstagram(data.social_instagram || '');
        setTelegram(data.social_telegram || '');
        setLookingFor(data.looking_for || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || '');
      setLanguages(profile.languages || []);
      setInstagram(profile.social_instagram || '');
      setTelegram(profile.social_telegram || '');
      setLookingFor(profile.looking_for || '');
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
        social_instagram: instagram || null,
        social_telegram: telegram || null,
        looking_for: lookingFor || null,
      } as any);

      await loadProfile();
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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ACCENT_ORANGE} />
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
        <Text style={styles.title}>Мій профіль</Text>
        <TouchableOpacity onPress={() => isEditing ? handleCancel() : setIsEditing(true)}>
          <Text style={styles.editButton}>{isEditing ? 'Скасувати' : 'Редагувати'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AvatarPicker
        currentAvatar={avatarUrl}
        displayName={displayName || 'User'}
        onAvatarChange={setAvatarUrl}
        isEditing={isEditing}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Основна інформація</Text>

        <Text style={styles.label}>Ім'я</Text>
        <TextInput
          style={styles.input}
          placeholder="Ваше ім'я"
          placeholderTextColor="#AAAAAA"
          value={displayName}
          onChangeText={setDisplayName}
          editable={isEditing}
        />

        <Text style={styles.label}>Про себе</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Розкажіть про себе..."
          placeholderTextColor="#AAAAAA"
          value={bio}
          onChangeText={setBio}
          editable={isEditing}
          multiline
          numberOfLines={4}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Вік</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => isEditing && setShowAgePicker(true)}
              disabled={!isEditing}
            >
              <Text style={[styles.pickerText, !age && styles.placeholderText]}>
                {age || 'Виберіть вік'}
              </Text>
              {isEditing && <ChevronDown size={16} color={TEXT_LIGHT} />}
            </TouchableOpacity>
          </View>

          <View style={styles.halfInput}>
            <Text style={styles.label}>Стать</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => isEditing && setShowGenderPicker(true)}
              disabled={!isEditing}
            >
              <Text style={[styles.pickerText, !gender && styles.placeholderText]}>
                {gender || 'Виберіть стать'}
              </Text>
              {isEditing && <ChevronDown size={16} color={TEXT_LIGHT} />}
            </TouchableOpacity>
          </View>
        </View>

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Мови</Text>
        <View style={styles.chipsContainer}>
          {languages.map((lang) => (
            <View key={lang} style={styles.chip}>
              <Text style={styles.chipText}>{lang}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => toggleLanguage(lang)}>
                  <X size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity
              style={styles.addChip}
              onPress={() => setShowLanguagePicker(true)}
            >
              <Plus size={16} color={ACCENT_ORANGE} />
              <Text style={styles.addChipText}>Додати</Text>
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
        <Text style={styles.sectionTitle}>Що шукаю</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Наприклад: Друзів для спорту, подорожей..."
          placeholderTextColor="#AAAAAA"
          value={lookingFor}
          onChangeText={setLookingFor}
          editable={isEditing}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Соціальні мережі</Text>
        <View style={styles.chipsContainer}>
          {instagram && (
            <View style={styles.socialChip}>
              <Instagram size={16} color="#E4405F" />
              <Text style={styles.socialChipText}>{instagram}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => setInstagram('')}>
                  <X size={14} color={TEXT_DARK} />
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
                  <X size={14} color={TEXT_DARK} />
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Зберегти зміни</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#E74C3C" />
        <Text style={styles.logoutText}>Вийти</Text>
      </TouchableOpacity>

      <Modal visible={showAgePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Виберіть вік</Text>
              <TouchableOpacity onPress={() => setShowAgePicker(false)}>
                <X size={24} color={TEXT_DARK} />
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
              <Text style={styles.modalTitle}>Виберіть стать</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <X size={24} color={TEXT_DARK} />
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
                    {option}
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
              <Text style={styles.modalTitle}>Виберіть мови</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <X size={24} color={TEXT_DARK} />
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
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={styles.doneButtonText}>Готово</Text>
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
                <X size={24} color={TEXT_DARK} />
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
                <Text style={styles.doneButtonText}>Зберегти</Text>
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
                <X size={24} color={TEXT_DARK} />
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
                <Text style={styles.doneButtonText}>Зберегти</Text>
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
    backgroundColor: BG_COLOR,
  },
  content: {
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
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
    color: TEXT_DARK,
  },
  editButton: {
    fontSize: 15,
    color: ACCENT_ORANGE,
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: TEXT_LIGHT,
    marginTop: 2,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_DARK,
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
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 14,
    color: TEXT_DARK,
  },
  placeholderText: {
    color: '#AAAAAA',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: ACCENT_ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    color: '#FFFFFF',
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
    borderColor: ACCENT_ORANGE,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: 13,
    color: ACCENT_ORANGE,
    fontWeight: '500',
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  socialChipText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  addSocialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderStyle: 'dashed',
  },
  addSocialChipText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: ACCENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
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
    backgroundColor: INPUT_BG,
  },
  optionSelected: {
    backgroundColor: '#FFF3E0',
  },
  optionText: {
    fontSize: 15,
    color: TEXT_DARK,
  },
  optionTextSelected: {
    color: ACCENT_ORANGE,
    fontWeight: '600',
  },
  doneButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: ACCENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
