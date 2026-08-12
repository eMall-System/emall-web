import axios, { AxiosError } from "axios";
import axiosRetry from "axios-retry";
import {
  AuthResponse,
  RegisterManagerData,
  Shop,
  Mall,
  UserResponse,
  Product,
  OrderForPackager,
} from "./authTypes";

// Define an ErrorResponse type for backend error responses
interface ErrorResponse {
  message?: string;
  [key: string]: unknown; // Allow other properties
}

const api = axios.create({
  baseURL: "https://emallbase-hkfnhzc7dyfdcpde.southafricanorth-01.azurewebsites.net",
  timeout: 30000,
});

axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return (
      axios.isAxiosError(error) &&
      (!error.response ||
        error.code === "ECONNABORTED" ||
        error.response.status >= 500)
    );
  },
});

api.interceptors.request.use((config) => {
  if (config.url?.includes("/api/Authentication/LoginManager")) {
    console.log(
      `[axios.interceptor] Skipping Authorization header for ${config.url}`
    );
    return config;
  }
  const token = localStorage.getItem("token");
  if (token) {
    console.log(
      `[axios.interceptor] Adding Authorization header with token: ${token.slice(
        0,
        20
      )}...`
    );
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (
    email: string,
    password: string,
    endpoint: string = "/api/Authentication/LoginManager"
  ): Promise<AuthResponse> => {
    try {
      console.log(
        `[authAPI.login] Sending request to ${endpoint} with email: ${email}`
      );
      const response = await api.post(endpoint, { email, password });
      console.log(
        `[authAPI.login] Response from ${endpoint}:`,
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode,
        message: response.data.message,
        token: response.data.token,
        data: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error(`[authAPI.login] Error calling ${endpoint}:`, {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
        config: axiosError.config
          ? JSON.stringify(
              {
                url: axiosError.config.url,
                method: axiosError.config.method,
                headers: axiosError.config.headers,
                data: axiosError.config.data,
              },
              null,
              2
            )
          : null,
        stack: axiosError.stack,
        cause: axiosError.cause
          ? JSON.stringify(axiosError.cause, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Login failed"
      );
    }
  },

  getUserById: async (id: number): Promise<UserResponse> => {
    try {
      const token = localStorage.getItem("token");
      console.log(
        `[authAPI.getUserById] Fetching user ${id} with token: ${
          token ? token.slice(0, 20) + "..." : "missing"
        }`
      );
      const response = await api.get(
        `/api/UserManagement/getUserByUsrID?id=${id}`
      );
      console.log(
        "[authAPI.getUserById] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getUserById] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
        config: axiosError.config
          ? JSON.stringify(
              {
                url: axiosError.config.url,
                method: axiosError.config.method,
                headers: axiosError.config.headers,
              },
              null,
              2
            )
          : null,
        stack: axiosError.stack,
        cause: axiosError.cause
          ? JSON.stringify(axiosError.cause, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch user"
      );
    }
  },

  getShopIdByPacID: async (pacID: number): Promise<number | null> => {
    try {
      const response = await api.get(
        `/api/PackageManegament/GetShopIdByPacID?pacID=${pacID}`
      );
      console.log(
        "[authAPI.getShopIdByPacID] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data || null;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error("[authAPI.getShopIdByPacID] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      return null;
    }
  },

  initiatePack: async (oID: number, pID: number): Promise<AuthResponse> => {
    try {
      const response = await api.put(
        `/api/PackageManegament/InitiatePack/${oID}/${pID}`
      );
      console.log(
        "[authAPI.initiatePack] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || "Pack initiated successfully",
        data: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.initiatePack] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to initiate pack"
      );
    }
  },

  packProduct: async (oID: number, cartId: number): Promise<AuthResponse> => {
    try {
      const response = await api.put(
        `/api/PackageManegament/PackProduct/${oID}/${cartId}`
      );
      console.log(
        "[authAPI.packProduct] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || "Product packed successfully",
        data: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.packProduct] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to pack product"
      );
    }
  },

  packagingComplete: async (
    oID: number,
    pacID: number
  ): Promise<AuthResponse> => {
    try {
      const response = await api.put(
        `/api/PackageManegament/PackagingComplete/${oID}/${pacID}`
      );
      console.log(
        "[authAPI.packagingComplete] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || "Packaging completed successfully",
        data: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.packagingComplete] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to complete packaging"
      );
    }
  },
  getCollectedOrders: async (shopID: number) => {
    const token = localStorage.getItem("token");
    const response = await api.get(
      `api/PackageManegament/GetCollectedOrders?shopID=${shopID}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getShopOrders: async (shopID: number): Promise<OrderForPackager[]> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }
      console.log(
        `[authAPI.getShopOrders] Fetching orders for shopID: ${shopID} with token: ${token.slice(
          0,
          20
        )}...`
      );
      const response = await api.get(
        `/api/PackageManegament/GetShopOrders?shopID=${shopID}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(
        "[authAPI.getShopOrders] Raw axios response:",
        JSON.stringify(response, null, 2)
      );
      console.log(
        "[authAPI.getShopOrders] Response.data:",
        JSON.stringify(response.data, null, 2)
      );

      // Ensure response.data is an array
      const data = Array.isArray(response.data) ? response.data : [];

      // Map response to OrderForPackager type
      const orders: OrderForPackager[] = data.map((o: unknown) => ({
        orderID: (o as any).order_ID || 0,
        orderType: (o as any).order_Type || "Unknown",
        orderDate: (o as any).order_Date || new Date().toISOString(),
        orderPrice: (o as any).order_Price != null ? (o as any).order_Price : null,
        orderStatus: (o as any).order_Status || "Unknown",
        packagingStatus: (o as any).packaging_Status || "Not Started",
        packagerId: (o as any).packagerId,
        carts: Array.isArray((o as any).carts)
          ? (o as any).carts.map((c: unknown) => ({
              cartID: (c as any).cartID || 0,
              product: {
                dto: {
                  id: (c as any).product?.dto?.prod_ID || 0,
                  prod_Name: (c as any).product?.dto?.prod_Name || "Unknown",
                  prod_Desc: (c as any).product?.dto?.prod_Desc || "",
                  prod_Categ: (c as any).product?.dto?.prod_Categ || "Unknown",
                  prod_Subcateg: (c as any).product?.dto?.prod_Subcateg || "",
                  price: (c as any).product?.dto?.price || 0,
                  prod_Weight: (c as any).product?.dto?.prod_Weight || "",
                  quantity: (c as any).product?.dto?.quantity || 0,
                  shopId: shopID,
                  imageUrl: (c as any).product?.imageBase64
                    ? `data:image/jpeg;base64,${(c as any).product.imageBase64}`
                    : (c as any).product?.dto?.prod_Image || "",
                  type: (c as any).product?.dto?.prod_Categ || "General",
                  variants: Array.isArray((c as any).product?.dto?.variants)
                    ? (c as any).product.dto.variants
                    : undefined,
                },
                imageBase64: (c as any).product?.imageBase64 || "",
              },
              quantity: (c as any).quantity || 0,
            }))
          : [],
      }));

      // Filter out invalid orders
      const validOrders = orders.filter((order) => order.orderID !== 0);
      if (!validOrders.length) {
        console.warn(
          "[authAPI.getShopOrders] No valid orders found in response:",
          JSON.stringify(data, null, 2)
        );
      }

      console.log(
        "[authAPI.getShopOrders] Mapped orders:",
        JSON.stringify(validOrders, null, 2)
      );
      return validOrders;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getShopOrders] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
        config: axiosError.config
          ? JSON.stringify(
              {
                url: axiosError.config.url,
                method: axiosError.config.method,
                headers: axiosError.config.headers,
              },
              null,
              2
            )
          : null,
        stack: axiosError.stack,
        cause: axiosError.cause
          ? JSON.stringify(axiosError.cause, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch shop orders"
      );
    }
  },

  getShopOrdersForPackager: async (
    shopID: number,
    pacID: number
  ): Promise<OrderForPackager[]> => {
    try {
      const response = await api.get(
        `/api/PackageManegament/GetShopOrdersForPackager?shopID=${shopID}&pacID=${pacID}`
      );
      console.log(
        "[authAPI.getShopOrdersForPackager] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data.map((o: unknown) => ({
        id: (o as any).id,
        orderDate: (o as any).orderDate,
        status: (o as any).status,
        total: (o as any).total,
        shopId: (o as any).shopId,
        packagerId: (o as any).packagerId,
        items: (o as any).items || [],
      }));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getShopOrdersForPackager] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch packager orders"
      );
    }
  },

  getPackagedOrdersByPacID: async (
    shopID: number,
    pacID: number
  ): Promise<OrderForPackager[]> => {
    try {
      const response = await api.get(
        `/api/PackageManegament/GetPackagedOrdersByPacID?shopID=${shopID}&pacID=${pacID}`
      );
      console.log(
        "[authAPI.getPackagedOrdersByPacID] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data.map((o: unknown) => ({
        id: (o as any).id,
        orderDate: (o as any).orderDate,
        status: (o as any).status,
        total: (o as any).total,
        shopId: (o as any).shopId,
        packagerId: (o as any).packagerId,
        items: (o as any).items || [],
      }));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getPackagedOrdersByPacID] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch packaged orders"
      );
    }
  },

  // REPLACE your existing collectOrder with this in api.ts
  collectOrder: async (oID: number): Promise<AuthResponse> => {
    try {
      console.log(`[authAPI.collectOrder] Calling — oID: ${oID}, type: ${typeof oID}`);
      const response = await api.get(
        `/api/PackageManegament/CollectOrder?oID=${oID}`
      );
      console.log(
        "[authAPI.collectOrder] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || "Order collected successfully",
        data: response.data,
      };
    } catch (error: any) {
      console.error("[authAPI.collectOrder] FULL ERROR:", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        requestURL: error?.config?.url,
        isAxiosError: error?.isAxiosError,
      });
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to collect order"
      );
    }
  },

  getPackagedOrders: async (shopID: number): Promise<OrderForPackager[]> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");
  
      console.log(`[authAPI.getPackagedOrders] Fetching for shopID: ${shopID}`);
      const response = await api.get(
        `/api/PackageManegament/GetPackagedOrders?shopID=${shopID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[authAPI.getPackagedOrders] Response:", JSON.stringify(response.data, null, 2));
  
      const data = Array.isArray(response.data) ? response.data : [];
  
      const orders: OrderForPackager[] = data.map((o: any) => ({
        orderID: o.order_ID || 0,
        orderType: o.order_Type || "Unknown",
        orderDate: o.order_Date || new Date().toISOString(),
        orderPrice: o.order_Price != null ? o.order_Price : null,
        orderStatus: o.order_Status || "Unknown",
        packagingStatus: o.packaging_Status || "Not Started",
        packagerId: o.pacID,
        carts: Array.isArray(o.carts)
          ? o.carts.map((c: any) => ({
              cartID: c.cartID || 0,
              product: {
                dto: {
                  id: c.product?.dto?.prod_ID || 0,
                  prod_Name: c.product?.dto?.prod_Name || "Unknown",
                  prod_Desc: c.product?.dto?.prod_Desc || "",
                  prod_Categ: c.product?.dto?.prod_Categ || "Unknown",
                  prod_Subcateg: c.product?.dto?.prod_Subcateg || "",
                  price: c.product?.dto?.price || 0,
                  prod_Weight: c.product?.dto?.prod_Weight || "",
                  quantity: c.product?.dto?.quantity || 0,
                  shopId: shopID,
                  imageUrl: c.product?.imageBase64
                    ? `data:image/jpeg;base64,${c.product.imageBase64}`
                    : c.product?.dto?.prod_Image || "",
                  type: c.product?.dto?.prod_Categ || "General",
                  variants: Array.isArray(c.product?.dto?.variants)
                    ? c.product.dto.variants
                    : undefined,
                },
                imageBase64: c.product?.imageBase64 || "",
              },
              quantity: c.quantity || 0,
            }))
          : [],
      }));
  
      const validOrders = orders.filter((order) => order.orderID !== 0);
      console.log("[authAPI.getPackagedOrders] Mapped orders:", JSON.stringify(validOrders, null, 2));
      return validOrders;
    } catch (error: any) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getPackagedOrders] Error:", {
        message: axiosError.message || "Unknown error",
        status: axiosError.response?.status,
        data: axiosError.response?.data ? JSON.stringify(axiosError.response.data, null, 2) : null,
      });
      throw new Error(axiosError.response?.data?.message || "Failed to fetch packaged orders");
    }
  },

  changePassword: async (
    email: string,
    currPass: string,
    newPass: string
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post("/api/Authentication/ChangePassword", {
        email,
        currPass,
        newPass,
      });
      console.log(
        "[authAPI.changePassword] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.changePassword] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to change password"
      );
    }
  },

  registerManager: async (data: RegisterManagerData): Promise<AuthResponse> => {
    try {
      const response = await api.post(
        "/api/Authentication/RegisterManager",
        data
      );
      console.log(
        "[authAPI.registerManager] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.registerManager] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to register manager"
      );
    }
  },

  registerPacManager: async (
    data: RegisterManagerData & { mallManagerId: number }
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post(
        "/api/Authentication/RegisterPacManager",
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
      console.log(
        "[authAPI.registerPacManager] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode,
        message: response.data.message,
        data: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.registerPacManager] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to register PAC manager"
      );
    }
  },

  updateManager: async (
    data: RegisterManagerData & { id: number }
  ): Promise<AuthResponse> => {
    try {
      const response = await api.put(
        `/api/Authentication/UpdateManager/${data.id}`,
        data
      );
      console.log(
        "[authAPI.updateManager] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.updateManager] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to update manager"
      );
    }
  },

  deleteManager: async (id: number): Promise<AuthResponse> => {
    try {
      const response = await api.delete(
        `/api/Authentication/DeleteManager/${id}`
      );
      console.log(
        "[authAPI.deleteManager] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.deleteManager] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to delete manager"
      );
    }
  },

  deleteShop: async (id: number): Promise<AuthResponse> => {
    try {
      const response = await api.delete(`/api/Shop/DeleteShop/${id}`);
      console.log(
        "[authAPI.deleteShop] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || "Shop deleted successfully",
        data: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.deleteShop] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to delete shop"
      );
    }
  },

  forgotPassword: async (username: string): Promise<AuthResponse> => {
    try {
      const response = await api.post("/api/Authentication/ForgotPassword", {
        username,
      });
      console.log(
        "[authAPI.forgotPassword] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.forgotPassword] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to request password reset"
      );
    }
  },

  getShops: async (
    mallID: number
  ): Promise<{ dto: Shop; imageBase64?: string }[]> => {
    try {
      const response = await api.get(`/api/Shop/GetShopsByMallID?id=${mallID}`);
      console.log(
        "[authAPI.getShops] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data.map((s: unknown) => ({
        dto: {
          id: (s as any).dto.shopId || (s as any).dto.id,
          shopName: (s as any).dto.shopName,
          shopType: (s as any).dto.shopType,
          mangrID: (s as any).dto.mangrID || 0,
          mallID,
          managerName: (s as any).dto.managerName || "",
          shopImage: (s as any).dto.shopImage,
        },
        imageBase64: (s as any).imageBase64,
      }));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getShops] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch shops"
      );
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
      formData.append("ShopName", shop.ShopName);
      formData.append("ShopType", shop.ShopType);
      formData.append("MangrID", shop.MangrID.toString());
      formData.append("MallID", shop.MallID.toString());
      if (shop.image) {
        formData.append("image", shop.image);
      }

      const response = await api.post("/api/Shop/AddShop", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(
        "[authAPI.addShop] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode,
        message: response.data.message,
        data: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.addShop] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to add shop"
      );
    }
  },

  getMallIdByManagerId: async (roleID: number): Promise<{ mallID: number }> => {
    try {
      const response = await api.get(`/api/Mall/GetMallidByMngrID/${roleID}`);
      console.log(
        "[authAPI.getMallIdByManagerId] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return { mallID: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getMallIdByManagerId] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch mall ID"
      );
    }
  },

  getMallById: async (
    id: number
  ): Promise<{ dto: Mall; imageBase64?: string }> => {
    try {
      const response = await api.get(`/api/Mall/GetMallByID/${id}`);
      console.log(
        "[authAPI.getMallById] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getMallById] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch mall details"
      );
    }
  },

  getShopManagers: async (
    mallID: number
  ): Promise<
    {
      userID: number;
      roleID: number;
      uName: string;
      uSurname: string;
      uGender: string;
      uPhone: string;
      uEmail: string;
      uType: string;
    }[]
  > => {
    try {
      const response = await api.get(
        `/api/UserManagement/GetShopManagers?mallID=${mallID}`
      );
      console.log(
        "[authAPI.getShopManagers] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data.map((m: unknown) => ({
        userID: (m as any).userID,
        roleID: (m as any).roleID,
        uName: (m as any).user.uName,
        uSurname: (m as any).user.uSurname,
        uGender: (m as any).user.uGender,
        uPhone: (m as any).user.uPhone,
        uEmail: (m as any).user.uEmail,
        uType: (m as any).user.uType,
      }));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getShopManagers] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch shop managers"
      );
    }
  },

  getShopByMngrID: async (roleID: number): Promise<number> => {
    try {
      const response = await api.get(`/api/Shop/GetShopByMngrID/${roleID}`);
      console.log(
        "[authAPI.getShopByMngrID] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getShopByMngrID] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch shop ID"
      );
    }
  },

  getShopByID: async (
    id: number
  ): Promise<{ dto: Shop; imageBase64?: string }> => {
    try {
      const response = await api.get(`/api/Shop/GetShopByID/${id}`);
      console.log(
        "[authAPI.getShopByID] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        dto: {
          id: response.data.dto.shopId || response.data.dto.id,
          shopName: response.data.dto.shopName,
          shopType: response.data.dto.shopType,
          mangrID: response.data.dto.mangrID || 0,
          mallID: response.data.dto.mallID,
          managerName: response.data.dto.managerName || "",
          shopImage: response.data.dto.shopImage,
        },
        imageBase64: response.data.imageBase64,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getShopByID] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch shop details"
      );
    }
  },

  getPackagers: async (
    shopID: number
  ): Promise<
    {
      roleID: number;
      user: {
        userID: number;
        uName: string;
        uSurname: string;
        uGender: string;
        uPhone: string;
        uEmail: string;
        uType: string;
      };
    }[]
  > => {
    try {
      const response = await api.get(
        `/api/UserManagement/GetPackagers?shopID=${shopID}`
      );
      console.log(
        "[authAPI.getPackagers] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getPackagers] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch packagers"
      );
    }
  },

  getProducts: async (shopID: number): Promise<Product[]> => {
    try {
      const response = await api.get(
        `/api/Products/GetProductsByShopID/${shopID}`
      );
      console.log(
        "[authAPI.getProducts] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data.map((p: unknown) => ({
        id: (p as any).dto.prod_ID,
        prod_Name: (p as any).dto.prod_Name,
        prod_Desc: (p as any).dto.prod_Desc,
        prod_Categ:
          (p as any).dto.prod_Categ === "Health & Pharmarcy"
            ? "Health & Pharmacy"
            : (p as any).dto.prod_Categ,
        prod_Subcateg: (p as any).dto.prod_Subcateg,
        price: (p as any).dto.price,
        prod_Weight: (p as any).dto.prod_Weight,
        quantity: (p as any).dto.quantity,
        shopId: shopID,
        imageUrl: (p as any).imageBase64
          ? `data:image/jpeg;base64,${(p as any).imageBase64}`
          : (p as any).dto.prod_Image,
        onSaleOffer: (p as any).dto.onSaleOffer || undefined,
        type:
          (p as any).dto.prod_Categ === "Health & Pharmarcy"
            ? "Pharmacy"
            : (p as any).dto.prod_Categ || "General",
        variants: (p as any).dto.variants || undefined,
      }));
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.getProducts] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch products"
      );
    }
  },

  uploadProduct: async (formData: FormData): Promise<AuthResponse> => {
    try {
      const response = await api.post(
        "/api/Products/UploadProductInfo",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(
        "[authAPI.uploadProduct] Response:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || "Product uploaded successfully",
        data: response.data,
      };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("[authAPI.uploadProduct] Error:", {
        message: axiosError.message || "Unknown error",
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data, null, 2)
          : null,
      });
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to upload product"
      );
    }
  },
};
