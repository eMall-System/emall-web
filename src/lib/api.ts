// import axios, { AxiosError } from 'axios';
// import { AuthResponse, RegisterManagerData, Shop, Mall, UserResponse } from './authTypes';

// const api = axios.create({
//   baseURL: 'https://emall-h0cja4cpepgkhpcc.southafricanorth-01.azurewebsites.net',
//   timeout: 10000,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export const authAPI = {
//   login: async (email: string, password: string, endpoint: string = '/api/Authentication/LoginManager'): Promise<AuthResponse> => {
//     try {
//       const response = await api.post(endpoint, { email, password });
//       console.log('[authAPI.login] Response:', JSON.stringify(response.data, null, 2));
//       return {
//         statusCode: response.data.statusCode,
//         message: response.data.message,
//         token: response.data.token,
//         data: response.data,
//       };
//     } catch (error: unknown) {
//       console.error('[authAPI.login] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Login failed');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   changePassword: async (email: string, currPass: string, newPass: string): Promise<AuthResponse> => {
//     try {
//       const response = await api.post('/api/Authentication/ChangePassword', { email, currPass, newPass });
//       console.log('[authAPI.changePassword] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.changePassword] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to change password');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   registerManager: async (data: RegisterManagerData): Promise<AuthResponse> => {
//     try {
//       const response = await api.post('/api/Authentication/RegisterManager', data);
//       console.log('[authAPI.registerManager] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.registerManager] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to register manager');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   registerPacManager: async (data: RegisterManagerData & { mallManagerId: number }): Promise<AuthResponse> => {
//     try {
//       const response = await api.post(
//         '/api/Authentication/RegisterPacManager',
//         {
//           name: data.name,
//           surname: data.surname,
//           gender: data.gender,
//           contacts: data.contacts,
//           email: data.email,
//           password: data.password,
//           type: data.type,
//           username: data.email,
//         },
//         {
//           params: { ID: data.mallManagerId },
//         }
//       );
//       console.log('[authAPI.registerPacManager] Response:', JSON.stringify(response.data, null, 2));
//       return {
//         statusCode: response.data.statusCode,
//         message: response.data.message,
//         data: response.data,
//       };
//     } catch (error: unknown) {
//       console.error('[authAPI.registerPacManager] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to register PAC manager');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   updateManager: async (data: RegisterManagerData & { id: number }): Promise<AuthResponse> => {
//     try {
//       const response = await api.put(`/api/Authentication/UpdateManager/${data.id}`, data);
//       console.log('[authAPI.updateManager] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.updateManager] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to update manager');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   deleteManager: async (id: number): Promise<AuthResponse> => {
//     try {
//       const response = await api.delete(`/api/Authentication/DeleteManager/${id}`);
//       console.log('[authAPI.deleteManager] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.deleteManager] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to delete manager');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   deleteShop: async (id: number): Promise<AuthResponse> => {
//     try {
//       const response = await api.delete(`/api/Shop/DeleteShop/${id}`);
//       console.log('[authAPI.deleteShop] Response:', JSON.stringify(response.data, null, 2));
//       return {
//         statusCode: response.data.statusCode || 200,
//         message: response.data.message || 'Shop deleted successfully',
//         data: response.data,
//       };
//     } catch (error: unknown) {
//       console.error('[authAPI.deleteShop] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to delete shop');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   forgotPassword: async (username: string): Promise<AuthResponse> => {
//     try {
//       const response = await api.post('/api/Authentication/ForgotPassword', { username });
//       console.log('[authAPI.forgotPassword] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.forgotPassword] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to request password reset');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getUserById: async (id: number): Promise<UserResponse> => {
//     try {
//       const response = await api.get(`/api/UserManagement/getUserByUsrID?id=${id}`);
//       console.log('[authAPI.getUserById] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.getUserById] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to fetch user');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getShops: async (mallID: number): Promise<{ dto: Shop; imageBase64?: string }[]> => {
//     try {
//       const response = await api.get(`/api/Shop/GetShopsByMallID?id=${mallID}`);
//       console.log('[authAPI.getShops] Response:', JSON.stringify(response.data, null, 2));
//       return response.data.map((s: any) => ({
//         dto: {
//           id: s.dto.shopId || s.dto.id,
//           shopName: s.dto.shopName,
//           shopType: s.dto.shopType,
//           mangrID: s.dto.mangrID || 0,
//           mallID,
//           managerName: s.dto.managerName || '',
//           shopImage: s.dto.shopImage,
//         },
//         imageBase64: s.imageBase64,
//       }));
//     } catch (error: unknown) {
//       console.error('[authAPI.getShops] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to fetch shops');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   addShop: async (shop: {
//     ShopName: string;
//     ShopType: string;
//     MangrID: number;
//     MallID: number;
//     image?: File;
//   }): Promise<AuthResponse> => {
//     try {
//       const formData = new FormData();
//       formData.append('ShopName', shop.ShopName);
//       formData.append('ShopType', shop.ShopType);
//       formData.append('MangrID', shop.MangrID.toString());
//       formData.append('MallID', shop.MallID.toString());
//       if (shop.image) {
//         formData.append('image', shop.image);
//       }

