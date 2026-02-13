import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import classService from "@/src/services/classService";
import lessonService, {
    CreateLessonData,
    Lesson,
} from "@/src/services/lessonService";
import { showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Course {
  id: number;
  title: string;
  level: string;
}

interface Class {
  id: number;
  name: string;
  level_group: string;
}

interface Teacher {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
}

interface OrderOption {
  value: number;
  label: string;
  description: string;
}

export default function EditLessonScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const lessonId = parseInt(params.lessonId as string);
  const courseId = params.courseId
    ? parseInt(params.courseId as string)
    : undefined;
  const classId = params.classId
    ? parseInt(params.classId as string)
    : undefined;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCurrentLessons, setShowCurrentLessons] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateLessonData>({
    course_id: 0,
    class_id: 0,
    teacher_id: user?.id || undefined,
    title: "",
    content: "",
    description: "",
    content_type: "text",
    video_url: "",
    document_path: "",
    order: 1,
    status: "draft",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropdown data
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);
  const [currentLessons, setCurrentLessons] = useState<
    Array<{ id: number; title: string; order: number }>
  >([]);

  const [selectedOrderOption, setSelectedOrderOption] =
    useState<OrderOption | null>(null);
  const [loadingOrderOptions, setLoadingOrderOptions] = useState(false);

  useEffect(() => {
    loadLessonData();
  }, [lessonId]);

  useEffect(() => {
    if (formData.course_id && formData.class_id) {
      loadOrderOptions(formData.course_id, formData.class_id);
    }
  }, [formData.course_id, formData.class_id]);

  const loadLessonData = async () => {
    setLoading(true);
    try {
      // Load lesson and dropdown data in parallel
      const [lessonData, coursesData, classesData, teachersData] =
        await Promise.all([
          lessonService.getLesson(lessonId),
          lessonService.getAvailableCourses(),
          classService.getAvailableClasses(),
          lessonService.getAvailableTeachers(),
        ]);

      setLesson(lessonData);
      setCourses(coursesData);
      setClasses(classesData);
      setTeachers(teachersData);

      // Set form data from lesson
      setFormData({
        course_id: lessonData.course_id,
        class_id: lessonData.class_id,
        teacher_id: lessonData.teacher_id || user?.id,
        title: lessonData.title,
        content: lessonData.content || "",
        description: lessonData.description || "",
        content_type:
          (lessonData.content_type as "text" | "video" | "document") || "text",
        video_url: lessonData.video_url || "",
        document_path: lessonData.document_path || "",
        order: lessonData.order,
        status: lessonData.status,
      });
    } catch (error: any) {
      console.error("Error loading lesson data:", error);
      showError("Error", error.message || "Failed to load lesson data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadOrderOptions = async (courseId: number, classId: number) => {
    setLoadingOrderOptions(true);
    try {
      const { positions, currentLessons } = await lessonService.getOrderOptions(
        courseId,
        classId,
      );

      // Filter out the current lesson from the list (can't insert after itself)
      const filteredCurrentLessons = currentLessons.filter(
        (l) => l.id !== lessonId,
      );
      setCurrentLessons(filteredCurrentLessons);
      setShowCurrentLessons(filteredCurrentLessons.length > 0);

      // Generate positions, excluding the current lesson's position
      const filteredPositions = positions.filter((position) => {
        // Keep all positions except those that would duplicate the current lesson
        if (position.value === formData.order) return true; // Keep current position
        // For "After: X" positions, filter out if X is the current lesson
        if (position.label.includes("After:")) {
          const currentLesson = currentLessons.find(
            (l) => position.label.includes(l.title) && l.id === lessonId,
          );
          return !currentLesson;
        }
        return true;
      });

      setOrderOptions(filteredPositions);

      // Find and set the selected option based on current order
      if (filteredPositions.length > 0) {
        const selected = filteredPositions.find(
          (opt) => opt.value === formData.order,
        );
        setSelectedOrderOption(selected || filteredPositions[0]);
      }
    } catch (error) {
      console.error("Error loading order options:", error);
      setOrderOptions([]);
      setCurrentLessons([]);
      setShowCurrentLessons(false);
    } finally {
      setLoadingOrderOptions(false);
    }
  };

  const updateField = (field: keyof CreateLessonData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));

    // When order changes, update the selected option
    if (field === "order") {
      const option = orderOptions.find((opt) => opt.value === value);
      setSelectedOrderOption(option || null);
    }
  };

  const handleContentTypeChange = (type: "text" | "video" | "document") => {
    setFormData((prev) => ({
      ...prev,
      content_type: type,
      // Clear media fields when switching types
      ...(type !== "video" && { video_url: "" }),
      ...(type !== "document" && { document_path: "" }),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.course_id) {
      newErrors.course_id = "Course is required";
    }
    if (!formData.class_id) {
      newErrors.class_id = "Class is required";
    }
    if (formData.content_type === "video" && !formData.video_url?.trim()) {
      newErrors.video_url = "Video URL is required for video content type";
    }
    if (
      formData.content_type === "document" &&
      !formData.document_path?.trim()
    ) {
      newErrors.document_path =
        "Document path is required for document content type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const dataToSubmit: Partial<CreateLessonData> = {
        ...formData,
        title: formData.title.trim(),
        content: formData.content?.trim() || "",
        description: formData.description?.trim() || "",
        video_url: formData.video_url?.trim() || "",
        document_path: formData.document_path?.trim() || "",
      };

      const updatedLesson = await lessonService.updateLesson(
        lessonId,
        dataToSubmit,
      );

      showSuccess("Success", "Lesson updated successfully");

      // Navigate back to lesson details
      router.push({
        pathname: "/lesson-details",
        params: {
          lessonId: lessonId.toString(),
          classId: updatedLesson.class_id.toString(),
          courseId: updatedLesson.course_id.toString(),
        },
      } as any);
    } catch (error: any) {
      console.error("Error updating lesson:", error);
      showError("Error", error.message || "Failed to update lesson");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Lesson",
      "Are you sure you want to delete this lesson? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await lessonService.deleteLesson(lessonId);
      showSuccess("Success", "Lesson deleted successfully");

      // Navigate back to class details
      router.push({
        pathname: "/class-details",
        params: { classId: formData.class_id.toString() },
      } as any);
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      showError("Error", error.message || "Failed to delete lesson");
    } finally {
      setDeleting(false);
    }
  };

  const renderContentTypeFields = () => {
    switch (formData.content_type) {
      case "video":
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Video URL *</Text>
            <Input
              value={formData.video_url}
              onChangeText={(value: string) => updateField("video_url", value)}
              placeholder="https://example.com/video.mp4"
              keyboardType="url"
              style={styles.input}
            />
            {errors.video_url && (
              <Text style={styles.errorText}>{errors.video_url}</Text>
            )}
          </View>
        );
      case "document":
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Document Path *</Text>
            <Input
              value={formData.document_path}
              onChangeText={(value: string) =>
                updateField("document_path", value)
              }
              placeholder="/documents/lesson.pdf"
              style={styles.input}
            />
            {errors.document_path && (
              <Text style={styles.errorText}>{errors.document_path}</Text>
            )}
          </View>
        );
      default: // text
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Content</Text>
            <Input
              value={formData.content}
              onChangeText={(value: string) => updateField("content", value)}
              placeholder="Enter lesson content here..."
              multiline
              numberOfLines={6}
              style={styles.textArea}
              textAlignVertical="top"
            />
          </View>
        );
    }
  };

  const toggleCurrentLessons = () => {
    setShowCurrentLessons(!showCurrentLessons);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.yellow} />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Lesson</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons
            name="trash-outline"
            size={22}
            color={colors.status.error}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Lessons Toggle Button - Only show when we have other lessons */}
        {currentLessons.length > 0 && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleCurrentLessons}
          >
            <View style={styles.toggleButtonContent}>
              <Ionicons
                name={showCurrentLessons ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.secondary.greenDark}
              />
              <Text style={styles.toggleButtonText}>
                {showCurrentLessons ? "Hide" : "Show"} Other Lessons (
                {currentLessons.length})
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Current Lessons Preview - Collapsible */}
        {showCurrentLessons && currentLessons.length > 0 && (
          <View style={styles.currentLessonsContainer}>
            <View style={styles.currentLessonsHeader}>
              <Text style={styles.sectionTitle}>
                Other Lessons in this Course
              </Text>
              <TouchableOpacity onPress={toggleCurrentLessons}>
                <Ionicons
                  name="close"
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.currentLessonsList} nestedScrollEnabled>
              {currentLessons.map((lesson) => (
                <View key={lesson.id} style={styles.lessonPreview}>
                  <Text style={styles.lessonOrder}>{lesson.order}.</Text>
                  <Text style={styles.lessonTitle} numberOfLines={1}>
                    {lesson.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lesson Title *</Text>
            <Input
              value={formData.title}
              onChangeText={(value: string) => updateField("title", value)}
              placeholder="Enter lesson title"
              style={styles.input}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <Input
              value={formData.description}
              onChangeText={(value: string) =>
                updateField("description", value)
              }
              placeholder="Enter lesson description"
              multiline
              numberOfLines={3}
              style={styles.textArea}
              textAlignVertical="top"
            />
          </View>

          {/* Course - Disabled in edit mode */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course *</Text>
            <View style={[styles.pickerContainer, styles.disabledContainer]}>
              <Picker
                enabled={false}
                selectedValue={formData.course_id?.toString()}
                style={[styles.picker, styles.disabledText]}
              >
                {courses
                  .filter((course) => course.id === formData.course_id)
                  .map((course) => (
                    <Picker.Item
                      key={course.id}
                      label={`${course.title} (${course.level})`}
                      value={course.id.toString()}
                    />
                  ))}
              </Picker>
            </View>
            <Text style={styles.disabledHint}>Course cannot be changed</Text>
          </View>

          {/* Class - Disabled in edit mode */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Class *</Text>
            <View style={[styles.pickerContainer, styles.disabledContainer]}>
              <Picker
                enabled={false}
                selectedValue={formData.class_id?.toString()}
                style={[styles.picker, styles.disabledText]}
              >
                {classes
                  .filter((cls) => cls.id === formData.class_id)
                  .map((cls) => (
                    <Picker.Item
                      key={cls.id}
                      label={`${cls.name} (${cls.level_group})`}
                      value={cls.id.toString()}
                    />
                  ))}
              </Picker>
            </View>
            <Text style={styles.disabledHint}>Class cannot be changed</Text>
          </View>

          {/* Teacher */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teacher</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.teacher_id?.toString() || ""}
                onValueChange={(value: string) => {
                  updateField(
                    "teacher_id",
                    value ? parseInt(value) : undefined,
                  );
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select a teacher..." value="" />
                {teachers.map((teacher) => (
                  <Picker.Item
                    key={teacher.id}
                    label={`${teacher.user.first_name} ${teacher.user.last_name}`}
                    value={teacher.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Content Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Content Type *</Text>
            <View style={styles.contentTypeButtons}>
              {(["text", "video", "document"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.contentTypeButton,
                    formData.content_type === type &&
                      styles.contentTypeButtonActive,
                  ]}
                  onPress={() => handleContentTypeChange(type)}
                >
                  <Ionicons
                    name={
                      type === "text"
                        ? "document-text-outline"
                        : type === "video"
                          ? "videocam-outline"
                          : "document-attach-outline"
                    }
                    size={20}
                    color={
                      formData.content_type === type
                        ? colors.primary.yellow
                        : colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.contentTypeButtonText,
                      formData.content_type === type &&
                        styles.contentTypeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Type Specific Fields */}
          {renderContentTypeFields()}

          {/* Order and Status */}
          <View style={styles.row}>
            {/* Order */}
            <View style={styles.halfInput}>
              <Text style={styles.label}>Position *</Text>
              {loadingOrderOptions ? (
                <View style={styles.loadingOrderContainer}>
                  <ActivityIndicator
                    size="small"
                    color={colors.primary.yellow}
                  />
                  <Text style={styles.loadingOrderText}>
                    Loading positions...
                  </Text>
                </View>
              ) : orderOptions.length > 0 ? (
                <>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.order?.toString()}
                      onValueChange={(value: string) => {
                        if (value) {
                          updateField("order", parseInt(value));
                        }
                      }}
                      style={styles.picker}
                    >
                      {orderOptions.map((option) => (
                        <Picker.Item
                          key={option.value}
                          label={option.label}
                          value={option.value.toString()}
                        />
                      ))}
                    </Picker>
                  </View>
                  {selectedOrderOption && (
                    <Text style={styles.helperText}>
                      {selectedOrderOption.description}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.helperText}>Loading positions...</Text>
              )}
            </View>

            {/* Status */}
            <View style={styles.halfInput}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(
                    value: "active" | "inactive" | "draft" | "published",
                  ) => updateField("status", value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Draft" value="draft" />
                  <Picker.Item label="Active" value="active" />
                  <Picker.Item label="Inactive" value="inactive" />
                  <Picker.Item label="Published" value="published" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Metadata */}
          {lesson && (
            <View style={styles.metadataContainer}>
              <Text style={styles.metadataText}>
                Created:{" "}
                {new Date(lesson.created_at || "").toLocaleDateString()}
              </Text>
              {lesson.updated_at && lesson.updated_at !== lesson.created_at && (
                <Text style={styles.metadataText}>
                  Last updated:{" "}
                  {new Date(lesson.updated_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title={submitting ? "Saving..." : "Save Changes"}
              onPress={handleSubmit}
              variant="primary"
              style={styles.submitButton}
              disabled={submitting || deleting}
            />
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: fontSize.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
    zIndex: 10,
  },
  backButton: {
    padding: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  toggleButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  toggleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: colors.secondary.greenLight + "10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary.greenLight + "30",
  },
  toggleButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.secondary.greenDark,
    marginLeft: spacing.xs,
  },
  currentLessonsContainer: {
    backgroundColor: colors.secondary.greenLight + "10",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondary.greenLight + "30",
  },
  currentLessonsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.secondary.greenDark,
  },
  currentLessonsList: {
    maxHeight: 200,
  },
  lessonPreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  lessonOrder: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary.yellow,
    marginRight: spacing.sm,
    width: 24,
  },
  lessonTitle: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  form: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 120,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    overflow: "hidden",
  },
  disabledContainer: {
    backgroundColor: colors.neutral.gray100,
    borderColor: colors.neutral.gray300,
  },
  disabledText: {
    color: colors.text.secondary,
    opacity: 0.7,
  },
  disabledHint: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  picker: {
    backgroundColor: colors.neutral.white,
  },
  contentTypeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  contentTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 8,
    gap: spacing.xs,
  },
  contentTypeButtonActive: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.primary.yellow + "20",
  },
  contentTypeButtonText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  contentTypeButtonTextActive: {
    color: colors.primary.yellow,
  },
  loadingOrderContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.neutral.gray100,
    borderRadius: 8,
  },
  loadingOrderText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  errorText: {
    color: colors.status.error,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  metadataContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.neutral.gray100,
    borderRadius: 8,
  },
  metadataText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
