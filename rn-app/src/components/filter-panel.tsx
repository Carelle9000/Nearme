import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Slider,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDiscoverFilters } from '../context/discover-filters-context';

export function FilterPanel() {
  const { filters, updateFilters, resetFilters } = useDiscoverFilters();
  const [showModal, setShowModal] = useState(false);

  const handleAgeChange = (ages: number[]) => {
    updateFilters({
      minAge: ages[0],
      maxAge: ages[1],
    });
  };

  const handleDistanceChange = (distance: number) => {
    updateFilters({ maxDistance: distance });
  };

  return (
    <>
      <TouchableOpacity style={styles.filterButton} onPress={() => setShowModal(true)}>
        <Ionicons name="funnel" size={20} color="#fff" />
        <Text style={styles.filterButtonText}>Filters</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.modalResetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Age Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Age Range</Text>
              <Text style={styles.filterValue}>
                {filters.minAge} - {filters.maxAge} years
              </Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={18}
                  maximumValue={65}
                  step={1}
                  value={filters.minAge}
                  onValueChange={(value) =>
                    handleAgeChange([value, filters.maxAge])
                  }
                  minimumTrackTintColor="#FF1744"
                  maximumTrackTintColor="#f0f0f0"
                />
              </View>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={18}
                  maximumValue={65}
                  step={1}
                  value={filters.maxAge}
                  onValueChange={(value) =>
                    handleAgeChange([filters.minAge, value])
                  }
                  minimumTrackTintColor="#FF1744"
                  maximumTrackTintColor="#f0f0f0"
                />
              </View>
            </View>

            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Maximum Distance</Text>
              <Text style={styles.filterValue}>{filters.maxDistance} km</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={5}
                  maximumValue={100}
                  step={5}
                  value={filters.maxDistance}
                  onValueChange={handleDistanceChange}
                  minimumTrackTintColor="#FF1744"
                  maximumTrackTintColor="#f0f0f0"
                />
              </View>
            </View>

            {/* Gender Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Gender</Text>
              <View style={styles.genderOptions}>
                {['male', 'female', 'other', 'all'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      filters.gender === gender && styles.genderButtonActive,
                    ]}
                    onPress={() => updateFilters({ gender: gender as any })}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        filters.gender === gender && styles.genderButtonTextActive,
                      ]}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    backgroundColor: '#FF1744',
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
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalResetText: {
    fontSize: 16,
    color: '#FF1744',
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
    color: '#000',
    marginBottom: 12,
  },
  filterValue: {
    fontSize: 14,
    color: '#FF1744',
    fontWeight: '600',
    marginBottom: 12,
  },
  sliderContainer: {
    marginBottom: 12,
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
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    backgroundColor: '#FF1744',
    borderColor: '#FF1744',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  applyButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 14,
    backgroundColor: '#FF1744',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
