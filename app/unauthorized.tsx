// app/unauthorized.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function UnauthorizedScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleGoHome = () => {
    router.replace('/(tabs)/dashboard');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={80} color={colors.neutral.gray400} />
        </View>
        
        <Text style={styles.title}>Access Denied</Text>
        
        <Text style={styles.message}>
          Sorry, you don't have permission to access this page.
        </Text>

        {user && (
          <Text style={styles.userInfo}>
            Logged in as: {user.first_name} {user.last_name} ({user.role})
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            title="Go to Dashboard"
            onPress={handleGoHome}
            variant="primary"
            fullWidth
            size="large"
          />
          
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            fullWidth
            size="large"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  userInfo: {
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    textAlign: "center",
    marginBottom: spacing.xl,
    fontStyle: "italic",
  },
  actions: {
    width: "100%",
    gap: spacing.md,
  },
});