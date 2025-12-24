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
import { useI18n } from '@shared/i18n';

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

  const SUGGESTED_INTERESTS = [
    t('interestSport'),
    t('interestMusic'),
    t('interestMovies'),
    t('interestTravel'),
    t('interestFood'),
    t('interestPhotography'),
    t('interestArt'),
    t('interestTech'),
    t('interestBooks'),
    t('interestGames'),
    t('interestNature'),
    t('interestDance'),
    t('interestYoga'),
    t('interestCooking'),
    t('interestFashion'),
    t('interestVolleyball'),
    t('interestFootball'),
    t('interestBasketball'),
    t('interestRunning'),
    t('interestCycling'),
    t('interestSwimming'),
    t('interestFitness'),
    t('interestMeditation'),
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      onInterestsChange(selectedInterests.filter((i) => i !== interest));
    } else {
      onInterestsChange([...selectedInterests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    onInterestsChange(selectedInterests.filter((i) => i !== interest));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('interestsLabel')}</Text>

      {selectedInterests.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedInterests.map((interest) => (
            <View key={interest} style={styles.selectedTag}>
              <Text style={styles.selectedTagText}>{interest}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => removeInterest(interest)}>
                  <X size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {isEditing && (
        <>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Plus size={16} color="#FF9500" />
            <Text style={styles.addButtonText}>{t('addInterest')}</Text>
          </TouchableOpacity>

          <Modal visible={showModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('selectInterests')}</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <X size={24} color="#333333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <View style={styles.tagsGrid}>
                    {SUGGESTED_INTERESTS.map((interest) => (
                      <TouchableOpacity
                        key={interest}
                        style={[
                          styles.tag,
                          selectedInterests.includes(interest) && styles.tagSelected,
                        ]}
                        onPress={() => toggleInterest(interest)}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            selectedInterests.includes(interest) && styles.tagTextSelected,
                          ]}
                        >
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    ))}
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
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
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
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF9500',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
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
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
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
    borderColor: '#E8E8E8',
  },
  tagSelected: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  tagText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  doneButton: {
    margin: 20,
    backgroundColor: '#FF9500',
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
