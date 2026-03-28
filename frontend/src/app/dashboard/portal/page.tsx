'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { ShoppingCart, DollarSign, FileText, CreditCard, ArrowUpRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portal/dashboard')
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-accent-600 to-brand-600 rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold">Welcome, {data?.client?.companyName}</h1>
        <p className="text-white/80 mt-1">Your account overview and recent activity</p>
        <div className="flex items-center gap-4 mt-4">
          <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium capitalize">{data?.client?.pricingTier} Tier</span>
          <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">{data?.client?.paymentTerms}</span>
          <Badge status={data?.client?.status || 'active'} className="!bg-white/20 !text-white !ring-0" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Orders" value={data?.stats?.totalOrders || 0} icon={<ShoppingCart className="w-5 h-5" />} color="blue" />
        <StatCard title="Active Orders" value={data?.stats?.activeOrders || 0} icon={<Clock className="w-5 h-5" />} color="green" />
        <StatCard title="Total Spent" value={formatCurrency(data?.stats?.totalSpent || 0)} icon={<DollarSign className="w-5 h-5" />} color="purple" />
        <StatCard title="Outstanding Balance" value={formatCurrency(data?.stats?.outstandingBalance || 0)} icon={<CreditCard className="w-5 h-5" />} color={data?.stats?.outstandingBalance > 0 ? 'red' : 'teal'} />
      </div>

      {/* Credit info */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <h3 className="text-base font-semibold text-surface-900 mb-4">Credit Status</h3>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm text-surface-500">Credit Limit</p>
            <p className="text-xl font-bold">{formatCurrency(data?.client?.creditLimit || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-surface-500">Current Balance</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(data?.client?.currentBalance || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-surface-500">Available Credit</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency((data?.client?.creditLimit || 0) - (data?.client?.currentBalance || 0))}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-surface-500 mb-1">Utilization</p>
            <div className="w-full bg-surface-100 rounded-full h-3">
              <div className="bg-brand-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(((data?.client?.currentBalance || 0) / Math.max(data?.client?.creditLimit || 1, 1)) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-surface-100">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface-900">Recent Orders</h3>
            <Link href="/dashboard/portal/orders" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">View All <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="divide-y divide-surface-100">
            {data?.recentOrders?.length > 0 ? data.recentOrders.map((order: any) => (
              <div key={order._id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold font-mono text-brand-600">{order.orderNumber}</p>
                  <p className="text-xs text-surface-500">{formatDate(order.orderDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                  <Badge status={order.status} />
                </div>
              </div>
            )) : <div className="px-6 py-8 text-center text-sm text-surface-500">No orders yet</div>}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-surface-100">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface-900">Recent Invoices</h3>
            <Link href="/dashboard/portal/invoices" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">View All <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="divide-y divide-surface-100">
            {data?.recentInvoices?.length > 0 ? data.recentInvoices.map((inv: any) => (
              <div key={inv._id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold font-mono text-brand-600">{inv.invoiceNumber}</p>
                  <p className="text-xs text-surface-500">Due: {formatDate(inv.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(inv.totalAmount)}</p>
                  {inv.balanceDue > 0 && <p className="text-xs text-red-600">Balance: {formatCurrency(inv.balanceDue)}</p>}
                  <Badge status={inv.status} />
                </div>
              </div>
            )) : <div className="px-6 py-8 text-center text-sm text-surface-500">No invoices yet</div>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/portal/catalogue" className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-card-hover transition-all group">
          <FileText className="w-8 h-8 text-brand-500 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-surface-900">Browse Catalogue</h4>
          <p className="text-sm text-surface-500 mt-1">View our full product range</p>
        </Link>
        <Link href="/dashboard/portal/rfq" className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-card-hover transition-all group">
          <ShoppingCart className="w-8 h-8 text-accent-500 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-surface-900">Submit RFQ</h4>
          <p className="text-sm text-surface-500 mt-1">Request a quotation for products</p>
        </Link>
        <Link href="/dashboard/portal/profile" className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-card-hover transition-all group">
          <CreditCard className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-surface-900">Account Details</h4>
          <p className="text-sm text-surface-500 mt-1">View your company profile</p>
        </Link>
      </div>
    </div>
  );
}
