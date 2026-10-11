import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { GRIEVANCE_TYPES, type GrievanceType } from '../../services/disputeService';

interface Props {
  onSubmit: (type: GrievanceType, description: string) => void;
  onCancel: () => void;
}

const TYPES = Object.entries(GRIEVANCE_TYPES) as [GrievanceType, typeof GRIEVANCE_TYPES[GrievanceType]][];

export function DisputeForm({ onSubmit, onCancel }: Props) {
  const [selectedType, setSelectedType] = useState<GrievanceType | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (selectedType && description.trim()) {
      onSubmit(selectedType, description.trim());
    }
  };

  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.header}>
        <MaterialIcons name="report-problem" size={22} color={Colors.error} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>File a Grievance</Text>
          <Text style={styles.titleTa}>புகார் பதிவு செய்யுங்கள்</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Select Issue Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.typeRow}>
          {TYPES.map(([key, cfg]) => (
            <Pressable
              key={key}
              onPress={() => setSelectedType(key)}
              style={[
                styles.typeChip,
                selectedType === key && styles.typeChipActive,
              ]}
            >
              <MaterialIcons
                name={cfg.icon as any}
                size={18}
                color={selectedType === key ? Colors.textWhite : Colors.primary}
              />
              <Text style={[styles.typeText, selectedType === key && styles.typeTextActive]}>
                {cfg.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.sectionLabel}>Describe Your Issue</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={4}
        placeholder="What happened? Include details like date, counter number, etc."
        placeholderTextColor={Colors.textMuted}
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          style={[styles.submitBtn, (!selectedType || !description.trim()) && styles.submitDisabled]}
          disabled={!selectedType || !description.trim()}
        >
          <MaterialIcons name="send" size={16} color={Colors.textWhite} />
          <Text style={styles.submitText}>Submit Grievance</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  titleTa: { fontSize: FontSize.xs, color: Colors.textMuted },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surfaceTint,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  typeTextActive: { color: Colors.textWhite },
  textArea: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.sm, minHeight: 80, fontSize: FontSize.sm,
    color: Colors.textPrimary, textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semiBold },
  submitBtn: {
    flex: 2, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.primary,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textWhite },
});
