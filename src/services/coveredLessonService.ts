// src/services/coveredLessonService.ts
import apiClient from "./api";
import { Assessment } from "./assessmentService";

interface OverallProgress {
  student: {
    id: number;
    name: string | null;
    class: {
      id: number;
      name: string;
    };
  };
  total_lessons: number;
  total_courses: number;
  covered_lessons: number;
  completed: number;
  in_progress: number;
  failed: number;
  completion_rate: number;
  average_score: number;
  streak: number;
  breakdown_by_course: Array<{
    course_id: number;
    course_name: string;
    progress_percentage: number;
    completed_lessons: number;
    total_lessons: number;
  }>;
}
export interface RecentActivity {
  id: number;
  type: 'lesson_started' | 'lesson_completed' | 'lesson_failed' | 'quiz_taken';
  title: string;
  description: string;
  date: string;
  course_name: string;
  score?: number;
  status: string;
}
export interface AssignmentsResponse {
  count: number;
  assessments: Assessment[];
}
export interface CourseProgress {
  course: {
    id: number;
    title: string;
    description: string;
  };
  progress: {
    total_lessons: number;
    completed: number;
    in_progress: number;
    failed: number;
    not_started: number;
    percentage: number;
    average_score: number;
  };
  recent_lessons: Array<{
    id: number;
    title: string;
    completed_at: string;
    score?: number;
  }>;
}

interface CoveredLesson {
  id: number;
  student_id: number;
  lesson_id: number;
  course_id: number;
  class_id: number;
  status: "in-progress" | "completed" | "failed";
  score: number | null;
  time_spent: number;
  attempts: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  lesson: any;
  course: any;
  class: any;
}

class CoveredLessonService {
  // Start a lesson
  async startLesson(lessonId: number, userId?: number): Promise<CoveredLesson> {
    //console.log("Starting lesson with ID:", lessonId, "for user ID:", userId);
    const response = await apiClient.post(
      `students/${userId}/covered-lessons/start`,
      {
        lesson_id: lessonId,
      }
    );
    //console.log("Start lesson response:", response.data);
    return response.data.data;
  }

  // Complete a lesson with quiz score
  async completeLesson(
    lessonId: number,
    score: number,
    timeSpent?: number
  ): Promise<CoveredLesson> {
    const response = await apiClient.post(
      `/my/covered-lessons/${lessonId}/complete`,
      {
        score,
        time_spent: timeSpent,
      }
    );
    return response.data.data;
  }

  // Get student's covered lessons
  async getMyCoveredLessons(params?: {
    status?: string;
    course_id?: number;
    class_id?: number;
    per_page?: number;
  }): Promise<{ data: CoveredLesson[]; meta: any }> {
    const response = await apiClient.get("/my/covered-lessons", { params });
    return response.data;
  }

  // Get last lesson
  async getLastLesson(): Promise<CoveredLesson | null> {
    const response = await apiClient.get("/my/last-lesson");
    return response.data.data;
  }

  async getOverallProgress(studentId: number): Promise<OverallProgress> {
    const response = await apiClient.get(
      `/students/${studentId}/overall-progress`
    );
    console.log("Overall progress response:", response);
    return response.data;
  }
  async getPendingAssessments(studentId: number): Promise<AssignmentsResponse> {
    const response = await apiClient.get(
      `/students/${studentId}/pending-assessments`
    );
    //console.log("Pending assessments response:", response);
    return response.data;
  }

  // Get progress for a specific course
  async getProgressForCourse(
    courseId: number,
    studentId: number
  ): Promise<CourseProgress> {
    const response = await apiClient.get(
      `my/progress/${courseId}/${studentId}`
    );
    console.log("Course progress response:", response);
    return response.data;
  }
  // Get recent lessons for a specific course
  async getCourseRecentLessons(studentId: number, courseId: number) {
    const response = await apiClient.get(
      `/students/${studentId}/course-recent-lessons/${courseId}`
    );
    return response.data;
  }

  // Get recent lessons
  /*
  async getRecentLessons(limit: number = 5): Promise<CoveredLesson[]> {
    const response = await apiClient.get('/my/recent-lessons', {
      params: { limit }
    });
    return response.data.data;
  }
*/
}

export default new CoveredLessonService();
