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
  active: boolean;
  mallId: number;
  mallName: string;
  imageBase64?: string;
}

// Dashboard
export interface DashboardSummary {
  todayRevenue: number;
  todayOrders: number;
  totalProducts: number;
  lowStockCount: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface SalesTrend {
  day: string;
  revenue: number;
}

export interface TopProduct {
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface RecentOrder {
  orderId: number;
  customerName: string;
  total: number;
  status: string;
}

export interface DashboardAlert {
  message: string;
  type: string;
}

export interface DashboardAlerts {
  lowStock: DashboardAlert[];
  pendingReturns: DashboardAlert[];
  paymentFailed: DashboardAlert[];
}

// Reports - Sales
export interface SalesSummary {
  totalRevenue: number;
  ordersCompleted: number;
  averageOrderValue: number;
  topProduct: string;
}

export interface RevenueTrend {
  month: string;
  thisYear: number;
  lastYear: number;
}

export interface BestSeller {
  rank: number;
  productName: string;
  revenue: number;
  units: number;
  growth: number;
}

// Reports - Inventory
export interface InventorySummary {
  totalProducts: number;
  lowStockItems: number;
  stockTurnover: number;
  totalStockValue: number;
}

export interface StockDistribution {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  overstocked: number;
}

export interface StockHistory {
  week: string;
  stockLevel: number;
}

// Reports - Customers
export interface CustomerSummary {
  totalCustomers: number;
  newCustomers: number;
  returningRate: number;
  topCustomer: string;
}

export interface CustomerAcquisition {
  month: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface TopCustomer {
  customerName: string;
  orders: number;
  totalSpent: number;
}

// Reports - Orders
export interface OrderSummary {
  totalOrders: number;
  avgFulfillmentTime: number;
  cancellationRate: number;
  returnRate: number;
}

export interface OrderStatusBreakdown {
  completed: number;
  pending: number;
  cancelled: number;
  inTransit: number;
}

export interface FulfillmentTime {
  day: string;
  avgTime: number;
}

// Reports - Financial
export interface FinancialSummary {
  netRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  totalRefunds: number;
}

export interface RevenueExpense {
  month: string;
  revenue: number;
  expenses: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  transactions: number;
}

export type ReportRange = 'today' | 'thisWeek' | 'thisMonth';