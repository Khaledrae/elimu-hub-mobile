// src/screens/auth/StudentRegisterScreen.tsx
import authService from "@/src/services/authService";
import { useRouter } from "expo-router";

import UserBaseFields from "@/src/components/forms/UserBaseFields";
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

export default function StudentRegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [counties, setCounties] = useState<{ id: number; name: string }[]>([]);

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

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    county: "",
    password: "",
    password_confirmation: "",
    admission_number: "",
    grade_level: "",
    school_name: "",
    dob: "",
    gender: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const phoneRegex = /^(?:\+254|254|0)([17]\d{8})$/;

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };
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
        "Password must contain uppercase, lowercase, and a number";
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match";
    }

    if (!formData.admission_number.trim()) {
      newErrors.admission_number = "Admission number is required";
    }

    if (!formData.grade_level.trim()) {
      newErrors.grade_level = "Grade level is required";
    }

    if (!formData.county) {
      newErrors.county = "County is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
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
        role: "student",
        email: formData.email.trim(),
        county: Number(formData.county),
      });

      Alert.alert("Success", "Registration successful! Welcome to Elimi Hub.");
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
          <Text style={styles.title}>Student Registration</Text>
          <Text style={styles.subtitle}>Create your student account</Text>
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
            label="Date of Birth"
            placeholder="DD/MM/YYYY"
            value={formData.dob}
            onChangeText={(text) => updateField("dob", text)}
            error={errors.dob}
            leftIcon="calendar-outline"
          />

          <Input
            label="Gender"
            placeholder="Male/Female/Other"
            value={formData.gender}
            onChangeText={(text) => updateField("gender", text)}
            error={errors.gender}
            leftIcon="male-female-outline"
          />
          <View style={{ marginBottom: 20 }}></View>

          <Text style={styles.sectionTitle}>Academic Details</Text>

          <Input
            label="Admission Number"
            placeholder="Enter your admission number"
            value={formData.admission_number}
            onChangeText={(text) => updateField("admission_number", text)}
            error={errors.admission_number}
            leftIcon="card-outline"
          />

          <Input
            label="Grade Level"
            placeholder="e.g., Grade 5"
            value={formData.grade_level}
            onChangeText={(text) => updateField("grade_level", text)}
            error={errors.grade_level}
            leftIcon="school-outline"
          />

          <Input
            label="School Name (Optional)"
            placeholder="Enter your school name"
            value={formData.school_name}
            onChangeText={(text) => updateField("school_name", text)}
            leftIcon="business-outline"
          />

          <Text style={styles.sectionTitle}>Security</Text>

          <Input
            label="Password"
            placeholder="Create a strong password"
            value={formData.password}
            onChangeText={(text) => updateField("password", text)}
            error={errors.password}
            secureTextEntry
            leftIcon="lock-closed-outline"
            helperText="Min 8 characters with uppercase, lowercase & number"
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={formData.password_confirmation}
            onChangeText={(text) => updateField("password_confirmation", text)}
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
    paddingBottom: spacing["3xl"],
  },
  header: {
    marginBottom: spacing.xl,
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
