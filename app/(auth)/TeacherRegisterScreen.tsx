// src/screens/auth/TeacherRegisterScreen.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { colors, fontSize, fontWeight, spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TeacherRegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    staff_number: '',
    subject_specialization: '',
    school_name: '',
    qualification: '',
    experience_years: '',
    dob: '',
    gender: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(?:254|\+254|0)?[17]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Kenyan phone number';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    if (!formData.staff_number.trim()) {
      newErrors.staff_number = 'Staff number is required';
    }
    if (!formData.subject_specialization.trim()) {
      newErrors.subject_specialization = 'Subject specialization is required';
    }
    if (!formData.qualification.trim()) {
      newErrors.qualification = 'Qualification is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      /*
      await register({
        ...formData,
        role: 'teacher',
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        experience_years: parseInt(formData.experience_years) || 0,
      });*/
      Alert.alert('Success', 'Registration successful! Welcome to Elimi Hub.');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Teacher Registration</Text>
          <Text style={styles.subtitle}>Create your educator account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
         

          <Text style={styles.sectionTitle}>Professional Details</Text>

          <Input
            label="Staff Number"
            placeholder="Enter your staff number"
            value={formData.staff_number}
            onChangeText={(text) => updateField('staff_number', text)}
            error={errors.staff_number}
            leftIcon="card-outline"
          />

          <Input
            label="Subject Specialization"
            placeholder="e.g., Mathematics, English"
            value={formData.subject_specialization}
            onChangeText={(text) => updateField('subject_specialization', text)}
            error={errors.subject_specialization}
            leftIcon="book-outline"
          />

          <Input
            label="Qualification"
            placeholder="e.g., Bachelor of Education"
            value={formData.qualification}
            onChangeText={(text) => updateField('qualification', text)}
            error={errors.qualification}
            leftIcon="ribbon-outline"
          />

          <Input
            label="Years of Experience"
            placeholder="Enter years of teaching experience"
            value={formData.experience_years}
            onChangeText={(text) => updateField('experience_years', text)}
            keyboardType="numeric"
            leftIcon="time-outline"
          />

          <Input
            label="School Name (Optional)"
            placeholder="Enter your school name"
            value={formData.school_name}
            onChangeText={(text) => updateField('school_name', text)}
            leftIcon="business-outline"
          />

          <Text style={styles.sectionTitle}>Security</Text>

          <Input
            label="Password"
            placeholder="Create a strong password"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            error={errors.password}
            secureTextEntry
            leftIcon="lock-closed-outline"
            helperText="Min 8 characters with uppercase, lowercase & number"
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={formData.password_confirmation}
            onChangeText={(text) => updateField('password_confirmation', text)}
            error={errors.password_confirmation}
            secureTextEntry
            leftIcon="lock-closed-outline"
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            fullWidth
            size="large"
            variant="secondary"
          />

          <Button
            title="Back to Role Selection"
            onPress={() => router.back()}
            fullWidth
            variant="ghost"
            size="small"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  form: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});