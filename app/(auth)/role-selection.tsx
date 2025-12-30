// src/screens/auth/RoleSelectionScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, fontSize, fontWeight, shadows, spacing } from '../../src/constants/theme';

interface RoleOption {
  role: 'student' | 'teacher' | 'parent' | 'admin';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'student',
    title: 'Student',
    description: 'Access learning materials and track your progress',
    icon: 'school-outline',
    color: colors.primary.yellow,
  },
  {
    role: 'teacher',
    title: 'Teacher',
    description: 'Manage content and monitor student performance',
    icon: 'person-outline',
    color: colors.secondary.green,
  },
  {
    role: 'parent',
    title: 'Parent/Guardian',
    description: "View your child's progress and manage subscriptions",
    icon: 'people-outline',
    color: colors.status.info,
  },
  {
    role: 'admin',
    title: 'Administrator',
    description: 'Manage platform users and oversee operations',
    icon: 'settings-outline',
    color: colors.text.primary,
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: string) => {
    router.push(`/(auth)/register/${role}` as any);

  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>ELIMU HUB</Text>
        </View>
        
        <Text style={styles.title}>Join Elimu Hub</Text>
        <Text style={styles.subtitle}>Select your role to get started</Text>
      </View>

      <View style={styles.rolesContainer}>
        {roleOptions.map((option) => (
          <TouchableOpacity
            key={option.role}
            style={styles.roleCard}
            onPress={() => handleRoleSelect(option.role)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon} size={32} color={option.color} />
            </View>
            
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>{option.title}</Text>
              <Text style={styles.roleDescription}>{option.description}</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={24} color={colors.neutral.gray400} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('./login')}>
          <Text style={styles.footerLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    marginTop: spacing.xl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
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
    textAlign: 'center',
  },
  rolesContainer: {
    marginBottom: spacing.xl,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  roleDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  footerLink: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary.yellow,
  },
});