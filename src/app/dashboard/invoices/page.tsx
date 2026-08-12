"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package } from "lucide-react";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";
import { OrderForPackager, CartItem } from "@/lib/authTypes";

export default function InvoicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderForPackager[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderForPackager[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<number | undefined>(undefined);
  const [pacID, setPacID] = useState<number | undefined>(undefined);
  const [collectingId, setCollectingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) {
      console.log("[InvoicesPage] Waiting for AuthContext to load...");
      return;
    }

    if (!user?.id) {
      console.error("[InvoicesPage] Missing userId:", { user });
      toast.error("User ID not found. Please log in again.");
      router.push("/login");
      return;
    }

    let isMounted = true;

    const fetchShopOrders = async () => {
      try {
        let fetchedPacID = user?.pacID;
        let fetchedShopId = user?.shopId;

        if (fetchedPacID === undefined || fetchedShopId === undefined) {
          console.log(`[InvoicesPage] Fetching user details for userId: ${user.id}`);
          const userResponse = await authAPI.getUserById(user.id);
          console.log("[InvoicesPage] getUserById Response:", JSON.stringify(userResponse, null, 2));
          fetchedPacID = userResponse.roleID;

          if (fetchedPacID === undefined) {
            throw new Error("Packager ID (roleID) not found.");
          }

          console.log(`[InvoicesPage] Fetching shopId for pacID: ${fetchedPacID}`);
          fetchedShopId = (await authAPI.getShopIdByPacID(fetchedPacID)) ?? undefined;
          if (fetchedShopId === undefined) {
            throw new Error("Shop ID not found for packager.");
          }
        }

        if (isMounted) {
          setPacID(fetchedPacID);
          setShopId(fetchedShopId);
        }

        if (fetchedShopId === undefined) {
          throw new Error("Shop ID is undefined.");
        }

        console.log(`[InvoicesPage] Fetching packaged orders for shopId: ${fetchedShopId}`);
        const shopOrders = await authAPI.getPackagedOrders(fetchedShopId);
        console.log("[InvoicesPage] getPackagedOrders Response:", JSON.stringify(shopOrders, null, 2));

        const validOrders = shopOrders.filter((order: OrderForPackager) => {
          if (!order || !order.orderID || order.orderPrice == null) {
            console.warn("[InvoicesPage] Invalid order skipped:", JSON.stringify(order, null, 2));
            return false;
          }
          return order.packagingStatus === "Packaging Complete";
        });

        if (isMounted) {
          setOrders(validOrders);
          setFilteredOrders(validOrders);
        }
      } catch (error: any) {
        console.error("[InvoicesPage] Failed to fetch packaged orders:", {
          message: error?.message || "Unknown error",
          status: error?.response?.status,
          data: error?.response?.data ? JSON.stringify(error.response.data, null, 2) : null,
        });
        if (isMounted) {
          toast.error(error?.message || "Failed to load packaged orders. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchShopOrders();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.pacID, user?.shopId, authLoading, router]);

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      const products = order.carts
        .map((cart: CartItem) => cart.product.dto.prod_Name)
        .join(", ")
        .toLowerCase();
      return (
        order.orderID.toString().includes(searchLower) ||
        products.includes(searchLower)
      );
    });
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  const handleCollectOrder = async (oID: number) => {
    console.log(`[InvoicesPage] handleCollectOrder — oID: ${oID}, type: ${typeof oID}`);
    setCollectingId(oID);
    try {
      const response = await authAPI.collectOrder(oID);
      console.log("[InvoicesPage] collectOrder Response:", JSON.stringify(response, null, 2));

      const isSuccess = Number(response.statusCode) === 200;

      if (isSuccess) {
        setOrders((prev) => prev.filter((order) => order.orderID !== oID));
        setFilteredOrders((prev) => prev.filter((order) => order.orderID !== oID));
        if (selectedOrderId === oID) setSelectedOrderId(null);
        toast.success(response.message || "Order collected successfully.");
        router.push("/dashboard/history");
      } else {
        toast.error(response.message || "Failed to collect order.");
      }
    } catch (error: any) {
      console.log("[InvoicesPage] collectOrder ERROR — oIDUsed:", oID);
      console.log("[InvoicesPage] collectOrder ERROR — message:", error?.message);
      console.log("[InvoicesPage] collectOrder ERROR — status:", error?.response?.status);
      console.log("[InvoicesPage] collectOrder ERROR — responseData:", JSON.stringify(error?.response?.data ?? null));
      console.log("[InvoicesPage] collectOrder ERROR — requestURL:", error?.config?.url);
      console.log("[InvoicesPage] collectOrder ERROR — isAxiosError:", error?.isAxiosError);
      toast.error(error?.message || "Failed to collect order.");
    } finally {
      setCollectingId(null);
    }
  };

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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoices</h2>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoices</h2>
          <p className="text-gray-600">No packaged orders ready for collection.</p>
        </div>
      </div>
    );
  }

  const selectedOrder = orders.find((order) => order.orderID === selectedOrderId);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex gap-6 h-full">
        {/* Left panel - Invoice list */}
        <div className={`${selectedOrderId ? "flex-1" : "w-full"} bg-white rounded-lg shadow transition-all duration-300`}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
            <div className="flex items-center justify-center mt-4">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Order ID or Product"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index: number) => (
                  <tr
                    key={order.orderID}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedOrderId === order.orderID ? "bg-blue-50" : ""}`}
                    onClick={() => setSelectedOrderId(order.orderID)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {String(index + 1).padStart(4, "0")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{order.orderID}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.orderPrice != null ? `R ${order.orderPrice.toFixed(2)}` : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white text-xs font-semibold">
                        Ready for collection
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel - Invoice details */}
        {selectedOrder && (
          <div className="w-96 bg-white rounded-lg shadow p-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold mb-4">
              Invoice &gt;{" "}
              {String(orders.findIndex((o) => o.orderID === selectedOrder.orderID) + 1).padStart(4, "0")}
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-green-600 font-semibold">
                  {selectedOrder.orderPrice != null ? `R ${selectedOrder.orderPrice.toFixed(2)}` : "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white text-xs font-semibold">
                  Ready for collection
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Order ID</div>
                  <div>{selectedOrder.orderID}</div>
                </div>
                <div>
                  <div className="text-gray-600">Store</div>
                  <div>{user?.storeName || "N/A"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Date</div>
                  <div>{new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-gray-600">Time</div>
                  <div>
                    {new Date(selectedOrder.orderDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-3">Products</h3>
                <div className="space-y-2">
                  {selectedOrder.carts.map((cart: CartItem, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>{cart.product.dto.prod_Name}</div>
                      <div className="flex items-center space-x-4">
                        <span>{cart.product.dto.prod_Weight}</span>
                        <span>R {cart.product.dto.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>
                        {selectedOrder.orderPrice != null
                          ? `R ${selectedOrder.orderPrice.toFixed(2)}`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 mt-6 disabled:opacity-50"
                onClick={() => handleCollectOrder(selectedOrder.orderID)}
                disabled={collectingId === selectedOrder.orderID}
              >
                {collectingId === selectedOrder.orderID ? "Confirming..." : "Confirm Collection"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}