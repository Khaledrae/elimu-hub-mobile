// src/screens/auth/ParentRegisterScreen.tsx
//import { UserBaseFields } from "@/src/components/forms/UserBaseFields";
import UserBaseFields from "@/src/components/forms/UserBaseFields";
import authService from "@/src/services/authService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Button } from "../../../src/components/ui/Button";
import { Input } from "../../../src/components/ui/Input";
import {
    colors,
    fontSize,
    fontWeight,
    spacing,
} from "../../../src/constants/theme";
import { useAuth } from "../../../src/contexts/AuthContext";

export default function ParentRegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [counties, setCounties] = useState<{ id: number; name: string }[]>([]);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    county: "",
    password: "",
    password_confirmation: "",
    relationship: "",
    occupation: "",
  });

  useEffect(() => {
    const loadCounties = async () => {
      try {
        const data = await authService.getCounties();
        setCounties(data);
      } catch (error) {
        console.log("Failed to load counties:", error);
      }
    };

    loadCounties();
  }, []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };
  const phoneRegex = /^(?:\+254|254|0)([17]\d{8})$/;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";

    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Invalid Kenyan phone number";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match";
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
        role: 'parent',
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });*/
      Alert.alert(
        "Success",
        "Registration successful! You can now link your children to your account.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "An error occurred");
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Parent Registration</Text>
          <Text style={styles.subtitle}>
            Create your parent/guardian account
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            After registration, you'll be able to link your children's accounts
            and monitor their progress.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <UserBaseFields
            formData={formData}
            errors={errors}
            updateField={updateField}
            counties={counties}
          />
          <Input
            label="Relationship (Optional)"
            placeholder="e.g., Father, Mother, Guardian"
            value={formData.relationship}
            onChangeText={(text) => updateField("relationship", text)}
            leftIcon="people-outline"
          />

          <Input
            label="Occupation (Optional)"
            placeholder="Enter your occupation"
            value={formData.occupation}
            onChangeText={(text) => updateField("occupation", text)}
            leftIcon="briefcase-outline"
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
    paddingBottom: spacing["3xl"],
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  infoBox: {
    backgroundColor: colors.primary.yellow + "20",
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
