// src/services/userService.ts
import apiClient from "./api";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  status?: "active" | "inactive";
  password?: string;
  password_confirmation?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: number;
}

class UserService {
 async getAllUsers(role?: string): Promise<User[]> {
    try {
      const params: any = {};
      if (role && role !== 'all') {
        params.role = role;
      }
      
      const response = await apiClient.get<{ users: User[] }>("/users", { params });
      console.log("UserService.getAllUsers response:", response);
      return response.data.users;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>(`/users/${id}`);
      return response.data.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await apiClient.post<{ user: User }>("/users", userData);
      return response.data.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateUser(userData: UpdateUserData): Promise<User> {
    try {
      const response = await apiClient.put<{ user: User }>(
        `/users/${userData.id}`,
        userData
      );
      return response.data.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
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

export default new UserService();