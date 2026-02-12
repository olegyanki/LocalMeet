import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Search } from 'lucide-react-native';
import { useI18n } from '@shared/i18n';
import { COLORS, LANGUAGES, SIZES, SHADOW, type Language } from '@shared/constants';

interface LanguagePickerModalProps {
  visible: boolean;
  selectedLanguages: string[];
  onClose: () => void;
  onConfirm: (languages: string[]) => void;
}

export default function LanguagePickerModal({
  visible,
  selectedLanguages,
  onClose,
  onConfirm,
}: LanguagePickerModalProps) {
  const { t } = useI18n();
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>(selectedLanguages);

  const panResponder = useRef(
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

  useEffect(() => {
    if (visible) {
      setTempSelected(selectedLanguages);
      setSearchQuery('');
      panY.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

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

  const handleConfirm = () => {
    onConfirm(tempSelected);
    handleClose();
  };

  const toggleLanguage = (code: string) => {
    setTempSelected((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const filteredLanguages = LANGUAGES.filter((lang) =>
    t(lang.nameKey as any).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLanguagesData = LANGUAGES.filter((lang) =>
    tempSelected.includes(lang.code) &&
    t(lang.nameKey as any).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unselectedLanguagesData = filteredLanguages.filter(
    (lang) => !tempSelected.includes(lang.code)
  );

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
              transform: [{ translateY: Animated.add(slideAnim, panY) }],
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={{ width: 60 }} />
            <Text style={styles.title}>{t('selectLanguages')}</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Search size={20} color={COLORS.TEXT_LIGHT} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('searchLanguages')}
                placeholderTextColor={COLORS.TEXT_LIGHT}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {selectedLanguagesData.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('selected').toUpperCase()}</Text>
                <View style={styles.languageList}>
                  {selectedLanguagesData.map((lang) => (
                    <Pressable
                      key={lang.code}
                      style={styles.languageItem}
                      onPress={() => toggleLanguage(lang.code)}
                    >
                      <View style={styles.languageInfo}>
                        <Text style={styles.flag}>{lang.flag}</Text>
                        <Text style={styles.languageName}>{t(lang.nameKey as any)}</Text>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          tempSelected.includes(lang.code) && styles.checkboxChecked,
                        ]}
                      >
                        {tempSelected.includes(lang.code) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('allLanguages').toUpperCase()}</Text>
              <View style={styles.languageList}>
                {unselectedLanguagesData.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={styles.languageItem}
                    onPress={() => toggleLanguage(lang.code)}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={styles.flag}>{lang.flag}</Text>
                      <Text style={styles.languageName}>{t(lang.nameKey as any)}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        tempSelected.includes(lang.code) && styles.checkboxChecked,
                      ]}
                    >
                      {tempSelected.includes(lang.code) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheet: {
    backgroundColor: COLORS.BG_SECONDARY,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 8,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 6,
    backgroundColor: COLORS.BORDER_COLOR,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_LIGHT,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  languageList: {
    gap: 10,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderColor: COLORS.ACCENT_ORANGE,
  },
  checkmark: {
    color: COLORS.CARD_BG,
    fontSize: 14,
    fontWeight: '700',
  },
});
