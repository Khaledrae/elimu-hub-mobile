// app/(tabs)/lessons.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import lessonService, { Lesson } from "@/src/services/lessonService";
import { showConfirmation, showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function LessonsScreen() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const canManageLesson =
    currentUser?.role === "admin" || currentUser?.role === "teacher";
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    course_id: "",
    class_id: "",
    title: "",
    content: "",
    video_url: "",
    document_path: "",
    order: "",
    status: "active",
  });

  // Status options
  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Draft", value: "draft" },
  ];

  useEffect(() => {
    loadLessons();
    loadCourses();
    loadClasses();
  }, []);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const lessonsData = await lessonService.getAllLessons();
      setLessons(lessonsData);
    } catch (error: any) {
      console.error("Failed to load lessons:", error);
      showError("Error", "Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const coursesData = await lessonService.getAvailableCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const loadClasses = async () => {
    try {
      const classesData = await lessonService.getAvailableClasses();
      setClasses(classesData);
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.course_id ||
      !formData.class_id ||
      !formData.title ||
      !formData.order
    ) {
      showError("Error", "Course, class, title, and order are required");
      return;
    }

    try {
      const submitData = {
        course_id: parseInt(formData.course_id),
        class_id: parseInt(formData.class_id),
        title: formData.title,
        content: formData.content,
        video_url: formData.video_url,
        document_path: formData.document_path,
        order: parseInt(formData.order),
        status: formData.status as "active" | "inactive" | "draft",
      };

      if (editingLesson) {
        await lessonService.updateLesson(editingLesson.id, submitData);
        showSuccess("Success", "Lesson updated successfully");
      } else {
        await lessonService.createLesson(submitData);
        showSuccess("Success", "Lesson created successfully");
      }

      setModalVisible(false);
      resetForm();
      loadLessons();
    } catch (error: any) {
      console.error("Lesson operation failed:", error);
      showError("Error", error.message || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      class_id: "",
      title: "",
      content: "",
      video_url: "",
      document_path: "",
      order: "",
      status: "active",
    });
    setEditingLesson(null);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      course_id: lesson.course_id.toString(),
      class_id: lesson.class_id.toString(),
      title: lesson.title || "",
      content: lesson.content || "",
      video_url: lesson.video_url || "",
      document_path: lesson.document_path || "",
      order: lesson.order?.toString() || "",
      status: lesson.status || "active",
    });
    setModalVisible(true);
  };

  const handleDelete = async (lesson: Lesson) => {
    showConfirmation(
      "Delete Lesson",
      `Are you sure you want to delete "${lesson.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await lessonService.deleteLesson(lesson.id);
              showSuccess("Success", "Lesson deleted successfully");
              loadLessons();
            } catch (error: any) {
              console.error("Delete failed:", error);
              showError("Error", error.message || "Delete failed");
            }
          },
        },
      ]
    );
  };

  const handleLessonPress = (lesson: Lesson) => {
    router.push({
      pathname: "/lesson-details",
      params: { lessonId: lesson.id.toString() },
    } as any);
  };

  const getCourseName = (lesson: Lesson) => {
    return lesson.course?.title || `Course #${lesson.course_id}`;
  };

  const getClassName = (lesson: Lesson) => {
    return lesson.class?.name || `Class #${lesson.class_id}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "inactive":
        return "#F44336";
      case "draft":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  const hasMedia = (lesson: Lesson) => {
    return lesson.video_url || lesson.document_path;
  };

  return (
    <View style={styles.container}>
      {/* Header with Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Lessons Management</Text>
        </View>

        <Button
          title="Add Lesson"
          onPress={() => setModalVisible(true)}
          leftIcon="add-outline"
          size="small"
          variant="secondary"
        />
      </View>

      {/* Lessons List */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading lessons...</Text>
          </View>
        ) : lessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="play-outline"
              size={64}
              color={colors.neutral.gray400}
            />
            <Text style={styles.emptyText}>No lessons found</Text>
            <Text style={styles.emptySubtext}>
              Add your first lesson to get started
            </Text>
          </View>
        ) : (
          lessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonCard}
              onPress={() => handleLessonPress(lesson)}
              activeOpacity={0.7}
            >
              <View style={styles.lessonIcon}>
                <Ionicons
                  name={
                    hasMedia(lesson)
                      ? "play-circle-outline"
                      : "document-text-outline"
                  }
                  size={24}
                  color={colors.primary.yellow}
                />
              </View>

              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDetails}>
                  Course: {getCourseName(lesson)} • Class:{" "}
                  {getClassName(lesson)}
                </Text>
                <Text style={styles.lessonOrder}>Order: #{lesson.order}</Text>

                {lesson.content && (
                  <Text style={styles.lessonContent} numberOfLines={2}>
                    {lesson.content}
                  </Text>
                )}

                <View style={styles.mediaIndicators}>
                  {lesson.video_url && (
                    <View style={styles.mediaIndicator}>
                      <Ionicons
                        name="videocam-outline"
                        size={12}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.mediaText}>Video</Text>
                    </View>
                  )}
                  {lesson.document_path && (
                    <View style={styles.mediaIndicator}>
                      <Ionicons
                        name="document-outline"
                        size={12}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.mediaText}>Document</Text>
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(lesson.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {lesson.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              {canManageLesson && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(lesson);
                    }}
                    style={styles.actionButton}
                  >
                    <Ionicons name="create-outline" size={20} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(lesson);
                    }}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLesson ? "Edit Lesson" : "Add New Lesson"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Course *</Text>
                <Picker
                  selectedValue={formData.course_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, course_id: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Select course..." value="" />
                  {courses.map((course) => (
                    <Picker.Item
                      key={course.id}
                      label={`${course.title} (${course.level})`}
                      value={course.id.toString()}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Class *</Text>
                <Picker
                  selectedValue={formData.class_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, class_id: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Select class..." value="" />
                  {classes.map((classItem) => (
                    <Picker.Item
                      key={classItem.id}
                      label={`${classItem.name} (${classItem.level_group})`}
                      value={classItem.id.toString()}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lesson Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text })
                  }
                  placeholder="Enter lesson title"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Order *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.order}
                  onChangeText={(text) =>
                    setFormData({ ...formData, order: text })
                  }
                  placeholder="Enter lesson order (1, 2, 3...)"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.content}
                  onChangeText={(text) =>
                    setFormData({ ...formData, content: text })
                  }
                  placeholder="Enter lesson content"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Video URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.video_url}
                  onChangeText={(text) =>
                    setFormData({ ...formData, video_url: text })
                  }
                  placeholder="Enter video URL"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Document Path</Text>
                <TextInput
                  style={styles.input}
                  value={formData.document_path}
                  onChangeText={(text) =>
                    setFormData({ ...formData, document_path: text })
                  }
                  placeholder="Enter document path"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                  style={styles.picker}
                >
                  {statusOptions.map((status) => (
                    <Picker.Item
                      key={status.value}
                      label={status.label}
                      value={status.value}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  variant="ghost"
                />
                <Button
                  title={editingLesson ? "Update Lesson" : "Create Lesson"}
                  onPress={handleSubmit}
                  variant="primary"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  listContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyContainer: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  lessonCard: {
    flexDirection: "row",
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.yellow + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  lessonDetails: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  lessonOrder: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  lessonContent: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  mediaIndicators: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  mediaIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  mediaText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral.white,
  },
  actions: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  actionButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  form: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.base,
    backgroundColor: colors.neutral.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  picker: {
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 8,
    backgroundColor: colors.neutral.white,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
});
