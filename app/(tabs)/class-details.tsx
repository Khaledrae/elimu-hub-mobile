// app/class-details.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import classService, { ClassModel } from "@/src/services/classService";
import { Student } from "@/src/types";
import { showError } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
  status: string; // Use string instead of specific union type
}
// Update your ClassLesson interface
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
export default function ClassDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const classId = parseInt(params.classId as string);

  const [classData, setClassData] = useState<ClassModel | null>(null);
  const [courses, setCourses] = useState<ClassCourse[]>([]);
  const [lessons, setLessons] = useState<ClassLesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "lessons" | "courses" | "students"
  >("overview");

  useEffect(() => {
    if (classId) {
      loadClassDetails();
    }
  }, [classId]);

  const loadClassDetails = async () => {
    try {
      setLoading(true);
      const [classResponse /*, coursesResponse, lessonsResponse*/] =
        await Promise.all([
          classService.getClass(classId),
          //classService.getClassCourses(classId),
          //classService.getClassLessons(classId)
        ]);

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

      // Transform lessons data - lessonsResponse is now { class: any, lessons: Lesson[] }
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

  const onRefresh = () => {
    setRefreshing(true);
    loadClassDetails();
  };

  const handleEditClass = () => {
    router.push({
      pathname: "/edit-class",
      params: { classId: classId.toString() },
    } as any);
  };

  const handleAddLesson = () => {
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

  // Remove formatTime function since we don't have time fields

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
        <TouchableOpacity onPress={handleEditClass} style={styles.editButton}>
          <Ionicons
            name="create-outline"
            size={20}
            color={colors.primary.yellow}
          />
        </TouchableOpacity>
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
                <Button
                  title="Add Lesson"
                  onPress={handleAddLesson}
                  size="small"
                  variant="secondary"
                />
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
              <Button
                title="Add Lesson"
                onPress={handleAddLesson}
                size="small"
                variant="secondary"
              />
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
                <Text style={styles.emptySubtext}>
                  Add your first lesson to get started
                </Text>
                <Button
                  title="Add Lesson"
                  onPress={handleAddLesson}
                  variant="primary"
                  style={styles.emptyButton}
                />
              </View>
            )}
          </View>
        )}

        {activeTab === "courses" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Courses</Text>
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
                        backgroundColor:
                          course.status === "active" ? "#4CAF50" : "#F44336",
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
              <Text style={styles.emptyText}>No courses assigned</Text>
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
                    {/* Use admission number or student ID as fallback */}
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
  studentEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  studentAdmission: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
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
});
