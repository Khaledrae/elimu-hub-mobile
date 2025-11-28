// src/services/authService.ts
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import apiClient, { publicApiClient } from "./api";

// Type definitions
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

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: "student" | "teacher" | "parent" | "admin";
  phone: string;
  county: number;

  // Student specific
  admission_number?: string;
  grade_level?: string;
  school_name?: string;
  dob?: string;
  gender?: string;

  // Teacher
  staff_number?: string;
  subject_specialization?: string;
  qualification?: string;
  experience_years?: string;

  // Parent
  relationship?: string;
  occupation?: string;

  // Admin
  admin_level?: string;
}

export interface AuthResponse {
  token: string; // This is your JWT token
  user: User;
  expires_in?: number;
  // No refresh_token needed for basic JWT
}

// Cross-platform storage helper
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log("Registering user:", data);

      // Use publicApiClient for registration
      const response = await publicApiClient.post<AuthResponse>(
        "auth/register",
        data
      );

      console.log("Registration response:", response);

      // Store JWT token and user data
      if (response.data.token) {
        await storage.set("auth_token", response.data.token);
        await storage.set("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      console.log("Registration error:", error);
      throw this.handleError(error);
    }
  }

  /*
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log("Logging in API:", { data });

      const response = await publicApiClient.post<AuthResponse>(
        "auth/login",
        data
      );

      // Store JWT token and user data
      if (response.data.token) {
        await storage.set("auth_token", response.data.token);
        await storage.set("user", JSON.stringify(response.data.user));
      }
      console.log("Logging in API Resp:", { response });

      return response.data;
    } catch (error: any) {
      // Standardize error message
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to login. Please try again.";

      throw new Error(message);
    }
  }
    */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log("Logging in API:", { data });

      const response = await publicApiClient.post<AuthResponse>(
        "auth/login",
        data
      );

      // Store JWT token and user data
      if (response.data.token) {
        await storage.set("auth_token", response.data.token);
        await storage.set("user", JSON.stringify(response.data.user));
      }
      console.log("Logging in API Resp:", { response });

      return response.data;
    } catch (error: any) {
      console.log("🔴 Full login error object:", error);
      console.log("🔴 Error response data:", error.response?.data);

      // Fix: Properly extract the error message from Laravel response
      let message = "Failed to login. Please try again.";

      if (error.response?.data) {
        // Laravel returns { "error": "message" } for 401
        if (error.response.data.error) {
          message = error.response.data.error;
        }
        // Or sometimes { "message": "error message" }
        else if (error.response.data.message) {
          message = error.response.data.message;
        }
      } else if (error.message) {
        message = error.message;
      }

      console.log("🔴 Final error message:", message);
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    try {
      // Optional: Call logout endpoint if your JWT implementation has one
      // Some JWT setups don't need this since tokens are stateless
      const token = await storage.get("auth_token");
      if (token) {
        await apiClient.post("auth/logout");
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always clear local storage
      await storage.remove("auth_token");
      await storage.remove("user");
    }
  }

  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>("auth/me");
      // Update stored user data
      await storage.set("user", JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await storage.get("user");
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.warn("Error getting current user:", error);
      return null;
    }
  }

  async getCounties() {
    const response = await publicApiClient.get("/counties");
    return response.data;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await storage.get("auth_token");
      
      // If no token exists, definitely not authenticated
      if (!token) {
        return false;
      }

      // Verify token is valid by calling the /me endpoint
      try {
        await this.getMe();
        return true;
      } catch (error: any) {
        // If the API call fails (401/403), token is invalid
        console.log("Token validation failed:", error);
        
        // Clear invalid token
        await this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.warn("Error checking authentication:", error);
      return false;
    }
  }
 /**
   * Clear all authentication data
   */
  async clearAuthData(): Promise<void> {
    await storage.remove("auth_token");
    await storage.remove("user");
  }
  // Helper method to get the JWT token
  async getToken(): Promise<string | null> {
    return await storage.get("auth_token");
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

export default new AuthService();
