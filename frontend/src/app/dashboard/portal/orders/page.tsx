'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from '@/lib/utils';
import { Eye } from 'lucide-react';

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/portal/orders?page=${page}&limit=25&search=${search}`);
      setOrders(data.data); setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrder = async (order: any) => {
    try {
      const { data } = await api.get(`/portal/orders/${order._id}`);
      setSelectedOrder(data.data); setShowDetail(true);
    } catch { }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (item: any) => <span className="font-mono font-semibold text-brand-600">{item.orderNumber}</span> },
    { key: 'orderDate', label: 'Date', render: (item: any) => formatDate(item.orderDate) },
    { key: 'items', label: 'Items', render: (item: any) => <span>{item.lines?.length || 0}</span> },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span className="font-semibold">{formatCurrency(item.totalAmount)}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <Badge status={item.status} label={ORDER_STATUS_LABELS[item.status]} /> },
    { key: 'paymentStatus', label: 'Payment', render: (item: any) => <Badge status={item.paymentStatus || 'pending'} /> },
    { key: 'delivery', label: 'Expected Delivery', render: (item: any) => item.expectedDeliveryDate ? formatDate(item.expectedDeliveryDate) : '—' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Orders</h1>
        <p className="text-sm text-surface-500 mt-1">Track all your orders and their status</p>
      </div>

      <DataTable columns={columns} data={orders} total={total} page={page} onPageChange={setPage} onSearch={setSearch} loading={loading} onRowClick={viewOrder} />

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={`Order ${selectedOrder?.orderNumber || ''}`} size="xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-surface-500">Status</p><Badge status={selectedOrder.status} label={ORDER_STATUS_LABELS[selectedOrder.status]} /></div>
              <div><p className="text-xs text-surface-500">Payment</p><Badge status={selectedOrder.paymentStatus || 'pending'} /></div>
              <div><p className="text-xs text-surface-500">Total</p><p className="text-lg font-bold text-brand-600">{formatCurrency(selectedOrder.totalAmount)}</p></div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Items</h4>
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-50"><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
                <tbody>{selectedOrder.lines?.map((line: any, i: number) => (
                  <tr key={i} className="border-t border-surface-100">
                    <td className="px-3 py-2">{line.name} <span className="text-xs text-surface-400 font-mono">({line.sku})</span></td>
                    <td className="px-3 py-2 text-right">{line.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(line.lineTotal)}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="border-t border-surface-200 mt-2 pt-2 text-right">
                <p className="text-sm">Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                <p className="text-sm">VAT ({selectedOrder.taxRate}%): {formatCurrency(selectedOrder.taxAmount)}</p>
                <p className="text-base font-bold mt-1">Total: {formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
