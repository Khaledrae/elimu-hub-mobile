// src/services/schoolService.ts
import apiClient from './api';

export interface School {
  id: number;
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  county_id?: number;
  county?: { id: number; name: string };
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  admin?: {
    user: {
      first_name: string;
      last_name: string;
    }
  };
}

export interface CreateSchoolData {
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  county_id?: number;
}

class SchoolService {
  async getAllSchools(): Promise<School[]> {
    const response = await apiClient.get<School[]>('/schools');
    return response.data; // Direct array
  }

  async getSchool(id: number): Promise<School> {
    const response = await apiClient.get<School>(`/schools/${id}`);
    return response.data; // Direct object
  }

  async createSchool(data: CreateSchoolData): Promise<School> {
    const response = await apiClient.post<School>('/schools', data);
    return response.data; // Direct object
  }

  async updateSchool(id: number, data: Partial<CreateSchoolData>): Promise<School> {
    const response = await apiClient.put<School>(`/schools/${id}`, data);
    return response.data; // Direct object
  }

  async deleteSchool(id: number): Promise<void> {
    await apiClient.delete(`/schools/${id}`);
  }

  // Get admin for a school
  async getSchoolAdmin(schoolId: number): Promise<any> {
    const response = await apiClient.get(`/schools/${schoolId}/admin`);
    return response.data; // Direct object
  }
}

export default new SchoolService();