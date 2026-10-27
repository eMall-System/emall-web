'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  BranchShop,
  ReportRange,
  SalesSummary,
  RevenueTrend,
  TopProduct,
  BestSeller,
  InventorySummary,
  StockDistribution,
  StockHistory,
  CustomerSummary,
  CustomerAcquisition,
  TopCustomer,
  OrderSummary,
  OrderStatusBreakdown,
  FulfillmentTime,
  FinancialSummary,
  RevenueExpense,
  PaymentMethodBreakdown,
} from '@/lib/authTypes';

type Category = 'sales' | 'inventory' | 'customers' | 'orders' | 'financial';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'sales', label: 'Sales' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'customers', label: 'Customers' },
  { id: 'orders', label: 'Orders' },
  { id: 'financial', label: 'Financial' },
];

const RANGES: { id: ReportRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'thisMonth', label: 'This Month' },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function ReportsSection() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<BranchShop[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('sales');
  const [range, setRange] = useState<ReportRange>('thisMonth');

  // Sales
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [topProductsByRevenue, setTopProductsByRevenue] = useState<TopProduct[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);

  // Inventory
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [stockDistribution, setStockDistribution] = useState<StockDistribution | null>(null);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);

  // Customers
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary | null>(null);
  const [customerAcquisition, setCustomerAcquisition] = useState<CustomerAcquisition[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  // Orders
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState<OrderStatusBreakdown | null>(null);
  const [fulfillmentTime, setFulfillmentTime] = useState<FulfillmentTime[]>([]);

  // Financial
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [revenueVsExpenses, setRevenueVsExpenses] = useState<RevenueExpense[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodBreakdown[]>([]);

  useEffect(() => {
    if (loading) return;

    if (!user || !user.id) {
      toast.error('Please log in to access reports.');
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
        console.error('[ReportsSection] Failed to fetch branches:', error);
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

    const load = async () => {
      switch (activeCategory) {
        case 'sales': {
          const [summary, trend, topRevenue, sellers] = await Promise.all([
            authAPI.getSalesSummary(shopId, range),
            authAPI.getRevenueTrend(shopId, range),
            authAPI.getTopProductsByRevenue(shopId, range),
            authAPI.getBestSellers(shopId, range),
          ]);
          setSalesSummary(summary);
          setRevenueTrend(trend);
          setTopProductsByRevenue(topRevenue);
          setBestSellers(sellers);
          break;
        }
        case 'inventory': {
          const [summary, distribution, history] = await Promise.all([
            authAPI.getInventorySummary(shopId),
            authAPI.getStockDistribution(shopId),
            authAPI.getStockHistory(shopId),
          ]);
          setInventorySummary(summary);
          setStockDistribution(distribution);
          setStockHistory(history);
          break;
        }
        case 'customers': {
          const [summary, acquisition, top] = await Promise.all([
            authAPI.getCustomerSummary(shopId),
            authAPI.getCustomerAcquisitionTrend(shopId),
            authAPI.getTopCustomers(shopId),
          ]);
          setCustomerSummary(summary);
          setCustomerAcquisition(acquisition);
          setTopCustomers(top);
          break;
        }
        case 'orders': {
          const [summary, breakdown, fulfillment] = await Promise.all([
            authAPI.getOrderSummary(shopId),
            authAPI.getOrderStatusBreakdown(shopId),
            authAPI.getFulfillmentTime(shopId),
          ]);
          setOrderSummary(summary);
          setOrderStatusBreakdown(breakdown);
          setFulfillmentTime(fulfillment);
          break;
        }
        case 'financial': {
          const [summary, revExp, methods] = await Promise.all([
            authAPI.getFinancialSummary(shopId),
            authAPI.getRevenueVsExpenses(shopId),
            authAPI.getPaymentMethodBreakdown(shopId),
          ]);
          setFinancialSummary(summary);
          setRevenueVsExpenses(revExp);
          setPaymentMethods(methods);
          break;
        }
      }
    };

    load()
      .catch((error: any) => {
        console.error('[ReportsSection] Failed to fetch report data:', error);
        toast.error(error.message || 'Failed to load report data.');
      })
      .finally(() => setIsLoadingData(false));
  }, [selectedBranchId, activeCategory, range]);

  if (loading || isLoadingBranches) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <BarChart3 className="h-12 w-12 text-green-600" />
          <p className="text-gray-500 mt-2">Loading reports...</p>
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
        <BarChart3 className="h-12 w-12 text-gray-300 mb-3 mx-auto" />
        <p className="text-gray-600 mb-1">No approved branches yet.</p>
        <p className="text-gray-500 text-sm">
          Reports are tracked per branch - add a branch under the Branches tab and come back once it's
          approved.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-green-600">Reports</h1>
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              size="sm"
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? 'bg-green-600 hover:bg-green-700' : 'border-gray-300'}
            >
              {cat.label}
            </Button>
          ))}
        </div>
        {activeCategory === 'sales' && (
          <Select value={range} onValueChange={(v) => setRange(v as ReportRange)}>
            <SelectTrigger className="w-40 border-gray-300 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoadingData ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg shadow-sm">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {activeCategory === 'sales' && salesSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Revenue" value={`R${salesSummary.totalRevenue.toFixed(2)}`} />
                <StatCard label="Orders Completed" value={String(salesSummary.ordersCompleted)} />
                <StatCard label="Avg Order Value" value={`R${salesSummary.averageOrderValue.toFixed(2)}`} />
                <StatCard label="Top Product" value={salesSummary.topProduct || 'N/A'} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (vs last year)</h3>
                    {revenueTrend.length === 0 ? (
                      <p className="text-sm text-gray-500">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {revenueTrend.map((r) => (
                          <div key={r.month} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 w-12">{r.month}</span>
                            <span className="text-gray-900 font-medium">R{r.thisYear.toFixed(2)}</span>
                            <span className="text-gray-400">R{r.lastYear.toFixed(2)} last yr</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Products by Revenue</h3>
                    {topProductsByRevenue.length === 0 ? (
                      <p className="text-sm text-gray-500">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {topProductsByRevenue.map((p, idx) => (
                          <div key={`${p.productName}-${idx}`} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 truncate pr-2">{p.productName}</span>
                            <span className="text-gray-500 shrink-0">R{p.revenue.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Best Sellers</h3>
                  {bestSellers.length === 0 ? (
                    <p className="text-sm text-gray-500">No data yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Growth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bestSellers.map((b) => (
                          <TableRow key={b.rank}>
                            <TableCell className="text-gray-500">{b.rank}</TableCell>
                            <TableCell>{b.productName}</TableCell>
                            <TableCell>{b.units}</TableCell>
                            <TableCell>R{b.revenue.toFixed(2)}</TableCell>
                            <TableCell className={b.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {b.growth >= 0 ? '+' : ''}
                              {b.growth.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeCategory === 'inventory' && inventorySummary && stockDistribution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Products" value={String(inventorySummary.totalProducts)} />
                <StatCard label="Low Stock Items" value={String(inventorySummary.lowStockItems)} />
                <StatCard label="Stock Turnover" value={inventorySummary.stockTurnover.toFixed(2)} />
                <StatCard label="Total Stock Value" value={`R${inventorySummary.totalStockValue.toFixed(2)}`} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock Distribution</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">In Stock</span><span className="font-medium text-green-700">{stockDistribution.inStock}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Low Stock</span><span className="font-medium text-amber-700">{stockDistribution.lowStock}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Out of Stock</span><span className="font-medium text-red-700">{stockDistribution.outOfStock}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Overstocked</span><span className="font-medium text-blue-700">{stockDistribution.overstocked}</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Stock History</h3>
                    {stockHistory.length === 0 ? (
                      <p className="text-sm text-gray-500">No history yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {stockHistory.map((h) => (
                          <div key={h.week} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{h.week}</span>
                            <span className="text-gray-900 font-medium">{h.stockLevel} units</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeCategory === 'customers' && customerSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Customers" value={String(customerSummary.totalCustomers)} />
                <StatCard label="New Customers" value={String(customerSummary.newCustomers)} />
                <StatCard label="Returning Rate" value={`${customerSummary.returningRate.toFixed(1)}%`} />
                <StatCard label="Top Customer" value={customerSummary.topCustomer || 'N/A'} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Customer Acquisition</h3>
                    {customerAcquisition.length === 0 ? (
                      <p className="text-sm text-gray-500">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {customerAcquisition.map((c) => (
                          <div key={c.month} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 w-12">{c.month}</span>
                            <span className="text-green-700">{c.newCustomers} new</span>
                            <span className="text-gray-500">{c.returningCustomers} returning</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Customers</h3>
                    {topCustomers.length === 0 ? (
                      <p className="text-sm text-gray-500">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {topCustomers.map((c, idx) => (
                          <div key={`${c.customerName}-${idx}`} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{c.customerName}</span>
                            <span className="text-gray-500">{c.orders} orders &middot; R{c.totalSpent.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeCategory === 'orders' && orderSummary && orderStatusBreakdown && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total Orders" value={String(orderSummary.totalOrders)} />
                <StatCard label="Avg Fulfillment Time" value={`${orderSummary.avgFulfillmentTime.toFixed(1)}h`} />
                <StatCard label="Cancellation Rate" value={`${orderSummary.cancellationRate.toFixed(1)}%`} />
                <StatCard label="Return Rate" value={`${orderSummary.returnRate.toFixed(1)}%`} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Status Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Completed</span><span className="font-medium text-green-700">{orderStatusBreakdown.completed}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Pending</span><span className="font-medium text-amber-700">{orderStatusBreakdown.pending}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Cancelled</span><span className="font-medium text-red-700">{orderStatusBreakdown.cancelled}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">In Transit</span><span className="font-medium text-blue-700">{orderStatusBreakdown.inTransit}</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Fulfillment Time</h3>
                    {fulfillmentTime.length === 0 ? (
                      <p className="text-sm text-gray-500">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {fulfillmentTime.map((f) => (
                          <div key={f.day} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{f.day}</span>
                            <span className="text-gray-900 font-medium">{f.avgTime.toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeCategory === 'financial' && financialSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Net Revenue" value={`R${financialSummary.netRevenue.toFixed(2)}`} />
                <StatCard label="Total Expenses" value={`R${financialSummary.totalExpenses.toFixed(2)}`} />
                <StatCard label="Profit Margin" value={`${financialSummary.profitMargin.toFixed(1)}%`} />
                <StatCard label="Total Refunds" value={`R${financialSummary.totalRefunds.toFixed(2)}`} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue vs Expenses</h3>
                    {revenueVsExpenses.length === 0 ? (
                      <p className="text-sm text-gray-500">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {revenueVsExpenses.map((r) => (
                          <div key={r.month} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 w-12">{r.month}</span>
                            <span className="text-green-700">R{r.revenue.toFixed(2)}</span>
                            <span className="text-red-600">R{r.expenses.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Methods</h3>
                    {paymentMethods.length === 0 ? (
                      <p className="text-sm text-gray-500">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {paymentMethods.map((m) => (
                          <div key={m.method} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{m.method}</span>
                            <span className="text-gray-500">{m.transactions} transactions</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
