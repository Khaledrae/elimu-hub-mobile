// app/lesson-details.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import {
    Assessment,
    Attempt,
    getAssessmentByLesson,
    getAttemptResults,
    Question,
    startAttempt,
    submitAttempt,
} from "@/src/services/assessmentService";
import coveredLessonService from "@/src/services/coveredLessonService";
import lessonService, { Lesson } from "@/src/services/lessonService";
import { showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking, Modal, RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Video from "react-native-video";

interface UserAnswer {
  question_id: number;
  selected_option: "A" | "B" | "C" | "D";
}

export default function LessonDetailsScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams();
  const lessonId = parseInt(params.lessonId as string);
  const courseId = parseInt(params.courseId as string);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "quiz">("content");
  const [submitting, setSubmitting] = useState(false);

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

      if (currentUser?.role === "student") {
        try {
          await coveredLessonService.startLesson(lessonId, currentUser.id);
        } catch (e) {
          console.warn("Lesson already started or failed silently");
        }
      }

      // Fetch assessment for this lesson
      try {
        const assessmentResponse = await getAssessmentByLesson(lessonId);
        setAssessment(assessmentResponse);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log("No assessment found for this lesson");
          setAssessment(null);
        } else {
          throw error;
        }
      }
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
        courseId: courseId.toString(),
      },
    } as any);
  };

  const handleManageAssessment = () => {
    router.push({
      pathname: "/manage-assessment",
      params: {
        lessonId: lessonId.toString(),
        assessmentId: assessment?.id.toString(),
      },
    } as any);
  };

  const handleStartQuiz = async () => {
    if (!assessment || currentUser?.role !== "student") return;

    try {
      setLoading(true);
      const attemptResponse = await startAttempt(assessment.id);
      setCurrentAttempt(attemptResponse.attempt);
      setQuizStarted(true);
      setActiveTab("quiz");
      setUserAnswers([]);
      setQuizSubmitted(false);
      setResults(null);
      showSuccess("Quiz Started", attemptResponse.message);
    } catch (error: any) {
      console.error("Failed to start quiz:", error);
      showError("Error", error.message || "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, option: "A" | "B" | "C" | "D") => {
    setUserAnswers((prev) => {
      const existingAnswer = prev.find((a) => a.question_id === questionId);
      if (existingAnswer) {
        return prev.map((a) =>
          a.question_id === questionId ? { ...a, selected_option: option } : a
        );
      } else {
        return [...prev, { question_id: questionId, selected_option: option }];
      }
    });
  };

  const handleSubmitQuiz = async () => {
    if (!assessment || !currentAttempt) return;

    try {
      setSubmitting(true);
      const submitResponse = await submitAttempt(
        assessment.id,
        currentAttempt.id,
        userAnswers
      );

      // Fetch results
      const resultsResponse = await getAttemptResults(
        assessment.id,
        currentAttempt.id
      );

      setResults(resultsResponse);
      setQuizSubmitted(true);

      const percentage = resultsResponse.score_percentage;
      if (percentage >= 70) {
        showSuccess(
          "Quiz Completed",
          `Congratulations! You scored ${percentage.toFixed(1)}% - You passed!`
        );
      } else {
        showError(
          "Quiz Completed",
          `You scored ${percentage.toFixed(1)}% - Please review and try again.`
        );
      }
    } catch (error: any) {
      console.error("Failed to submit quiz:", error);
      showError("Error", error.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizStarted(false);
    setQuizSubmitted(false);
    setUserAnswers([]);
    setResults(null);
    setCurrentAttempt(null);
  };

  const handleOpenVideo = () => {
    if (lesson?.video_url) {
      Linking.openURL(lesson.video_url).catch((err) =>
        showError("Error", "Could not open video URL")
      );
    }
  };

  const handleOpenDocument = () => {
    if (lesson?.document_path) {
      showError("Info", "Document viewer would open here");
    }
  };

  const renderContent = () => {
    if (!lesson) return null;

    switch (lesson.content_type) {
      case "video":
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Video Content</Text>
            {showVideoPlayer && lesson.video_url && (
              <Modal
                visible={showVideoPlayer}
                animationType="slide"
                onRequestClose={() => setShowVideoPlayer(false)}
              >
                <View style={styles.videoModal}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowVideoPlayer(false)}
                  >
                    <Ionicons name="close" size={30} color="white" />
                  </TouchableOpacity>
                  <Video
                    source={{ uri: lesson.video_url }}
                    style={styles.videoPlayer}
                    controls={true}
                    resizeMode="contain"
                    onError={(error) => console.error("Video error:", error)}
                  />
                </View>
              </Modal>
            )}
            {lesson.video_url ? (
              <View style={styles.mediaContainer}>
                <TouchableOpacity
                  onPress={() => setShowVideoPlayer(true)}
                  style={styles.videoThumbnail}
                >
                  <Ionicons
                    name="play-circle"
                    size={64}
                    color={colors.primary.yellow}
                  />
                  <Text style={styles.mediaText}>Play Video</Text>
                </TouchableOpacity>
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

      case "document":
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Document</Text>
            {lesson.document_path ? (
              <View style={styles.mediaContainer}>
                <Ionicons
                  name="document-text"
                  size={64}
                  color={colors.primary.yellow}
                />
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

      case "text":
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

  const getOptionLabel = (option: "A" | "B" | "C" | "D", question: Question): string => {
    switch (option) {
      case "A":
        return question.option_a;
      case "B":
        return question.option_b;
      case "C":
        return question.option_c || "";
      case "D":
        return question.option_d || "";
      default:
        return "";
    }
  };

  const renderQuizQuestion = (question: Question, index: number) => {
    if (!quizStarted && !quizSubmitted) return null;

    const userAnswer = userAnswers.find((a) => a.question_id === question.id);
    const options: Array<"A" | "B" | "C" | "D"> = ["A", "B"];
    if (question.option_c) options.push("C");
    if (question.option_d) options.push("D");

    const responseData = quizSubmitted
      ? results?.responses.find((r: any) => r.question_id === question.id)
      : null;

    return (
      <View key={question.id} style={styles.questionCard}>
        <Text style={styles.questionText}>
          {index + 1}. {question.question_text} ({question.marks} marks)
        </Text>

        {options.map((option) => {
          const optionText = getOptionLabel(option, question);
          if (!optionText) return null;

          const isSelected = userAnswer?.selected_option === option;
          const isCorrect = quizSubmitted && option === question.correct_option;
          const isIncorrect =
            quizSubmitted &&
            isSelected &&
            option !== question.correct_option;

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                isSelected && !quizSubmitted && styles.selectedOption,
                isCorrect && styles.correctOption,
                isIncorrect && styles.incorrectOption,
              ]}
              onPress={() => !quizSubmitted && handleAnswerSelect(question.id, option)}
              disabled={quizSubmitted}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{option}.</Text>
                <Text style={styles.optionText}>{optionText}</Text>
              </View>
              {quizSubmitted && isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
              {quizSubmitted && isIncorrect && (
                <Ionicons name="close-circle" size={20} color="#F44336" />
              )}
            </TouchableOpacity>
          );
        })}

        {quizSubmitted && responseData && (
          <View style={styles.feedbackContainer}>
            <Text
              style={[
                styles.feedbackText,
                responseData.is_correct
                  ? styles.correctFeedback
                  : styles.incorrectFeedback,
              ]}
            >
              {responseData.is_correct
                ? `✓ Correct (+${responseData.marks_awarded} marks)`
                : `✗ Incorrect (0 marks)`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderQuiz = () => {
    if (!assessment) {
      return (
        <View style={styles.noQuizContainer}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={colors.neutral.gray400}
          />
          <Text style={styles.noQuizText}>
            No assessment available for this lesson
          </Text>
          {(currentUser?.role === "admin" || currentUser?.role === "teacher") && (
            <Button
              title="Create Assessment"
              onPress={handleManageAssessment}
              variant="primary"
              style={styles.createButton}
            />
          )}
        </View>
      );
    }

    if (currentUser?.role !== "student") {
      return (
        <View style={styles.teacherQuizView}>
          <Ionicons
            name="school-outline"
            size={64}
            color={colors.primary.yellow}
          />
          <Text style={styles.teacherQuizTitle}>{assessment.title}</Text>
          <Text style={styles.teacherQuizInfo}>
            {assessment.questions?.length || 0} questions • {assessment.total_marks} marks
          </Text>
          <Text style={styles.teacherQuizInfo}>
            Duration: {assessment.duration_minutes} minutes
          </Text>
          <Button
            title="Manage Assessment"
            onPress={handleManageAssessment}
            variant="primary"
            style={styles.manageButton}
          />
        </View>
      );
    }

    if (!quizStarted && !quizSubmitted) {
      return (
        <View style={styles.quizIntro}>
          <Ionicons
            name="help-circle"
            size={64}
            color={colors.primary.yellow}
          />
          <Text style={styles.quizTitle}>{assessment.title}</Text>
          {assessment.instructions && (
            <Text style={styles.quizDescription}>{assessment.instructions}</Text>
          )}

          <View style={styles.quizInfo}>
            <Text style={styles.quizInfoText}>
              • {assessment.questions?.length || 0} questions
            </Text>
            <Text style={styles.quizInfoText}>
              • Total marks: {assessment.total_marks}
            </Text>
            {assessment.duration_minutes && (
              <Text style={styles.quizInfoText}>
                • Time limit: {assessment.duration_minutes} minutes
              </Text>
            )}
            <Text style={styles.quizInfoText}>
              • Status: {assessment.status}
            </Text>
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
      const totalQuestions = assessment.questions?.length || 0;

      return (
        <View style={styles.quizContainer}>
          <View style={styles.quizHeader}>
            <Text style={styles.quizProgress}>
              Progress: {answeredCount}/{totalQuestions}
            </Text>
            {assessment.duration_minutes && (
              <Text style={styles.timeLimit}>
                Time: {assessment.duration_minutes} min
              </Text>
            )}
          </View>

          <ScrollView style={styles.questionsContainer}>
            {assessment.questions?.map((question, index) =>
              renderQuizQuestion(question, index)
            )}
          </ScrollView>

          <View style={styles.quizActions}>
            <Button
              title={submitting ? "Submitting..." : "Submit Quiz"}
              onPress={handleSubmitQuiz}
              variant="primary"
              disabled={
                userAnswers.length < totalQuestions || submitting
              }
            />
            {userAnswers.length < totalQuestions && (
              <Text style={styles.warningText}>
                Please answer all questions before submitting
              </Text>
            )}
          </View>
        </View>
      );
    }

    if (quizSubmitted && results) {
      const percentage = results.score_percentage;
      const passed = percentage >= 70;

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
            Your Score: {results.total_marks}/{results.possible_marks} (
            {percentage.toFixed(1)}%)
          </Text>
          <Text style={styles.resultMessage}>
            {passed
              ? "You have successfully passed this quiz!"
              : "Keep learning and try again!"}
          </Text>

          <ScrollView style={styles.reviewContainer}>
            <Text style={styles.reviewTitle}>Review Your Answers:</Text>
            {assessment.questions?.map((question, index) =>
              renderQuizQuestion(question, index)
            )}
          </ScrollView>

          <View style={styles.resultActions}>
            <Button
              title="Retake Quiz"
              onPress={handleRetakeQuiz}
              variant="primary"
            />
          </View>
          <View style={styles.resultActions}>
            <Button
              title="Next Lesson"
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
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={colors.neutral.gray400}
        />
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

  const canManageLesson =
    currentUser?.role === "admin" || currentUser?.role === "teacher";

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
            <Text style={styles.title} numberOfLines={1}>
              {lesson.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {lesson.course?.title || "Course"}
            </Text>
          </View>
        </View>
        {canManageLesson && (
          <TouchableOpacity
            onPress={handleEditLesson}
            style={styles.editButton}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.primary.yellow}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Lesson Info */}
      <View style={styles.lessonInfo}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons
              name="book-outline"
              size={16}
              color={colors.text.secondary}
            />
            <Text style={styles.infoText}>Lesson {lesson.order}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.text.secondary}
            />
            <Text style={styles.infoText}>
              {lesson.created_at
                ? new Date(lesson.created_at).toLocaleDateString()
                : "No date"}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(lesson.status) },
          ]}
        >
          <Text style={styles.statusText}>{lesson.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "content" && styles.activeTab]}
          onPress={() => setActiveTab("content")}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={
              activeTab === "content"
                ? colors.primary.yellow
                : colors.text.secondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "content" && styles.activeTabText,
            ]}
          >
            Content
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "quiz" && styles.activeTab]}
          onPress={() => setActiveTab("quiz")}
        >
          <Ionicons
            name="help-circle-outline"
            size={16}
            color={
              activeTab === "quiz"
                ? colors.primary.yellow
                : colors.text.secondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "quiz" && styles.activeTabText,
            ]}
          >
            Quiz
            {assessment && (
              <Text style={styles.tabBadge}> •</Text>
            )}
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
        {activeTab === "content" && renderContent()}
        {activeTab === "quiz" && renderQuiz()}
      </ScrollView>
    </View>
  );
}

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
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
  tabBadge: {
    color: colors.primary.yellow,
    fontSize: fontSize.lg,
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
  videoModal: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
  },
  videoPlayer: {
    width: "100%",
    height: 300,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  videoThumbnail: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  mediaContainer: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.neutral.gray500,
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
    fontStyle: "italic",
    textAlign: "center",
    padding: spacing.xl,
  },
  // No Quiz Styles
  noQuizContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  noQuizText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  createButton: {
    marginTop: spacing.md,
  },
  // Teacher Quiz View
  teacherQuizView: {
    alignItems: "center",
    padding: spacing.xl,
  },
  teacherQuizTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  teacherQuizInfo: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  manageButton: {
    marginTop: spacing.lg,
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
    textAlign: "center",
  },
  quizDescription: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  quizInfo: {
    backgroundColor: colors.neutral.gray500,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    width: "100%",
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  quizProgress: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  timeLimit: {
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questionText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    lineHeight: 22,
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
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  selectedOption: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.primary.yellow + "20",
  },
  correctOption: {
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50" + "20",
  },
  incorrectOption: {
    borderColor: "#F44336",
    backgroundColor: "#F44336" + "20",
  },
  optionText: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    flex: 1,
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
    color: "#4CAF50",
  },
  incorrectFeedback: {
    color: "#F44336",
  },
  quizActions: {
    marginTop: spacing.lg,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: "#FF9800",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  quizResults: {
    padding: spacing.xl,
  },
  resultTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  resultScore: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  resultMessage: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  reviewContainer: {
    maxHeight: 400,
    marginBottom: spacing.lg,
  },
  reviewTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  resultActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    justifyContent: "center",
  },
});