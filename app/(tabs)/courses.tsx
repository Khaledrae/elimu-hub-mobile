// app/(tabs)/courses.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { User } from "@/src/services/authService";
import courseService, { Course } from "@/src/services/courseService";
import { showConfirmation, showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Teacher {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function CoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teacher_id: "",
    level: "",
    status: "active",
  });

  // Level options
  const levels = [
    { label: "Select level...", value: "" },
    { label: "Pre-Primary", value: "pre-primary" },
    { label: "Lower Primary", value: "lower-primary" },
    { label: "Upper Primary", value: "upper-primary" },
    { label: "Lower Secondary", value: "lower-secondary" },
    { label: "Upper Secondary", value: "upper-secondary" },
  ];

  // Status options
  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Draft", value: "draft" },
  ];

  useEffect(() => {
    loadCourses();
    loadTeachers();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.getAllCourses();
      setCourses(coursesData);
    } catch (error: any) {
      console.error("Failed to load courses:", error);
      showError("Error", "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const teachersData = await courseService.getAvailableTeachers();
      setTeachers(teachersData);
    } catch (error) {
      console.error("Failed to load teachers:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.level) {
      showError("Error", "Course title and level are required");
      return;
    }

    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : undefined,
        level: formData.level,
        status: formData.status as 'active' | 'inactive' | 'draft',
      };

      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, submitData);
        showSuccess("Success", "Course updated successfully");
      } else {
        await courseService.createCourse(submitData);
        showSuccess("Success", "Course created successfully");
      }
      
      setModalVisible(false);
      resetForm();
      loadCourses();
    } catch (error: any) {
      console.error("Course operation failed:", error);
      showError("Error", error.message || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      teacher_id: "",
      level: "",
      status: "active",
    });
    setEditingCourse(null);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      teacher_id: course.teacher_id?.toString() || "",
      level: course.level || "",
      status: course.status || "active",
    });
    setModalVisible(true);
  };

  const handleDelete = async (course: Course) => {
    showConfirmation(
      "Delete Course",
      `Are you sure you want to delete "${course.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await courseService.deleteCourse(course.id);
              showSuccess("Success", "Course deleted successfully");
              loadCourses();
            } catch (error: any) {
              console.error("Delete failed:", error);
              showError("Error", error.message || "Delete failed");
            }
          },
        },
      ]
    );
  };

  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: "/course-details",
      params: { courseId: course.id.toString() }
    } as any);
  };

  const handleAssignClasses = (course: Course) => {
    router.push({
      pathname: "/assign-classes",
      params: { courseId: course.id.toString(), courseTitle: course.title }
    } as any);
  };

  const getTeacherName = (course: Course) => {
    if (course.teacher?.user) {
      return `${course.teacher.user.first_name} ${course.teacher.user.last_name}`;
    }
    return "No teacher assigned";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#F44336';
      case 'draft': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getLevelLabel = (level: string) => {
    const levelOption = levels.find(l => l.value === level);
    return levelOption?.label || level;
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
          <Text style={styles.title}>Courses Management</Text>
        </View>
        
        <Button
          title="Add Course"
          onPress={() => setModalVisible(true)}
          leftIcon="add-outline"
          size="small"
          variant="secondary"
        />
      </View>

      {/* Courses List */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading courses...</Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={colors.neutral.gray400} />
            <Text style={styles.emptyText}>No courses found</Text>
            <Text style={styles.emptySubtext}>Add your first course to get started</Text>
          </View>
        ) : (
          courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => handleCoursePress(course)}
              activeOpacity={0.7}
            >
              {/* Thumbnail placeholder */}
              <View style={styles.thumbnail}>
                {course.thumbnail ? (
                  <Image source={{ uri: course.thumbnail }} style={styles.thumbnailImage} />
                ) : (
                  <Ionicons name="book-outline" size={32} color={colors.neutral.gray400} />
                )}
              </View>

              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDescription} numberOfLines={2}>
                  {course.description || "No description"}
                </Text>
                
                <View style={styles.courseDetails}>
                  <Text style={styles.courseDetail}>
                    Level: {getLevelLabel(course.level)}
                  </Text>
                  <Text style={styles.courseDetail}>
                    Teacher: {getTeacherName(course)}
                  </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <Ionicons name="school-outline" size={14} color={colors.text.secondary} />
                    <Text style={styles.statText}>
                      {course.classes?.length || 0} classes
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="play-outline" size={14} color={colors.text.secondary} />
                    <Text style={styles.statText}>
                      {course.lesson_count || 0} lessons
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(course.status) }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {course.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAssignClasses(course);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="link-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(course);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="create-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(course);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
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
                {editingCourse ? "Edit Course" : "Add New Course"}
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
                <Text style={styles.label}>Course Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData({ ...formData, title: text })
                  }
                  placeholder="Enter course title"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Enter course description"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Level *</Text>
                <Picker
                  selectedValue={formData.level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: value })
                  }
                  style={styles.picker}
                >
                  {levels.map((level) => (
                    <Picker.Item 
                      key={level.value} 
                      label={level.label} 
                      value={level.value} 
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teacher</Text>
                <Picker
                  selectedValue={formData.teacher_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teacher_id: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Select teacher..." value="" />
                  {teachers.map((teacher) => (
                    <Picker.Item 
                      key={teacher.id} 
                      label={`${teacher.first_name} ${teacher.last_name}`} 
                      value={teacher.id.toString()} 
                    />
                  ))}
                </Picker>
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
                  title={editingCourse ? "Update Course" : "Create Course"}
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
  courseCard: {
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
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.neutral.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  courseDetails: {
    marginBottom: spacing.sm,
  },
  courseDetail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  statText: {
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
    minHeight: 80,
    textAlignVertical: 'top',
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