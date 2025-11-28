// app/lesson-details.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import lessonService, { Lesson } from "@/src/services/lessonService";
import { showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface QuizQuestion {
    id: number;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correct_answer: string;
    points: number;
}

interface Quiz {
    id: number;
    title: string;
    description?: string;
    questions: QuizQuestion[];
    total_points: number;
    time_limit?: number; // in minutes
    passing_score: number;
}

interface UserAnswer {
    questionId: number;
    answer: string;
    isCorrect?: boolean;
}

export default function LessonDetailsScreen() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const params = useLocalSearchParams();
    const lessonId = parseInt(params.lessonId as string);
    const courseId = parseInt(params.courseId as string);
    
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');

    useEffect(() => {
        if (lessonId) {
            loadLessonDetails();
        }
    }, [lessonId]);

    const loadLessonDetails = async () => {
        try {
            setLoading(true);
            const lessonResponse = await lessonService.getLesson(lessonId);
            setLesson(lessonResponse);
            
            // In a real app, you'd fetch the quiz associated with this lesson
            // For now, we'll create a mock quiz
            const mockQuiz: Quiz = {
                id: 1,
                title: `${lessonResponse.title} - Quiz`,
                description: "Test your understanding of this lesson",
                total_points: 100,
                passing_score: 70,
                time_limit: 30,
                questions: [
                    {
                        id: 1,
                        question: "What is the main topic of this lesson?",
                        type: 'multiple_choice',
                        options: ["Option A", "Option B", "Option C", "Option D"],
                        correct_answer: "Option B",
                        points: 25
                    },
                    {
                        id: 2,
                        question: "This lesson covers important concepts. True or False?",
                        type: 'true_false',
                        options: ["True", "False"],
                        correct_answer: "True",
                        points: 25
                    },
                    {
                        id: 3,
                        question: "Explain the key concept from this lesson in your own words.",
                        type: 'short_answer',
                        correct_answer: "The main concept involves...",
                        points: 50
                    }
                ]
            };
            setQuiz(mockQuiz);
            
        } catch (error: any) {
            console.error("Failed to load lesson details:", error);
            showError("Error", error.message || "Failed to load lesson details");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadLessonDetails();
    };

    const handleEditLesson = () => {
        router.push({
            pathname: "/edit-lesson",
            params: { 
                lessonId: lessonId.toString(),
                courseId: courseId.toString()
            }
        } as any);
    };

    const handleStartQuiz = () => {
        setQuizStarted(true);
        setActiveTab('quiz');
        setUserAnswers([]);
        setScore(0);
        setQuizSubmitted(false);
    };

    const handleAnswerSelect = (questionId: number, answer: string) => {
        setUserAnswers(prev => {
            const existingAnswer = prev.find(a => a.questionId === questionId);
            if (existingAnswer) {
                return prev.map(a => 
                    a.questionId === questionId ? { ...a, answer } : a
                );
            } else {
                return [...prev, { questionId, answer }];
            }
        });
    };

    const handleSubmitQuiz = () => {
        if (!quiz) return;

        let totalScore = 0;
        const evaluatedAnswers: UserAnswer[] = userAnswers.map(answer => {
            const question = quiz.questions.find(q => q.id === answer.questionId);
            if (!question) return answer;

            const isCorrect = answer.answer === question.correct_answer;
            if (isCorrect) {
                totalScore += question.points;
            }

            return { ...answer, isCorrect };
        });

        setUserAnswers(evaluatedAnswers);
        setScore(totalScore);
        setQuizSubmitted(true);

        const percentage = (totalScore / quiz.total_points) * 100;
        if (percentage >= quiz.passing_score) {
            showSuccess("Quiz Completed", `Congratulations! You scored ${percentage.toFixed(1)}% - You passed!`);
        } else {
            showError("Quiz Completed", `You scored ${percentage.toFixed(1)}% - Please review the lesson and try again.`);
        }
    };

    const handleRetakeQuiz = () => {
        setQuizStarted(false);
        setQuizSubmitted(false);
        setUserAnswers([]);
        setScore(0);
    };

    const handleOpenVideo = () => {
        if (lesson?.video_url) {
            Linking.openURL(lesson.video_url).catch(err => 
                showError("Error", "Could not open video URL")
            );
        }
    };

    const handleOpenDocument = () => {
        if (lesson?.document_path) {
            // In a real app, you'd use a document viewer
            showError("Info", "Document viewer would open here");
        }
    };

    const renderContent = () => {
        if (!lesson) return null;

        switch (lesson.content_type) {
            case 'video':
                return (
                    <View style={styles.contentSection}>
                        <Text style={styles.sectionTitle}>Video Content</Text>
                        {lesson.video_url ? (
                            <View style={styles.mediaContainer}>
                                <Ionicons name="play-circle" size={64} color={colors.primary.yellow} />
                                <Text style={styles.mediaText}>Video Lesson</Text>
                                <Button
                                    title="Watch Video"
                                    onPress={handleOpenVideo}
                                    variant="primary"
                                    style={styles.mediaButton}
                                />
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>No video available</Text>
                        )}
                        {lesson.content && (
                            <>
                                <Text style={styles.sectionTitle}>Additional Notes</Text>
                                <Text style={styles.textContent}>{lesson.content}</Text>
                            </>
                        )}
                    </View>
                );

            case 'document':
                return (
                    <View style={styles.contentSection}>
                        <Text style={styles.sectionTitle}>Document</Text>
                        {lesson.document_path ? (
                            <View style={styles.mediaContainer}>
                                <Ionicons name="document-text" size={64} color={colors.primary.yellow} />
                                <Text style={styles.mediaText}>Lesson Document</Text>
                                <Button
                                    title="Open Document"
                                    onPress={handleOpenDocument}
                                    variant="primary"
                                    style={styles.mediaButton}
                                />
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>No document available</Text>
                        )}
                        {lesson.content && (
                            <>
                                <Text style={styles.sectionTitle}>Summary</Text>
                                <Text style={styles.textContent}>{lesson.content}</Text>
                            </>
                        )}
                    </View>
                );

            case 'text':
            default:
                return (
                    <View style={styles.contentSection}>
                        <Text style={styles.sectionTitle}>Lesson Content</Text>
                        {lesson.content ? (
                            <Text style={styles.textContent}>{lesson.content}</Text>
                        ) : (
                            <Text style={styles.emptyText}>No content available</Text>
                        )}
                    </View>
                );
        }
    };

    const renderQuizQuestion = (question: QuizQuestion) => {
        if (!quizStarted && !quizSubmitted) return null;

        const userAnswer = userAnswers.find(a => a.questionId === question.id);
        
        return (
            <View key={question.id} style={styles.questionCard}>
                <Text style={styles.questionText}>
                    {question.question} ({question.points} points)
                </Text>
                
                {question.type === 'multiple_choice' && question.options?.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.optionButton,
                            userAnswer?.answer === option && styles.selectedOption,
                            quizSubmitted && option === question.correct_answer && styles.correctOption,
                            quizSubmitted && userAnswer?.answer === option && userAnswer.answer !== question.correct_answer && styles.incorrectOption
                        ]}
                        onPress={() => !quizSubmitted && handleAnswerSelect(question.id, option)}
                        disabled={quizSubmitted}
                    >
                        <Text style={styles.optionText}>{option}</Text>
                        {quizSubmitted && option === question.correct_answer && (
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        )}
                        {quizSubmitted && userAnswer?.answer === option && userAnswer.answer !== question.correct_answer && (
                            <Ionicons name="close-circle" size={20} color="#F44336" />
                        )}
                    </TouchableOpacity>
                ))}

                {question.type === 'true_false' && question.options?.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.optionButton,
                            userAnswer?.answer === option && styles.selectedOption,
                            quizSubmitted && option === question.correct_answer && styles.correctOption,
                            quizSubmitted && userAnswer?.answer === option && userAnswer.answer !== question.correct_answer && styles.incorrectOption
                        ]}
                        onPress={() => !quizSubmitted && handleAnswerSelect(question.id, option)}
                        disabled={quizSubmitted}
                    >
                        <Text style={styles.optionText}>{option}</Text>
                        {quizSubmitted && option === question.correct_answer && (
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        )}
                        {quizSubmitted && userAnswer?.answer === option && userAnswer.answer !== question.correct_answer && (
                            <Ionicons name="close-circle" size={20} color="#F44336" />
                        )}
                    </TouchableOpacity>
                ))}

                {question.type === 'short_answer' && (
                    <View style={styles.shortAnswerContainer}>
                        <Text style={styles.answerLabel}>Your Answer:</Text>
                        <Text style={styles.userAnswer}>
                            {userAnswer?.answer || "No answer provided"}
                        </Text>
                        {quizSubmitted && (
                            <>
                                <Text style={styles.answerLabel}>Correct Answer:</Text>
                                <Text style={styles.correctAnswer}>
                                    {question.correct_answer}
                                </Text>
                            </>
                        )}
                    </View>
                )}

                {quizSubmitted && (
                    <View style={styles.feedbackContainer}>
                        <Text style={[
                            styles.feedbackText,
                            userAnswer?.isCorrect ? styles.correctFeedback : styles.incorrectFeedback
                        ]}>
                            {userAnswer?.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderQuiz = () => {
        if (!quiz) return null;

        if (!quizStarted && !quizSubmitted) {
            return (
                <View style={styles.quizIntro}>
                    <Ionicons name="help-circle" size={64} color={colors.primary.yellow} />
                    <Text style={styles.quizTitle}>{quiz.title}</Text>
                    <Text style={styles.quizDescription}>{quiz.description}</Text>
                    
                    <View style={styles.quizInfo}>
                        <Text style={styles.quizInfoText}>
                            • {quiz.questions.length} questions
                        </Text>
                        <Text style={styles.quizInfoText}>
                            • Total points: {quiz.total_points}
                        </Text>
                        <Text style={styles.quizInfoText}>
                            • Passing score: {quiz.passing_score}%
                        </Text>
                        {quiz.time_limit && (
                            <Text style={styles.quizInfoText}>
                                • Time limit: {quiz.time_limit} minutes
                            </Text>
                        )}
                    </View>

                    <Button
                        title="Start Quiz"
                        onPress={handleStartQuiz}
                        variant="primary"
                        style={styles.startButton}
                    />
                </View>
            );
        }

        if (quizStarted && !quizSubmitted) {
            const answeredCount = userAnswers.length;
            const totalQuestions = quiz.questions.length;
            
            return (
                <View style={styles.quizContainer}>
                    <View style={styles.quizHeader}>
                        <Text style={styles.quizProgress}>
                            Question {answeredCount + 1} of {totalQuestions}
                        </Text>
                        <Text style={styles.answeredCount}>
                            Answered: {answeredCount}/{totalQuestions}
                        </Text>
                    </View>

                    <ScrollView style={styles.questionsContainer}>
                        {quiz.questions.map(renderQuizQuestion)}
                    </ScrollView>

                    <View style={styles.quizActions}>
                        <Button
                            title="Submit Quiz"
                            onPress={handleSubmitQuiz}
                            variant="primary"
                            disabled={userAnswers.length < quiz.questions.length}
                        />
                    </View>
                </View>
            );
        }

        if (quizSubmitted) {
            const percentage = (score / quiz.total_points) * 100;
            const passed = percentage >= quiz.passing_score;

            return (
                <View style={styles.quizResults}>
                    <Ionicons 
                        name={passed ? "trophy" : "alert-circle"} 
                        size={64} 
                        color={passed ? "#4CAF50" : "#FF9800"} 
                    />
                    <Text style={styles.resultTitle}>
                        {passed ? "Congratulations!" : "Quiz Completed"}
                    </Text>
                    <Text style={styles.resultScore}>
                        Your Score: {score}/{quiz.total_points} ({percentage.toFixed(1)}%)
                    </Text>
                    <Text style={styles.resultMessage}>
                        {passed 
                            ? "You have successfully passed this quiz!" 
                            : `You need ${quiz.passing_score}% to pass. Please review the lesson and try again.`
                        }
                    </Text>

                    <View style={styles.resultActions}>
                        <Button
                            title="Review Answers"
                            onPress={() => setActiveTab('quiz')}
                            variant="secondary"
                        />
                        <Button
                            title="Retake Quiz"
                            onPress={handleRetakeQuiz}
                            variant="primary"
                        />
                    </View>
                </View>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.yellow} />
                <Text style={styles.loadingText}>Loading lesson...</Text>
            </View>
        );
    }

    if (!lesson) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.neutral.gray400} />
                <Text style={styles.errorText}>Lesson not found</Text>
                <Button
                    title="Go Back"
                    onPress={() => router.back()}
                    variant="primary"
                    style={styles.backButton}
                />
            </View>
        );
    }

    const canManageLesson = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

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
                    <View style={styles.headerTitle}>
                        <Text style={styles.title} numberOfLines={1}>{lesson.title}</Text>
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {lesson.course?.title || 'Course'}
                        </Text>
                    </View>
                </View>
                {canManageLesson && (
                    <TouchableOpacity onPress={handleEditLesson} style={styles.editButton}>
                        <Ionicons name="create-outline" size={20} color={colors.primary.yellow} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Lesson Info */}
            <View style={styles.lessonInfo}>
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Ionicons name="book-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.infoText}>Lesson {lesson.order}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                        <Text style={styles.infoText}>
                            {lesson.created_at ? new Date(lesson.created_at).toLocaleDateString() : 'No date'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lesson.status) }]}>
                    <Text style={styles.statusText}>{lesson.status.toUpperCase()}</Text>
                </View>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'content' && styles.activeTab]}
                    onPress={() => setActiveTab('content')}
                >
                    <Ionicons 
                        name="document-text-outline" 
                        size={16} 
                        color={activeTab === 'content' ? colors.primary.yellow : colors.text.secondary} 
                    />
                    <Text style={[styles.tabText, activeTab === 'content' && styles.activeTabText]}>
                        Content
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'quiz' && styles.activeTab]}
                    onPress={() => setActiveTab('quiz')}
                >
                    <Ionicons 
                        name="help-circle-outline" 
                        size={16} 
                        color={activeTab === 'quiz' ? colors.primary.yellow : colors.text.secondary} 
                    />
                    <Text style={[styles.tabText, activeTab === 'quiz' && styles.activeTabText]}>
                        Quiz
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {activeTab === 'content' && renderContent()}
                {activeTab === 'quiz' && renderQuiz()}
            </ScrollView>
        </View>
    );
}