//       const response = await api.post('/api/Shop/AddShop', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       console.log('[authAPI.addShop] Response:', JSON.stringify(response.data, null, 2));
//       return {
//         statusCode: response.data.statusCode,
//         message: response.data.message,
//         data: response.data,
//       };
//     } catch (error: unknown) {
//       console.error('[authAPI.addShop] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to add shop');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getMallIdByManagerId: async (roleID: number): Promise<{ mallID: number }> => {
//     try {
//       const response = await api.get(`/api/Mall/GetMallidByMngrID/${roleID}`);
//       console.log('[authAPI.getMallIdByManagerId] Response:', JSON.stringify(response.data, null, 2));
//       return { mallID: response.data };
//     } catch (error: unknown) {
//       console.error('[authAPI.getMallIdByManagerId] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         console.error('[authAPI.getMallIdByManagerId] Status:', error.response.status);
//         console.error('[authAPI.getMallIdByManagerId] Data:', JSON.stringify(error.response.data, null, 2));
//         throw new Error(error.response.data.message || 'Failed to fetch mall ID');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getMallById: async (id: number): Promise<{ dto: Mall; imageBase64?: string }> => {
//     try {
//       const response = await api.get(`/api/Mall/GetMallByID/${id}`);
//       console.log('[authAPI.getMallById] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.getMallById] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to fetch mall details');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getShopManagers: async (mallID: number): Promise<{ userID: number; roleID: number; uName: string; uSurname: string; uGender: string; uPhone: string; uEmail: string; uType: string }[]> => {
//     try {
//       const response = await api.get(`/api/UserManagement/GetShopManagers?mallID=${mallID}`);
//       console.log('[authAPI.getShopManagers] Response:', JSON.stringify(response.data, null, 2));
//       return response.data.map((m: any) => ({
//         userID: m.userID,
//         roleID: m.roleID,
//         uName: m.user.uName,
//         uSurname: m.user.uSurname,
//         uGender: m.user.uGender,
//         uPhone: m.user.uPhone,
//         uEmail: m.user.uEmail,
//         uType: m.user.uType,
//       }));
//     } catch (error: unknown) {
//       console.error('[authAPI.getShopManagers] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to fetch shop managers');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getShopByMngrID: async (roleID: number): Promise<number> => {
//     try {
//       const response = await api.get(`/api/Shop/GetShopByMngrID/${roleID}`);
//       console.log('[authAPI.getShopByMngrID] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.getShopByMngrID] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to fetch shop ID');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getShopByID: async (id: number): Promise<{ dto: Shop; imageBase64?: string }> => {
//     try {
//       const response = await api.get(`/api/Shop/GetShopByID/${id}`);
//       console.log('[authAPI.getShopByID] Response:', JSON.stringify(response.data, null, 2));
//       return {
//         dto: {
//           id: response.data.dto.shopId || response.data.dto.id,
//           shopName: response.data.dto.shopName,
//           shopType: response.data.dto.shopType,
//           mangrID: response.data.dto.mangrID || 0,
//           mallID: response.data.dto.mallID,
//           managerName: response.data.dto.managerName || '',
//           shopImage: response.data.dto.shopImage,
//         },
//         imageBase64: response.data.imageBase64,
//       };
//     } catch (error: unknown) {
//       console.error('[authAPI.getShopByID] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to fetch shop details');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },

