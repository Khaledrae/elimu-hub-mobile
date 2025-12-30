import api from './api';

export interface Question {
  id: number;
  assessment_id: number;
  set_by: number;
  question_text: string;
  marks: number;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_option: 'A' | 'B' | 'C' | 'D';
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: number;
  lesson_id: number;
  course_id: number | null;
  teacher_id: number;
  title: string;
  instructions: string | null;
  type: 'quiz' | 'assignment' | 'exam';
  total_marks: number;
  duration_minutes: number | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  questions?: Question[];
}

export interface Attempt {
  id: number;
  student_id: number;
  assessment_id: number;
  started_at: string;
  submitted_at: string | null;
  total_marks_scored: number;
  total_marks_possible: number;
  score_percentage: number;
  status: 'in_progress' | 'submitted' | 'graded';
  created_at: string;
  updated_at: string;
}

export interface StudentResponse {
  id: number;
  student_id: number;
  assessment_id: number;
  attempt_id: number;
  question_id: number;
  selected_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  marks_awarded: number;
  question?: Question;
}

// Assessment CRUD
export const getAssessments = async (page = 1) => {
  const response = await api.get(`/assessments?page=${page}`);
  return response.data;
};

export const getAssessmentById = async (id: number) => {
  const response = await api.get(`/assessments/${id}`);
  return response.data;
};

export const getAssessmentByLesson = async (lessonId: number) => {
  const response = await api.get(`/lessons/${lessonId}/assessment`);
  return response.data;
};

export const createAssessment = async (data: Partial<Assessment>) => {
  const response = await api.post('/assessments', data);
  return response.data;
};

export const updateAssessment = async (id: number, data: Partial<Assessment>) => {
  const response = await api.put(`/assessments/${id}`, data);
  return response.data;
};

export const deleteAssessment = async (id: number) => {
  const response = await api.delete(`/assessments/${id}`);
  return response.data;
};

// Question CRUD
export const getQuestions = async (assessmentId?: number) => {
  const url = assessmentId 
    ? `/questions?assessment_id=${assessmentId}`
    : '/questions';
  const response = await api.get(url);
  return response.data;
};

export const createQuestion = async (data: Partial<Question>) => {
  const response = await api.post('/questions', data);
  return response.data;
};

export const updateQuestion = async (id: number, data: Partial<Question>) => {
  const response = await api.put(`/questions/${id}`, data);
  return response.data;
};

export const deleteQuestion = async (id: number) => {
  const response = await api.delete(`/questions/${id}`);
  return response.data;
};

// Student Attempt & Response
export const startAttempt = async (assessmentId: number) => {
  const response = await api.post(`/assessments/${assessmentId}/attempt/start`);
  return response.data;
};

export const submitAttempt = async (
  assessmentId: number,
  attemptId: number,
  responses: Array<{ question_id: number; selected_option: string }>
) => {
  const response = await api.post(`/assessments/${assessmentId}/submit`, {
    attempt_id: attemptId,
    responses,
  });
  return response.data;
};

export const getAttemptResults = async (assessmentId: number, attemptId: number) => {
  const response = await api.get(`/assessments/${assessmentId}/attempts/${attemptId}/results`);
  return response.data;
};

export const getStudentAttempts = async (assessmentId: number) => {
  const response = await api.get(`/assessments/${assessmentId}/attempts`);
  return response.data;
};