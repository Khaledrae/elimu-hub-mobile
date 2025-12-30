// app/course-details.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import courseService, { Course } from "@/src/services/courseService";
import coveredLessonService from "@/src/services/coveredLessonService";
import lessonService from "@/src/services/lessonService";
import { showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// TODO: Replace with actual premium status from backend
const IS_PREMIUM = false; // Temporary variable
const DAILY_LESSON_LIMIT = 3;

interface CourseClass {
    id: number;
    name: string;
    level_group: string;
}

interface CourseLesson {
    id: number;
    course_id: number;
    class_id: number;
    title: string;
    description?: string;
    content_type: string;
    order: number;
    status: string;
    created_at?: string;
}

interface CoveredLesson {
    id: number;
    lesson_id: number;
    status: "in-progress" | "completed" | "failed";
    score: number | null;
    attempts: number;
    started_at: string;
    completed_at: string | null;
    lesson: CourseLesson;
}

interface CourseAssessment {
    id: number;
    lesson_id: number;
    title: string;
    type: string;
    status: string;
    total_marks: number;
}

export default function CourseDetailsScreen() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const params = useLocalSearchParams();
    const courseId = parseInt(params.courseId as string);
    
    const [course, setCourse] = useState<Course | null>(null);
    const [classes, setClasses] = useState<CourseClass[]>([]);
    const [lessons, setLessons] = useState<CourseLesson[]>([]);
    const [coveredLessons, setCoveredLessons] = useState<CoveredLesson[]>([]);
    const [assessments, setAssessments] = useState<CourseAssessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'assessments' | 'classes'>('overview');
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [todayAccessedCount, setTodayAccessedCount] = useState(0);

    const isStudent = currentUser?.role === "student";
    const canManageCourse = currentUser?.role === "admin" || currentUser?.role === "teacher";
    const isPremium = IS_PREMIUM; // TODO: Get from user profile

    useEffect(() => {
        if (courseId) {
            loadCourseDetails();
        }
    }, [courseId, selectedClass]);

    const loadCourseDetails = async () => {
        try {
            setLoading(true);
            const courseResponse = await courseService.getCourse(courseId);
            setCourse(courseResponse);
            
            // Load classes
            const classesResponse = await courseService.getCourseClasses(courseId);
            setClasses(classesResponse || []);

            // Set selected class to student's class or first available
            if (isStudent && currentUser.student_profile?.grade_level_id) {
                setSelectedClass(currentUser.student_profile.grade_level_id);
            } else if (!selectedClass && classesResponse?.length > 0) {
                setSelectedClass(classesResponse[0].id);
            }

            // Load lessons based on permissions
            let lessonsResponse: CourseLesson[] = [];
            if (canManageCourse) {
                // Teachers/Admins see all lessons
                lessonsResponse = await courseService.getCourseLessons(courseId);
            } else if (isStudent) {
                // Students see lessons filtered by their class or selected class
                const classId = isPremium ? selectedClass : currentUser.student_profile?.grade_level_id;
                if (classId) {
                    lessonsResponse = await courseService.getCourseLessonsByClass(courseId, classId);
                }
                
                // Get covered lessons for progress tracking
                const coveredResponse = await coveredLessonService.getCourseRecentLessons(
                    currentUser.id,
                    courseId
                );
                setCoveredLessons(coveredResponse.data || []);
                
                // Count today's accessed lessons
                const today = new Date().toDateString();
                const todayCount = coveredResponse.data.filter((cl: CoveredLesson) => {
                    const startedDate = new Date(cl.started_at).toDateString();
                    return startedDate === today;
                }).length;
                setTodayAccessedCount(todayCount);
            }
            setLessons(lessonsResponse || []);

            // Load assessments
            const assessmentsResponse = await courseService.getCourseAssessments(courseId);
            
            // Filter assessments based on role
            if (isStudent && currentUser.student_profile?.grade_level_id) {
                // Students only see assessments for their class
                const filteredAssessments = assessmentsResponse?.filter(
                    (assessment: CourseAssessment) => {
                        // Check if assessment's lesson belongs to student's class
                        const lesson = lessonsResponse.find(l => l.id === assessment.lesson_id);
                        return lesson?.class_id === currentUser.student_profile?.grade_level_id;
                    }
                ) || [];
                setAssessments(filteredAssessments);
            } else {
                // Teachers/Admins see all assessments
                setAssessments(assessmentsResponse || []);
            }
            
        } catch (error: any) {
            console.error("Failed to load course details:", error);
            showError("Error", error.message || "Failed to load course details");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadCourseDetails();
    };

    const getLessonStatus = (lesson: CourseLesson) => {
        if (canManageCourse) {
            // Teachers/Admins see published/draft status
            return lesson.status;
        }

        // Students see locked/unlocked/progress status
        const covered = coveredLessons.find(cl => cl.lesson_id === lesson.id);
        
        if (covered) {
            return covered.status; // completed, failed, in-progress
        }

        // Check if lesson is locked
        if (!isPremium) {
            // Check if previous lesson is completed
            const previousLesson = lessons.find(l => l.order === lesson.order - 1);
            if (lesson.order > 1 && previousLesson) {
                const previousCovered = coveredLessons.find(cl => cl.lesson_id === previousLesson.id);
                if (!previousCovered || previousCovered.status !== "completed") {
                    return "locked";
                }
            }

            // Check daily limit
            if (todayAccessedCount >= DAILY_LESSON_LIMIT) {
                const todayLessons = coveredLessons.filter(cl => {
                    const startedDate = new Date(cl.started_at).toDateString();
                    return startedDate === new Date().toDateString();
                });
                const isAccessedToday = todayLessons.some(cl => cl.lesson_id === lesson.id);
                if (!isAccessedToday) {
                    return "locked";
                }
            }
        }

        return "unlocked";
    };

    const canAccessLesson = (lesson: CourseLesson): boolean => {
        if (canManageCourse) return true;
        if (isPremium) return true;

        const status = getLessonStatus(lesson);
        return status !== "locked";
    };

    const handleLessonPress = (lesson: CourseLesson) => {
        if (!canAccessLesson(lesson)) {
            Alert.alert(
                "Lesson Locked 🔒",
                isPremium 
                    ? "This lesson is not available yet."
                    : `Unlock this lesson by:\n• Completing the previous lesson\n• Daily limit: ${todayAccessedCount}/${DAILY_LESSON_LIMIT} lessons accessed today\n\nUpgrade to Premium for unlimited access!`,
                [
                    { text: "OK", style: "cancel" },
                    { text: "Upgrade to Premium", onPress: () => handleUpgradeToPremium() }
                ]
            );
            return;
        }

        router.push({
            pathname: "/lesson-details",
            params: { 
                lessonId: lesson.id.toString(), 
                courseId: courseId.toString() 
            }
        } as any);
    };

    const handleUpgradeToPremium = () => {
        // TODO: Navigate to premium upgrade screen
        showSuccess("Coming Soon", "Premium subscriptions will be available soon!");
    };

    const handleEditCourse = () => {
        router.push({
            pathname: "/edit-course",
            params: { courseId: courseId.toString() }
        } as any);
    };

    const handleAddLesson = () => {
        router.push({
            pathname: "/add-lesson",
            params: { courseId: courseId.toString() }
        } as any);
    };

    const handleEditLesson = (lessonId: number) => {
        router.push({
            pathname: "/edit-lesson",
            params: { 
                lessonId: lessonId.toString(),
                courseId: courseId.toString()
            }
        } as any);
    };

    const handleDeleteLesson = (lessonId: number) => {
        Alert.alert(
            "Delete Lesson",
            "Are you sure you want to delete this lesson? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await lessonService.deleteLesson(lessonId);
                            showSuccess("Success", "Lesson deleted successfully");
                            loadCourseDetails();
                        } catch (error: any) {
                            showError("Error", "Failed to delete lesson");
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#4CAF50';
            case 'in-progress': return '#2196F3';
            case 'failed': return '#F44336';
            case 'locked': return '#9E9E9E';
            case 'unlocked': return '#FF9800';
            case 'published': return '#4CAF50';
            case 'draft': return '#FF9800';
            default: return '#9E9E9E';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return 'checkmark-circle';
            case 'in-progress': return 'time';
            case 'failed': return 'close-circle';
            case 'locked': return 'lock-closed';
            case 'unlocked': return 'lock-open';
            case 'published': return 'checkmark-circle';
            case 'draft': return 'create';
            default: return 'help-circle';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'in-progress': return 'In Progress';
            case 'locked': return 'Locked';
            case 'unlocked': return 'Available';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const renderLessonCard = (lesson: CourseLesson) => {
        const status = getLessonStatus(lesson);
        const covered = coveredLessons.find(cl => cl.lesson_id === lesson.id);
        const isLocked = status === "locked";

        return (
            <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonCard, isLocked && styles.lockedCard]}
                onPress={() => handleLessonPress(lesson)}
                disabled={isLocked && !canManageCourse}
            >
                <View style={styles.lessonHeader}>
                    <View style={styles.lessonTitleRow}>
                        <Ionicons 
                            name={getStatusIcon(status) as any}
                            size={20} 
                            color={getStatusColor(status)} 
                        />
                        <Text style={[
                            styles.lessonTitle,
                            isLocked && styles.lockedText
                        ]}>
                            {lesson.order}. {lesson.title}
                        </Text>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(status) }
                    ]}>
                        <Text style={styles.statusText}>
                            {getStatusLabel(status).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {lesson.description && !isLocked && (
                    <Text style={styles.lessonDescription}>{lesson.description}</Text>
                )}

                <View style={styles.lessonFooter}>
                    <View style={styles.lessonMeta}>
                        <Ionicons 
                            name={lesson.content_type === 'video' ? 'play-circle' : 
                                  lesson.content_type === 'document' ? 'document-text' : 
                                  'reader'} 
                            size={14} 
                            color={colors.text.secondary} 
                        />
                        <Text style={styles.lessonMetaText}>
                            {lesson.content_type.charAt(0).toUpperCase() + lesson.content_type.slice(1)}
                        </Text>
                    </View>

                    {covered && (
                        <View style={styles.lessonProgress}>
                            <Text style={styles.progressText}>
                                {covered.score !== null ? `Score: ${covered.score}%` : ''}
                                {covered.attempts > 1 ? ` • ${covered.attempts} attempts` : ''}
                            </Text>
                        </View>
                    )}

                    {canManageCourse && (
                        <View style={styles.lessonActions}>
                            <TouchableOpacity
                                onPress={() => handleEditLesson(lesson.id)}
                                style={styles.actionButton}
                            >
                                <Ionicons name="create-outline" size={18} color={colors.primary.yellow} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDeleteLesson(lesson.id)}
                                style={styles.actionButton}
                            >
                                <Ionicons name="trash-outline" size={18} color="#F44336" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {isLocked && !canManageCourse && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color={colors.neutral.gray400} />
                        <Text style={styles.lockText}>
                            {!isPremium && todayAccessedCount >= DAILY_LESSON_LIMIT
                                ? `Daily limit reached (${DAILY_LESSON_LIMIT} lessons)`
                                : "Complete previous lesson to unlock"}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const getTeacherName = () => {
        if (course?.teacher?.user) {
            return `${course.teacher.user.first_name} ${course.teacher.user.last_name}`;
        }
        return "No teacher assigned";
    };

    const getLevelLabel = (level: string) => {
        const levels = {
            'pre-primary': 'Pre-Primary',
            'lower-primary': 'Lower Primary (1-3)',
            'upper-primary': 'Upper Primary (4-6)',
            'lower-secondary': 'Lower Secondary (7-9)',
            'upper-secondary': 'Upper Secondary (10-12)',
        };
        return levels[level as keyof typeof levels] || level;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.yellow} />
                <Text style={styles.loadingText}>Loading course details...</Text>
            </View>
        );
    }

    if (!course) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.neutral.gray400} />
                <Text style={styles.errorText}>Course not found</Text>
                <Button
                    title="Go Back"
                    onPress={() => router.back()}
                    variant="primary"
                    style={styles.backButton}
                />
            </View>
        );
    }

    const completedCount = coveredLessons.filter(cl => cl.status === "completed").length;
    const progressPercentage = lessons.length > 0 
        ? Math.round((completedCount / lessons.length) * 100) 
        : 0;

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
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>{course.title}</Text>
                        <Text style={styles.subtitle}>
                            {getLevelLabel(course.level)}
                        </Text>
                    </View>
                </View>
                {canManageCourse && (
                    <TouchableOpacity onPress={handleEditCourse} style={styles.editButton}>
                        <Ionicons name="create-outline" size={20} color={colors.primary.yellow} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Premium Banner for Students */}
            {isStudent && !isPremium && (
                <TouchableOpacity 
                    style={styles.premiumBanner}
                    onPress={handleUpgradeToPremium}
                >
                    <Ionicons name="star" size={20} color="#FFD700" />
                    <Text style={styles.premiumText}>
                        Upgrade to Premium for unlimited lesson access!
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.neutral.white} />
                </TouchableOpacity>
            )}

            {/* Course Progress (Students Only) */}
            {isStudent && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Your Progress</Text>
                        <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View 
                            style={[
                                styles.progressFill, 
                                { width: `${progressPercentage}%` }
                            ]} 
                        />
                    </View>
                    <Text style={styles.progressStats}>
                        {completedCount} of {lessons.length} lessons completed
                        {!isPremium && ` • ${todayAccessedCount}/${DAILY_LESSON_LIMIT} accessed today`}
                    </Text>
                </View>
            )}

            {/* Class Selector for Premium Students */}
            {isStudent && isPremium && classes.length > 1 && (
                <ScrollView 
                    horizontal 
                    style={styles.classSelector}
                    showsHorizontalScrollIndicator={false}
                >
                    {classes.map((classItem) => (
                        <TouchableOpacity
                            key={classItem.id}
                            style={[
                                styles.classChip,
                                selectedClass === classItem.id && styles.classChipActive
                            ]}
                            onPress={() => setSelectedClass(classItem.id)}
                        >
                            <Text style={[
                                styles.classChipText,
                                selectedClass === classItem.id && styles.classChipTextActive
                            ]}>
                                {classItem.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Course Header with Thumbnail */}
            <View style={styles.courseHeader}>
                <View style={styles.thumbnailContainer}>
                    {course.thumbnail && course.thumbnail !== 'default.png' ? (
                        <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
                    ) : (
                        <View style={styles.thumbnailPlaceholder}>
                            <Ionicons name="book-outline" size={40} color={colors.neutral.gray400} />
                        </View>
                    )}
                </View>
                <View style={styles.courseMeta}>
                    <Text style={styles.courseDescription}>
                        {course.description || "No description available"}
                    </Text>
                    <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.metaText}>Teacher: {getTeacherName()}</Text>
                    </View>
                </View>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Ionicons name="school-outline" size={24} color={colors.primary.yellow} />
                    <Text style={styles.statNumber}>{classes.length}</Text>
                    <Text style={styles.statLabel}>Classes</Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="document-outline" size={24} color={colors.primary.yellow} />
                    <Text style={styles.statNumber}>{lessons.length}</Text>
                    <Text style={styles.statLabel}>Lessons</Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="clipboard-outline" size={24} color={colors.primary.yellow} />
                    <Text style={styles.statNumber}>{assessments.length}</Text>
                    <Text style={styles.statLabel}>Assessments</Text>
                </View>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabContainer}>
                {[
                    { key: 'overview' as const, label: 'Overview', icon: 'grid-outline' },
                    { key: 'lessons' as const, label: 'Lessons', icon: 'document-outline' },
                    { key: 'assessments' as const, label: 'Assessments', icon: 'clipboard-outline' },
                    { key: 'classes' as const, label: 'Classes', icon: 'people-outline' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && styles.activeTab
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons 
                            name={tab.icon as any} 
                            size={16} 
                            color={activeTab === tab.key ? colors.primary.yellow : colors.text.secondary} 
                        />
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.key && styles.activeTabText
                        ]}>
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
                {activeTab === 'overview' && (
                    <View style={styles.tabContent}>
                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Course Information</Text>
                            <View style={styles.infoItem}>
                                <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
                                <Text style={styles.infoLabel}>Teacher:</Text>
                                <Text style={styles.infoValue}>{getTeacherName()}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="school-outline" size={16} color={colors.text.secondary} />
                                <Text style={styles.infoLabel}>Level:</Text>
                                <Text style={styles.infoValue}>{getLevelLabel(course.level)}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
                                <Text style={styles.infoLabel}>Created:</Text>
                                <Text style={styles.infoValue}>
                                    {course.created_at ? formatDate(course.created_at) : 'N/A'}
                                </Text>
                            </View>
                            {canManageCourse && (
                                <View style={styles.infoItem}>
                                    <Ionicons name="flag-outline" size={16} color={colors.text.secondary} />
                                    <Text style={styles.infoLabel}>Status:</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) }]}>
                                        <Text style={styles.statusText}>{course.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Recent Lessons */}
                        <View style={styles.infoSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    {isStudent ? "Continue Learning" : "Recent Lessons"}
                                </Text>
                                {canManageCourse && (
                                    <Button
                                        title="Add Lesson"
                                        onPress={handleAddLesson}
                                        size="small"
                                        variant="secondary"
                                    />
                                )}
                            </View>
                            {lessons.slice(0, 3).map((lesson) => renderLessonCard(lesson))}
                            {lessons.length === 0 && (
                                <Text style={styles.emptyText}>No lessons available</Text>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'lessons' && (
                    <View style={styles.tabContent}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                All Lessons ({lessons.length})
                            </Text>
                            {canManageCourse && (
                                <Button
                                    title="Add Lesson"
                                    onPress={handleAddLesson}
                                    size="small"
                                    variant="secondary"
                                />
                            )}
                        </View>
                        {lessons.map((lesson) => renderLessonCard(lesson))}
                        {lessons.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-outline" size={64} color={colors.neutral.gray400} />
                                <Text style={styles.emptyText}>No lessons available</Text>
                                <Text style={styles.emptySubtext}>Add your first lesson to get started</Text>
                                {canManageCourse && (
                                    <Button
                                        title="Add Lesson"
                                        onPress={handleAddLesson}
                                        variant="primary"
                                        style={styles.emptyButton}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'assessments' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>
                            Assessments ({assessments.length})
                        </Text>
                        {assessments.map((assessment) => {
                            const lesson = lessons.find(l => l.id === assessment.lesson_id);
                            return (
                                <View key={assessment.id} style={styles.assessmentCard}>
                                    <View style={styles.assessmentHeader}>
                                        <Text style={styles.assessmentTitle}>{assessment.title}</Text>
                                        {canManageCourse && (
                                            <View style={[
                                                styles.statusBadge,
                                                { backgroundColor: getStatusColor(assessment.status) }
                                            ]}>
                                                <Text style={styles.statusText}>
                                                    {assessment.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {lesson && (
                                        <Text style={styles.assessmentLesson}>
                                            📚 {lesson.title}
                                        </Text>
                                    )}
                                    <View style={styles.assessmentFooter}>
                                        <Text style={styles.assessmentType}>
                                            {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                                        </Text>
                                        <Text style={styles.assessmentMarks}>
                                            {assessment.total_marks} marks
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                        {assessments.length === 0 && (
                            <Text style={styles.emptyText}>No assessments available</Text>
                        )}
                    </View>
                )}

                {activeTab === 'classes' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Assigned Classes ({classes.length})</Text>
                        {classes.map((classItem) => (
                            <View key={classItem.id} style={styles.classCard}>
                                <View style={styles.classAvatar}>
                                    <Text style={styles.avatarText}>
                                        {classItem.name.charAt(0)}
                                    </Text>
                                </View>
                                <View style={styles.classInfo}>
                                    <Text style={styles.className}>{classItem.name}</Text>
                                    <Text style={styles.classLevel}>{classItem.level_group}</Text>
                                </View>
                            </View>
                        ))}
                        {classes.length === 0 && (
                            <Text style={styles.emptyText}>No classes assigned</Text>
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
        padding: spacing.xl,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.text.secondary,
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
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: fontSize.lg,
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
    premiumBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#9C27B0",
        padding: spacing.md,
        gap: spacing.sm,
    },
    premiumText: {
        flex: 1,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.neutral.white,
    },
    progressContainer: {
        backgroundColor: colors.neutral.white,
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    progressTitle: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
    },
    progressPercentage: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.primary.yellow,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.neutral.gray200,
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: spacing.sm,
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.primary.yellow,
    },
    progressStats: {
        fontSize: fontSize.xs,
        color: colors.text.secondary,
    },
    classSelector: {
        backgroundColor: colors.neutral.white,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    classChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.neutral.gray300,
        marginRight: spacing.sm,
    },
    classChipActive: {
        backgroundColor: colors.primary.yellow,
        borderColor: colors.primary.yellow,
    },
    classChipText: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
    },
    classChipTextActive: {
        color: colors.text.primary,
        fontWeight: fontWeight.semibold,
    },
    courseHeader: {
        flexDirection: "row",
        backgroundColor: colors.neutral.white,
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    thumbnailContainer: {
        marginRight: spacing.md,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    thumbnailPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: colors.neutral.gray100,
        justifyContent: "center",
        alignItems: "center",
    },
    courseMeta: {
        flex: 1,
    },
    courseDescription: {
        fontSize: fontSize.base,
        color: colors.text.secondary,
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.xs,
    },
    metaText: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginLeft: spacing.xs,
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
    lessonCard: {
        backgroundColor: colors.neutral.white,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    lockedCard: {
        opacity: 0.6,
    },
    lessonHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.sm,
    },
    lessonTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flex: 1,
    },
    lessonTitle: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        flex: 1,
    },
    lockedText: {
        color: colors.neutral.gray400,
    },
    lessonDescription: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
        lineHeight: 18,
    },
    lessonFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: spacing.sm,
    },
    lessonMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    lessonMetaText: {
        fontSize: fontSize.xs,
        color: colors.text.secondary,
    },
    lessonProgress: {
        flex: 1,
        alignItems: "center",
    },
    progressText: {
        fontSize: fontSize.xs,
        color: colors.text.secondary,
    },
    lessonActions: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    actionButton: {
        padding: spacing.xs,
    },
    lockOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.md,
    },
    lockText: {
        fontSize: fontSize.sm,
        color: colors.neutral.gray400,
        textAlign: "center",
        marginTop: spacing.sm,
    },
    assessmentCard: {
        backgroundColor: colors.neutral.white,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    assessmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: spacing.sm,
    },
    assessmentTitle: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        flex: 1,
        marginRight: spacing.sm,
    },
    assessmentLesson: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    assessmentFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    assessmentType: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
    },
    assessmentMarks: {
        fontSize: fontSize.sm,
        color: colors.primary.yellow,
        fontWeight: fontWeight.semibold,
    },
    classCard: {
        flexDirection: "row",
        backgroundColor: colors.neutral.white,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.md,
        alignItems: "center",
    },
    classAvatar: {
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
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: 2,
    },
    classLevel: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
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