// Helper function for status colors
const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return '#4CAF50';
        case 'inactive': return '#F44336';
        case 'draft': return '#FF9800';
        default: return '#9E9E9E';
    }
};

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
    headerTitle: {
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
    lessonInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.lg,
        backgroundColor: colors.neutral.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    infoText: {
        fontSize: fontSize.sm,
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
    contentSection: {
        padding: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    textContent: {
        fontSize: fontSize.base,
        color: colors.text.primary,
        lineHeight: 24,
    },
    mediaContainer: {
        alignItems: "center",
        padding: spacing.xl,
        backgroundColor: colors.neutral.gray50,
        borderRadius: 12,
        marginBottom: spacing.lg,
    },
    mediaText: {
        fontSize: fontSize.base,
        color: colors.text.primary,
        marginVertical: spacing.md,
    },
    mediaButton: {
        marginTop: spacing.sm,
    },
    emptyText: {
        fontSize: fontSize.base,
        color: colors.text.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: spacing.xl,
    },
    // Quiz Styles
    quizIntro: {
        alignItems: "center",
        padding: spacing.xl,
    },
    quizTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    quizDescription: {
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    quizInfo: {
        backgroundColor: colors.neutral.gray50,
        padding: spacing.lg,
        borderRadius: 12,
        marginBottom: spacing.lg,
        width: '100%',
    },
    quizInfoText: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    startButton: {
        marginTop: spacing.md,
    },
    quizContainer: {
        flex: 1,
        padding: spacing.lg,
    },
    quizHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    quizProgress: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
    },
    answeredCount: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
    },
    questionsContainer: {
        flex: 1,
    },
    questionCard: {
        backgroundColor: colors.neutral.white,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    questionText: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    optionButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.neutral.gray300,
        borderRadius: 8,
        marginBottom: spacing.sm,
    },
    selectedOption: {
        borderColor: colors.primary.yellow,
        backgroundColor: colors.primary.yellow + '20',
    },
    correctOption: {
        borderColor: '#4CAF50',
        backgroundColor: '#4CAF50' + '20',
    },
    incorrectOption: {
        borderColor: '#F44336',
        backgroundColor: '#F44336' + '20',
    },
    optionText: {
        fontSize: fontSize.base,
        color: colors.text.primary,
        flex: 1,
    },
    shortAnswerContainer: {
        marginTop: spacing.md,
    },
    answerLabel: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    userAnswer: {
        fontSize: fontSize.base,
        color: colors.text.primary,
        backgroundColor: colors.neutral.gray50,
        padding: spacing.md,
        borderRadius: 8,
        marginBottom: spacing.md,
    },
    correctAnswer: {
        fontSize: fontSize.base,
        color: '#4CAF50',
        backgroundColor: '#4CAF50' + '20',
        padding: spacing.md,
        borderRadius: 8,
    },
    feedbackContainer: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.neutral.gray200,
    },
    feedbackText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    correctFeedback: {
        color: '#4CAF50',
    },
    incorrectFeedback: {
        color: '#F44336',
    },
    quizActions: {
        marginTop: spacing.lg,
    },
    quizResults: {
        alignItems: "center",
        padding: spacing.xl,
    },
    resultTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    resultScore: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    resultMessage: {
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    resultActions: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.md,
    },
});