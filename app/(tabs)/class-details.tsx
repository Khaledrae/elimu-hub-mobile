// app/class-details.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext"; // Adjust path as needed
import classService, { ClassModel } from "@/src/services/classService";
import courseService from "@/src/services/courseService";
import { Student } from "@/src/types";
import { showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Define simplified interfaces for the class details page
interface ClassCourse {
  id: number;
  title: string;
  slug: string;
  level: string;
  teacher?: string;
  status: string;
}

interface ClassLesson {
  id: number;
  title: string;
  description?: string;
  content_type?: "text" | "video" | "document" | "mixed";
  video_url?: string;
  document_path?: string;
  order: number;
  status: string;
  teacher?: string;
  course?: {
    title: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface AvailableCourse {
  id: number;
  title: string;
  description?: string;
  level: string;
  status: string;
  teacher?: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function ClassDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const classId = parseInt(params.classId as string);
  
  // Get user info from auth context
  const { user } = useAuth();
  
  // Check if user has management permissions (admin or teacher)
  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const [classData, setClassData] = useState<ClassModel | null>(null);
  const [courses, setCourses] = useState<ClassCourse[]>([]);
  const [lessons, setLessons] = useState<ClassLesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "lessons" | "courses" | "students"
  >("overview");

  // Course management state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [allAvailableCourses, setAllAvailableCourses] = useState<AvailableCourse[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());
  const [savingCourses, setSavingCourses] = useState(false);

  useEffect(() => {
    if (classId) {
      loadClassDetails();
    }
  }, [classId]);

  const loadClassDetails = async () => {
    try {
      setLoading(true);
      const classResponse = await classService.getClass(classId);

      setClassData(classResponse);
      console.log(classResponse);

      setStudents(classResponse.students || []);

      const transformedCourses: ClassCourse[] = (
        classResponse.courses || []
      ).map((course: any) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        level: course.level,
        teacher:
          course.teacher && course.teacher.user
            ? `${course.teacher.user.first_name} ${course.teacher.user.last_name}`
            : "No teacher assigned",
        status: course.status,
      }));
      setCourses(transformedCourses);

      const transformedLessons: ClassLesson[] = (
        classResponse.lessons || []
      ).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.content,
        content_type: lesson.content_type || "text",
        video_url: lesson.video_url,
        document_path: lesson.document_path,
        order: lesson.order,
        status: lesson.status,
        teacher: lesson.teacher,
        course: lesson.course ? { title: lesson.course.title } : undefined,
        created_at: lesson.created_at,
        updated_at: lesson.updated_at,
      }));
      setLessons(transformedLessons);
    } catch (error: any) {
      console.error("Failed to load class details:", error);
      showError("Error", error.message || "Failed to load class details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      const allCourses = await courseService.getAllCourses();
      setAllAvailableCourses(allCourses);
      
      // Initialize selected courses with currently assigned ones
      const currentCourseIds = new Set(courses.map(c => c.id));
      setSelectedCourseIds(currentCourseIds);
    } catch (error: any) {
      console.error("Failed to load available courses:", error);
      showError("Error", "Failed to load available courses");
    }
  };

  const handleManageCourses = async () => {
    // Double-check permissions before opening modal
    if (!canManage) {
      showError("Permission Denied", "You don't have permission to manage courses");
      return;
    }
    await loadAvailableCourses();
    setShowCourseModal(true);
  };

  const toggleCourseSelection = (courseId: number) => {
    const newSelected = new Set(selectedCourseIds);
    if (newSelected.has(courseId)) {
      // Show warning when removing a course
      Alert.alert(
        "Remove Course",
        "Removing this course from the class may affect associated lessons and student progress. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              newSelected.delete(courseId);
              setSelectedCourseIds(newSelected);
            },
          },
        ]
      );
    } else {
      newSelected.add(courseId);
      setSelectedCourseIds(newSelected);
    }
  };

  const handleSaveCourses = async () => {
    try {
      setSavingCourses(true);
      const courseIdsArray = Array.from(selectedCourseIds);
      
      await courseService.assignCoursesToClass(classId, courseIdsArray);
      
      showSuccess("Success", "Course assignments updated successfully!");
      setShowCourseModal(false);
      
      // Reload class details to reflect changes
      await loadClassDetails();
    } catch (error: any) {
      console.error("Failed to update course assignments:", error);
      showError("Error", error.message || "Failed to update course assignments");
    } finally {
      setSavingCourses(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClassDetails();
  };

  const handleEditClass = () => {
    // Check permissions
    if (!canManage) {
      showError("Permission Denied", "You don't have permission to edit classes");
      return;
    }
    router.push({
      pathname: "/edit-class",
      params: { classId: classId.toString() },
    } as any);
  };

  const handleAddLesson = () => {
    // Check permissions
    if (!canManage) {
      showError("Permission Denied", "You don't have permission to add lessons");
      return;
    }
    router.push({
      pathname: "/add-lesson",
      params: { classId: classId.toString() },
    } as any);
  };

  const handleLessonPress = (lesson: ClassLesson) => {
    router.push({
      pathname: "/lesson-details",
      params: { lessonId: lesson.id.toString(), classId: classId.toString() },
    } as any);
  };

  const handleCoursePress = (course: ClassCourse) => {
    router.push({
      pathname: "/course-details",
      params: { courseId: course.id.toString(), classId: classId.toString() },
    } as any);
  };

  const getManagerName = () => {
    if (classData?.manager) {
      return `${classData.manager.first_name} ${classData.manager.last_name}`;
    }
    return "No manager assigned";
  };

  const getLevelGroupLabel = (levelGroup: string) => {
    const groups = {
      "pre-primary": "Pre-Primary",
      "lower-primary": "Lower Primary (1-3)",
      "upper-primary": "Upper Primary (4-6)",
      "lower-secondary": "Lower Secondary (7-9)",
      "upper-secondary": "Upper Secondary (10-12)",
    };
    return groups[levelGroup as keyof typeof groups] || levelGroup;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCourseStatusColor = (status: string) => {
    switch (status) {
      case "published":
      case "active":
        return "#4CAF50";
      case "draft":
        return "#FFA726";
      case "archived":
      case "inactive":
        return "#757575";
      default:
        return "#2196F3";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading class details...</Text>
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={colors.neutral.gray400}
        />
        <Text style={styles.errorText}>Class not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{classData.name}</Text>
            <Text style={styles.subtitle}>
              {getLevelGroupLabel(classData.level_group)}
            </Text>
          </View>
        </View>
        {canManage && (
          <TouchableOpacity onPress={handleEditClass} style={styles.editButton}>
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.primary.yellow}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons
            name="people-outline"
            size={24}
            color={colors.primary.yellow}
          />
          <Text style={styles.statNumber}>
            {classData.students?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons
            name="book-outline"
            size={24}
            color={colors.primary.yellow}
          />
          <Text style={styles.statNumber}>
            {classData.courses?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons
            name="document-outline"
            size={24}
            color={colors.primary.yellow}
          />
          <Text style={styles.statNumber}>{classData.lessons?.length}</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: "overview" as const, label: "Overview", icon: "grid-outline" },
          {
            key: "lessons" as const,
            label: "Lessons",
            icon: "document-outline",
          },
          { key: "courses" as const, label: "Courses", icon: "book-outline" },
          {
            key: "students" as const,
            label: "Students",
            icon: "people-outline",
          },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={
                activeTab === tab.key
                  ? colors.primary.yellow
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Class Information</Text>
              <View style={styles.infoItem}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.text.secondary}
                />
                <Text style={styles.infoLabel}>Manager:</Text>
                <Text style={styles.infoValue}>{getManagerName()}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="school-outline"
                  size={16}
                  color={colors.text.secondary}
                />
                <Text style={styles.infoLabel}>Level Group:</Text>
                <Text style={styles.infoValue}>
                  {getLevelGroupLabel(classData.level_group)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.text.secondary}
                />
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>
                  {classData.created_at
                    ? formatDate(classData.created_at)
                    : "N/A"}
                </Text>
              </View>
            </View>

            {/* Recent Lessons */}
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Lessons</Text>
                {canManage && (
                  <Button
                    title="Add Lesson"
                    onPress={handleAddLesson}
                    size="small"
                    variant="secondary"
                  />
                )}
              </View>
              {lessons.slice(0, 3).map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.lessonItem}
                  onPress={() => handleLessonPress(lesson)}
                >
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonDetails}>
                      {lesson.created_at
                        ? `Created: ${formatDate(lesson.created_at)}`
                        : "No date"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              ))}
              {lessons.length === 0 && (
                <Text style={styles.emptyText}>No lessons available</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === "lessons" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Lessons</Text>
              {canManage && (
                <Button
                  title="Add Lesson"
                  onPress={handleAddLesson}
                  size="small"
                  variant="secondary"
                />
              )}
            </View>
            {lessons.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => handleLessonPress(lesson)}
              >
                <View style={styles.lessonHeader}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          lesson.status === "completed" ? "#4CAF50" : "#2196F3",
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {lesson.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                {lesson.description && (
                  <Text style={styles.lessonDescription}>
                    {lesson.description}
                  </Text>
                )}
                <View style={styles.lessonMeta}>
                  <Text style={styles.lessonDate}>
                    {lesson.created_at
                      ? `Created: ${formatDate(lesson.created_at)}`
                      : "No date"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {lessons.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-outline"
                  size={64}
                  color={colors.neutral.gray400}
                />
                <Text style={styles.emptyText}>No lessons available</Text>
                {canManage && (
                  <>
                    <Text style={styles.emptySubtext}>
                      Add your first lesson to get started
                    </Text>
                    <Button
                      title="Add Lesson"
                      onPress={handleAddLesson}
                      variant="primary"
                      style={styles.emptyButton}
                    />
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === "courses" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Assigned Courses</Text>
              {canManage && (
                <Button
                  title="Manage Courses"
                  onPress={handleManageCourses}
                  size="small"
                  variant="secondary"
                />
              )}
            </View>
            {courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => handleCoursePress(course)}
              >
                <View style={styles.courseHeader}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getCourseStatusColor(course.status),
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {course.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.courseLevel}>Level: {course.level}</Text>
                {course.teacher && (
                  <Text style={styles.courseTeacher}>
                    Teacher: {course.teacher}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            {courses.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="book-outline"
                  size={64}
                  color={colors.neutral.gray400}
                />
                <Text style={styles.emptyText}>No courses assigned</Text>
                {canManage && (
                  <>
                    <Text style={styles.emptySubtext}>
                      Assign courses to this class to get started
                    </Text>
                    <Button
                      title="Manage Courses"
                      onPress={handleManageCourses}
                      variant="primary"
                      style={styles.emptyButton}
                    />
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === "students" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Students</Text>
            {students.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>
                    {student.admission_number?.charAt(0) || "S"}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    Admission: {student.admission_number}
                  </Text>
                  <Text style={styles.studentDetails}>
                    Grade: {student.grade_level}
                  </Text>
                  <Text style={styles.studentDetails}>
                    School: {student.school_name}
                  </Text>
                  <Text style={styles.studentDetails}>
                    Gender: {student.gender} • DOB: {student.dob}
                  </Text>
                </View>
              </View>
            ))}
            {students.length === 0 && (
              <Text style={styles.emptyText}>No students enrolled</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Course Management Modal - Only accessible if canManage */}
      {canManage && (
        <Modal
          visible={showCourseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCourseModal(false)}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowCourseModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Manage Courses</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCourseIds.size} selected
                </Text>
              </View>
            </View>

            {/* Warning Banner */}
            <View style={styles.warningBanner}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={colors.status.warning}
              />
              <Text style={styles.warningText}>
                Removing courses may affect associated lessons and student progress
              </Text>
            </View>

            {/* Course List */}
            <ScrollView style={styles.modalContent}>
              {allAvailableCourses.map((course) => {
                const isSelected = selectedCourseIds.has(course.id);
                const wasOriginallyAssigned = courses.some(c => c.id === course.id);

                return (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.modalCourseCard,
                      isSelected && styles.modalCourseCardSelected,
                    ]}
                    onPress={() => toggleCourseSelection(course.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalCourseContent}>
                      {/* Custom Checkbox */}
                      <View
                        style={[
                          styles.customCheckbox,
                          isSelected && styles.customCheckboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={colors.neutral.white}
                          />
                        )}
                      </View>

                      {/* Course Info */}
                      <View style={styles.modalCourseInfo}>
                        <Text style={styles.modalCourseTitle}>
                          {course.title}
                        </Text>
                        {course.description && (
                          <Text
                            style={styles.modalCourseDescription}
                            numberOfLines={2}
                          >
                            {course.description}
                          </Text>
                        )}
                        <View style={styles.modalCourseMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="school-outline"
                              size={12}
                              color={colors.text.secondary}
                            />
                            <Text style={styles.metaText}>{course.level}</Text>
                          </View>
                          {course.teacher && (
                            <View style={styles.metaItem}>
                              <Ionicons
                                name="person-outline"
                                size={12}
                                color={colors.text.secondary}
                              />
                              <Text style={styles.metaText}>
                                {course.teacher.user.first_name}{" "}
                                {course.teacher.user.last_name}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.modalStatusBadge,
                          {
                            backgroundColor: getCourseStatusColor(course.status),
                          },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {course.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Currently Assigned Indicator */}
                    {wasOriginallyAssigned && (
                      <View style={styles.currentlyAssignedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={colors.secondary.green}
                        />
                        <Text style={styles.currentlyAssignedText}>
                          Currently assigned
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {allAvailableCourses.length === 0 && (
                <View style={styles.modalEmptyState}>
                  <Ionicons
                    name="book-outline"
                    size={64}
                    color={colors.neutral.gray400}
                  />
                  <Text style={styles.emptyText}>No courses available</Text>
                  <Text style={styles.emptySubtext}>
                    Create courses first before assigning them
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => setShowCourseModal(false)}
                variant="outline"
                style={styles.modalCancelButton}
                disabled={savingCourses}
              />
              <Button
                title={savingCourses ? "Saving..." : "Save Changes"}
                onPress={handleSaveCourses}
                variant="primary"
                style={styles.modalSaveButton}
                isLoading={savingCourses}
                disabled={savingCourses}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
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
    flex: 1,
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  editButton: {
    padding: spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginVertical: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.yellow,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  activeTabText: {
    color: colors.primary.yellow,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.lg,
  },
  infoSection: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    minWidth: 80,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  lessonInfo: {
    flex: 1,
  },
  studentDetails: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  lessonCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  lessonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  lessonTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  lessonDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  lessonDetails: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  lessonMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonDate: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  courseCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  courseTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  courseLevel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  courseTeacher: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  studentCard: {
    flexDirection: "row",
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral.white,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  modalCloseButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.status.warning + "20",
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: 8,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  modalCourseCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.neutral.gray200,
  },
  modalCourseCardSelected: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.primary.yellow + "10",
  },
  modalCourseContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral.gray300,
    backgroundColor: colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
  },
  customCheckboxSelected: {
    backgroundColor: colors.primary.yellow,
    borderColor: colors.primary.yellow,
  },
  modalCourseInfo: {
    flex: 1,
  },
  modalCourseTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalCourseDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  modalCourseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  modalStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  currentlyAssignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary.green + "10",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: spacing.sm,
    gap: 4,
  },
  currentlyAssignedText: {
    fontSize: fontSize.xs,
    color: colors.secondary.green,
    fontWeight: fontWeight.semibold,
  },
  modalEmptyState: {
    alignItems: "center",
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  modalFooter: {
    flexDirection: "row",
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray200,
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSaveButton: {
    flex: 1,
  },
});