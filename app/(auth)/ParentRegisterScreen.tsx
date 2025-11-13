// src/screens/auth/ParentRegisterScreen.tsx
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

export default function ParentRegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    relationship: '',
    occupation: '',
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        ...formData,
        role: 'parent',
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });
      Alert.alert(
        'Success',
        'Registration successful! You can now link your children to your account.',
        [{ text: 'OK' }]
      );
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
          <Text style={styles.title}>Parent Registration</Text>
          <Text style={styles.subtitle}>Create your parent/guardian account</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            After registration, you'll be able to link your children's accounts and monitor their progress.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            error={errors.name}
            leftIcon="person-outline"
          />

          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <Input
            label="Phone Number"
            placeholder="0712345678"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            error={errors.phone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
            helperText="This will be used for M-PESA payments"
          />

          <Input
            label="Relationship (Optional)"
            placeholder="e.g., Father, Mother, Guardian"
            value={formData.relationship}
            onChangeText={(text) => updateField('relationship', text)}
            leftIcon="people-outline"
          />

          <Input
            label="Occupation (Optional)"
            placeholder="Enter your occupation"
            value={formData.occupation}
            onChangeText={(text) => updateField('occupation', text)}
            leftIcon="briefcase-outline"
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
            variant="primary"
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
    marginBottom: spacing.lg,
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
  infoBox: {
    backgroundColor: colors.primary.yellow + '20',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.yellow,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
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