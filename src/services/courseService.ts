// src/services/courseService.ts
import apiClient, { ApiResponse } from './api';

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  teacher_id?: number;
  thumbnail?: string;
  level: string;
  status: 'active' | 'inactive' | 'draft';
  created_at?: string;
  updated_at?: string;
  teacher?: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  classes?: Array<{
    id: number;
    name: string;
    level_group: string;
  }>;
  lesson_count?: number;
  assessment_count?: number;
}

// Type guard to check if response is ApiResponse
function isApiResponse<T>(data: any): data is ApiResponse<T> {
  return data && typeof data === 'object' && 'data' in data;
}

// Type guard to check if data is a Course
function isCourse(data: any): data is Course {
  return data && typeof data === 'object' && 'id' in data && 'title' in data;
}

class CourseService {
  async getAllCourses(): Promise<Course[]> {
    const response = await apiClient.get<Course[] | ApiResponse<Course[]>>('/courses');
    console.log("CourseService.getAllCourses response:", response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (isApiResponse<Course[]>(response.data)) {
      return response.data.data || [];
    }
    return [];
  }

  async getCourse(id: number): Promise<Course> {
    const response = await apiClient.get<Course | ApiResponse<Course>>(`/courses/${id}`);
    
    if (isCourse(response.data)) {
      return response.data;
    } else if (isApiResponse<Course>(response.data) && response.data.data) {
      return response.data.data;
    }
    throw new Error('Invalid response format or course not found');
  }

  async createCourse(data: Partial<Course>): Promise<Course> {
    const response = await apiClient.post<Course | ApiResponse<Course>>('/courses', data);
    
    if (isCourse(response.data)) {
      return response.data;
    } else if (isApiResponse<Course>(response.data) && response.data.data) {
      return response.data.data;
    }
    throw new Error('Invalid response format');
  }

  async updateCourse(id: number, data: Partial<Course>): Promise<Course> {
    const response = await apiClient.put<Course | ApiResponse<Course>>(`/courses/${id}`, data);
    
    if (isCourse(response.data)) {
      return response.data;
    } else if (isApiResponse<Course>(response.data) && response.data.data) {
      return response.data.data;
    }
    throw new Error('Invalid response format');
  }

  async deleteCourse(id: number): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  }

  async getAvailableTeachers(): Promise<any[]> {
    const response = await apiClient.get<any[] | ApiResponse<any[]>>('/teachers/available');
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (isApiResponse<any[]>(response.data)) {
      return response.data.data || [];
    }
    return [];
  }

  async getCourseClasses(courseId: number): Promise<any[]> {
    const response = await apiClient.get<any[] | ApiResponse<any[]>>(`/courses/${courseId}/classes`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (isApiResponse<any[]>(response.data)) {
      return response.data.data || [];
    }
    return [];
  }

  async getCourseLessons(courseId: number): Promise<any[]> {
    const response = await apiClient.get<any[] | ApiResponse<any[]>>(`/courses/${courseId}/lessons`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (isApiResponse<any[]>(response.data)) {
      return response.data.data || [];
    }
    return [];
  }

  async getCourseAssessments(courseId: number): Promise<any[]> {
    const response = await apiClient.get<any[] | ApiResponse<any[]>>(`/courses/${courseId}/assessments`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (isApiResponse<any[]>(response.data)) {
      return response.data.data || [];
    }
    return [];
  }

  async getCoursesByLevel(level: string): Promise<Course[]> {
    const response = await apiClient.get<Course[] | ApiResponse<Course[]>>(`/courses/level/${level}`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (isApiResponse<Course[]>(response.data)) {
      return response.data.data || [];
    }
    return [];
  }

  async getTeacherCourses(teacherId: number): Promise<Course[]> {
    const response = await apiClient.get<Course[] | ApiResponse<Course[]>>(`/teachers/${teacherId}/courses`);
    
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (isApiResponse<Course[]>(response.data)) {
      return response.data.data || [];
    }
    return [];
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "An error occurred";

      if (error.response.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        return new Error(
          Array.isArray(firstError) ? firstError[0] : firstError
        );
      }

      return new Error(message);
    } else if (error.request) {
      return new Error("Network error. Please check your connection.");
    } else {
      return new Error(error.message || "An unexpected error occurred");
    }
  }
}

export default new CourseService();