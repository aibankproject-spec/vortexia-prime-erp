'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Download, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ order: '', daysUntilDue: '30' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'bank_transfer', reference: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/invoices?page=${page}&limit=25`);
      setInvoices(data.data);
      setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateInvoice = async () => {
    try {
      const order = orders.find((o: any) => o._id === createForm.order);
      if (!order) return toast.error('Select an order');
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (parseInt(createForm.daysUntilDue) || 30));

      await api.post('/orders/invoices', {
        order: order._id,
        client: order.client?._id || order.client,
        lines: order.lines.map((l: any) => ({ product: l.product, description: l.name, quantity: l.quantity, unitPrice: l.unitPrice, discount: l.discount || 0, lineTotal: l.lineTotal })),
        currency: 'QAR',
        taxRate: 5,
        dueDate,
        companyDetails: { name: 'Vortexia Prime Trading', crNumber: 'CR-VPT-2006', vatNumber: 'VAT-VPT-001', address: 'West Bay, Doha, Qatar', phone: '+974-4444-0000', email: 'accounts@vortexia.com' },
      });
      toast.success('Invoice created');
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    try {
      await api.post(`/orders/invoices/${selectedInvoice._id}/payment`, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
      });
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', method: 'bank_transfer', reference: '' });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openPaymentModal = (inv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(inv);
    setPaymentForm({ amount: String(inv.balanceDue), method: 'bank_transfer', reference: '' });
    setShowPaymentModal(true);
  };

  const handleExport = () => {
    const csv = [['Invoice #', 'Client', 'Total', 'Paid', 'Balance', 'Due Date', 'Status'].join(','),
      ...invoices.map((i: any) => [i.invoiceNumber, i.client?.companyName, i.totalAmount, i.paidAmount, i.balanceDue, formatDate(i.dueDate), i.status].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'invoices.csv'; a.click();
    toast.success('Exported');
  };

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', render: (item: any) => <span className="font-mono font-semibold text-brand-600">{item.invoiceNumber}</span> },
    { key: 'client', label: 'Client', render: (item: any) => <span className="font-medium">{item.client?.companyName || '—'}</span> },
    { key: 'order', label: 'Order #', render: (item: any) => <span className="font-mono text-xs">{item.order?.orderNumber || '—'}</span> },
    { key: 'issueDate', label: 'Issue Date', render: (item: any) => formatDate(item.issueDate) },
    { key: 'dueDate', label: 'Due Date', render: (item: any) => formatDate(item.dueDate) },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span className="font-semibold">{formatCurrency(item.totalAmount)}</span> },
    { key: 'paidAmount', label: 'Paid', render: (item: any) => <span className="text-emerald-600">{formatCurrency(item.paidAmount)}</span> },
    { key: 'balanceDue', label: 'Balance', render: (item: any) => <span className={item.balanceDue > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{formatCurrency(item.balanceDue)}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <Badge status={item.status} /> },
    { key: 'actions', label: '', render: (item: any) => item.balanceDue > 0 ? (
      <button onClick={(e) => openPaymentModal(item, e)} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium flex items-center gap-1"><CreditCard className="w-3 h-3" />Pay</button>
    ) : null },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Invoices</h1>
          <p className="text-sm text-surface-500 mt-1">Track invoices and payments</p>
        </div>
      </div>

      <DataTable columns={columns} data={invoices} total={total} page={page} onPageChange={setPage} loading={loading} title="All Invoices"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={async () => { const { data } = await api.get('/orders/orders?limit=100&status=delivered'); setOrders(data.data); setShowCreateModal(true); }}>New Invoice</Button>
          </div>
        }
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Invoice from Order">
        <div className="space-y-4">
          <Select label="Order" required options={orders.map((o: any) => ({ value: o._id, label: `${o.orderNumber} - ${o.client?.companyName || 'Client'} (${formatCurrency(o.totalAmount)})` }))} value={createForm.order} onChange={(e) => setCreateForm({ ...createForm, order: e.target.value })} placeholder="Select delivered order" />
          <Input label="Payment Due (days)" type="number" value={createForm.daysUntilDue} onChange={(e) => setCreateForm({ ...createForm, daysUntilDue: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button onClick={handleCreateInvoice}>Create Invoice</Button>
        </div>
      </Modal>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={`Record Payment - ${selectedInvoice?.invoiceNumber || ''}`}>
        <div className="space-y-4">
          <div className="bg-surface-50 rounded-xl p-4"><p className="text-sm text-surface-500">Balance Due</p><p className="text-2xl font-bold text-red-600">{formatCurrency(selectedInvoice?.balanceDue || 0)}</p></div>
          <Input label="Payment Amount" type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          <Select label="Payment Method" options={[{ value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'cheque', label: 'Cheque' }, { value: 'cash', label: 'Cash' }, { value: 'lc', label: 'Letter of Credit' }, { value: 'online', label: 'Online' }]} value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} />
          <Input label="Reference #" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Payment reference number" />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
          <Button onClick={handleRecordPayment}>Record Payment</Button>
        </div>
      </Modal>
    </div>
  );
}
