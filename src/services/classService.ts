// src/services/classService.ts
import apiClient from './api';

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
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface CreateClassData {
  name: string;
  level_group: string;
  manager_id?: number;
}

class ClassService {
  async getAllClasses(): Promise<ClassModel[]> {
    const response = await apiClient.get<ClassModel[]>('/classes');
    console.log("ClassService.getAllClasses response:", response.data);
    return response.data; // Direct array
  }

  async getClass(id: number): Promise<ClassModel> {
    const response = await apiClient.get<ClassModel>(`/classes/${id}`);
    console.log("Single class response:", response.data);
    return response.data; // Direct object
  }

  async createClass(data: CreateClassData): Promise<ClassModel> {
    const response = await apiClient.post<ClassModel>('/classes', data);
    console.log("Create class response:", response.data);
    return response.data; // Direct object
  }

  async updateClass(id: number, data: Partial<CreateClassData>): Promise<ClassModel> {
    const response = await apiClient.put<ClassModel>(`/classes/${id}`, data);
    console.log("Update class response:", response.data);
    return response.data; // Direct object
  }

  async deleteClass(id: number): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  }
  
 // Get available teachers/managers for classes
  async getAvailableManagers(): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>('/teachers/available-managers');
    console.log("Available managers response:", response.data);
    
    // Handle both response structures
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data; // { data: [...] }
    } else if (Array.isArray(response.data)) {
      return response.data; // [...]
    } else {
      console.warn("Unexpected managers response structure:", response.data);
      return [];
    }
  }
}

export default new ClassService();