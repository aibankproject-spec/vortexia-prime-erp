'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, ArrowRightLeft, CheckCircle, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ client: '', productId: '', quantity: '1', validityDays: '30', paymentTerms: 'Net 30', discount: '0' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/quotations?page=${page}&limit=25`);
      setQuotations(data.data);
      setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadFormData = async () => {
    const [cRes, pRes] = await Promise.all([api.get('/clients?limit=100'), api.get('/products?limit=100&status=active')]);
    setClients(cRes.data.data);
    setProducts(pRes.data.data);
  };

  const handleCreate = async () => {
    try {
      const product = products.find((p: any) => p._id === createForm.productId);
      if (!product) return toast.error('Select a product');
      const qty = parseInt(createForm.quantity) || 1;
      const price = product.prices?.[0]?.basePrice || 0;
      const disc = parseFloat(createForm.discount) || 0;
      const lineTotal = qty * price * (1 - disc / 100);
      const validity = new Date();
      validity.setDate(validity.getDate() + (parseInt(createForm.validityDays) || 30));

      await api.post('/orders/quotations', {
        client: createForm.client,
        lines: [{ product: product._id, sku: product.sku, name: product.name, quantity: qty, unitPrice: price, discount: disc, lineTotal }],
        currency: 'QAR',
        taxRate: 5,
        validityDate: validity,
        paymentTerms: createForm.paymentTerms,
        deliveryTerms: 'Ex-Works Doha',
      });
      toast.success('Quotation created');
      setShowCreateModal(false);
      setCreateForm({ client: '', productId: '', quantity: '1', validityDays: '30', paymentTerms: 'Net 30', discount: '0' });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/orders/quotations/${id}/approve`);
      toast.success('Quotation approved');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleConvert = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/orders/quotations/${id}/convert`);
      toast.success('Quotation converted to order');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleExport = () => {
    const csv = [['Quote #', 'Client', 'Total', 'Valid Until', 'Status'].join(','),
      ...quotations.map((q: any) => [q.quotationNumber, q.client?.companyName, q.totalAmount, formatDate(q.validityDate), q.status].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quotations.csv'; a.click();
    toast.success('Exported');
  };

  const columns = [
    { key: 'quotationNumber', label: 'Quote #', render: (item: any) => <span className="font-mono font-semibold text-brand-600">{item.quotationNumber}</span> },
    { key: 'client', label: 'Client', render: (item: any) => <span className="font-medium">{item.client?.companyName || '—'}</span> },
    { key: 'salesRep', label: 'Sales Rep', render: (item: any) => item.salesRep ? <span>{item.salesRep.firstName} {item.salesRep.lastName}</span> : <span className="text-surface-400">—</span> },
    { key: 'items', label: 'Items', render: (item: any) => <span>{item.lines?.length || 0}</span> },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span className="font-semibold">{formatCurrency(item.totalAmount)}</span> },
    { key: 'validityDate', label: 'Valid Until', render: (item: any) => <span>{formatDate(item.validityDate)}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <Badge status={item.status} /> },
    { key: 'actions', label: 'Actions', render: (item: any) => (
      <div className="flex items-center gap-1">
        {item.status === 'draft' && <button onClick={(e) => handleApprove(item._id, e)} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium">Approve</button>}
        {['sent', 'accepted'].includes(item.status) && !item.convertedToOrder && <button onClick={(e) => handleConvert(item._id, e)} className="px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 font-medium flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" />Convert</button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Quotations</h1>
          <p className="text-sm text-surface-500 mt-1">Create and manage quotations for clients</p>
        </div>
      </div>

      <DataTable columns={columns} data={quotations} total={total} page={page} onPageChange={setPage} loading={loading} title="All Quotations"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { loadFormData(); setShowCreateModal(true); }}>New Quotation</Button>
          </div>
        }
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Quotation" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Select label="Client" required options={clients.map((c: any) => ({ value: c._id, label: c.companyName }))} value={createForm.client} onChange={(e) => setCreateForm({ ...createForm, client: e.target.value })} placeholder="Select client" /></div>
          <div className="col-span-2"><Select label="Product" required options={products.map((p: any) => ({ value: p._id, label: `${p.sku} - ${p.name} (${formatCurrency(p.prices?.[0]?.basePrice || 0)})` }))} value={createForm.productId} onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })} placeholder="Select product" /></div>
          <Input label="Quantity" type="number" min="1" value={createForm.quantity} onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })} />
          <Input label="Discount (%)" type="number" min="0" max="100" value={createForm.discount} onChange={(e) => setCreateForm({ ...createForm, discount: e.target.value })} />
          <Input label="Validity (days)" type="number" value={createForm.validityDays} onChange={(e) => setCreateForm({ ...createForm, validityDays: e.target.value })} />
          <Select label="Payment Terms" options={['Net 30', 'Net 60', 'Net 90', 'LC', 'Advance'].map(t => ({ value: t, label: t }))} value={createForm.paymentTerms} onChange={(e) => setCreateForm({ ...createForm, paymentTerms: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Quotation</Button>
        </div>
      </Modal>
    </div>
  );
}
