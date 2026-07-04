import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '@/constants/theme';

interface DatePickerInputProps {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  disabled?: boolean;
}

export function DatePickerInput({
  value,
  onChange,
  maximumDate,
  minimumDate,
  disabled = false,
}: DatePickerInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);

  const handleDateChange = (field: 'day' | 'month' | 'year', newValue: number) => {
    const newDate = new Date(selectedDate);

    if (field === 'day') {
      newDate.setDate(newValue);
    } else if (field === 'month') {
      newDate.setMonth(newValue - 1);
    } else if (field === 'year') {
      newDate.setFullYear(newValue);
    }

    if (maximumDate && newDate > maximumDate) {
      return;
    }
    if (minimumDate && newDate < minimumDate) {
      return;
    }

    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onChange(selectedDate);
    setShowPicker(false);
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <View>
      <TouchableOpacity
        style={[styles.dateButton, disabled && styles.disabled]}
        onPress={() => setShowPicker(true)}
        disabled={disabled}
      >
        <Ionicons name="calendar" size={20} color={Colors.primary} />
        <Text style={styles.dateButtonText}>
          {value.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select date</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerRow}>
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.columnLabel}>Day</Text>
                <ScrollView style={styles.scrollPicker}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDate.getDate() === day && styles.pickerItemSelected,
                      ]}
                      onPress={() => handleDateChange('day', day)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDate.getDate() === day && styles.pickerItemTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.columnLabel}>Month</Text>
                <ScrollView style={styles.scrollPicker}>
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        selectedDate.getMonth() + 1 === month && styles.pickerItemSelected,
                      ]}
                      onPress={() => handleDateChange('month', month)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDate.getMonth() + 1 === month && styles.pickerItemTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.columnLabel}>Year</Text>
                <ScrollView style={styles.scrollPicker}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedDate.getFullYear() === year && styles.pickerItemSelected,
                      ]}
                      onPress={() => handleDateChange('year', year)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDate.getFullYear() === year && styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: Colors.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  pickerRow: {
    flexDirection: 'row',
    height: 250,
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollPicker: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.base,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: Colors.text,
    fontWeight: '700',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
