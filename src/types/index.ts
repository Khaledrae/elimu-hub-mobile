// src/types/index.ts

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone: string;
  county: number;
  status: string;
  created_at: string;
  updated_at: string;
}
// Add Student interface
export interface Student {
  id: number;
  user_id: number;
  admission_number: string;
  grade_level: string;
  school_name: string;
  dob: string;
  gender: string;
  guardian_id?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}
export interface Teacher {
  id: number;
  user_id: number;
  staff_number: string;
  subject_specialization: string;
  school_name: string;
  qualification: string;
  experience_years: number;
  gender: string;
  dob: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: User;
  school?: any;
  courses?: any[];
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface StudentFilters {
  school_name?: string;
  grade_level?: string;
  status?: string;
  gender?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface TeacherFilters {
  school_name?: string;
  subject_specialization?: string;
  status?: string;
  gender?: string;
  min_experience?: number;
  max_experience?: number;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface StudentFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  county: number;
  admission_number: string;
  grade_level: string;
  school_name: string;
  dob: string;
  gender: string;
  guardian_id?: number;
  password?: string;
}

export interface TeacherFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  county: number;
  staff_number: string;
  subject_specialization: string;
  school_name: string;
  qualification: string;
  experience_years: number;
  gender: string;
  dob: string;
  password?: string;
}

export interface Statistics {
  total: number;
  active: number;
  inactive: number;
  by_gender: Record<string, number>;
  [key: string]: any;
}
