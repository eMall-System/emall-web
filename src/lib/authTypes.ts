export interface AuthResponse {
  statusCode: number;
  message: string;
  token?: string;
  data?: unknown;
}

export interface RegisterManagerData {
  name: string;
  surname: string;
  gender: string;
  contacts: string;
  email: string;
  password: string;
  type: string;
}

export interface Shop {
  id: number;
  shopName: string;
  shopType: string;
  mangrID: number;
  mallID: number;
  managerName: string;
  shopImage: string;
}

export interface Mall {
  id: number;
  mallName: string;
}

export interface UserResponse {
  roleID: number;
  user: {
    userID: number;
    uName: string;
    uSurname: string;
    uGender: string;
    uPhone: string;
    uEmail: string;
    uType: string;
    accountCreated: string;
  };
}

export interface Product {
  id: number;
  prod_Name: string;
  prod_Desc: string;
  prod_Categ: string;
  prod_Subcateg: string;
  price: number;
  prod_Weight: string;
  quantity: number;
  shopId: number;
  imageUrl: string;
  onSaleOffer?: string;
  type: string;
  variants?: { id: number; size: string; color: string; quantity: number }[];
}

export interface CartItem {
  cartID: number;
  product: {
    dto: Product;
    imageBase64: string;
  };
  quantity: number;
}

export interface Order {
  orderID: number;
  orderType: string;
  orderDate: string;
  orderPrice: number | null;
  orderStatus: string;
  packagingStatus: string;
  packagerId?: number;
  carts: CartItem[];
}

export interface OrderForPackager {
  orderID: number;
  orderType: string;
  orderDate: string;
  orderPrice: number | null;
  orderStatus: string;
  packagingStatus: string;
  packagerId?: number;
  carts: CartItem[];
}

export interface AuthContextType {
  user: {
    id: number;
    pacID?: number;
    shopId?: number;
    storeName?: string;
  } | null;
  isLoading: boolean;
  logout: () => void;
}