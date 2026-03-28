'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Eye, Edit2, Download } from 'lucide-react';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  // Create order form
  const [createForm, setCreateForm] = useState({
    client: '', productId: '', quantity: '1', notes: '',
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/orders?page=${page}&limit=25&search=${search}${statusFilter ? `&status=${statusFilter}` : ''}`);
      setOrders(data.data);
      setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const loadFormData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/clients?limit=100'),
        api.get('/products?limit=100&status=active'),
      ]);
      setClients(cRes.data.data);
      setProducts(pRes.data.data);
    } catch { }
  };

  const handleCreateOrder = async () => {
    try {
      const product = products.find((p: any) => p._id === createForm.productId);
      if (!product) return toast.error('Select a product');
      const qty = parseInt(createForm.quantity) || 1;
      const price = product.prices?.[0]?.basePrice || 0;

      await api.post('/orders/orders', {
        client: createForm.client,
        lines: [{ product: product._id, sku: product.sku, name: product.name, quantity: qty, unitPrice: price, discount: 0, lineTotal: qty * price }],
        currency: 'QAR',
        taxRate: 5,
        status: 'rfq_received',
        clientNotes: createForm.notes,
      });
      toast.success('Order created successfully');
      setShowCreateModal(false);
      setCreateForm({ client: '', productId: '', quantity: '1', notes: '' });
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating order');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      await api.put(`/orders/orders/${selectedOrder._id}/status`, { status: newStatus, reason: statusReason });
      toast.success('Order status updated');
      setShowStatusModal(false);
      setNewStatus('');
      setStatusReason('');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const viewOrder = async (order: any) => {
    try {
      const { data } = await api.get(`/orders/orders/${order._id}`);
      setSelectedOrder(data.data);
      setShowDetailModal(true);
    } catch {
      toast.error('Failed to load order details');
    }
  };

  const openStatusModal = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setNewStatus('');
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleExport = () => {
    const csv = [
      ['Order #', 'Client', 'Date', 'Total', 'Status', 'Payment'].join(','),
      ...orders.map((o: any) => [o.orderNumber, o.client?.companyName, formatDate(o.orderDate), o.totalAmount, o.status, o.paymentStatus].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
    toast.success('Orders exported');
  };

  const allStatuses = ['rfq_received', 'quotation_prepared', 'quotation_sent', 'negotiation', 'po_received', 'order_confirmed', 'picking_packing', 'dispatched', 'delivered', 'invoiced', 'payment_received', 'closed', 'cancelled'];

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (item: any) => <span className="font-mono font-semibold text-brand-600">{item.orderNumber}</span> },
    { key: 'client', label: 'Client', render: (item: any) => <span className="font-medium">{item.client?.companyName || '—'}</span> },
    { key: 'orderDate', label: 'Date', render: (item: any) => <span>{formatDate(item.orderDate)}</span> },
    { key: 'items', label: 'Items', render: (item: any) => <span>{item.lines?.length || 0}</span> },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span className="font-semibold">{formatCurrency(item.totalAmount)}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <Badge status={item.status} label={ORDER_STATUS_LABELS[item.status]} /> },
    { key: 'paymentStatus', label: 'Payment', render: (item: any) => <Badge status={item.paymentStatus || 'pending'} /> },
    { key: 'actions', label: 'Actions', render: (item: any) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); viewOrder(item); }} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors" title="View">
          <Eye className="w-4 h-4 text-surface-500" />
        </button>
        <button onClick={(e) => openStatusModal(item, e)} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors" title="Update Status">
          <Edit2 className="w-4 h-4 text-surface-500" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Orders</h1>
          <p className="text-sm text-surface-500 mt-1">Manage the full order lifecycle from RFQ to delivery</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: '', label: 'All' }, { key: 'rfq_received', label: 'RFQ' },
          { key: 'order_confirmed', label: 'Confirmed' }, { key: 'picking_packing', label: 'Processing' },
          { key: 'dispatched', label: 'Dispatched' }, { key: 'delivered', label: 'Delivered' },
          { key: 'invoiced', label: 'Invoiced' }, { key: 'closed', label: 'Closed' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => { setStatusFilter(key); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === key ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={orders} total={total} page={page} onPageChange={setPage} onSearch={setSearch} loading={loading}
        onRowClick={viewOrder}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { loadFormData(); setShowCreateModal(true); }}>New Order</Button>
          </div>
        }
      />

      {/* Create Order Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Order" size="lg">
        <div className="space-y-4">
          <Select label="Client" required options={clients.map((c: any) => ({ value: c._id, label: c.companyName }))} value={createForm.client} onChange={(e) => setCreateForm({ ...createForm, client: e.target.value })} placeholder="Select client" />
          <Select label="Product" required options={products.map((p: any) => ({ value: p._id, label: `${p.sku} - ${p.name} (${formatCurrency(p.prices?.[0]?.basePrice || 0)})` }))} value={createForm.productId} onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })} placeholder="Select product" />
          <Input label="Quantity" type="number" min="1" value={createForm.quantity} onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })} />
          <Input label="Notes" value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} placeholder="Optional notes" />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button onClick={handleCreateOrder}>Create Order</Button>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Order ${selectedOrder?.orderNumber || ''}`} size="xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-surface-500">Client</p><p className="font-semibold">{selectedOrder.client?.companyName}</p></div>
              <div><p className="text-xs text-surface-500">Status</p><Badge status={selectedOrder.status} label={ORDER_STATUS_LABELS[selectedOrder.status]} /></div>
              <div><p className="text-xs text-surface-500">Payment</p><Badge status={selectedOrder.paymentStatus || 'pending'} /></div>
              <div><p className="text-xs text-surface-500">Order Date</p><p>{formatDate(selectedOrder.orderDate)}</p></div>
              <div><p className="text-xs text-surface-500">PO Number</p><p className="font-mono">{selectedOrder.purchaseOrderNumber || '—'}</p></div>
              <div><p className="text-xs text-surface-500">Total</p><p className="text-lg font-bold text-brand-600">{formatCurrency(selectedOrder.totalAmount)}</p></div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Line Items</h4>
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-50"><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-left">SKU</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
                <tbody>
                  {selectedOrder.lines?.map((line: any, i: number) => (
                    <tr key={i} className="border-t border-surface-100">
                      <td className="px-3 py-2">{line.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{line.sku}</td>
                      <td className="px-3 py-2 text-right">{line.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(line.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatCurrency(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-surface-200 mt-2 pt-2 text-right space-y-1">
                <p className="text-sm">Subtotal: <span className="font-semibold">{formatCurrency(selectedOrder.subtotal)}</span></p>
                <p className="text-sm">Tax ({selectedOrder.taxRate}%): <span className="font-semibold">{formatCurrency(selectedOrder.taxAmount)}</span></p>
                <p className="text-base font-bold">Total: {formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title={`Update Status - ${selectedOrder?.orderNumber || ''}`}>
        <div className="space-y-4">
          <div><p className="text-sm text-surface-500 mb-1">Current Status</p><Badge status={selectedOrder?.status || ''} label={ORDER_STATUS_LABELS[selectedOrder?.status] || ''} /></div>
          <Select label="New Status" required options={allStatuses.map(s => ({ value: s, label: ORDER_STATUS_LABELS[s] || s }))} value={newStatus} onChange={(e) => setNewStatus(e.target.value)} placeholder="Select new status" />
          <Input label="Reason" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} placeholder="Reason for status change" />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate}>Update Status</Button>
        </div>
      </Modal>
    </div>
  );
}
