import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { Plus, X } from 'lucide-react-native';

// Contexts & Hooks
import { useI18n } from '@shared/i18n';

// Constants
import { COLORS, ALL_INTERESTS, getInterestByKey } from '@shared/constants';

interface InterestPickerProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  isEditing: boolean;
}

export default function InterestPicker({
  selectedInterests,
  onInterestsChange,
  isEditing,
}: InterestPickerProps) {
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);

  const toggleInterest = (interestKey: string) => {
    if (selectedInterests.includes(interestKey)) {
      onInterestsChange(selectedInterests.filter((i) => i !== interestKey));
    } else {
      onInterestsChange([...selectedInterests, interestKey]);
    }
  };

  const removeInterest = (interestKey: string) => {
    onInterestsChange(selectedInterests.filter((i) => i !== interestKey));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('interestsLabel')}</Text>

      {selectedInterests.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedInterests.map((interestKey) => {
            const interest = getInterestByKey(interestKey);
            if (!interest) return null;
            
            return (
              <View key={interestKey} style={styles.selectedTag}>
                <Text style={styles.selectedTagText}>
                  {interest.emoji} {t(interest.key as any)}
                </Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => removeInterest(interestKey)}>
                    <X size={14} color={COLORS.WHITE} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {isEditing && (
        <>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Plus size={16} color={COLORS.ACCENT_ORANGE} />
            <Text style={styles.addButtonText}>{t('addInterest')}</Text>
          </TouchableOpacity>

          <Modal visible={showModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('selectInterests')}</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <X size={24} color={COLORS.TEXT_DARK} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <View style={styles.tagsGrid}>
                    {ALL_INTERESTS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest.key);
                      return (
                        <TouchableOpacity
                          key={interest.key}
                          style={[
                            styles.tag,
                            isSelected && styles.tagSelected,
                          ]}
                          onPress={() => toggleInterest(interest.key)}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              isSelected && styles.tagTextSelected,
                            ]}
                          >
                            {interest.emoji} {t(interest.key as any)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.doneButtonText}>{t('done')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 12,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 13,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WARNING_BG,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_ORANGE,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
  },
  tagSelected: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderColor: COLORS.ACCENT_ORANGE,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: COLORS.WHITE,
  },
  doneButton: {
    margin: 20,
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});
