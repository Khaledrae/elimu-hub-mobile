// (auth)/login.tsx
import PlatformIcon from "@/src/components/ui/PlatformIcon";
import { showError, showSuccess } from "@/src/utils/alerts";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../src/components/ui/Button";
import { Input } from "../../src/components/ui/Input";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
} from "../../src/constants/theme";
import { useAuth } from "../../src/contexts/AuthContext";
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log("Logging in with:", { email: email.trim(), password });
      var response = await login({ email: email.trim(), password });
      console.log("Logging in Resp:", { response });
      showSuccess(
        "Login Successful",
        `You have logged in successfully ${response.user.first_name}.`
      );
      // Navigation will be handled by the auth state change
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      showError("Login Failed", err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {/* Placeholder for logo */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>ELIMU HUB</Text>
          </View>

          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue learning</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text: string) => {
              setPassword(text);
              if (errors.password)
                setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
          />

          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <PlatformIcon
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            fullWidth
            size="large"
            variant="primary"
          />

          <Button
            title="Forgot Password?"
            onPress={() => {
              Alert.alert(
                "Coming Soon",
                "Password recovery feature will be available soon."
              );
            }}
            fullWidth
            variant="ghost"
            size="small"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Button
            title="Sign Up"
            onPress={() => router.push("/(auth)/role-selection" as any)}
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
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },

  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "41%", // Center vertically
    marginTop: 12, // Adjust based on your input height
    padding: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["3xl"],
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  title: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
});
