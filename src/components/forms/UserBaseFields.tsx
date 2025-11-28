// src/components/forms/UserBaseFields.tsx
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../constants/theme';
import { Input } from '../ui/Input';

export interface UserBaseFieldsProps {
  formData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    county: string;
  };
  errors: Record<string, string>;
  updateField: (field: string, value: string) => void;
  counties: Array<{ id: number; name: string }>;
}
export default function UserBaseFields({
  formData,
  errors,
  updateField,
  counties,
}: UserBaseFieldsProps) {
  return (
    <View>
      <Input
        label="First Name"
        placeholder="Enter first name"
        value={formData.first_name}
        onChangeText={(v) => updateField("first_name", v)}
        error={errors.first_name}
      />

      <Input
        label="Last Name"
        placeholder="Enter last name"
        value={formData.last_name}
        onChangeText={(v) => updateField("last_name", v)}
        error={errors.last_name}
      />

      <Input
        label="Email"
        placeholder="Enter email"
        value={formData.email}
        onChangeText={(v) => updateField("email", v)}
        error={errors.email}
        keyboardType="email-address"
      />

      <Input
        label="Phone Number"
        placeholder="0712345678"
        value={formData.phone}
        onChangeText={(v) => updateField("phone", v)}
        error={errors.phone}
        keyboardType="phone-pad"
      />

      {/* County Picker */}
      <Text style={styles.label}>County</Text>

      <Picker
        selectedValue={formData.county}
        onValueChange={(v) => updateField("county", v)}
        style={styles.picker}
      >
        <Picker.Item label="Select county..." value="" />

        {counties.map((county) => (
          <Picker.Item key={county.id} label={county.name} value={county.id} />
        ))}
      </Picker>

      {errors.county_id && <Text style={styles.error}>{errors.county_id}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 5,
    marginTop: spacing.md,
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  error: {
    color: "red",
    marginBottom: spacing.sm,
  },
});
