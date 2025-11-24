// app/(auth)/register.tsx
/*
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, spacing } from '../../src/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) return alert('Fill all required fields');
    if (form.password !== form.confirmPassword) return alert('Passwords do not match');

    try {
      setLoading(true);
      const response = await fetch('https://your-backend-url/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: role ?? 'student',
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        console.log('Error:', data);
        alert(data.message || 'Registration failed');
        return;
      }

      alert('Registration successful!');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Try again later.');
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Register as {role ?? 'Student'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={form.name}
        onChangeText={(text) => handleChange('name', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={form.phone}
        onChangeText={(text) => handleChange('phone', text)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(text) => handleChange('password', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={form.confirmPassword}
        onChangeText={(text) => handleChange('confirmPassword', text)}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  header: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
  },
  button: {
    backgroundColor: colors.primary.yellow,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  linkText: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primary.yellow,
  },
});*/
