// app/class-course-editor.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import classService from "@/src/services/classService";
import courseService from "@/src/services/courseService";
import { showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Course {
  id: number;
  title: string;
  description?: string;
  teacher?: {
    id: number;
    user: {
     first_name: string;
      last_name: string;
      email: string;
    };
  };
  status: 'published' | 'draft' | 'archived';
  level?: string;
  slug: string;
}

interface ClassModel {
  id: number;
  name: string;
  level_group: string;
}

export default function ClassCourseEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const classId = parseInt(params.classId as string);

  const [classData, setClassData] = useState<ClassModel | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load class data
      const classResponse = await classService.getClass(classId);
      setClassData(classResponse);

      // Load all available courses
      const allCoursesData = await courseService.getAllCourses();
      setAllCourses(allCoursesData);

      // Load already assigned courses
      const assignedCoursesData = await courseService.getCoursesForClass(classId);
      setAssignedCourses(assignedCoursesData);

      // Initialize selected course IDs
      const initialSelectedIds = new Set(assignedCoursesData.map(course => course.id));
      setSelectedCourseIds(initialSelectedIds);

    } catch (error: any) {
      console.error("Failed to load data:", error);
      showError("Error", error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: number) => {
    const newSelected = new Set(selectedCourseIds);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourseIds(newSelected);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const courseIdsArray = Array.from(selectedCourseIds);
      
      await courseService.assignCoursesToClass(classId, courseIdsArray);
      
      showSuccess("Success", "Courses assigned successfully!");
      router.back();
      
    } catch (error: any) {
      console.error("Failed to assign courses:", error);
      showError("Error", error.message || "Failed to assign courses");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Changes",
      "Are you sure you want to discard your changes?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          style: "destructive",
          onPress: () => router.back()
        }
      ]
    );
  };

  const getCourseStatusColor = (status: string) => {
    switch (status) {
      case 'published': return colors.secondary.green;
      case 'draft': return colors.status.warning;
      case 'archived': return colors.text.secondary;
      default: return colors.text.secondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.yellow} />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Assign Courses</Text>
          <Text style={styles.subtitle}>
            {classData?.name} • {classData?.level_group}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.selectedCount}>
            {selectedCourseIds.size} selected
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="information-circle-outline" size={20} color={colors.status.info} />
        <Text style={styles.instructionsText}>
          Tap courses to select/deselect. Only selected courses will be assigned.
        </Text>
      </View>

      {/* Course List */}
      <ScrollView style={styles.courseList}>
        {allCourses.map((course) => {
          const isSelected = selectedCourseIds.has(course.id);
          const isAssigned = assignedCourses.some(c => c.id === course.id);
          
          return (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseCard,
                isSelected && styles.courseCardSelected,
                isAssigned && !isSelected && styles.courseCardPreviouslyAssigned,
              ]}
              onPress={() => toggleCourseSelection(course.id)}
              activeOpacity={0.7}
            >
              <View style={styles.courseCardContent}>
                {/* Selection indicator */}
                <View style={styles.selectionIndicator}>
                  <View style={[
                    styles.selectionDot,
                    isSelected && styles.selectionDotSelected,
                    isAssigned && !isSelected && styles.selectionDotPreviouslyAssigned,
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={12} color={colors.neutral.white} />
                    )}
                  </View>
                </View>

                {/* Course Info */}
                <View style={styles.courseInfo}>
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getCourseStatusColor(course.status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {course.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  {course.description && (
                    <Text style={styles.courseDescription} numberOfLines={2}>
                      {course.description}
                    </Text>
                  )}
                  
                  <View style={styles.courseMeta}>
                    {course.teacher?.user?.name && (
                      <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={12} color={colors.text.secondary} />
                        <Text style={styles.metaText}>{course.teacher.user.name}</Text>
                      </View>
                    )}
                    
                    {course.level && (
                      <View style={styles.metaItem}>
                        <Ionicons name="school-outline" size={12} color={colors.text.secondary} />
                        <Text style={styles.metaText}>{course.level}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Assigned badge */}
              {isAssigned && (
                <View style={styles.assignedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.secondary.green} />
                  <Text style={styles.assignedText}>Previously assigned</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {allCourses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={colors.neutral.gray400} />
            <Text style={styles.emptyText}>No courses available</Text>
            <Text style={styles.emptySubtext}>
              Create courses first before assigning them to classes
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
          disabled={saving}
        />
        <Button
          title={saving ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          variant="primary"
          style={styles.saveButton}
          loading={saving}
          disabled={saving}
        />
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
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
  headerRight: {
    padding: spacing.sm,
  },
  selectedCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary.yellow,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.status.info + '20',
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: 8,
    gap: spacing.sm,
  },
  instructionsText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  courseList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  courseCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.neutral.gray200,
  },
  courseCardSelected: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.primary.yellow + '10',
  },
  courseCardPreviouslyAssigned: {
    borderColor: colors.secondary.green + '50',
    backgroundColor: colors.secondary.green + '05',
  },
  courseCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectionIndicator: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  selectionDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionDotSelected: {
    backgroundColor: colors.primary.yellow,
  },
  selectionDotPreviouslyAssigned: {
    backgroundColor: colors.secondary.green + '30',
  },
  courseInfo: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  courseTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  courseDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral.white,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary.green + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: spacing.sm,
    gap: 4,
  },
  assignedText: {
    fontSize: fontSize.xs,
    color: colors.secondary.green,
    fontWeight: fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray200,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});