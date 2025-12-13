// app/(tabs)/dashboard.tsx
import {
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import classService, { ClassModel } from "@/src/services/classService";
import courseService, { Course } from "@/src/services/courseService";
import lessonService, { Lesson } from "@/src/services/lessonService";
import schoolService from "@/src/services/schoolService";
import { showConfirmation } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DashboardStats {
  schools: number;
  classes: number;
  courses: number;
  lessons: number;
  students?: number;
  teachers?: number;
  myClasses?: number;
  myCourses?: number;
  myLessons?: number;
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    schools: 0,
    classes: 0,
    courses: 0,
    lessons: 0,
  });
  const [loading, setLoading] = useState(true);
  const [studentClass, setStudentClass] = useState<ClassModel | null>(null);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [lastLesson, setLastLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Role-based data fetching
      const userRole = user?.role;

      if (userRole === "admin") {
        // Admin sees everything
        const [schoolsData, classesData, coursesData, lessonsData] =
          await Promise.all([
            schoolService.getAllSchools().catch(() => []),
            classService.getAllClasses().catch(() => []),
            courseService.getAllCourses().catch(() => []),
            lessonService.getAllLessons().catch(() => []),
          ]);

        setStats({
          schools: schoolsData.length,
          classes: classesData.length,
          courses: coursesData.length,
          lessons: lessonsData.length,
        });
      } else if (userRole === "teacher") {
        // Teacher sees their classes and courses
        const [classesData, coursesData, lessonsData] = await Promise.all([
          classService.getAllClasses().catch(() => []), // Would be teacher's classes
          courseService.getAllCourses().catch(() => []), // Would be teacher's courses
          lessonService.getAllLessons().catch(() => []), // Would be teacher's lessons
        ]);

        setStats({
          schools: 0, // Teachers don't manage schools
          classes: classesData.length,
          courses: coursesData.length,
          lessons: lessonsData.length,
          myClasses: classesData.length,
          myCourses: coursesData.length,
        });
      } else if (userRole === "student") {
        // Student sees their classes and lessons
        const [classesData, coursesData, lessonsData] = await Promise.all([
          classService.getAllClasses().catch(() => []), // Would be student's classes
          courseService.getAllCourses().catch(() => []), // Would be student's courses
          lessonService.getAllLessons().catch(() => []), // Would be student's lessons
        ]);

        const classId = 1;

        const classData = await classService.getClass(classId);
        setStudentClass(classData);

        if (classData.courses) {
          setMyCourses(classData.courses);
        }

        if (classData.lessons && classData.lessons.length > 0) {
          setRecentLessons(classData.lessons);
          setLastLesson(classData.lessons[0]); // or last accessed logic later
        }
        setStats({
          schools: 0,
          classes: 0,
          courses: coursesData.length,
          lessons: lessonsData.length,
          myClasses: classesData.length,
          myCourses: coursesData.length,
          myLessons: lessonsData.length,
        });
      } else if (userRole === "parent") {
        // Parent sees children's progress
        setStats({
          schools: 0,
          classes: 0,
          courses: 0,
          lessons: 0,
          myClasses: 2, // Example: 2 children's classes
          myCourses: 8, // Example: 8 enrolled courses
        });
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log("Logging out user");
    showConfirmation("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          console.log("User confirmed logout");
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // Role-based stats cards
  const getStatsCards = () => {
    const userRole = user?.role;
    const cards = [];

    if (userRole === "admin") {
      cards.push(
        {
          title: "Schools",
          count: stats.schools,
          icon: "business-outline",
          color: colors.primary.yellow,
        },
        {
          title: "Classes",
          count: stats.classes,
          icon: "school-outline",
          color: colors.secondary.green,
        },
        {
          title: "Courses",
          count: stats.courses,
          icon: "library-outline",
          color: colors.status.info,
        },
        {
          title: "Lessons",
          count: stats.lessons,
          icon: "book-outline",
          color: colors.status.warning,
        }
      );
    } else if (userRole === "teacher") {
      cards.push(
        {
          title: "My Classes",
          count: stats.myClasses || 0,
          icon: "school-outline",
          color: colors.secondary.green,
        },
        {
          title: "My Courses",
          count: stats.myCourses || 0,
          icon: "library-outline",
          color: colors.status.info,
        },
        {
          title: "My Lessons",
          count: stats.lessons,
          icon: "book-outline",
          color: colors.status.warning,
        },
        {
          title: "Students",
          count: 45, // Would be actual student count
          icon: "people-outline",
          color: colors.primary.yellow,
        }
      );
    } else if (userRole === "student") {
      cards.push(
        {
          title: "My Classes",
          count: stats.myClasses || 0,
          icon: "school-outline",
          color: colors.secondary.green,
        },
        {
          title: "My Courses",
          count: stats.myCourses || 0,
          icon: "library-outline",
          color: colors.status.info,
        },
        {
          title: "My Lessons",
          count: stats.myLessons || 0,
          icon: "book-outline",
          color: colors.status.warning,
        },
        {
          title: "Progress",
          count: "75%", // Example progress
          icon: "trending-up-outline",
          color: colors.primary.yellow,
        }
      );
    } else if (userRole === "parent") {
      cards.push(
        {
          title: "Children",
          count: 2, // Number of children
          icon: "people-outline",
          color: colors.secondary.green,
        },
        {
          title: "Classes",
          count: stats.myClasses || 0,
          icon: "school-outline",
          color: colors.status.info,
        },
        {
          title: "Courses",
          count: stats.myCourses || 0,
          icon: "library-outline",
          color: colors.status.warning,
        },
        {
          title: "Avg. Progress",
          count: "82%",
          icon: "trending-up-outline",
          color: colors.primary.yellow,
        }
      );
    }

    return cards;
  };

  // Role-based menu items (your existing function)
  const getMenuItems = () => {
    const baseItems = [
      {
        title: "Schools",
        description: "Manage schools and institutions",
        icon: "business-outline",
        color: "#4CAF50",
        route: "/schools",
        roles: ["admin"],
      },
      {
        title: "Classes",
        description: "Manage classes and grades",
        icon: "school-outline",
        color: "#2196F3",
        route: "/classes",
        roles: ["admin", "teacher"],
      },
      {
        title: "Courses",
        description: "Manage subjects and curriculum",
        icon: "library-outline",
        color: "#9C27B0",
        route: "/courses",
        roles: ["admin", "teacher"],
      },
      {
        title: "Lessons",
        description: "Create and manage lessons",
        icon: "book-outline",
        color: "#FF9800",
        route: "/lessons",
        roles: ["admin", "teacher"],
      },
      {
        title: "Students",
        description: "View and manage students",
        icon: "people-outline",
        color: "#00BCD4",
        route: "/students",
        roles: ["admin", "teacher"],
      },
      {
        title: "Teachers",
        description: "Manage teaching staff",
        icon: "person-outline",
        color: "#F44336",
        route: "/teachers",
        roles: ["admin"],
      },
      {
        title: "My Classes",
        description: "View your assigned classes",
        icon: "school-outline",
        color: "#4CAF50",
        route: "/my-classes",
        roles: ["teacher"],
      },
      {
        title: "My Children",
        description: "Monitor your children's progress",
        icon: "people-outline",
        color: "#2196F3",
        route: "/my-children",
        roles: ["parent"],
      },
      {
        title: "My Lessons",
        description: "Access your learning materials",
        icon: "book-outline",
        color: "#FF9800",
        route: "/my-lessons",
        roles: ["student"],
      },
    ];

    return baseItems.filter(
      (item) => !item.roles || item.roles.includes(user?.role || "")
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.role}>{user?.role}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>
      </View>
      {user?.role === "student" && (
        <View style={styles.studentSection}>
          {/* Continue Learning Card */}
          {lastLesson && (
            <TouchableOpacity
              style={styles.continueCard}
              onPress={() => router.push(`/lesson/${lastLesson.id}`)}
            >
              <Ionicons
                name="play-circle-outline"
                size={26}
                color={colors.primary.yellow}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.continueText}>Continue Learning</Text>
                <Text style={styles.continueTitle}>{lastLesson.title}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Courses with Progress */}
          <Text style={styles.studentSectionTitle}>My Courses</Text>
          {myCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => router.push(`/course/${course.id}`)}
            >
              <Text style={styles.courseTitle}>{course.name}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${course.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>
                {course.progress}% completed
              </Text>
            </TouchableOpacity>
          ))}

          {/* Class Info */}
          <Text style={styles.studentSectionTitle}>My Class</Text>
          <TouchableOpacity
            style={styles.classCard}
            onPress={() => router.push(`/class/${studentClass.id}`)}
          >
            <Ionicons
              name="school-outline"
              size={24}
              color={colors.secondary.green}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.className}>{studentClass.name}</Text>
              <Text style={styles.classTeacher}>
                Teacher: {studentClass.teacher}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Recent Lessons */}
          <Text style={styles.studentSectionTitle}>Recent Lessons</Text>
          {recentLessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonCard}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
            >
              <Ionicons
                name="book-outline"
                size={20}
                color={colors.status.info}
              />
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Menu */}
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Role-Based Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Overview</Text>
          {loading ? (
            <View style={styles.loadingStats}>
              <ActivityIndicator size="small" color={colors.primary.yellow} />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {getStatsCards().map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <Ionicons
                    name={stat.icon as any}
                    size={24}
                    color={stat.color}
                  />
                  <Text style={styles.statNumber}>{stat.count}</Text>
                  <Text style={styles.statLabel}>{stat.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.menuGrid}>
          {getMenuItems().map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={28}
                  color={item.color}
                />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.text.secondary}
            />
            <Text style={styles.activityText}>
              Last login: {new Date().toLocaleDateString()}
            </Text>
          </View>
          {user?.created_at && (
            <View style={styles.activityCard}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.activityText}>
                Member since: {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.primary.yellow,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    opacity: 0.8,
  },
  userName: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.neutral.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  role: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary.yellow,
  },
  logoutButton: {
    padding: spacing.sm,
    marginTop: 4,
  },
  statsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
  },
  statsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  loadingStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.text.secondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    ...shadows.sm,
  },
  statNumber: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  menuContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  menuItem: {
    width: "47%",
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    borderRadius: 16,
    ...shadows.sm,
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  menuTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  menuDescription: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 16,
  },
  activitySection: {
    marginTop: spacing.lg,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  activityText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  studentSection: {
    padding: spacing.lg,
  },

  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },

  continueText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },

  continueTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },

  studentSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginVertical: spacing.md,
    color: colors.text.primary,
  },

  courseCard: {
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.sm,
  },

  courseTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },

  progressBar: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginTop: 8,
  },

  progressFill: {
    height: 8,
    backgroundColor: colors.primary.yellow,
    borderRadius: 8,
  },

  classCard: {
    flexDirection: "row",
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: 12,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },

  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },

  lessonTitle: {
    marginLeft: 10,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
});
