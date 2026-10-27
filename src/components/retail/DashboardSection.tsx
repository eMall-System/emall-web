'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BranchShop, DashboardSummary, SalesTrend, TopProduct, RecentOrder, DashboardAlerts } from '@/lib/authTypes';

function statusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

export default function DashboardSection() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<BranchShop[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [weeklySales, setWeeklySales] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user || !user.id) {
      toast.error('Please log in to access the dashboard.');
      router.push('/login');
      return;
    }

    const fetchBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const data = await authAPI.getBranchesByRShopID(user.id);
        const approved = data.filter((b) => b.regStatus === 'Approved');
        setBranches(approved);
        if (approved.length > 0) {
          setSelectedBranchId(String(approved[0].id));
        }
      } catch (error: any) {
        console.error('[DashboardSection] Failed to fetch branches:', error);
        toast.error(error.message || 'Failed to load branches.');
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [user, loading, router]);

  useEffect(() => {
    if (!selectedBranchId) return;

    const shopId = Number(selectedBranchId);
    setIsLoadingData(true);

    Promise.all([
      authAPI.getDashboardSummary(shopId),
      authAPI.getWeeklySales(shopId),
      authAPI.getDashboardTopProducts(shopId),
      authAPI.getRecentOrders(shopId),
      authAPI.getDashboardAlerts(shopId),
    ])
      .then(([summaryData, weeklyData, topProductsData, recentOrdersData, alertsData]) => {
        setSummary(summaryData);
        setWeeklySales(weeklyData);
        setTopProducts(topProductsData);
        setRecentOrders(recentOrdersData);
        setAlerts(alertsData);
      })
      .catch((error: any) => {
        console.error('[DashboardSection] Failed to fetch dashboard data:', error);
        toast.error(error.message || 'Failed to load dashboard data.');
      })
      .finally(() => setIsLoadingData(false));
  }, [selectedBranchId]);

  if (loading || isLoadingBranches) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <LayoutDashboard className="h-12 w-12 text-green-600" />
          <p className="text-gray-500 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.id) {
    return null;
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg shadow-sm px-4">
        <LayoutDashboard className="h-12 w-12 text-gray-300 mb-3 mx-auto" />
        <p className="text-gray-600 mb-1">No approved branches yet.</p>
        <p className="text-gray-500 text-sm">
          Dashboard data is tracked per branch - add a branch under the Branches tab and come back once
          it's approved.
        </p>
      </div>
    );
  }

  const maxWeeklyRevenue = Math.max(...weeklySales.map((d) => d.revenue), 1);
  const alertItems = alerts
    ? [
        ...alerts.lowStock.map((a) => ({ ...a, group: 'Low Stock' })),
        ...alerts.pendingReturns.map((a) => ({ ...a, group: 'Pending Returns' })),
        ...alerts.paymentFailed.map((a) => ({ ...a, group: 'Payment Failed' })),
      ]
    : [];

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-green-600">Dashboard</h1>
        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
          <SelectTrigger className="w-64 border-gray-300 bg-white">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                {branch.shopName} - {branch.mallName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoadingData || !summary ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg shadow-sm">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading branch data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <DollarSign className="h-5 w-5 text-green-600 mb-2" />
                <p className="text-xs text-gray-500">Today's Revenue</p>
                <p className="text-lg font-bold text-gray-900">R{summary.todayRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <ShoppingCart className="h-5 w-5 text-green-600 mb-2" />
                <p className="text-xs text-gray-500">Today's Orders</p>
                <p className="text-lg font-bold text-gray-900">{summary.todayOrders}</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <Package className="h-5 w-5 text-green-600 mb-2" />
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-lg font-bold text-gray-900">{summary.totalProducts}</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 mb-2" />
                <p className="text-xs text-gray-500">Low Stock</p>
                <p className="text-lg font-bold text-gray-900">{summary.lowStockCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <Clock className="h-5 w-5 text-amber-600 mb-2" />
                <p className="text-xs text-gray-500">Pending Orders</p>
                <p className="text-lg font-bold text-gray-900">{summary.pendingOrders}</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                <p className="text-xs text-gray-500">Completed Orders</p>
                <p className="text-lg font-bold text-gray-900">{summary.completedOrders}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly Sales */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">This Week's Sales</h3>
                {weeklySales.length === 0 ? (
                  <p className="text-sm text-gray-500">No sales recorded this week.</p>
                ) : (
                  <div className="space-y-2">
                    {weeklySales.map((d) => (
                      <div key={d.day} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-10">{d.day}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full"
                            style={{ width: `${(d.revenue / maxWeeklyRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-700 w-20 text-right">R{d.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Products</h3>
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">No product sales yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((p, idx) => (
                      <div key={`${p.productName}-${idx}`} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate pr-2">{p.productName}</span>
                        <span className="text-gray-500 shrink-0">
                          {p.totalSold} sold &middot; R{p.revenue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Orders</h3>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500">No recent orders.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((o) => (
                      <TableRow key={o.orderId}>
                        <TableCell className="text-gray-500">#{o.orderId}</TableCell>
                        <TableCell>{o.customerName}</TableCell>
                        <TableCell>R{o.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusBadgeClass(o.status)}>
                            {o.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          {alertItems.length > 0 && (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Alerts</h3>
                <div className="space-y-2">
                  {alertItems.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-gray-500">{a.group}:</span>
                      <span className="text-gray-700">{a.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
