// services/subscriptionService.ts
import apiClient from './api';
export interface SubscriptionPlan {
  id: number;
  name: string; 
  code: string;
  description: string;
  amount: number;
  duration_days: number | null;
  features: string[];
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  checkout_request_id?: string;
  transaction?: {
    id: number;
    amount: number;
    phone_number: string;
  };
}

export interface PaymentStatus {
  success: boolean;
  status: 'pending' | 'success' | 'failed';
  transaction?: any;
  subscription?: any;
}

const subscriptionService = {
  async getPlans(): Promise<{ plans: SubscriptionPlan[] }> {
    try {
      const response = await apiClient.get('/subscription/plans');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async initiatePayment(data: {
    plan_id: number;
    phone_number: string;
  }): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post('/subscription/initiate-payment', data);
      console.log("Payment initiation response:", response);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Payment initiation failed');
      }
      throw error;
    }
  },

  async checkPaymentStatus(checkoutRequestId: string): Promise<PaymentStatus> {
    try {
      const response = await apiClient.get(`/subscription/check-status/${checkoutRequestId}`);
      //console.log("Payment status response:", response);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSubscriptionDetails(): Promise<any> {
    try {
      const response = await apiClient.get('/subscription/details');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/subscription/cancel');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default subscriptionService;