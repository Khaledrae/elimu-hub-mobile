// app/course-details.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import courseService, { Course } from "@/src/services/courseService";
import { showError } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface CourseClass {
    id: number;
    name: string;
    level_group: string;
}

interface CourseLesson {
    id: number;
    title: string;
    description?: string;
    content_type: string;
    order: number;
    status: string;
    created_at?: string;
}

interface CourseAssessment {
    id: number;
    title: string;
    type: string;
    due_date?: string;
    status: string;
}

export default function CourseDetailsScreen() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const params = useLocalSearchParams();
    const courseId = parseInt(params.courseId as string);
    
    const [course, setCourse] = useState<Course | null>(null);
    const [classes, setClasses] = useState<CourseClass[]>([]);
    const [lessons, setLessons] = useState<CourseLesson[]>([]);
    const [assessments, setAssessments] = useState<CourseAssessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'assessments' | 'classes'>('overview');

    useEffect(() => {
        if (courseId) {
            loadCourseDetails();
        }
    }, [courseId]);

    const loadCourseDetails = async () => {
        try {
            setLoading(true);
            const courseResponse = await courseService.getCourse(courseId);
            setCourse(courseResponse);
            
            // Load additional data
            const [classesResponse, lessonsResponse, assessmentsResponse] = await Promise.all([
                courseService.getCourseClasses(courseId),
                courseService.getCourseLessons(courseId),
                courseService.getCourseAssessments(courseId)
            ]);
            
            setClasses(classesResponse || []);
            setLessons(lessonsResponse || []);
            setAssessments(assessmentsResponse || []);
            
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

    const handleLessonPress = (lesson: CourseLesson) => {
        router.push({
            pathname: "/lesson-details",
            params: { 
                lessonId: lesson.id.toString(), 
                courseId: courseId.toString() 
            }
        } as any);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#4CAF50';
            case 'inactive': return '#F44336';
            case 'draft': return '#FF9800';
            default: return '#9E9E9E';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading course details...</Text>
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

    const canManageCourse = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

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

            {/* Course Header with Thumbnail */}
            <View style={styles.courseHeader}>
                <View style={styles.thumbnailContainer}>
                    {course.thumbnail ? (
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
                    <View style={styles.metaItem}>
                        <Ionicons name="school-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.metaText}>Level: {getLevelLabel(course.level)}</Text>
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
                            <View style={styles.infoItem}>
                                <Ionicons name="flag-outline" size={16} color={colors.text.secondary} />
                                <Text style={styles.infoLabel}>Status:</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) }]}>
                                    <Text style={styles.statusText}>{course.status.toUpperCase()}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Recent Lessons */}
                        <View style={styles.infoSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recent Lessons</Text>
                                {canManageCourse && (
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
                                            {lesson.created_at ? `Created: ${formatDate(lesson.created_at)}` : 'No date'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                                </TouchableOpacity>
                            ))}
                            {lessons.length === 0 && (
                                <Text style={styles.emptyText}>No lessons available</Text>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'lessons' && (
                    <View style={styles.tabContent}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>All Lessons</Text>
                            {canManageCourse && (
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
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: lesson.status === 'active' ? '#4CAF50' : '#FF9800' }
                                    ]}>
                                        <Text style={styles.statusText}>
                                            {lesson.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                {lesson.description && (
                                    <Text style={styles.lessonDescription}>{lesson.description}</Text>
                                )}
                                <View style={styles.lessonMeta}>
                                    <Text style={styles.lessonOrder}>Lesson {lesson.order}</Text>
                                    <Text style={styles.lessonDate}>
                                        {lesson.created_at ? `Created: ${formatDate(lesson.created_at)}` : 'No date'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
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
                        <Text style={styles.sectionTitle}>Assessments</Text>
                        {assessments.map((assessment) => (
                            <View key={assessment.id} style={styles.assessmentCard}>
                                <View style={styles.assessmentHeader}>
                                    <Text style={styles.assessmentTitle}>{assessment.title}</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: assessment.status === 'active' ? '#4CAF50' : '#FF9800' }
                                    ]}>
                                        <Text style={styles.statusText}>
                                            {assessment.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.assessmentType}>Type: {assessment.type}</Text>
                                {assessment.due_date && (
                                    <Text style={styles.assessmentDue}>
                                        Due: {formatDate(assessment.due_date)}
                                    </Text>
                                )}
                            </View>
                        ))}
                        {assessments.length === 0 && (
                            <Text style={styles.emptyText}>No assessments available</Text>
                        )}
                    </View>
                )}

                {activeTab === 'classes' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Assigned Classes</Text>
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

// Add the styles - similar to class-details styles but adjusted for courses
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
    lessonOrder: {
        fontSize: fontSize.xs,
        color: colors.text.secondary,
    },
    lessonDate: {
        fontSize: fontSize.xs,
        color: colors.text.secondary,
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
    assessmentType: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    assessmentDue: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
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