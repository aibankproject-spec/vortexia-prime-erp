'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Upload, Download, Building2, Eye } from 'lucide-react';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const SEGMENTS = ['Oil & Gas', 'Petrochemical', 'Marine & Offshore', 'Construction', 'Power Generation', 'Manufacturing', 'EPC Contractor', 'Government', 'Other'];
const TERRITORIES = ['Qatar', 'UAE', 'Saudi Arabia', 'Bahrain', 'Kuwait', 'Oman', 'Other'];

export default function CustomersPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '', crNumber: '', vatNumber: '', segment: '', territory: '',
    paymentTerms: 'Net 30', creditLimit: '', pricingTier: 'standard', status: 'prospect',
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/clients?page=${page}&limit=25&search=${search}`);
      setClients(data.data);
      setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleCreate = async () => {
    try {
      await api.post('/clients', { ...formData, creditLimit: Number(formData.creditLimit) || 0 });
      toast.success('Client created successfully');
      setShowModal(false);
      setFormData({ companyName: '', crNumber: '', vatNumber: '', segment: '', territory: '', paymentTerms: 'Net 30', creditLimit: '', pricingTier: 'standard', status: 'prospect' });
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating client');
    }
  };

  const columns = [
    {
      key: 'companyName', label: 'Company',
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-sm font-bold text-brand-600">
            {getInitials(item.companyName)}
          </div>
          <div>
            <p className="font-medium text-surface-900">{item.companyName}</p>
            <p className="text-xs text-surface-500">{item.crNumber || 'No CR'}</p>
          </div>
        </div>
      ),
    },
    { key: 'segment', label: 'Segment', render: (item: any) => <span className="text-sm">{item.segment || '—'}</span> },
    { key: 'territory', label: 'Territory', render: (item: any) => <span className="text-sm">{item.territory || '—'}</span> },
    { key: 'pricingTier', label: 'Tier', render: (item: any) => <span className="badge badge-info capitalize">{item.pricingTier}</span> },
    { key: 'creditLimit', label: 'Credit Limit', render: (item: any) => <span className="font-medium">{formatCurrency(item.creditLimit || 0)}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <Badge status={item.status} /> },
    {
      key: 'salesRep', label: 'Sales Rep',
      render: (item: any) => item.primarySalesRep ? (
        <span className="text-sm">{item.primarySalesRep.firstName} {item.primarySalesRep.lastName}</span>
      ) : <span className="text-surface-400">Unassigned</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Customers</h1>
          <p className="text-sm text-surface-500 mt-1">Manage your client relationships and accounts</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        total={total}
        page={page}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        title="Client Directory"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => {
              const csv = [['Company', 'CR Number', 'Segment', 'Territory', 'Tier', 'Credit Limit', 'Status'].join(','),
                ...clients.map((c: any) => [c.companyName, c.crNumber, c.segment, c.territory, c.pricingTier, c.creditLimit, c.status].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'customers.csv'; a.click();
              toast.success('Customers exported');
            }}>Export</Button>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Client</Button>
          </div>
        }
      />

      {/* Create Client Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Client" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Company Name" required value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Enter company name" />
          </div>
          <Input label="CR Number" value={formData.crNumber} onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })} placeholder="CR-XXXX" />
          <Input label="VAT/TIN Number" value={formData.vatNumber} onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })} placeholder="VAT number" />
          <Select label="Industry Segment" required options={SEGMENTS.map(s => ({ value: s, label: s }))} value={formData.segment} onChange={(e) => setFormData({ ...formData, segment: e.target.value })} placeholder="Select segment" />
          <Select label="Territory" required options={TERRITORIES.map(t => ({ value: t, label: t }))} value={formData.territory} onChange={(e) => setFormData({ ...formData, territory: e.target.value })} placeholder="Select territory" />
          <Select label="Payment Terms" options={['Net 30', 'Net 60', 'Net 90', 'LC', 'Advance', 'COD'].map(t => ({ value: t, label: t }))} value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} />
          <Input label="Credit Limit (QAR)" type="number" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })} placeholder="0.00" />
          <Select label="Pricing Tier" options={['standard', 'silver', 'gold', 'platinum'].map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} value={formData.pricingTier} onChange={(e) => setFormData({ ...formData, pricingTier: e.target.value })} />
          <Select label="Status" options={['prospect', 'active', 'on-hold', 'dormant'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Client</Button>
        </div>
      </Modal>
    </div>
  );
}
