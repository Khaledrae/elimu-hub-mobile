// src/services/courseService.ts
import apiClient from './api';

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

export interface CreateCourseData {
  title: string;
  description?: string;
  teacher_id?: number;
  level: string;
  status?: 'active' | 'inactive' | 'draft';
}
interface ApiResponse<T> {
  data?: T;
}
class CourseService {
  async getAllCourses(): Promise<Course[]> {
    const response = await apiClient.get<Course[] | ApiResponse<Course[]>>('/courses');
    console.log("CourseService.getAllCourses response:", response.data);
    
    if (Array.isArray(response.data)) {
      return response.data; 
    } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return []; // Always return an array
  }
  async getCourse(id: number): Promise<Course> {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  }

  async createCourse(data: CreateCourseData): Promise<Course> {
    const response = await apiClient.post<Course>('/courses', data);
    return response.data;
  }

  async updateCourse(id: number, data: Partial<CreateCourseData>): Promise<Course> {
    const response = await apiClient.put<Course>(`/courses/${id}`, data);
    return response.data;
  }

  async deleteCourse(id: number): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  }

  // Get available teachers for courses
  async getAvailableTeachers(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/teachers/available');
    return response.data;
  }

  // Assign course to classes
  async assignToClasses(courseId: number, classIds: number[]): Promise<void> {
    await apiClient.post(`/courses/${courseId}/assign-classes`, { class_ids: classIds });
  }

  // Get classes for a course
  async getCourseClasses(courseId: number): Promise<any[]> {
    const response = await apiClient.get(`/courses/${courseId}/classes`);
    return response.data;
  }
}

export default new CourseService();