'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { ChartCard, RevenueChart, DoughnutChart, BarChart } from '@/components/charts/ChartWrapper';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Package,
  FileText, Clock, AlertTriangle, ArrowUpRight, MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface KPIs {
  revenueToday: number;
  revenueMTD: number;
  revenueYTD: number;
  totalClients: number;
  activeOrders: number;
  pipelineValue: number;
  pendingInvoices: number;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, ordersRes, trendRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/orders/orders?limit=8&sort=-createdAt'),
          api.get('/reports/revenue-trend?period=monthly'),
        ]);
        setKpis(kpiRes.data.data);
        setRecentOrders(ordersRes.data.data || []);
        setRevenueTrend(trendRes.data.data || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-sm text-surface-500 mt-1">Welcome back. Here&apos;s your business overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input-field !py-2 !w-auto text-sm">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Revenue (YTD)"
          value={formatCurrency(kpis?.revenueYTD || 0)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12.5, label: 'vs last year' }}
          color="blue"
        />
        <StatCard
          title="Active Orders"
          value={formatNumber(kpis?.activeOrders || 0)}
          icon={<ShoppingCart className="w-5 h-5" />}
          trend={{ value: 8, label: 'vs last month' }}
          color="green"
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(kpis?.pipelineValue || 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 23, label: 'growth' }}
          color="purple"
        />
        <StatCard
          title="Active Clients"
          value={formatNumber(kpis?.totalClients || 0)}
          icon={<Users className="w-5 h-5" />}
          color="teal"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Trend" subtitle="Monthly revenue overview">
            <RevenueChart data={{
              labels: revenueTrend.map(r => monthNames[r._id - 1] || `M${r._id}`),
              values: revenueTrend.map(r => r.revenue),
            }} />
          </ChartCard>
        </div>
        <ChartCard title="Revenue by Segment">
          <DoughnutChart data={{
            labels: ['Oil & Gas', 'Petrochemical', 'Marine', 'EPC', 'Other'],
            values: [42, 25, 15, 12, 6],
          }} />
        </ChartCard>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-100">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-surface-900">Recent Orders</h3>
              <p className="text-sm text-surface-500 mt-0.5">Latest orders across all clients</p>
            </div>
            <Link href="/dashboard/orders" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-surface-100">
            {recentOrders.length > 0 ? recentOrders.slice(0, 6).map((order: any) => (
              <div key={order._id} className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">{order.orderNumber}</p>
                    <p className="text-xs text-surface-500">{order.client?.companyName || 'Unknown Client'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-surface-900">{formatCurrency(order.totalAmount)}</p>
                  <Badge status={order.status} />
                </div>
              </div>
            )) : (
              <div className="px-6 py-12 text-center text-sm text-surface-500">No recent orders</div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="text-base font-semibold text-surface-900 mb-4">Outstanding Invoices</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{formatCurrency(kpis?.pendingInvoices || 0)}</p>
                <p className="text-xs text-surface-500">Pending collection</p>
              </div>
            </div>
            <Link href="/dashboard/invoices" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View Details <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h3 className="text-base font-semibold text-surface-900 mb-4">Revenue Today</h3>
            <p className="text-2xl font-bold text-surface-900">{formatCurrency(kpis?.revenueToday || 0)}</p>
            <p className="text-xs text-surface-500 mt-1">MTD: {formatCurrency(kpis?.revenueMTD || 0)}</p>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white">
            <h3 className="text-base font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/dashboard/orders" className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors">
                <ShoppingCart className="w-4 h-4" /> New Order
              </Link>
              <Link href="/dashboard/quotations" className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors">
                <FileText className="w-4 h-4" /> Create Quotation
              </Link>
              <Link href="/dashboard/customers" className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors">
                <Users className="w-4 h-4" /> Add Client
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
