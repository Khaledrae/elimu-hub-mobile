// src/services/authService.ts
import * as SecureStore from 'expo-secure-store';
import apiClient from './api';

// Type definitions
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  phone: string;
  // Student specific
  admission_number?: string;
  grade_level?: string;
  school_name?: string;
  dob?: string;
  gender?: string;
  // Teacher specific
  staff_number?: string;
  subject_specialization?: string;
  qualification?: string;
  experience_years?: number;
  // Parent specific
  relationship?: string;
  occupation?: string;
  // Admin specific
  admin_level?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expires_in?: number;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('auth/register', data);
      
      // Store token and user data
      if (response.data.token) {
        await SecureStore.setItemAsync('auth_token', response.data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('auth/login', data);
      
      // Store token and user data
      if (response.data.token) {
        await SecureStore.setItemAsync('auth_token', response.data.token);
        await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored data regardless of API response
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user');
    }
  }

  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>('auth/me');
      await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await SecureStore.getItemAsync('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('auth_token');
    return !!token;
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 
                     error.response.data?.error || 
                     'An error occurred';
      
      // Handle validation errors
      if (error.response.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        return new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
      
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new AuthService();