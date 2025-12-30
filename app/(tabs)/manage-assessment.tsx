// app/manage-assessment.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import {
    Assessment,
    createAssessment,
    createQuestion,
    deleteAssessment,
    deleteQuestion,
    getAssessmentByLesson,
    Question,
    updateAssessment,
    updateQuestion,
} from "@/src/services/assessmentService";
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
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ManageAssessmentScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams();
  const lessonId = parseInt(params.lessonId as string);
  const assessmentId = params.assessmentId
    ? parseInt(params.assessmentId as string)
    : null;

  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Assessment form state
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [type, setType] = useState<"quiz" | "assignment" | "exam">("quiz");
  const [totalMarks, setTotalMarks] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");

  // Question management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  // Question form state
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D">("A");

  useEffect(() => {
    loadAssessment();
  }, [lessonId, assessmentId]);

  // Calculate total marks from questions
  const calculateTotalMarks = () => {
    return questions.reduce((sum, q) => sum + q.marks, 0);
  };

  // Check if calculated marks differ from entered marks
  const hasMarksDiscrepancy = () => {
    const calculated = calculateTotalMarks();
    const entered = parseInt(totalMarks) || 0;
    return calculated !== entered && questions.length > 0;
  };

  const loadAssessment = async () => {
    if (assessmentId) {
      try {
        setLoading(true);
        const data = await getAssessmentByLesson(lessonId);
        setAssessment(data);
        setQuestions(data.questions || []);
        
        // Populate form
        setTitle(data.title);
        setInstructions(data.instructions || "");
        setType(data.type);
        setTotalMarks(data.total_marks.toString());
        setDurationMinutes(data.duration_minutes?.toString() || "");
        setStatus(data.status);
        setIsEditing(true);
      } catch (error: any) {
        console.error("Failed to load assessment:", error);
        if (error.response?.status !== 404) {
          showError("Error", "Failed to load assessment");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const promptUpdateTotalMarks = async () => {
    if (!hasMarksDiscrepancy()) {
      return true; // No discrepancy, proceed
    }

    const calculated = calculateTotalMarks();
    
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Update Total Marks?",
        `Questions total: ${calculated} marks\nCurrent total: ${totalMarks} marks\n\nWould you like to update the assessment total marks to match the questions?`,
        [
          {
            text: "Keep Current",
            style: "cancel",
            onPress: () => resolve(true),
          },
          {
            text: "Update to " + calculated,
            onPress: () => {
              setTotalMarks(calculated.toString());
              resolve(true);
            },
          },
        ]
      );
    });
  };

  const handleSaveAssessment = async () => {
    if (!title.trim() || !totalMarks) {
      showError("Validation Error", "Please fill in all required fields");
      return;
    }

    // Check for marks discrepancy before saving
    const shouldProceed = await promptUpdateTotalMarks();
    if (!shouldProceed) return;

    try {
      setLoading(true);
      const assessmentData = {
        lesson_id: lessonId,
        teacher_id: currentUser?.id,
        title: title.trim(),
        instructions: instructions.trim() || null,
        type,
        total_marks: parseInt(totalMarks),
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
        status,
      };

      if (assessmentId) {
        const updated = await updateAssessment(assessmentId, assessmentData);
        setAssessment(updated);
        showSuccess("Success", "Assessment updated successfully");
      } else {
        const created = await createAssessment(assessmentData);
        setAssessment(created);
        setIsEditing(true);
        showSuccess("Success", "Assessment created successfully");
        router.setParams({ assessmentId: created.id.toString() });
      }
    } catch (error: any) {
      console.error("Failed to save assessment:", error);
      showError("Error", error.message || "Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = () => {
    Alert.alert(
      "Delete Assessment",
      "Are you sure you want to delete this assessment? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAssessment(assessmentId!);
              showSuccess("Success", "Assessment deleted successfully");
              router.back();
            } catch (error: any) {
              showError("Error", "Failed to delete assessment");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetQuestionForm = () => {
    setQuestionText("");
    setMarks("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("A");
    setEditingQuestionId(null);
  };

  const handleAddEditQuestion = async () => {
    if (!questionText.trim() || !optionA.trim() || !optionB.trim()) {
      showError("Validation Error", "Question text and at least 2 options are required");
      return;
    }

    if (!assessment) {
      showError("Error", "Please save the assessment first");
      return;
    }

    try {
      setLoading(true);
      const questionData = {
        assessment_id: assessment.id,
        question_text: questionText.trim(),
        marks: marks ? parseInt(marks) : 1,
        option_a: optionA.trim(),
        option_b: optionB.trim(),
        option_c: optionC.trim() || null,
        option_d: optionD.trim() || null,
        correct_option: correctOption,
      };

      if (editingQuestionId) {
        const updated = await updateQuestion(editingQuestionId, questionData);
        setQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestionId ? updated.data : q))
        );
        showSuccess("Success", "Question updated successfully");
      } else {
        const created = await createQuestion(questionData);
        setQuestions((prev) => [...prev, created.data]);
        showSuccess("Success", "Question added successfully");
      }

      resetQuestionForm();
      setShowAddQuestion(false);
    } catch (error: any) {
      console.error("Failed to save question:", error);
      showError("Error", error.message || "Failed to save question");
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setQuestionText(question.question_text);
    setMarks(question.marks.toString());
    setOptionA(question.option_a);
    setOptionB(question.option_b);
    setOptionC(question.option_c || "");
    setOptionD(question.option_d || "");
    setCorrectOption(question.correct_option);
    setEditingQuestionId(question.id);
    setShowAddQuestion(true);
  };

  const handleDeleteQuestion = (questionId: number) => {
    Alert.alert(
      "Delete Question",
      "Are you sure you want to delete this question?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteQuestion(questionId);
              setQuestions((prev) => prev.filter((q) => q.id !== questionId));
              showSuccess("Success", "Question deleted successfully");
            } catch (error: any) {
              showError("Error", "Failed to delete question");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBackPress = async () => {
    // Check for discrepancy before leaving
    if (hasMarksDiscrepancy()) {
      await promptUpdateTotalMarks();
    }
    router.back();
  };

  const renderAssessmentForm = () => {
    const calculated = calculateTotalMarks();
    const showWarning = hasMarksDiscrepancy();

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assessment Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Chapter 1 Quiz"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Instructions for students..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Type *</Text>
            <View style={styles.typeSelector}>
              {(["quiz", "assignment", "exam"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeOption,
                    type === t && styles.typeOptionActive,
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      type === t && styles.typeOptionTextActive,
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Status *</Text>
            <View style={styles.typeSelector}>
              {(["draft", "published"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.typeOption,
                    status === s && styles.typeOptionActive,
                  ]}
                  onPress={() => setStatus(s)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      status === s && styles.typeOptionTextActive,
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Total Marks *</Text>
            <TextInput
              style={[styles.input, showWarning && styles.inputWarning]}
              value={totalMarks}
              onChangeText={setTotalMarks}
              placeholder="100"
              keyboardType="numeric"
            />
            {showWarning && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={16} color="#FF9800" />
                <Text style={styles.warningText}>
                  Questions total: {calculated} marks
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="30"
              keyboardType="numeric"
            />
          </View>
        </View>

        <Button
          title={loading ? "Saving..." : isEditing ? "Update Assessment" : "Create Assessment"}
          onPress={handleSaveAssessment}
          variant="primary"
          disabled={loading}
        />

        {isEditing && (
          <Button
            title="Delete Assessment"
            onPress={handleDeleteAssessment}
            variant="secondary"
            style={styles.deleteButton}
          />
        )}
      </View>
    );
  };

  const renderQuestionForm = () => (
    <View style={styles.questionForm}>
      <Text style={styles.sectionTitle}>
        {editingQuestionId ? "Edit Question" : "Add Question"}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Question Text *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={questionText}
          onChangeText={setQuestionText}
          placeholder="Enter your question..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Marks *</Text>
        <TextInput
          style={styles.input}
          value={marks}
          onChangeText={setMarks}
          placeholder="1"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Option A *</Text>
        <TextInput
          style={styles.input}
          value={optionA}
          onChangeText={setOptionA}
          placeholder="First option"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Option B *</Text>
        <TextInput
          style={styles.input}
          value={optionB}
          onChangeText={setOptionB}
          placeholder="Second option"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Option C (Optional)</Text>
        <TextInput
          style={styles.input}
          value={optionC}
          onChangeText={setOptionC}
          placeholder="Third option"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Option D (Optional)</Text>
        <TextInput
          style={styles.input}
          value={optionD}
          onChangeText={setOptionD}
          placeholder="Fourth option"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Correct Answer *</Text>
        <View style={styles.typeSelector}>
          {(["A", "B", "C", "D"] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.typeOption,
                correctOption === option && styles.typeOptionActive,
              ]}
              onPress={() => setCorrectOption(option)}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  correctOption === option && styles.typeOptionTextActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.questionFormActions}>
        <Button
          title="Cancel"
          onPress={() => {
            resetQuestionForm();
            setShowAddQuestion(false);
          }}
          variant="secondary"
          style={styles.halfButton}
        />
        <Button
          title={loading ? "Saving..." : editingQuestionId ? "Update" : "Add"}
          onPress={handleAddEditQuestion}
          variant="primary"
          style={styles.halfButton}
          disabled={loading}
        />
      </View>
    </View>
  );

  const renderQuestionsList = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Questions ({questions.length})
          </Text>
          {questions.length > 0 && (
            <Text style={styles.totalMarksInfo}>
              Total: {calculateTotalMarks()} marks
            </Text>
          )}
        </View>
        {assessment && !showAddQuestion && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddQuestion(true)}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary.yellow} />
          </TouchableOpacity>
        )}
      </View>

      {!assessment ? (
        <Text style={styles.infoText}>
          Please save the assessment first before adding questions.
        </Text>
      ) : showAddQuestion ? (
        renderQuestionForm()
      ) : questions.length === 0 ? (
        <Text style={styles.emptyText}>
          No questions yet. Click the + button to add your first question.
        </Text>
      ) : (
        questions.map((question, index) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>Question {index + 1}</Text>
              <Text style={styles.questionMarks}>{question.marks} marks</Text>
            </View>
            <Text style={styles.questionTextDisplay}>{question.question_text}</Text>

            <View style={styles.optionsGrid}>
              <View style={styles.optionDisplay}>
                <Text style={styles.optionLabel}>A:</Text>
                <Text style={styles.optionTextDisplay}>{question.option_a}</Text>
                {question.correct_option === "A" && (
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                )}
              </View>
              <View style={styles.optionDisplay}>
                <Text style={styles.optionLabel}>B:</Text>
                <Text style={styles.optionTextDisplay}>{question.option_b}</Text>
                {question.correct_option === "B" && (
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                )}
              </View>
              {question.option_c && (
                <View style={styles.optionDisplay}>
                  <Text style={styles.optionLabel}>C:</Text>
                  <Text style={styles.optionTextDisplay}>{question.option_c}</Text>
                  {question.correct_option === "C" && (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  )}
                </View>
              )}
              {question.option_d && (
                <View style={styles.optionDisplay}>
                  <Text style={styles.optionLabel}>D:</Text>
                  <Text style={styles.optionTextDisplay}>{question.option_d}</Text>
                  {question.correct_option === "D" && (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  )}
                </View>
              )}
            </View>

            <View style={styles.questionActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditQuestion(question)}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary.yellow} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteQuestion(question.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
                <Text style={[styles.actionButtonText, { color: "#F44336" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  if (loading && !assessment) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.yellow} />
        <Text style={styles.loadingText}>Loading assessment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Assessment" : "Create Assessment"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {renderAssessmentForm()}
        {renderQuestionsList()}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
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
  totalMarksInfo: {
    fontSize: fontSize.sm,
    color: colors.primary.yellow,
    fontWeight: fontWeight.medium,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.neutral.white,
  },
  inputWarning: {
    borderColor: "#FF9800",
    borderWidth: 2,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: "#FF9800" + "20",
    borderRadius: 6,
  },
  warningText: {
    fontSize: fontSize.xs,
    color: "#FF9800",
    fontWeight: fontWeight.medium,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  typeOption: {
    flex: 1,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 8,
    alignItems: "center",
  },
  typeOptionActive: {
    borderColor: colors.primary.yellow,
    backgroundColor: colors.primary.yellow + "20",
  },
  typeOptionText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  typeOptionTextActive: {
    color: colors.primary.yellow,
    fontWeight: fontWeight.semibold,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  addButton: {
    padding: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: "italic",
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    padding: spacing.xl,
    fontStyle: "italic",
  },
  questionForm: {
    backgroundColor: colors.neutral.gray500,
    borderRadius: 8,
    padding: spacing.md,
  },
  questionFormActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: colors.neutral.gray200,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  questionNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  questionMarks: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  questionTextDisplay: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  optionsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.neutral.gray500,
    borderRadius: 6,
  },
  optionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  optionTextDisplay: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  questionActions: {
    flexDirection: "row",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray200,
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary.yellow,
  },
});