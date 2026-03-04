// src/screens/auth/StudentRegisterScreen.tsx
import authService from "@/src/services/authService";
import classService, { ClassModel } from "@/src/services/classService";
import { useRouter } from "expo-router";

import UserBaseFields from "@/src/components/forms/UserBaseFields";
import { showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

export default function StudentRegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [counties, setCounties] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [countiesData, classesData] = await Promise.all([
          authService.getCounties(),
          classService.getAvailableClasses(),
        ]);
        setCounties(countiesData);
        setClasses(classesData);
      } catch (error) {
        console.log("Failed to load initial data:", error);
      }
    };

    loadInitialData();
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
    grade_level: "", // This will now store the class ID
    school_name: "",
    dob: "",
    gender: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const phoneRegex = /^(?:\+254|254|0)([17]\d{8})$/;

  const updateField = (field: string, value: string) => {
    console.log(`Updating field ${field} with value: ${value}`);
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
      updateField("dob", formattedDate);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
  };

  const handleGenderSelect = (gender: string) => {
    updateField("gender", gender);
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
      newErrors.grade_level = "Class is required";
    }

    if (!formData.county) {
      newErrors.county = "County is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      var response = await register({
        ...formData,
        role: "student",
        email: formData.email.trim(),
        county: Number(formData.county),
      });
      showSuccess(
        "Registration Successful",
        `You have registered in successfully ${response.user.first_name}.`,
      );
      // Navigation will be handled by the auth state change
      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      showError("Registration Failed", error.message || "An error occurred");
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
          {/* Date of Birth Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Date of Birth <Text style={styles.required}>*</Text>
            </Text>

            {Platform.OS === "web" ? (
              // 🖥 WEB VERSION
              <View
                style={[
                  styles.datePickerButton,
                  errors.dob && styles.inputError,
                ]}
              >
                {/* <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={
                    formData.dob ? colors.text.primary : colors.text.secondary
                  }
                /> */}
                <input
                  type="date"
                  value={formData.dob || ""}
                  onChange={(e) => updateField("dob", e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    flex: 1,
                  }}
                />
              </View>
            ) : (
              // 📱 MOBILE VERSION
              <>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    errors.dob && styles.inputError,
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={
                      formData.dob ? colors.text.primary : colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.datePickerText,
                      !formData.dob && styles.datePickerPlaceholder,
                    ]}
                  >
                    {formData.dob
                      ? formatDateDisplay(formData.dob)
                      : "Select date of birth"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && DateTimePicker && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1950, 0, 1)}
                  />
                )}
              </>
            )}

            {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
          </View>

          {/* Gender Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Gender <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === "male" && styles.genderOptionSelected,
                ]}
                onPress={() => handleGenderSelect("male")}
              >
                <View
                  style={[
                    styles.genderRadio,
                    formData.gender === "male" && styles.genderRadioSelected,
                  ]}
                >
                  {formData.gender === "male" && (
                    <View style={styles.genderRadioInner} />
                  )}
                </View>
                <Ionicons
                  name="man"
                  size={24}
                  color={
                    formData.gender === "male"
                      ? colors.primary.yellow
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.genderLabel,
                    formData.gender === "male" && styles.genderLabelSelected,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === "female" && styles.genderOptionSelected,
                ]}
                onPress={() => handleGenderSelect("female")}
              >
                <View
                  style={[
                    styles.genderRadio,
                    formData.gender === "female" && styles.genderRadioSelected,
                  ]}
                >
                  {formData.gender === "female" && (
                    <View style={styles.genderRadioInner} />
                  )}
                </View>
                <Ionicons
                  name="woman"
                  size={24}
                  color={
                    formData.gender === "female"
                      ? colors.primary.yellow
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.genderLabel,
                    formData.gender === "female" && styles.genderLabelSelected,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  formData.gender === "other" && styles.genderOptionSelected,
                ]}
                onPress={() => handleGenderSelect("other")}
              >
                <View
                  style={[
                    styles.genderRadio,
                    formData.gender === "other" && styles.genderRadioSelected,
                  ]}
                >
                  {formData.gender === "other" && (
                    <View style={styles.genderRadioInner} />
                  )}
                </View>
                <Ionicons
                  name="people"
                  size={24}
                  color={
                    formData.gender === "other"
                      ? colors.primary.yellow
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.genderLabel,
                    formData.gender === "other" && styles.genderLabelSelected,
                  ]}
                >
                  Other
                </Text>
              </TouchableOpacity>
            </View>
            {errors.gender && (
              <Text style={styles.errorText}>{errors.gender}</Text>
            )}
          </View>

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

          {/* Class Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Class <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.pickerContainer,
                errors.grade_level && styles.inputError,
              ]}
            >
              <Ionicons
                name="school-outline"
                size={20}
                color={colors.text.secondary}
                style={styles.pickerIcon}
              />
              <Picker
                selectedValue={formData.grade_level}
                onValueChange={(value) =>
                  updateField("grade_level", value.toString())
                }
                style={styles.picker}
              >
                <Picker.Item label="Select your class" value="" />
                {classes.map((classItem) => (
                  <Picker.Item
                    key={classItem.id}
                    label={`${classItem.name} - ${classItem.level_group}`}
                    value={classItem.id.toString()}
                  />
                ))}
              </Picker>
            </View>
            {errors.grade_level && (
              <Text style={styles.errorText}>{errors.grade_level}</Text>
            )}
            {classes.length === 0 && (
              <Text style={styles.helperText}>Loading classes...</Text>
            )}
          </View>

          <Input
            label="School Name (Optional)"
            placeholder="Enter your school name"
            value={formData.school_name}
            onChangeText={(text) => updateField("school_name", text)}
            leftIcon="business-outline"
          />

          <Text style={styles.sectionTitle}>Security</Text>

          {/* Password with Toggle */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <Input
                placeholder="Create a strong password"
                value={formData.password}
                onChangeText={(text) => updateField("password", text)}
                error={errors.password}
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                helperText="Min 8 characters with uppercase, lowercase & number"
                style={styles.passwordInput}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password with Toggle */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <Input
                placeholder="Re-enter your password"
                value={formData.password_confirmation}
                onChangeText={(text) =>
                  updateField("password_confirmation", text)
                }
                error={errors.password_confirmation}
                secureTextEntry={!showConfirmPassword}
                leftIcon="lock-closed-outline"
                style={styles.passwordInput}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

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
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.status.error,
  },
  // Date Picker Styles
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  datePickerText: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: colors.text.secondary,
  },
  // Gender Selection Styles
  genderContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  genderOption: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderColor: colors.neutral.gray300,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  genderOptionSelected: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.primary.yellow + "10",
  },
  genderRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.neutral.gray300,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  genderRadioSelected: {
    borderColor: colors.primary.yellow,
  },
  genderRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.yellow,
  },
  genderLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  genderLabelSelected: {
    color: colors.primary.yellow,
    fontWeight: fontWeight.semibold,
  },
  // Picker/Dropdown Styles
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 12,
    paddingLeft: spacing.md,
    overflow: "hidden",
  },
  pickerIcon: {
    marginRight: spacing.sm,
  },
  picker: {
    flex: 1,
    height: 48,
    color: colors.text.primary,
  },
  // Password Toggle Styles
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: spacing["3xl"],
  },
  passwordToggle: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    padding: spacing.xs,
  },
  // Error and Helper Text Styles
  inputError: {
    borderColor: colors.status.error,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.status.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
