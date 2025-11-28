// src/components/auth/AuthGuard.tsx
import { colors, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole, 
  fallback 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
      
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
        return;
      }

      // If role is required but user doesn't have it
      if (requiredRole && user) {
        const userRole = user.role;
        const hasRequiredRole = Array.isArray(requiredRole) 
          ? requiredRole.includes(userRole)
          : requiredRole === userRole;

        if (!hasRequiredRole) {
          router.replace('/unauthorized');
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole]);

  // Show loading while checking authentication
  if (isLoading || !authChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.yellow} />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // If not authenticated, show nothing (redirect will happen)
  if (!isAuthenticated) {
    return fallback || null;
  }

  // Check role permissions if required
  if (requiredRole && user) {
    const userRole = user.role;
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? requiredRole.includes(userRole)
      : requiredRole === userRole;

    if (!hasRequiredRole) {
      return fallback || null;
    }
  }

  // User is authenticated and has required role (if any)
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
});