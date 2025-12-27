// app/(tabs)/dashboard.tsx
import {
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import classService from "@/src/services/classService";
import courseService from "@/src/services/courseService";
import coveredLessonService from "@/src/services/coveredLessonService";
import lessonService from "@/src/services/lessonService";
import schoolService from "@/src/services/schoolService";
import { showConfirmation } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
//import { OverallP
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
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
  completedLessons?: number;
  pendingAssignments?: number;
  progressPercentage?: number;
}

interface StudentCourse {
  id: number;
  title: string;
  description: string;
  teacher: {
    id: number;
    user: {
      name: string;
    };
  };
  progress?: number;
}

interface RecentActivity {
  id: number;
  type:
    | "lesson_completed"
    | "assignment_submitted"
    | "quiz_taken"
    | "login"
    | "created";
  title: string;
  description: string;
  date: string;
  course_name?: string;
}

interface StatCard {
  title: string;
  count: number | string;
  icon: string;
  color: string;
  onPress?: () => void;
}

export default function DashboardScreen() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    schools: 0,
    classes: 0,
    courses: 0,
    lessons: 0,
  });
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadDashboardData();
    }
  }, [user, isLoading]);

  const loadDashboardData = async () => {
    if (!user) {
      console.log("No user available, skipping dashboard load");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userRole = user?.role;

      // Common data for all roles
      let baseStats: DashboardStats = {
        schools: 0,
        classes: 0,
        courses: 0,
        lessons: 0,
      };

      // Role-specific data fetching
      if (userRole === "admin") {
        // Admin sees everything
        const [schoolsData, classesData, coursesData, lessonsData] =
          await Promise.all([
            schoolService.getAllSchools().catch(() => []),
            classService.getAllClasses().catch(() => []),
            courseService.getAllCourses().catch(() => []),

            lessonService.getAllLessons().catch(() => []),
          ]);

        baseStats = {
          ...baseStats,
          schools: schoolsData.length,
          classes: classesData.length,
          courses: coursesData.length,
          lessons: lessonsData.length,
        };

        // Admin recent activities (recently created items)
        const adminActivities: RecentActivity[] = [
          {
            id: 1,
            type: "created",
            title: "Created new school",
            description: 'Added "New Academy" to the system',
            date: new Date().toISOString(),
          },
          {
            id: 2,
            type: "created",
            title: "Added new teacher",
            description: "Registered Mr. John Doe as teacher",
            date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
        ];
        setRecentActivities(adminActivities);
      } else if (userRole === "teacher") {
        // Teacher sees their classes and courses
        const [classesData, coursesData, lessonsData] = await Promise.all([
          classService.getAllClasses().catch(() => []),
          courseService.getAllCourses().catch(() => []),
          lessonService.getAllLessons().catch(() => []),
        ]);

        baseStats = {
          ...baseStats,
          schools: 0,
          classes: classesData.length,
          courses: coursesData.length,
          lessons: lessonsData.length,
          myClasses: classesData.length,
          myCourses: coursesData.length,
        };

        // Teacher recent activities (recent lessons created)
        const teacherActivities: RecentActivity[] = [
          {
            id: 1,
            type: "created",
            title: "Created new lesson",
            description: 'Added "Mathematics: Algebra Basics"',
            date: new Date().toISOString(),
          },
          {
            id: 2,
            type: "created",
            title: "Updated assignment",
            description: "Updated homework for Grade 5",
            date: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setRecentActivities(teacherActivities);
      } else if (userRole === "student") {
        // Student sees their specific data
        const studentId = user.id;
        const gradeLevel = user.student_profile?.grade_level;
        const gradeLevelId = user.student_profile?.grade_level_id;

        // Get student's courses for their class
        let coursesData = [];
        if (gradeLevelId) {
          try {
            // Try to get courses by class/grade level
            coursesData = await courseService.getCoursesForClass(gradeLevelId);
            console.log("Fetched courses for student class:", coursesData);
          } catch (error) {
            // Fallback to all courses
            coursesData = await courseService.getAllCourses().catch(() => []);
          }
        }

        // Get progress data if coveredLessonService exists
        let progressData = { completed_lessons: 0 };
        try {
          const overallProgress = await coveredLessonService.getOverallProgress(
            studentId
          );

          const completedLessons = overallProgress.completed;
          const totalLessons = overallProgress.total_lessons;

          const progressPercentage = overallProgress.completion_rate;
        } catch (error) {
          
          console.log("Progress service not available yet", error);
        }

        // Get lessons data
        const lessonsData = await lessonService.getLessonsByClass(gradeLevelId).catch(() => []);

        // Calculate progress
        const totalLessons = lessonsData.length;
        const completedLessons = progressData.completed_lessons || 0;
        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        // Get pending assignments (mock for now)
        const pendingAssignments = 3;

        baseStats = {
          ...baseStats,
          schools: 0,
          classes: 0,
          courses: coursesData.length,
          lessons: lessonsData.length,
          myClasses: 1, // Student is in one class
          myCourses: coursesData.length,
          myLessons: lessonsData.length,
          completedLessons,
          pendingAssignments,
          progressPercentage,
        };

        const formattedCourses = await Promise.all(
          coursesData.map(async (course) => {
            let progress = 0;

            try {
              const courseProgress =
                await coveredLessonService.getProgressForCourse(
                  course.id,
                  studentId
                );
              progress = courseProgress.progress.percentage;
            } catch (e) {
              progress = 0;
            }

            return {
              id: course.id,
              title: course.title,
              description: course.description || "",
              teacher: course.teacher || { id: 0, user: { name: "Teacher" } },
              progress,
            };
          })
        );

        setStudentCourses(formattedCourses.slice(0, 3));

        // Student recent activities
        const studentActivities: RecentActivity[] = [
          {
            id: 1,
            type: "lesson_completed",
            title: "Completed lesson",
            description: 'Finished "Introduction to Fractions"',
            date: new Date().toISOString(),
            course_name: "Mathematics",
          },
          {
            id: 2,
            type: "quiz_taken",
            title: "Took quiz",
            description: "Scored 85% on Science quiz",
            date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            course_name: "Science",
          },
          {
            id: 3,
            type: "assignment_submitted",
            title: "Submitted assignment",
            description: "Submitted English essay",
            date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            course_name: "English",
          },
        ];
        setRecentActivities(studentActivities);
      } else if (userRole === "parent") {
        // Parent sees children's progress
        baseStats = {
          ...baseStats,
          schools: 0,
          classes: 0,
          courses: 0,
          lessons: 0,
          myClasses: 2, // Example: 2 children's classes
          myCourses: 8, // Example: 8 enrolled courses
        };

        // Parent recent activities
        const parentActivities: RecentActivity[] = [
          {
            id: 1,
            type: "login",
            title: "Checked progress",
            description: "Viewed child's learning progress",
            date: new Date().toISOString(),
          },
          {
            id: 2,
            type: "login",
            title: "Viewed report",
            description: "Checked quarterly report card",
            date: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setRecentActivities(parentActivities);
      }

      setStats(baseStats);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const handleLogout = () => {
    showConfirmation("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // Role-based stats cards - UPDATED WITH STUDENT SPECIFIC
  const getStatsCards = (): StatCard[] => {
    const userRole = user?.role;
    const cards: StatCard[] = [];

    if (userRole === "admin") {
      cards.push(
        {
          title: "Schools",
          count: stats.schools,
          icon: "business-outline",
          color: colors.primary.yellow,
          onPress: () => router.push("/schools"),
        },
        {
          title: "Classes",
          count: stats.classes,
          icon: "school-outline",
          color: colors.secondary.green,
          onPress: () => router.push("/classes"),
        },
        {
          title: "Courses",
          count: stats.courses,
          icon: "library-outline",
          color: colors.status.info,
          onPress: () => router.push("/courses"),
        },
        {
          title: "Lessons",
          count: stats.lessons,
          icon: "book-outline",
          color: colors.status.warning,
          onPress: () => router.push("/lessons"),
        }
      );
    } else if (userRole === "teacher") {
      cards.push(
        {
          title: "My Classes",
          count: stats.myClasses || 0,
          icon: "school-outline",
          color: colors.secondary.green,
          onPress: () => router.push("/my-classes"),
        },
        {
          title: "My Courses",
          count: stats.myCourses || 0,
          icon: "library-outline",
          color: colors.status.info,
          onPress: () => router.push("/my-courses"),
        },
        {
          title: "My Lessons",
          count: stats.lessons,
          icon: "book-outline",
          color: colors.status.warning,
          onPress: () => router.push("/lessons"),
        },
        {
          title: "Students",
          count: 45, // Would be actual student count
          icon: "people-outline",
          color: colors.primary.yellow,
          onPress: () => router.push("/students"),
        }
      );
    } else if (userRole === "student") {
      cards.push(
        {
          title: "Active Courses",
          count: stats.myCourses || 0,
          icon: "library-outline",
          color: colors.status.info,
          onPress: () => router.push("/courses"),
        },
        {
          title: "Progress",
          count: `${stats.progressPercentage || 0}%`,
          icon: "trending-up-outline",
          color: colors.secondary.green,
          onPress: () => router.push("/progress"),
        },
        {
          title: "Lessons",
          count: `${stats.completedLessons || 0}/${stats.lessons || 0}`,
          icon: "book-outline",
          color: colors.status.warning,
          onPress: () => router.push("/lessons"),
        },
        {
          title: "Assignments",
          count: stats.pendingAssignments || 0,
          icon: "document-text-outline",
          color: colors.primary.red,
          onPress: () => router.push("/assignments"),
        }
      );
    } else if (userRole === "parent") {
      cards.push(
        {
          title: "Children",
          count: 2, // Number of children
          icon: "people-outline",
          color: colors.secondary.green,
          onPress: () => router.push("/my-children"),
        },
        {
          title: "Classes",
          count: stats.myClasses || 0,
          icon: "school-outline",
          color: colors.status.info,
          onPress: () => router.push("/classes"),
        },
        {
          title: "Courses",
          count: stats.myCourses || 0,
          icon: "library-outline",
          color: colors.status.warning,
          onPress: () => router.push("/courses"),
        },
        {
          title: "Avg. Progress",
          count: "82%",
          icon: "trending-up-outline",
          color: colors.primary.yellow,
          onPress: () => router.push("/progress"),
        }
      );
    }

    return cards;
  };

  // Role-based menu items (your existing function - enhanced)
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
        roles: ["admin", "teacher", "student"],
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
      {
        title: "Assignments",
        description: "View and submit assignments",
        icon: "document-text-outline",
        color: "#673AB7",
        route: "/assignments",
        roles: ["student"],
      },
      {
        title: "Progress",
        description: "Track your learning progress",
        icon: "trending-up-outline",
        color: "#4CAF50",
        route: "/progress",
        roles: ["student", "parent"],
      },
      {
        title: "Assessments",
        description: "Create and grade assessments",
        icon: "clipboard-outline",
        color: "#FF9800",
        route: "/assessments",
        roles: ["teacher"],
      },
      {
        title: "Reports",
        description: "View analytics and reports",
        icon: "stats-chart-outline",
        color: "#2196F3",
        route: "/reports",
        roles: ["admin", "teacher"],
      },
    ];

    return baseItems.filter(
      (item) => !item.roles || item.roles.includes(user?.role || "")
    );
  };

  // Role-based quick actions
  const getQuickActions = () => {
    const userRole = user?.role;
    const actions = [];

    if (userRole === "student") {
      actions.push(
        {
          title: "Today's Lessons",
          icon: "today-outline",
          color: colors.primary.yellow,
          route: "/lessons/today",
        },
        {
          title: "Assignments",
          icon: "document-text-outline",
          color: colors.primary.red,
          route: "/assignments/pending",
        },
        {
          title: "Progress",
          icon: "stats-chart-outline",
          color: colors.secondary.green,
          route: "/progress",
        },
        {
          title: "Schedule",
          icon: "calendar-outline",
          color: colors.status.info,
          route: "/calendar",
        }
      );
    } else if (userRole === "teacher") {
      actions.push(
        {
          title: "Create Lesson",
          icon: "add-circle-outline",
          color: colors.primary.yellow,
          route: "/lessons/create",
        },
        {
          title: "Grade Work",
          icon: "checkmark-circle-outline",
          color: colors.secondary.green,
          route: "/assessments/grade",
        },
        {
          title: "Attendance",
          icon: "people-outline",
          color: colors.status.info,
          route: "/attendance",
        },
        {
          title: "Reports",
          icon: "stats-chart-outline",
          color: colors.primary.red,
          route: "/reports",
        }
      );
    } else if (userRole === "admin") {
      actions.push(
        {
          title: "Add User",
          icon: "person-add-outline",
          color: colors.primary.yellow,
          route: "/users/create",
        },
        {
          title: "Analytics",
          icon: "stats-chart-outline",
          color: colors.secondary.green,
          route: "/analytics",
        },
        {
          title: "Settings",
          icon: "settings-outline",
          color: colors.status.info,
          route: "/settings",
        },
        {
          title: "Reports",
          icon: "document-text-outline",
          color: colors.primary.red,
          route: "/reports",
        }
      );
    }

    return actions;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "lesson_completed":
        return "checkmark-circle-outline";
      case "assignment_submitted":
        return "document-text-outline";
      case "quiz_taken":
        return "help-circle-outline";
      case "created":
        return "add-circle-outline";
      case "login":
        return "log-in-outline";
      default:
        return "time-outline";
    }
  };

  const getActivityColor = (type: RecentActivity["type"]) => {
    switch (type) {
      case "lesson_completed":
        return colors.secondary.green;
      case "assignment_submitted":
        return colors.status.info;
      case "quiz_taken":
        return colors.primary.yellow;
      case "created":
        return colors.primary.blue;
      case "login":
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const renderRoleSpecificContent = () => {
    const userRole = user?.role;

    if (userRole === "student" && studentCourses.length > 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Courses</Text>
            <TouchableOpacity onPress={() => router.push("/courses")}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {studentCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => router.push(`/course-details?courseId=${course.id}`)}
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseTeacher}>
                  {course.teacher?.user?.name || "Teacher"}
                </Text>
              </View>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{course.progress}%</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${course.progress}%` },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return null;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.yellow} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>

          {user?.role === "student" && user?.student_profile && (
            <View style={styles.studentInfo}>
              <Text style={styles.studentClass}>
                {user.student_profile.grade_level}
              </Text>
              <Text style={styles.studentAdmission}>
                {user.student_profile.admission_number}
              </Text>
            </View>
          )}

          {user?.role !== "student" && (
            <View style={styles.roleBadge}>
              <Text style={styles.role}>{user?.role}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        {loading ? (
          <View style={styles.loadingStats}>
            <ActivityIndicator size="small" color={colors.primary.yellow} />
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {getStatsCards().map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.statCard}
                onPress={stat.onPress}
              >
                <View style={styles.statIconContainer}>
                  <Ionicons
                    name={stat.icon as any}
                    size={20}
                    color={stat.color}
                  />
                </View>
                <Text style={styles.statNumber}>{stat.count}</Text>
                <Text style={styles.statLabel}>{stat.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Role-specific content (Student Courses, etc.) */}
      {renderRoleSpecificContent()}

      {/* Quick Access Menu */}
      <View style={styles.section}>
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
      </View>

      {/* Quick Actions (Role-based) */}
      {getQuickActions().length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {getQuickActions().map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAction}
                onPress={() => router.push(action.route as any)}
              >
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recent Activity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={getActivityIcon(activity.type)}
                  size={20}
                  color={getActivityColor(activity.type)}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
                <Text style={styles.activityDate}>
                  {formatDate(activity.date)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="time-outline"
              size={48}
              color={colors.text.secondary}
            />
            <Text style={styles.emptyStateText}>No recent activity</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
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
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  studentClass: {
    backgroundColor: colors.neutral.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary.yellow,
  },
  studentAdmission: {
    fontSize: fontSize.xs,
    color: colors.text.primary,
    opacity: 0.8,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.neutral.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: spacing.sm,
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
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  viewAll: {
    fontSize: fontSize.sm,
    color: colors.primary.yellow,
    fontWeight: fontWeight.semibold,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    ...shadows.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: fontSize["xl"],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },
  loadingStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  courseCard: {
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  courseTeacher: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  progressContainer: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: colors.background.secondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.secondary.green,
    borderRadius: 3,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
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
  activityCard: {
    flexDirection: "row",
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  activityIcon: {
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    ...shadows.sm,
  },
  emptyStateText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  quickAction: {
    width: "47%",
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    borderRadius: 12,
    ...shadows.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
