// src/screens/auth/AdminRegisterScreen.tsx
import UserBaseFields from "@/src/components/forms/UserBaseFields";
import authService from "@/src/services/authService";
import { Picker } from '@react-native-picker/picker';
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

export default function AdminRegisterScreen() {
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
    admin_level: "",
    school_id: ""
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
  const phoneRegex = /^(?:\+254|254|0)([17]\d{8})$/;

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear school_name when admin_level changes from "school"
    if (field === "admin_level" && value !== "school") {
      setFormData(prev => ({ ...prev, school_name: "" }));
    }
    
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
        "Password must contain uppercase, lowercase, and number";
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match";
    }

    if (!formData.admin_level) {
      newErrors.admin_level = "Admin level is required";
    }

    // Only require school name for school administrators
    if (formData.admin_level === "school" && !formData.school_id.trim()) {
      newErrors.school_name = "School name is required for school administrators";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log("Registering Admin Submitted:", formData);
      await register({
        ...formData,
        role: 'admin',
        email: formData.email.trim(),
       // school_id: Number(formData.school_id),
        county: Number(formData.county),
      });

      Alert.alert(
        "Success",
        "Administrator account created successfully! You can now manage platform operations.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isSchoolAdmin = formData.admin_level === "school";

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
          <Text style={styles.title}>Administrator Registration</Text>
          <Text style={styles.subtitle}>
            Create your administrator account
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Administrator accounts have access to platform management features including user management, content oversight, and system configuration.
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

          <Text style={styles.sectionTitle}>Administrative Details</Text>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ marginBottom: 5, color: colors.text.primary }}>
              Admin Level *
            </Text>
            <Picker
              selectedValue={formData.admin_level}
              onValueChange={(value) => updateField("admin_level", value)}
              style={{ backgroundColor: "#fff", borderRadius: 8 }}
            >
              <Picker.Item label="Select admin level..." value="" />
              <Picker.Item label="School Administrator" value="school_admin" />
              <Picker.Item label="County Administrator" value="county" />
              <Picker.Item label="National Administrator" value="national" />
              <Picker.Item label="System Administrator" value="super_admin" />
            </Picker>
            {errors.admin_level && (
              <Text style={{ color: "red", fontSize: fontSize.sm, marginTop: 4 }}>
                {errors.admin_level}
              </Text>
            )}
          </View>

          {/* Conditionally render school name field only for school admins */}
          {isSchoolAdmin && (
            <Input
              label="School/Institution Name *"
              placeholder="Enter school or institution name"
              value={formData.school_id}
              onChangeText={(text) => updateField("school_id", text)}
              error={errors.school_id}
              leftIcon="business-outline"
            />
          )}

          {/* Optional: Show different fields for other admin levels */}
          {formData.admin_level && !isSchoolAdmin && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {formData.admin_level === "county" && "County administrators manage multiple schools within a county."}
                {formData.admin_level === "national" && "National administrators oversee platform operations at the national level."}
                {formData.admin_level === "super_admin" && "System administrators have full access to all platform features and configurations."}
              </Text>
            </View>
          )}

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
            title="Create Administrator Account"
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
    backgroundColor: colors.status.info + "20",
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.info,
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