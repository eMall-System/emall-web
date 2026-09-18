export interface AuthResponse {
  statusCode: number;
  message: string;
  token?: string;
  data?: any;
}

export interface AdminLoginResponse {
  statusCode: number;
  message: string;
  token?: string;
  adminID?: number;
  username?: string;
  email?: string;
  isTempPassword?: boolean;
}

export interface PendingRetailShop {
  id: number;
  shopName: string;
  email: string;
  tellphone: string;
  imageBase64?: string;
}

export interface PendingBranchShop {
  id: number;
  shopName: string;
  email: string;
  tellphone: string;
  imageBase64?: string;
}
