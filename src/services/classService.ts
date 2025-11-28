// src/services/classService.ts
import { Student } from "../types";
import apiClient, { ApiResponse } from "./api";
import { Course } from "./courseService";
import { Lesson } from "./lessonService";

export interface ClassModel {
  id: number;
  name: string;
  level_group: string;
  manager_id?: number;
  manager?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  student_count?: number;
  course_count?: number;
  lesson_count?: number;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
  courses?: Course[];
  students?: Student[];
  lessons?: Lesson[];
}

export interface CreateClassData {
  name: string;
  level_group: string;
  manager_id?: number;
}

class ClassService {
  async getAllClasses(): Promise<ClassModel[]> {
    try {
      const response = await apiClient.get<
        ClassModel[] | ApiResponse<ClassModel[]>
      >("/classes");
      console.log("ClassService.getAllClasses response:", response.data);

      // Handle both response formats safely
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        const data = (response.data as ApiResponse<ClassModel[]>).data;
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching classes:", error);
      return [];
    }
  }

  async getClass(id: number): Promise<ClassModel> {
    const response = await apiClient.get<ClassModel | ApiResponse<ClassModel>>(
      `/classes/${id}`
    );
    console.log("Single class response:", response.data);

    // Handle both response formats
    if (response.data && "id" in response.data) {
      return response.data;
    } else if (response.data && "data" in response.data) {
      return response.data.data;
    }
    throw new Error("Invalid response format");
  }

  async createClass(data: CreateClassData): Promise<ClassModel> {
    const response = await apiClient.post<ClassModel | ApiResponse<ClassModel>>(
      "/classes",
      data
    );
    console.log("Create class response:", response.data);

    if (response.data && "id" in response.data) {
      return response.data;
    } else if (response.data && "data" in response.data) {
      return response.data.data;
    }
    throw new Error("Invalid response format");
  }

  async updateClass(
    id: number,
    data: Partial<CreateClassData>
  ): Promise<ClassModel> {
    const response = await apiClient.put<ClassModel | ApiResponse<ClassModel>>(
      `/classes/${id}`,
      data
    );
    console.log("Update class response:", response.data);

    if (response.data && "id" in response.data) {
      return response.data;
    } else if (response.data && "data" in response.data) {
      return response.data.data;
    }
    throw new Error("Invalid response format");
  }

  async deleteClass(id: number): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  }

  async getAvailableManagers(): Promise<any[]> {
    const response = await apiClient.get<any[] | ApiResponse<any[]>>(
      "/teachers/available-managers"
    );
    console.log("Available managers response:", response.data);

    // Handle both response structures
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && "data" in response.data) {
      return response.data.data;
    }
    return [];
  }

  async getClassCourses(classId: number): Promise<{ courses: Course[] }> {
    const response = await apiClient.get<
      { courses: Course[] } | ApiResponse<{ courses: Course[] }>
    >(`/classes/${classId}/courses`);

    if (response.data && "courses" in response.data) {
      return response.data;
    } else if (response.data && "data" in response.data) {
      return response.data.data;
    }
    return { courses: [] };
  }
/*
async getClassLessons(classId: number): Promise<{ class: any; lessons: Lesson[] }> {
    const response = await apiClient.get<{ class: any; lessons: Lesson[] } | ApiResponse<{ class: any; lessons: Lesson[] }>>(`/classes/${classId}/lessons`);
    
    if (response.data && 'class' in response.data && 'lessons' in response.data) {
        return response.data;
    } else if (response.data && 'data' in response.data) {
        return response.data.data;
    }
    return { class: null, lessons: [] };
}
  async getClassStudents(classId: number): Promise<Student[]> {
    const response = await apiClient.get<Student[] | ApiResponse<Student[]>>(
      `/classes/${classId}/students`
    );

    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && "data" in response.data) {
      return response.data.data;
    }
    return [];
  }
    */
}

export default new ClassService();
