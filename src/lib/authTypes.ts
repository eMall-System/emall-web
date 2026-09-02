export interface User {
  id: number;
  username: string;
  name: string;
  surname: string;
  email: string;
  contacts: string;
  gender: string;
  type: string;
}

export interface UserResponse {
  roleID: number;
  user: {
    uName: string;
    uSurname: string;
    uGender: string;
    uPhone: string;
    uEmail: string;
    uType: string;
  };
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  token?: string;
  data?: any;
}

export interface RetailLoginResponse {
  statusCode: number;
  message: string;
  token?: string;
  rShop_ID?: number;
  shop_ID?: number;
  shopName?: string;
  username?: string;
  email?: string;
  isTempPassword?: boolean;
}

export interface RegisterManagerData {
  name: string;
  surname: string;
  gender: string;
  contacts: string;
  email: string;
  password?: string; // Made optional for updateManager
  type: string;
  username?: string;
}

export interface Shop {
  id: number;
  shopName: string;
  shopType: string;
  mangrID: number;
  mallID: number;
  managerName: string;
  shopImage?: string;
  imageBase64?: string;
}

export interface Mall {
  mallID: number;
  mallName: string;
  mallAddr: string;
  mallContacts: string;
  mallImage?: string;
  imageBase64?: string;
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
  imageUrl?: string;
  onSaleOffer?: string;
  type: string;
  variants?: { id: number; size: string; color: string; quantity: number }[];
}

export interface RetailProductVariant {
  id?: number;
  colorName: string;
  colorPicture?: string;
  sizes: string[];
}

export interface RetailProduct {
  id: number;
  prod_Name: string;
  prod_Desc: string;
  prod_Categ: string;
  prod_Subcateg: string;
  price: number;
  prod_Weight: string;
  hasVariant: boolean;
  discPerc?: number;
  discAmount?: number;
  shopId: number;
  imageUrl?: string;
  variants?: RetailProductVariant[];
}

export interface CategoryWithSubs {
  id: number;
  catName: string;
  subs: { catId: number; subcatName: string }[];
}

export interface RetailShopProfile {
  rShopId: number;
  shopName: string;
  username: string;
  email: string;
  tellphone: string;
  shopType: string;
  imageBase64?: string;
}

export interface BranchShop {
  id: number;
  shopName: string;
  email: string;
  tellphone: string;
  regStatus: string;
  imageBase64?: string;
}