//   getPackagers: async (shopID: number): Promise<{ roleID: number; user: { userID: number; uName: string; uSurname: string; uGender: string; uPhone: string; uEmail: string; uType: string } }[]> => {
//     try {
//       const response = await api.get(`/api/UserManagement/GetPackagers?shopID=${shopID}`);
//       console.log('[authAPI.getPackagers] Response:', JSON.stringify(response.data, null, 2));
//       return response.data;
//     } catch (error: unknown) {
//       console.error('[authAPI.getPackagers] Error:', error);
//       if (error instanceof AxiosError && error.response) {
//         throw new Error(error.response.data.message || 'Failed to fetch packagers');
//       }
//       throw new Error('An unexpected error occurred');
//     }
//   },
// };

import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { AuthResponse, RegisterManagerData, Shop, Mall, UserResponse, Product, RetailLoginResponse, RetailProduct, CategoryWithSubs, RetailShopProfile, BranchShop } from './authTypes';

// Friendlier labels for backend field names, used when turning ASP.NET Core's
// validation errors into readable messages (see extractErrorMessage below).
const FIELD_LABELS: Record<string, string> = {
  Prod_Name: 'Product Name',
  Prod_Desc: 'Description',
  Prod_Categ: 'Category',
  Prod_Subcateg: 'Sub-Category',
  Prod_Weight: 'Weight',
  Price: 'Price',
  DiscPerc: 'Discount %',
  DiscAmount: 'Discount Amount',
  RShopId: 'Shop',
  image: 'Product Image',
};

