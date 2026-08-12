"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { OrderForPackager, CartItem } from "@/lib/authTypes";

// Internal interface to maintain snake_case for OrdersPage logic
interface ApiOrder {
  order_ID: number;
  order_Type: string;
  order_Date: string;
  order_Price?: number | null;
  order_Status: string;
  packaging_Status: string;
  packagerId?: number;
  carts: CartItem[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [packStatus, setPackStatus] = useState<{ [orderId: number]: { [cartId: number]: boolean } }>({});
  const [shopId, setShopId] = useState<number | undefined>(undefined);
  const [pacID, setPacID] = useState<number | undefined>(undefined);
  const authLoading = false;

  useEffect(() => {
    if (authLoading) {
      console.log("[OrdersPage] Waiting for AuthContext to load...");
      return;
    }

    if (!user?.id) {
      console.error("[OrdersPage] Missing userId:", { user });
      toast.error("User ID not found. Please log in again.");
      router.push("/login");
      return;
    }

    let isMounted = true;
    const fetchOrders = async () => {
      try {
        let fetchedPacID = user?.pacID;
        let fetchedShopId = user?.shopId;

        if (fetchedPacID === undefined || fetchedShopId === undefined) {
          console.log(
            `[OrdersPage] Fetching user details for userId: ${user.id}`
          );
          const userResponse = await authAPI.getUserById(user.id);
          console.log(
            "[OrdersPage] getUserById Response:",
            JSON.stringify(userResponse, null, 2)
          );
          fetchedPacID = userResponse.roleID;

          if (fetchedPacID === undefined) {
            throw new Error("Packager ID (roleID) not found.");
          }

          console.log(
            `[OrdersPage] Fetching shopId for pacID: ${fetchedPacID}`
          );
          fetchedShopId = (await authAPI.getShopIdByPacID(fetchedPacID)) ?? undefined;
          if (fetchedShopId === undefined) {
            throw new Error("Shop ID not found for packager.");
          }
        }

        if (isMounted) {
          setPacID(fetchedPacID);
          setShopId(fetchedShopId);
        }

        console.log(
          `[OrdersPage] Fetching orders for shopId: ${fetchedShopId}, pacID: ${fetchedPacID}`
        );
        const shopOrders = await authAPI.getShopOrders(fetchedShopId!);
        console.log(
          "[OrdersPage] getShopOrders Response:",
          JSON.stringify(shopOrders, null, 2)
        );

        // Map OrderForPackager to ApiOrder to maintain snake_case
        const mappedOrders: ApiOrder[] = shopOrders.map((order: OrderForPackager) => ({
          order_ID: order.orderID,
          order_Type: order.orderType,
          order_Date: order.orderDate,
          order_Price: order.orderPrice,
          order_Status: order.orderStatus,
          packaging_Status: order.packagingStatus,
          packagerId: order.packagerId,
          carts: order.carts,
        }));

        const validOrders = mappedOrders.filter((order: ApiOrder) => {
          if (!order || !order.order_ID || order.order_Price == null) {
            console.warn(
              "[OrdersPage] Invalid order skipped:",
              JSON.stringify(order, null, 2)
            );
            return false;
          }
          return true;
        });
        console.log(
          "[OrdersPage] Valid orders:",
          JSON.stringify(validOrders, null, 2)
        );

        // Filter for "Not Started" or orders assigned to this packager
        const filteredOrders = validOrders.filter((order: ApiOrder) => {
          const isValidStatus =
            order.packaging_Status === "Not Started" ||
            order.packagerId === fetchedPacID;
          console.log("[OrdersPage] Filtering order:", {
            orderId: order.order_ID,
            packaging_Status: order.packaging_Status,
            packagerId: order.packagerId,
            fetchedPacID,
            isValidStatus,
          });
          return isValidStatus;
        });
        console.log(
          "[OrdersPage] Filtered orders:",
          JSON.stringify(filteredOrders, null, 2)
        );

        if (isMounted) {
          setOrders(filteredOrders);
          const initialPackStatus = filteredOrders.reduce(
            (acc: { [orderId: number]: { [cartId: number]: boolean } }, order: ApiOrder) => {
              acc[order.order_ID] = order.carts.reduce(
                (cartAcc: { [cartId: number]: boolean }, cart: CartItem) => {
                  cartAcc[cart.cartID] = false; // Initialize all carts as not packaged
                  return cartAcc;
                },
                {}
              );
              return acc;
            },
            {}
          );
          setPackStatus(initialPackStatus);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[OrdersPage] Failed to fetch orders:", {
          message: errorMessage,
          code: (error as any).code,
          status: (error as any).response?.status,
          data: (error as any).response?.data
            ? JSON.stringify((error as any).response.data, null, 2)
            : null,
        });
        if (isMounted) {
          toast.error(
            errorMessage || "Failed to load orders. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, [user, authLoading, router]);

  const handleInitiatePack = async (orderId: number) => {
    if (!pacID || !shopId) {
      toast.error("Packager ID or Shop ID not available.");
      return;
    }
    try {
      console.log(
        `[OrdersPage] Initiating packing for orderId: ${orderId}, pacID: ${pacID}`
      );
      const response = await authAPI.initiatePack(orderId, pacID);
      console.log(
        "[OrdersPage] initiatePack Response:",
        JSON.stringify(response, null, 2)
      );

      if (response.statusCode === 200) {
        setOrders((prev) =>
          prev.map((order) =>
            order.order_ID === orderId
              ? {
                  ...order,
                  packaging_Status: "Packaging Started",
                  packagerId: pacID,
                }
              : order
          )
        );
        toast.success("Packaging started successfully.");
      } else {
        throw new Error(response.message || "Failed to initiate packing.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[OrdersPage] initiatePack error:", {
        message: errorMessage,
        code: (error as any).code,
        status: (error as any).response?.status,
        data: (error as any).response?.data
          ? JSON.stringify((error as any).response.data, null, 2)
          : null,
      });
      toast.error("Failed to start packaging.");
    }
  };

  const handlePackProduct = async (orderId: number, cartId: number) => {
    if (!pacID || !shopId) {
      toast.error("Packager ID or Shop ID not available.");
      return;
    }
    try {
      console.log(
        `[OrdersPage] Packing product for orderId: ${orderId}, cartId: ${cartId}`
      );
      const response = await authAPI.packProduct(orderId, cartId);
      console.log(
        "[OrdersPage] packProduct Response:",
        JSON.stringify(response, null, 2)
      );

      if (response.statusCode === 200) {
        // FIX: Use functional update so we check the NEW state, not the stale closure value
        setPackStatus((prev) => {
          const updatedOrderStatus = {
            ...prev[orderId],
            [cartId]: true,
          };
          const allPackaged = Object.values(updatedOrderStatus).every((status) => status);

          // Update packaging_Status inside the functional update so it uses fresh data
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.order_ID === orderId
                ? {
                    ...order,
                    packaging_Status: allPackaged ? "Product Packaged" : order.packaging_Status,
                  }
                : order
            )
          );

          return {
            ...prev,
            [orderId]: updatedOrderStatus,
          };
        });
        toast.success(`Product with cart ID ${cartId} packaged successfully.`);
      } else {
        throw new Error(response.message || "Failed to pack product.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[OrdersPage] packProduct error:", {
        message: errorMessage,
        code: (error as any).code,
        status: (error as any).response?.status,
        data: (error as any).response?.data
          ? JSON.stringify((error as any).response.data, null, 2)
          : null,
      });
      toast.error(`Failed to pack product with cart ID ${cartId}.`);
    }
  };

  const handlePackagingComplete = async (orderId: number) => {
    if (!pacID || !shopId) {
      toast.error("Packager ID or Shop ID not available.");
      return;
    }
    try {
      // Check if all carts for this order are packaged
      const allPackaged = Object.values(packStatus[orderId] || {}).every((status) => status);
      if (!allPackaged) {
        toast.error("Not all products are packaged yet.");
        return;
      }

      console.log(
        `[OrdersPage] Completing packaging for orderId: ${orderId}, pacID: ${pacID}`
      );
      const response = await authAPI.packagingComplete(orderId, pacID);
      console.log(
        "[OrdersPage] packagingComplete Response:",
        JSON.stringify(response, null, 2)
      );

      // Accept statusCode as number or string, and treat any 200 without the failure message as success
      const isSuccess =
        (Number(response.statusCode) === 200 || response.statusCode === undefined) &&
        response.message !== "Not all products are packaged.";

      if (isSuccess) {
        setOrders((prev) => prev.filter((order) => order.order_ID !== orderId));
        setPackStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[orderId];
          return newStatus;
        });
        if (selectedOrder?.order_ID === orderId) {
          setSelectedOrder(null);
        }
        toast.success(
          `All products for order ${orderId} are packaged and ready to ship.`
        );
      } else {
        toast.error(response.message || "Failed to complete packaging.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[OrdersPage] packagingComplete error:", {
        message: errorMessage,
        rawError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
        code: (error as any).code,
        status: (error as any).response?.status,
        data: (error as any).response?.data
          ? JSON.stringify((error as any).response.data, null, 2)
          : null,
      });
      toast.error(errorMessage || "Failed to complete packaging.");
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Orders</h2>
          <p className="text-gray-600">
            Unable to load shop or packager information. Please try logging in
            again.
          </p>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Orders</h2>
          <p className="text-gray-600">No orders available for this shop.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Packaging Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const allPackaged =
                  Object.keys(packStatus[order.order_ID] || {}).length > 0 &&
                  Object.values(packStatus[order.order_ID] || {}).every((s) => s);

                return (
                  <tr
                    key={order.order_ID}
                    className="hover:bg-gray-100 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_ID}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {order.order_Type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(order.order_Date).toLocaleDateString()}
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
                        {order.order_Status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {order.packaging_Status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Products
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-full p-0">
                          <div className="p-10 bg-white rounded-md shadow-md">
                            <DialogTitle className="text-2xl font-semibold mb-4">
                              Invoice &gt; Order{" "}
                              {selectedOrder?.order_ID || "N/A"}
                            </DialogTitle>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div>
                                <p>
                                  <span className="font-medium">Amount</span>
                                </p>
                                <p className="text-green-600 font-bold text-lg">
                                  {selectedOrder?.order_Price != null
                                    ? `R ${selectedOrder.order_Price.toFixed(2)}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p>
                                  <span className="font-medium">Status</span>
                                </p>
                                <p className="text-green-500 font-semibold">
                                  {selectedOrder?.order_Status || "Processing"}
                                </p>
                              </div>
                              <div>
                                <p>
                                  <span className="font-medium">
                                    Item order no
                                  </span>
                                </p>
                                <p>{selectedOrder?.order_ID || "N/A"}</p>
                              </div>
                              <div>
                                <p>
                                  <span className="font-medium">Store</span>
                                </p>
                                <p>{user?.storeName || "N/A"}</p>
                              </div>
                            </div>

                            <table className="w-full text-left border-t border-b border-gray-200">
                              <thead>
                                <tr className="text-sm font-semibold text-gray-700">
                                  <th className="py-1">Product</th>
                                  <th className="py-2">Weight</th>
                                  <th className="py-2 px-2">Price</th>
                                  <th className="py-2">Quantity</th>
                                  <th className="py-2 px-2">Action</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm">
                                {selectedOrder?.carts.map((cart) => (
                                  <tr key={cart.cartID} className="border-t">
                                    <td className="py-2 flex items-center">
                                      <Image
                                        src={`data:image/jpeg;base64,${cart.product.imageBase64}`}
                                        alt={cart.product.dto.prod_Name}
                                        width={40}
                                        height={40}
                                        className="object-cover mr-2 rounded"
                                        onError={(e) => {
                                          console.error(
                                            "[OrdersPage] Image load error for:",
                                            cart.product.dto.prod_Name
                                          );
                                          (e.target as HTMLImageElement).src =
                                            "/placeholder-image.jpg";
                                        }}
                                        unoptimized
                                      />
                                      <span>{cart.product.dto.prod_Name}</span>
                                    </td>
                                    <td className="py-2">
                                      {cart.product.dto.prod_Weight}
                                    </td>
                                    <td className="py-2">
                                      R {cart.product.dto.price.toFixed(2)}
                                    </td>
                                    <td className="py-2">{cart.quantity}</td>
                                    <td className="py-2">
                                      {packStatus[selectedOrder.order_ID]?.[cart.cartID] ? (
                                        <span className="text-red-500 font-medium">
                                          Packaged
                                        </span>
                                      ) : (
                                        <Button
                                          className="bg-green-600 hover:bg-green-700 text-white"
                                          size="sm"
                                          onClick={() => handlePackProduct(selectedOrder.order_ID, cart.cartID)}
                                          disabled={packStatus[selectedOrder.order_ID]?.[cart.cartID]}
                                        >
                                          Collect
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="font-semibold border-t">
                                  <td className="py-2">Total</td>
                                  <td></td>
                                  <td className="py-2">
                                    {selectedOrder?.order_Price != null
                                      ? `R ${selectedOrder.order_Price.toFixed(2)}`
                                      : "N/A"}
                                  </td>
                                  <td></td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {order.packaging_Status === "Not Started" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleInitiatePack(order.order_ID)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {order.packaging_Status === "Packaging Started" && !allPackaged && (
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                          onClick={() => handlePackProduct(order.order_ID, order.carts[0]?.cartID)}
                        >
                          Pack
                        </Button>
                      )}
                      {/* FIX: Show Complete button when all items are packed, regardless of packaging_Status string */}
                      {(order.packaging_Status === "Product Packaged" || allPackaged) && (
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                          onClick={() => handlePackagingComplete(order.order_ID)}
                        >
                          Complete
                        </Button>
                      )}
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