// src/services/api.ts
/*
import axios, { AxiosError, AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://127.0.0.1:8000/api/';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { token } = response.data;
          await SecureStore.setItemAsync('auth_token', token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('user');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Default export
export default apiClient;

export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});*/
// src/services/api.ts
import axios, { AxiosError, AxiosInstance } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ----------------------------------------------
// STORAGE HELPERS (web → localStorage, mobile → SecureStore)
// ----------------------------------------------
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

// ----------------------------------------------
// AXIOS CLIENTS
// ----------------------------------------------
const API_BASE_URL = "http://127.0.0.1:8000/api/";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Public client for endpoints requiring NO token
export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});
export interface ApiResponse<T= any> {
  data: T;
  message?: string;
  status?: string;
}
// --------------------------------------------------
// REQUEST INTERCEPTOR — attach token
// --------------------------------------------------
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.get("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------
// RESPONSE INTERCEPTOR — handle refresh
// --------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // If unauthorized and not retried → try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.get("refresh_token");

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { token } = response.data;

          // Save new token
          await storage.set("auth_token", token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
        // Clear stored auth data
        await storage.remove("auth_token");
        await storage.remove("user");

        // Redirect to login page
        // Use setTimeout to avoid potential issues with navigation during render
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 100);

        return Promise.reject(error);
      } catch (refreshError) {
        // Refresh failed → logout user
        await storage.remove("auth_token");
        await storage.remove("refresh_token");
        await storage.remove("user");

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