// Turns a failed request into a message worth showing the user directly,
// instead of a generic "failed" toast. Handles the two shapes the backend
// actually returns - ASP.NET Core's automatic field validation errors
// ({ errors: { Field: [msgs] } }) and the app's own ApiResponse ({ message }) -
// plus a plain-string body, falling back to the given default otherwise.
// Only ever surfaces messages the backend itself already intended as
// user-facing (field validation text), never stack traces or internals.
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response) {
    const data = error.response.data;
    if (data && typeof data === 'object' && data.errors) {
      const messages = Object.entries(data.errors as Record<string, string[]>).map(
        ([field, msgs]) => `${FIELD_LABELS[field] || field}: ${msgs.join(' ')}`
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
  baseURL: 'https://emall-h0cja4cpepgkhpcc.southafricanorth-01.azurewebsites.net',
  timeout: 30000, // Increased timeout to 30 seconds
});

axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
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
  login: async (email: string, password: string, endpoint: string = '/api/Authentication/LoginManager'): Promise<AuthResponse> => {
    try {
      const response = await api.post(endpoint, { email, password });
      console.log('[authAPI.login] Response:', JSON.stringify(response.data, null, 2));
      return {
        statusCode: response.data.statusCode,
        message: response.data.message,
        token: response.data.token,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('[authAPI.login] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  changePassword: async (email: string, currPass: string, newPass: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/Authentication/ChangePassword', { email, currPass, newPass });
      console.log('[authAPI.changePassword] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.changePassword] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to change password');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  registerRetail: async (formData: FormData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/Authentication/RegisterRetailShop', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[authAPI.registerRetail] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.registerRetail] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to submit registration');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  retailLogin: async (username: string, password: string): Promise<RetailLoginResponse> => {
    try {
      const response = await api.post('/api/Authentication/RetailBranchLogin', { username, password });
      console.log('[authAPI.retailLogin] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.retailLogin] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  verifyOtp: async (username: string, otp: string): Promise<RetailLoginResponse> => {
    try {
      const response = await api.post('/api/Authentication/VerifyRetailBranchOtp', null, {
        params: { username, otp },
      });
      console.log('[authAPI.verifyOtp] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.verifyOtp] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'OTP verification failed');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  changeRetailPassword: async (username: string, currPass: string, newPass: string): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/ChangeRetailBranchPassword', { username, currPass, newPass });
      console.log('[authAPI.changeRetailPassword] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.changeRetailPassword] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to change password');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  registerManager: async (data: RegisterManagerData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/Authentication/RegisterManager', data);
      console.log('[authAPI.registerManager] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.registerManager] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to register manager');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  registerPacManager: async (data: RegisterManagerData & { mallManagerId: number }): Promise<AuthResponse> => {
    try {
      const response = await api.post(
        '/api/Authentication/RegisterPacManager',
        {
          name: data.name,
          surname: data.surname,
          gender: data.gender,
          contacts: data.contacts,
          email: data.email,
          password: data.password,
          type: data.type,
          username: data.email,
        },
        {
          params: { ID: data.mallManagerId },
        }
      );
      console.log('[authAPI.registerPacManager] Response:', JSON.stringify(response.data, null, 2));
      return {
        statusCode: response.data.statusCode,
        message: response.data.message,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('[authAPI.registerPacManager] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to register PAC manager');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  updateManager: async (data: RegisterManagerData & { id: number }): Promise<AuthResponse> => {
    try {
      const response = await api.put(`/api/Authentication/UpdateManager/${data.id}`, data);
      console.log('[authAPI.updateManager] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.updateManager] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to update manager');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  deleteManager: async (id: number): Promise<AuthResponse> => {
    try {
      const response = await api.delete(`/api/Authentication/DeleteManager/${id}`);
      console.log('[authAPI.deleteManager] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.deleteManager] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to delete manager');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  deleteShop: async (id: number): Promise<AuthResponse> => {
    try {
      const response = await api.delete(`/api/Shop/DeleteShop/${id}`);
      console.log('[authAPI.deleteShop] Response:', JSON.stringify(response.data, null, 2));
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || 'Shop deleted successfully',
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('[authAPI.deleteShop] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to delete shop');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  forgotPassword: async (username: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/Authentication/ForgotRetailBranchPass', null, {
        params: { username },
      });
      console.log('[authAPI.forgotPassword] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.forgotPassword] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to request password reset');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  resetForgottenPassword: async (username: string, otp: string, newPass: string): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/SaveNewRetailBranchPass', null, {
        params: { username, otp, newPass },
      });
      console.log('[authAPI.resetForgottenPassword] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.resetForgottenPassword] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to reset password');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getUserById: async (id: number): Promise<UserResponse> => {
    try {
      const response = await api.get(`/api/UserManagement/getUserByUsrID?id=${id}`);
      console.log('[authAPI.getUserById] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.getUserById] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch user');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getShops: async (mallID: number): Promise<{ dto: Shop; imageBase64?: string }[]> => {
    try {
      const response = await api.get(`/api/Shop/GetShopsByMallID?id=${mallID}`);
      console.log('[authAPI.getShops] Response:', JSON.stringify(response.data, null, 2));
      return response.data.map((s: any) => ({
        dto: {
          id: s.dto.shopId || s.dto.id,
          shopName: s.dto.shopName,
          shopType: s.dto.shopType,
          mangrID: s.dto.mangrID || 0,
          mallID,
          managerName: s.dto.managerName || '',
          shopImage: s.dto.shopImage,
        },
        imageBase64: s.imageBase64,
      }));
    } catch (error: unknown) {
      console.error('[authAPI.getShops] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch shops');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  addShop: async (shop: {
    ShopName: string;
    ShopType: string;
    MangrID: number;
    MallID: number;
    image?: File;
  }): Promise<AuthResponse> => {
    try {
      const formData = new FormData();
      formData.append('ShopName', shop.ShopName);
      formData.append('ShopType', shop.ShopType);
      formData.append('MangrID', shop.MangrID.toString());
      formData.append('MallID', shop.MallID.toString());
      if (shop.image) {
        formData.append('image', shop.image);
      }

      const response = await api.post('/api/Shop/AddShop', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[authAPI.addShop] Response:', JSON.stringify(response.data, null, 2));
      return {
        statusCode: response.data.statusCode,
        message: response.data.message,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('[authAPI.addShop] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to add shop');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getMallIdByManagerId: async (roleID: number): Promise<{ mallID: number }> => {
    try {
      const response = await api.get(`/api/Mall/GetMallidByMngrID/${roleID}`);
      console.log('[authAPI.getMallIdByManagerId] Response:', JSON.stringify(response.data, null, 2));
      return { mallID: response.data };
    } catch (error: unknown) {
      console.error('[authAPI.getMallIdByManagerId] Error:', error);
      if (error instanceof AxiosError && error.response) {
        console.error('[authAPI.getMallIdByManagerId] Status:', error.response.status);
        console.error('[authAPI.getMallIdByManagerId] Data:', JSON.stringify(error.response.data, null, 2));
        throw new Error(error.response.data.message || 'Failed to fetch mall ID');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getMallById: async (id: number): Promise<{ dto: Mall; imageBase64?: string }> => {
    try {
      const response = await api.get(`/api/Mall/GetMallByID/${id}`);
      console.log('[authAPI.getMallById] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.getMallById] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch mall details');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getShopManagers: async (mallID: number): Promise<{ userID: number; roleID: number; uName: string; uSurname: string; uGender: string; uPhone: string; uEmail: string; uType: string }[]> => {
    try {
      const response = await api.get(`/api/UserManagement/GetShopManagers?mallID=${mallID}`);
      console.log('[authAPI.getShopManagers] Response:', JSON.stringify(response.data, null, 2));
      return response.data.map((m: any) => ({
        userID: m.userID,
        roleID: m.roleID,
        uName: m.user.uName,
        uSurname: m.user.uSurname,
        uGender: m.user.uGender,
        uPhone: m.user.uPhone,
        uEmail: m.user.uEmail,
        uType: m.user.uType,
      }));
    } catch (error: unknown) {
      console.error('[authAPI.getShopManagers] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch shop managers');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getShopByMngrID: async (roleID: number): Promise<number> => {
    try {
      const response = await api.get(`/api/Shop/GetShopByMngrID/${roleID}`);
      console.log('[authAPI.getShopByMngrID] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.getShopByMngrID] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch shop ID');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getBranchesByRShopID: async (rShopId: number): Promise<BranchShop[]> => {
    try {
      const response = await api.get('/api/Shop/GetBranchesByRShopID', { params: { id: rShopId } });
      console.log('[authAPI.getBranchesByRShopID] Response:', JSON.stringify(response.data, null, 2));
      return (response.data as any[]).map((b) => ({
        id: b.dto.shopId,
        shopName: b.dto.shopName,
        email: b.dto.email,
        tellphone: b.dto.tellphone,
        regStatus: b.dto.regStatus,
        imageBase64: b.image,
      }));
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to fetch branches'));
    }
  },

  approveBranch: async (branchId: number): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/ApproveRetailBranchShop', null, {
        params: { b: branchId },
      });
      console.log('[authAPI.approveBranch] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to approve branch'));
    }
  },

  rejectBranch: async (branchId: number, reason?: string): Promise<AuthResponse> => {
    try {
      const response = await api.put('/api/Authentication/RejectRetailBranchShop', null, {
        params: { b: branchId, reason },
      });
      console.log('[authAPI.rejectBranch] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to reject branch'));
    }
  },

  getRetailShopById: async (id: number): Promise<RetailShopProfile> => {
    try {
      const response = await api.get('/api/Shop/GetRetailShopById', { params: { id } });
      console.log('[authAPI.getRetailShopById] Response:', JSON.stringify(response.data, null, 2));
      const dto = response.data.dto;
      return {
        rShopId: dto.rShop_ID ?? dto.rshopId ?? id,
        shopName: dto.shopName || '',
        username: dto.username || '',
        email: dto.email || '',
        tellphone: dto.tellphone || '',
        shopType: dto.shopType || '',
        imageBase64: response.data.image,
      };
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to fetch shop profile'));
    }
  },

  getShopByID: async (id: number): Promise<{ dto: Shop; imageBase64?: string }> => {
    try {
      const response = await api.get(`/api/Shop/GetShopByID/${id}`);
      console.log('[authAPI.getShopByID] Response:', JSON.stringify(response.data, null, 2));
      return {
        dto: {
          id: response.data.dto.shopId || response.data.dto.id,
          shopName: response.data.dto.shopName,
          shopType: response.data.dto.shopType,
          mangrID: response.data.dto.mangrID || 0,
          mallID: response.data.dto.mallID,
          managerName: response.data.dto.managerName || '',
          shopImage: response.data.dto.shopImage,
        },
        imageBase64: response.data.imageBase64,
      };
    } catch (error: unknown) {
      console.error('[authAPI.getShopByID] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch shop details');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getPackagers: async (shopID: number): Promise<{ roleID: number; user: { userID: number; uName: string; uSurname: string; uGender: string; uPhone: string; uEmail: string; uType: string } }[]> => {
    try {
      const response = await api.get(`/api/UserManagement/GetPackagers?shopID=${shopID}`);
      console.log('[authAPI.getPackagers] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: unknown) {
      console.error('[authAPI.getPackagers] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch packagers');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getProducts: async (shopID: number): Promise<Product[]> => {
    try {
      const response = await api.get(`/api/Products/GetProductsByShopID/${shopID}`);
      console.log('[authAPI.getProducts] Response:', JSON.stringify(response.data, null, 2));
      return response.data.map((p: any) => ({
        id: p.dto.prod_ID,
        prod_Name: p.dto.prod_Name,
        prod_Desc: p.dto.prod_Desc,
        prod_Categ: p.dto.prod_Categ === 'Health & Pharmarcy' ? 'Health & Pharmacy' : p.dto.prod_Categ, // Fix typo
        prod_Subcateg: p.dto.prod_Subcateg,
        price: p.dto.price,
        prod_Weight: p.dto.prod_Weight,
        quantity: p.dto.quantity,
        shopId: shopID, // Derive from input parameter
        imageUrl: p.imageBase64 ? `data:image/jpeg;base64,${p.imageBase64}` : p.dto.prod_Image,
        onSaleOffer: p.dto.onSaleOffer || undefined,
        type: p.dto.prod_Categ === 'Health & Pharmarcy' ? 'Pharmacy' : p.dto.prod_Categ || 'General',
        variants: p.dto.variants || undefined,
      }));
    } catch (error: unknown) {
      console.error('[authAPI.getProducts] Error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof AxiosError ? error.code : undefined,
        response: error instanceof AxiosError && error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : undefined,
      });
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch products');
      }
      throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  },

  getRProductsByRShopID: async (rShopID: number): Promise<RetailProduct[]> => {
    try {
      const response = await api.get(`/api/Products/GetRProductsByRShopID/${rShopID}`);
      console.log('[authAPI.getRProductsByRShopID] Response:', JSON.stringify(response.data, null, 2));
      return response.data.map((p: any) => ({
        id: p.dto.rProd_ID,
        prod_Name: p.dto.prod_Name,
        prod_Desc: p.dto.prod_Desc,
        prod_Categ: p.dto.prod_Categ === 'Health & Pharmarcy' ? 'Health & Pharmacy' : p.dto.prod_Categ, // Fix typo
        prod_Subcateg: p.dto.prod_Subcateg,
        price: p.dto.price,
        prod_Weight: p.dto.prod_Weight,
        hasVariant: p.dto.hasVariant ?? false,
        discPerc: p.dto.discPerc ?? undefined,
        discAmount: p.dto.discAmount ?? undefined,
        shopId: rShopID,
        imageUrl: p.image ? `data:image/jpeg;base64,${p.image}` : p.dto.prod_Image,
        variants: Array.isArray(p.dto.variants)
          ? p.dto.variants.map((v: any) => ({
              id: v.id ?? undefined,
              colorName: v.colorName,
              colorPicture: v.colorPicture ? `data:image/jpeg;base64,${v.colorPicture}` : undefined,
              sizes: Array.isArray(v.sizes) ? v.sizes : [],
            }))
          : undefined,
      }));
    } catch (error: unknown) {
      console.error('[authAPI.getRProductsByRShopID] Error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof AxiosError ? error.code : undefined,
        response: error instanceof AxiosError && error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : undefined,
      });
      throw new Error(extractErrorMessage(error, 'Failed to fetch products'));
    }
  },

  getCategoriesWithSubs: async (): Promise<CategoryWithSubs[]> => {
    try {
      const response = await api.get('/api/Products/GetAllCatandSubs');
      console.log('[authAPI.getCategoriesWithSubs] Response:', JSON.stringify(response.data, null, 2));
      return response.data.map((c: any) => ({
        id: c.id,
        catName: c.catName,
        subs: Array.isArray(c.subs)
          ? c.subs.map((s: any) => ({ catId: s.catId, subcatName: s.subcatName }))
          : [],
      }));
    } catch (error: unknown) {
      console.error('[authAPI.getCategoriesWithSubs] Error:', error);
      throw new Error(extractErrorMessage(error, 'Failed to fetch categories'));
    }
  },

  uploadRProduct: async (formData: FormData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/Products/UploadRProductInfo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[authAPI.uploadRProduct] Response:', JSON.stringify(response.data, null, 2));
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || 'Product uploaded successfully',
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('[authAPI.uploadRProduct] Error:', error);
      throw new Error(extractErrorMessage(error, 'Failed to upload product'));
    }
  },

  deleteRProduct: async (id: number): Promise<AuthResponse> => {
    try {
      const response = await api.delete(`/api/Products/DeleteRProduct/${id}`);
      console.log('[authAPI.deleteRProduct] Response:', JSON.stringify(response.data, null, 2));
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || 'Product deleted successfully',
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('[authAPI.deleteRProduct] Error:', error);
      throw new Error(extractErrorMessage(error, 'Failed to delete product'));
    }
  },

  editRProduct: async (id: number, formData: FormData): Promise<AuthResponse> => {
    try {
      const response = await api.put(`/api/Products/UpdateRProductInfo/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[authAPI.editRProduct] Response:', JSON.stringify(response.data, null, 2));
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || 'Product updated successfully',
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('[authAPI.editRProduct] Error:', error);
      throw new Error(extractErrorMessage(error, 'Failed to update product'));
    }
  },

  uploadProduct: async (formData: FormData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/Products/UploadProductInfo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[authAPI.uploadProduct] Response:', JSON.stringify(response.data, null, 2));
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || 'Product uploaded successfully',
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('[authAPI.uploadProduct] Error:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.message || 'Failed to upload product');
      }
      throw new Error('An unexpected error occurred');
    }
  },
};