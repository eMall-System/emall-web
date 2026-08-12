"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";

// Internal interface matching the raw snake_case API response shape
interface ApiCartItem {
  cartID: number;
  quantity: number;
  product: {
    dto: {
      prod_ID: number;
      prod_Name: string;
      prod_Desc: string;
      prod_Categ: string;
      prod_Subcateg: string;
      prod_Weight: string;
      price: number;
      quantity: number;
      prod_Image?: string;
      variants?: any[];
    };
    imageBase64?: string;
  };
}

interface ApiOrder {
  order_ID: number;
  order_Type: string;
  order_Date: string;
  order_Price?: number | null;
  order_Status: string;
  packaging_Status: string;
  pacID?: number;
  carts: ApiCartItem[];
}

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ApiOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<number | undefined>(undefined);
  const [pacID, setPacID] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (authLoading) {
      console.log("[HistoryPage] Waiting for AuthContext to load...");
      return;
    }

    if (!user?.id) {
      console.error("[HistoryPage] Missing userId:", { user });
      toast.error("User ID not found. Please log in again.");
      router.push("/login");
      return;
    }

    let isMounted = true;

    const fetchCollectedOrders = async () => {
      try {
        let fetchedPacID = user?.pacID;
        let fetchedShopId = user?.shopId;

        if (fetchedPacID === undefined || fetchedShopId === undefined) {
          console.log(`[HistoryPage] Fetching user details for userId: ${user.id}`);
          const userResponse = await authAPI.getUserById(user.id);
          console.log("[HistoryPage] getUserById Response:", JSON.stringify(userResponse, null, 2));
          fetchedPacID = userResponse.roleID;

          if (fetchedPacID === undefined) {
            throw new Error("Packager ID (roleID) not found.");
          }

          console.log(`[HistoryPage] Fetching shopId for pacID: ${fetchedPacID}`);
          fetchedShopId = (await authAPI.getShopIdByPacID(fetchedPacID)) ?? undefined;
          if (fetchedShopId === null || fetchedShopId === undefined) {
            throw new Error("Shop ID not found for packager.");
          }
        }

        if (isMounted) {
          setPacID(fetchedPacID);
          setShopId(fetchedShopId);
        }

        console.log(`[HistoryPage] Fetching collected orders for shopId: ${fetchedShopId}`);
        const rawOrders = await authAPI.getCollectedOrders(fetchedShopId!);
        console.log("[HistoryPage] getCollectedOrders Response:", JSON.stringify(rawOrders, null, 2));

        // Map raw API response (snake_case) directly into ApiOrder shape
        const data = Array.isArray(rawOrders) ? rawOrders : [];
        const mappedOrders: ApiOrder[] = data.map((o: any) => ({
          order_ID: o.order_ID ?? o.orderID ?? 0,
          order_Type: o.order_Type ?? o.orderType ?? "Unknown",
          order_Date: o.order_Date ?? o.orderDate ?? new Date().toISOString(),
          order_Price: o.order_Price ?? o.orderPrice ?? null,
          order_Status: o.order_Status ?? o.orderStatus ?? "Unknown",
          packaging_Status: o.packaging_Status ?? o.packagingStatus ?? "Unknown",
          pacID: o.pacID ?? o.packagerId,
          carts: Array.isArray(o.carts)
            ? o.carts.map((c: any) => ({
                cartID: c.cartID ?? 0,
                quantity: c.quantity ?? 0,
                product: {
                  dto: {
                    prod_ID: c.product?.dto?.prod_ID ?? 0,
                    prod_Name: c.product?.dto?.prod_Name ?? "Unknown",
                    prod_Desc: c.product?.dto?.prod_Desc ?? "",
                    prod_Categ: c.product?.dto?.prod_Categ ?? "Unknown",
                    prod_Subcateg: c.product?.dto?.prod_Subcateg ?? "",
                    prod_Weight: c.product?.dto?.prod_Weight ?? "",
                    price: c.product?.dto?.price ?? 0,
                    quantity: c.product?.dto?.quantity ?? 0,
                    prod_Image: c.product?.dto?.prod_Image ?? "",
                    variants: Array.isArray(c.product?.dto?.variants)
                      ? c.product.dto.variants
                      : [],
                  },
                  imageBase64: c.product?.imageBase64 ?? "",
                },
              }))
            : [],
        }));

        const validOrders = mappedOrders.filter((order) => {
          if (!order.order_ID) {
            console.warn("[HistoryPage] Invalid order skipped:", JSON.stringify(order, null, 2));
            return false;
          }
          return true;
        });

        console.log("[HistoryPage] Valid orders:", JSON.stringify(validOrders, null, 2));

        if (isMounted) {
          setOrders(validOrders);
          setFilteredOrders(validOrders);
        }
      } catch (error: any) {
        console.error("[HistoryPage] Failed to fetch collected orders:", {
          message: error?.message || "Unknown error",
          status: error?.response?.status,
          data: error?.response?.data
            ? JSON.stringify(error.response.data, null, 2)
            : null,
        });
        if (isMounted) {
          toast.error(error?.message || "Failed to load collected orders. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCollectedOrders();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.pacID, user?.shopId, authLoading, router]);

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      const products = order.carts
        .map((cart) => cart.product.dto.prod_Name)
        .join(", ")
        .toLowerCase();
      return (
        order.order_ID.toString().includes(searchLower) ||
        products.includes(searchLower)
      );
    });
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  if (authLoading || loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Package className="h-12 w-12 text-green-600" />
        </div>
      </div>
    );
  }

  if (shopId === undefined || pacID === undefined) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">History</h2>
          <p className="text-gray-600">
            Unable to load shop or packager information. Please try logging in again.
          </p>
        </div>
      </div>
    );
  }

  if (!filteredOrders.length) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">History</h2>
          <p className="text-gray-600">No collected orders found for this shop.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">History</h2>
            <div className="relative w-80">
              <Input
                placeholder="Search by Order ID or Product"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pr-10 rounded-full border-gray-300 focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const date = new Date(order.order_Date);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const products = order.carts
                  .map((cart) => `${cart.product.dto.prod_Name} (${cart.quantity})`)
                  .join(", ");

                return (
                  <tr
                    key={order.order_ID}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_ID}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{formattedDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{formattedTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {products}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_Price != null
                          ? `R ${order.order_Price.toFixed(2)}`
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {order.order_Type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white text-xs font-semibold">
                        {order.order_Status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}