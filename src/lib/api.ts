import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { AuthResponse, AdminLoginResponse, PendingRetailShop, PendingBranchShop } from './authTypes';

// Turns a failed request into a message worth showing the user directly,
// instead of a generic "failed" toast. Handles the two shapes the backend
// actually returns - ASP.NET Core's automatic field validation errors
// ({ errors: { Field: [msgs] } }) and the app's own ApiResponse ({ message }) -
// plus a plain-string body, falling back to the given default otherwise.
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response) {
    const data = error.response.data;
    if (data && typeof data === 'object' && data.errors) {
      const messages = Object.entries(data.errors as Record<string, string[]>).map(
        ([field, msgs]) => `${field}: ${msgs.join(' ')}`
      );
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    if (data && typeof data === 'object' && typeof data.message === 'string' && data.message) {
      return data.message;
    }
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
  }
  return fallback;
}

const api = axios.create({
  baseURL: 'http://localhost:5150',
  timeout: 30000,
});

axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return (
      axios.isAxiosError(error) &&
      (!error.response || error.code === 'ECONNABORTED' || error.response.status >= 500)
    );
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  adminLogin: async (username: string, password: string): Promise<AdminLoginResponse> => {
    try {
      const response = await api.post('/api/Authentication/AdminLogin', { username, password });
      console.log('[authAPI.adminLogin] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Login failed'));
    }
  },

  adminChangePassword: async (username: string, currPass: string, newPass: string): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/AdminChangePassword', { username, currPass, newPass });
      console.log('[authAPI.adminChangePassword] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to update password.'));
    }
  },

  getPendingRetailShops: async (): Promise<PendingRetailShop[]> => {
    try {
      const response = await api.get('/api/Shop/GetPendingRetailShops');
      console.log('[authAPI.getPendingRetailShops] Response:', JSON.stringify(response.data, null, 2));
      return (response.data as any[]).map((s) => ({
        id: s.dto.rShop_ID,
        shopName: s.dto.shopName,
        email: s.dto.email,
        tellphone: s.dto.tellphone,
        imageBase64: s.image,
      }));
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to fetch pending retail shops'));
    }
  },

  getPendingBranchShops: async (): Promise<PendingBranchShop[]> => {
    try {
      const response = await api.get('/api/Shop/GetPendingBranchShops');
      console.log('[authAPI.getPendingBranchShops] Response:', JSON.stringify(response.data, null, 2));
      return (response.data as any[]).map((s) => ({
        id: s.dto.shopId,
        shopName: s.dto.shopName,
        email: s.dto.email,
        tellphone: s.dto.tellphone,
        imageBase64: s.image,
      }));
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to fetch pending branch shops'));
    }
  },

  approveRetailShop: async (rShopId: number): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/ApproveRetailBranchShop', null, { params: { r: rShopId } });
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to approve retail shop'));
    }
  },

  rejectRetailShop: async (rShopId: number, reason?: string): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/RejectRetailBranchShop', null, { params: { r: rShopId, reason } });
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to reject retail shop'));
    }
  },

  approveBranch: async (branchId: number): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/ApproveRetailBranchShop', null, { params: { b: branchId } });
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to approve branch'));
    }
  },

  rejectBranch: async (branchId: number, reason?: string): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/RejectRetailBranchShop', null, { params: { b: branchId, reason } });
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to reject branch'));
    }
  },
};
