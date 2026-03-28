'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import { ChartCard, RevenueChart, BarChart, DoughnutChart } from '@/components/charts/ChartWrapper';
import { BarChart3, Users, Package, TrendingUp, Download, FileText } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [clientRevenue, setClientRevenue] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [salesPerf, setSalesPerf] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientRes, prodRes, salesRes, trendRes] = await Promise.all([
          api.get('/reports/client-revenue?limit=10'),
          api.get('/reports/product-sales?limit=10'),
          api.get('/reports/sales-performance'),
          api.get('/reports/revenue-trend?period=monthly'),
        ]);
        setClientRevenue(clientRes.data.data);
        setProductSales(prodRes.data.data);
        setSalesPerf(salesRes.data.data);
        setRevenueTrend(trendRes.data.data);
      } catch { } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'clients', label: 'Client Reports', icon: Users },
    { key: 'products', label: 'Product Reports', icon: Package },
    { key: 'sales', label: 'Sales Team', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reports & Analytics</h1>
          <p className="text-sm text-surface-500 mt-1">Business intelligence and performance insights</p>
        </div>
        <div className="flex gap-2">
          <select className="input-field !py-2 !w-auto text-sm">
            <option>This Year (2026)</option>
            <option>Last Year (2025)</option>
          </select>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => {
            const data = activeTab === 'clients' ? clientRevenue : activeTab === 'products' ? productSales : salesPerf;
            const csv = JSON.stringify(data, null, 2);
            const blob = new Blob([csv], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `report-${activeTab}.json`; a.click();
            toast.success('Report exported');
          }}>Export</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Revenue Trend" subtitle="Monthly revenue">
              <RevenueChart data={{
                labels: revenueTrend.map(r => monthNames[r._id - 1] || `M${r._id}`),
                values: revenueTrend.map(r => r.revenue),
              }} />
            </ChartCard>
            <ChartCard title="Top Clients by Revenue">
              <BarChart data={{
                labels: clientRevenue.slice(0, 8).map((c: any) => c.companyName?.slice(0, 15) || 'Unknown'),
                values: clientRevenue.slice(0, 8).map((c: any) => c.totalRevenue),
              }} />
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Top Selling Products">
              <BarChart data={{
                labels: productSales.slice(0, 8).map((p: any) => p.sku || p.name?.slice(0, 15)),
                values: productSales.slice(0, 8).map((p: any) => p.totalRevenue),
              }} />
            </ChartCard>
            <ChartCard title="Sales Team Performance">
              <BarChart data={{
                labels: salesPerf.map((s: any) => s.name || 'Unknown'),
                values: salesPerf.map((s: any) => s.totalRevenue),
              }} />
            </ChartCard>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold">Client Revenue Summary</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Avg Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Segment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Territory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {clientRevenue.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-surface-50/50">
                  <td className="px-6 py-3 font-medium text-sm">{c.companyName}</td>
                  <td className="px-6 py-3 text-sm">{c.totalOrders}</td>
                  <td className="px-6 py-3 text-sm font-semibold">{formatCurrency(c.totalRevenue)}</td>
                  <td className="px-6 py-3 text-sm">{formatCurrency(c.avgOrderValue)}</td>
                  <td className="px-6 py-3 text-sm">{c.segment || '—'}</td>
                  <td className="px-6 py-3 text-sm">{c.territory || '—'}</td>
                </tr>
              ))}
              {clientRevenue.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-surface-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold">Product Sales Summary</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Qty Sold</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {productSales.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-surface-50/50">
                  <td className="px-6 py-3 font-medium text-sm">{p.name}</td>
                  <td className="px-6 py-3 text-sm font-mono">{p.sku}</td>
                  <td className="px-6 py-3 text-sm">{p.totalQtySold}</td>
                  <td className="px-6 py-3 text-sm font-semibold">{formatCurrency(p.totalRevenue)}</td>
                  <td className="px-6 py-3 text-sm">{p.orderCount}</td>
                </tr>
              ))}
              {productSales.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-surface-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold">Sales Team Performance</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Sales Rep</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Avg Deal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Quotes Sent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {salesPerf.map((s: any, i: number) => (
                <tr key={i} className="hover:bg-surface-50/50">
                  <td className="px-6 py-3 font-medium text-sm">{s.name}</td>
                  <td className="px-6 py-3 text-sm">{s.totalOrders}</td>
                  <td className="px-6 py-3 text-sm font-semibold">{formatCurrency(s.totalRevenue)}</td>
                  <td className="px-6 py-3 text-sm">{formatCurrency(s.avgDealSize)}</td>
                  <td className="px-6 py-3 text-sm">{s.quotationsSent || 0}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-brand-600">{s.conversionRate || 0}%</td>
                </tr>
              ))}
              {salesPerf.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-surface-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
