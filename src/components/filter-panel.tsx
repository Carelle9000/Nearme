import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useDiscoverFilters } from '../context/discover-filters-context';
import { useDiscover } from '../context/discover-context';
import { locationService } from '../services/location.service';
import { Colors } from '../constants/theme';

export function FilterPanel() {
  const { filters, updateFilters, resetFilters } = useDiscoverFilters();
  const { applyFilters, loadNearbyProfiles } = useDiscover();
  const [showModal, setShowModal] = useState(false);
  // Bug #9: remember the distance at open time to detect a real change on apply.
  const distanceAtOpenRef = useRef<number>(filters.maxDistance);

  const handleAgeChange = (ages: number[]) => {
    updateFilters({
      minAge: ages[0],
      maxAge: ages[1],
    });
  };

  const handleDistanceChange = (distance: number) => {
    updateFilters({ maxDistance: distance });
  };

  const handleApplyFilters = async () => {
    applyFilters(filters);
    setShowModal(false);

    // Bug #9: if the distance radius changed, reload from the server so we don't
    // just re-filter a stale set of nearby profiles.
    if (filters.maxDistance !== distanceAtOpenRef.current) {
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc) {
          await loadNearbyProfiles(loc.latitude, loc.longitude);
        }
      } catch (err) {
        console.error('[FilterPanel] Failed to reload profiles on distance change:', err);
      }
    }
  };

  const handleOpenModal = () => {
    distanceAtOpenRef.current = filters.maxDistance;
    setShowModal(true);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  return (
    <>
      <TouchableOpacity style={styles.filterButton} onPress={handleOpenModal}>
        <Ionicons name="funnel" size={20} color="#fff" />
        <Text style={styles.filterButtonText}>Filtres</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtres</Text>
            <TouchableOpacity onPress={handleResetFilters}>
              <Text style={styles.modalResetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Age Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Plage d&apos;âge</Text>
              <Text style={styles.filterValue}>
                {filters.minAge} - {filters.maxAge} ans
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Âge minimum: {filters.minAge}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={18}
                  maximumValue={65}
                  step={1}
                  value={filters.minAge}
                  onValueChange={(value) =>
                    handleAgeChange([value, filters.maxAge])
                  }
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                />
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Âge maximum: {filters.maxAge}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={18}
                  maximumValue={65}
                  step={1}
                  value={filters.maxAge}
                  onValueChange={(value) =>
                    handleAgeChange([filters.minAge, value])
                  }
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                />
              </View>
            </View>

            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Distance maximale</Text>
              <Text style={styles.filterValue}>{filters.maxDistance} km</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={5}
                  maximumValue={500}
                  step={5}
                  value={filters.maxDistance}
                  onValueChange={handleDistanceChange}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                />
              </View>
            </View>

            {/* Gender Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Genre</Text>
              <View style={styles.genderOptions}>
                {[
                  { key: 'male' as const, label: 'Homme' },
                  { key: 'female' as const, label: 'Femme' },
                  { key: 'other' as const, label: 'Autre' },
                  { key: 'all' as const, label: 'Tous' },
                ].map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.genderButton,
                      filters.gender === key && styles.genderButtonActive,
                    ]}
                    onPress={() => updateFilters({ gender: key })}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        filters.gender === key && styles.genderButtonTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    gap: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalResetText: {
    fontSize: 16,
    color: Colors.primary,
  },
  modalContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  filterValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    backgroundColor: Colors.cardSurface,
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  applyButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
