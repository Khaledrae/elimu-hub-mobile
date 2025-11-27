// src/services/teacherService.ts
import {
    PaginatedResponse,
    Statistics,
    Teacher,
    TeacherFilters,
    TeacherFormData,
} from "../types";
import apiClient from "./api";

class TeacherService {
  /**
   * Get all teachers with optional filters
   */
  async getTeachers(
    filters?: TeacherFilters
  ): Promise<PaginatedResponse<Teacher>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Teacher>>(
        "teachers",
        {
          params: filters,
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a single teacher by ID
   */
  async getTeacher(id: number): Promise<Teacher> {
    try {
      const response = await apiClient.get<Teacher>(`teachers/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new teacher
   */
  async createTeacher(data: TeacherFormData): Promise<Teacher> {
    try {
      const response = await apiClient.post<{ teacher: Teacher }>(
        "teachers",
        data
      );
      return response.data.teacher;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a teacher
   */
  async updateTeacher(id: number, data: Partial<TeacherFormData>): Promise<Teacher> {
    try {
      const response = await apiClient.put<{ teacher: Teacher }>(
        `teachers/${id}`,
        data
      );
      return response.data.teacher;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a teacher
   */
  async deleteTeacher(id: number): Promise<void> {
    try {
      await apiClient.delete(`teachers/${id}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get teacher statistics
   */
  async getStatistics(schoolName?: string): Promise<Statistics> {
    try {
      const response = await apiClient.get<Statistics>(
        "teachers/statistics/summary",
        {
          params: schoolName ? { school_name: schoolName } : {},
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
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
          Array.isArray(firstError) ? firstError[0] : (firstError as string)
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

export default new TeacherService();