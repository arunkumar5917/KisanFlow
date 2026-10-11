import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { api } from '../../services/api';
import { Slot } from '../../types';

interface SlotBookingScreenProps {
  centreId: string;
  cropCode: string;
  farmerId: string;
  farmId: string;
  quantityQuintals: number;
  onBookingCreated: (booking: any) => void;
}

export const SlotBookingScreen = ({
  centreId,
  cropCode,
  farmerId,
  farmId,
  quantityQuintals,
  onBookingCreated,
}: SlotBookingScreenProps) => {
  const { t } = useLanguage();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const loadSlots = async () => {
    try {
      const response = await api.getCentreSlots(centreId, selectedDate.toISOString().split('T')[0]);
      setSlots(response.data);
    } catch (error) {
      // Mock data
      setSlots([
        { id: 'slot-1', centreId, date: selectedDate.toISOString(), startTime: '09:00', endTime: '11:00', maxCapacity: 25, bookedCount: 8, isActive: true, remainingCapacity: 17 },
        { id: 'slot-2', centreId, date: selectedDate.toISOString(), startTime: '11:00', endTime: '13:00', maxCapacity: 25, bookedCount: 15, isActive: true, remainingCapacity: 10 },
        { id: 'slot-3', centreId, date: selectedDate.toISOString(), startTime: '13:00', endTime: '15:00', maxCapacity: 25, bookedCount: 20, isActive: true, remainingCapacity: 5 },
        { id: 'slot-4', centreId, date: selectedDate.toISOString(), startTime: '15:00', endTime: '17:00', maxCapacity: 25, bookedCount: 5, isActive: true, remainingCapacity: 20 },
      ]);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.createBooking({
        farmer_id: farmerId,
        farm_id: farmId,
        centre_id: centreId,
        slot_id: selectedSlot.id,
        crop_code: cropCode,
        quantity_quintals: quantityQuintals,
      });
      onBookingCreated(response.data);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to book slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title={t('farmer.slotBooking')} showBack />
      
      <View style={styles.dateSelector}>
        <Text style={styles.dateLabel}>{t('farmer.selectSlot')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                  {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.slotsContainer}>
        <Text style={styles.sectionTitle}>
          {formatDate(selectedDate)} - {t('farmer.availableSlots')} ({slots.filter(s => s.isActive).length})
        </Text>
        {slots.filter(s => s.isActive).map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.slotCard,
              selectedSlot?.id === slot.id && styles.slotCardSelected,
              slot.remainingCapacity === 0 && styles.slotCardFull,
            ]}
            onPress={() => slot.remainingCapacity > 0 && setSelectedSlot(slot)}
            disabled={slot.remainingCapacity === 0}
          >
            <View style={styles.slotTime}>
              <Text style={styles.slotTimeText}>{slot.startTime} - {slot.endTime}</Text>
            </View>
            <View style={styles.slotCapacity}>
              <Text style={styles.capacityText}>
                {slot.remainingCapacity} / {slot.maxCapacity} {t('common.availableSlots').toLowerCase()}
              </Text>
              <View style={[
                styles.capacityBar,
                slot.remainingCapacity === 0 && styles.capacityBarFull,
              ]}>
                <View
                  style={[
                    styles.capacityFill,
                    { width: `${(slot.remainingCapacity / slot.maxCapacity) * 100}%` },
                  ]}
                />
              </View>
            </View>
            {slot.remainingCapacity === 0 && (
              <Text style={styles.slotFullText}>{t('farmer.availableSlots').toUpperCase()} - FULL</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedSlot && (
        <View style={styles.bottomAction}>
          <Button
            title={`${t('common.confirm')} ${selectedSlot.startTime} - ${selectedSlot.endTime}`}
            onPress={handleBookSlot}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  dateSelector: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B4F72',
    marginBottom: 12,
  },
  dateButton: {
    width: 56,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateButtonSelected: {
    backgroundColor: '#1B4F72',
    borderColor: '#1B4F72',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  slotsContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4F72',
    marginBottom: 12,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotCardSelected: {
    borderColor: '#1B4F72',
    backgroundColor: '#E8F0FE',
  },
  slotCardFull: {
    opacity: 0.5,
  },
  slotTime: {
    flex: 1,
  },
  slotTimeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  slotCapacity: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 120,
  },
  capacityText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'right',
  },
  capacityBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityBarFull: {
    backgroundColor: '#FEF2F2',
  },
  capacityFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  slotFullText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 8,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});