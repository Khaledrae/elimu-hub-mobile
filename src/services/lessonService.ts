// src/services/lessonService.ts
import apiClient from './api';

export interface Lesson {
  id: number;
  course_id: number;
  class_id: number;
  teacher_id?: number;
  title: string;
  content_type?: string;
  content?: string;
  video_url?: string;
  document_path?: string;
  order: number;
  status: 'active' | 'inactive' | 'draft';
  created_at?: string;
  updated_at?: string;
  course?: {
    id: number;
    title: string;
    level: string;
  };
  class?: {
    id: number;
    name: string;
    level_group: string;
  };
  teacher?: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface CreateLessonData {
  course_id: number;
  class_id: number;
  teacher_id?: number;
  title: string;
  content?: string;
  video_url?: string;
  document_path?: string;
  order: number;
  status?: 'active' | 'inactive' | 'draft';
}

interface Course {
  id: number;
  title: string;
  level: string;
}

interface Class {
  id: number;
  name: string;
  level_group: string;
}

interface Teacher {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ApiResponse<T> {
  data?: T;
}

class LessonService {
  async getAllLessons(): Promise<Lesson[]> {
    const response = await apiClient.get<Lesson[]>('/lessons');
    return response.data;
  }
  

  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    const response = await apiClient.get<Lesson[]>(`/courses/${courseId}/lessons`);
    return response.data;
  }

  async getLessonsByClass(classId?: number): Promise<Lesson[]> {
    const response = await apiClient.get<Lesson[]>(`/classes/${classId}/lessons`);
    return response.data;
  }
  async getLessonsByCourseAndClass(courseId: number, classId: number): Promise<Lesson[]> {
    const response = await apiClient.get(`/lessons/course/${courseId}/class/${classId}`);
    return response.data;
  };
  async getLesson(id: number): Promise<Lesson> {
    try {
        const response = await apiClient.get<Lesson | ApiResponse<Lesson>>(`/lessons/${id}`);
        
        if (response.data && 'id' in response.data) {
            return response.data;
        } else if (response.data && 'data' in response.data && response.data.data) {
            return response.data.data;
        }
        throw new Error('Lesson not found');
    } catch (error: any) {
        console.error('Error fetching lesson:', error);
        throw new Error(error.message || 'Failed to fetch lesson');
    }
}

  async createLesson(data: CreateLessonData): Promise<Lesson> {
    const response = await apiClient.post<Lesson>('/lessons', data);
    return response.data;
  }

  async updateLesson(id: number, data: Partial<CreateLessonData>): Promise<Lesson> {
    const response = await apiClient.put<Lesson>(`/lessons/${id}`, data);
    return response.data;
  }

  async deleteLesson(id: number): Promise<void> {
    await apiClient.delete(`/lessons/${id}`);
  }

  // Get available courses for lessons
  async getAvailableCourses(): Promise<Course[]> {
    try {
      const response = await apiClient.get<Course[] | ApiResponse<Course[]>>('/courses');
      
      // Handle both response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching available courses:", error);
      return [];
    }
  }

  // Get available classes for lessons
  async getAvailableClasses(): Promise<Class[]> {
    try {
      const response = await apiClient.get<Class[] | ApiResponse<Class[]>>('/classes/available');
      
      // Handle both response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching available classes:", error);
      return [];
    }
  }

  // Get available teachers for lessons
  async getAvailableTeachers(): Promise<Teacher[]> {
    try {
      const response = await apiClient.get<Teacher[] | ApiResponse<Teacher[]>>('/teachers/available');
      
      // Handle both response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching available teachers:", error);
      return [];
    }
  }
}

export default new LessonService();