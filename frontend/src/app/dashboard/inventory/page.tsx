'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { AlertTriangle, ArrowRightLeft, Plus, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stockForm, setStockForm] = useState({ product: '', warehouse: '', quantity: '', type: 'receipt', notes: '', referenceNumber: '' });
  const [transferForm, setTransferForm] = useState({ product: '', fromWarehouse: '', toWarehouse: '', quantity: '', notes: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/inventory?page=${page}&limit=25${lowStockOnly ? '&lowStock=true' : ''}`);
      setInventory(data.data);
      setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }, [page, lowStockOnly]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadFormData = async () => {
    const [pRes, wRes] = await Promise.all([api.get('/products?limit=100'), api.get('/inventory/warehouses')]);
    setProducts(pRes.data.data);
    setWarehouses(wRes.data.data);
  };

  const handleStockUpdate = async () => {
    try {
      await api.post('/inventory/stock', { ...stockForm, quantity: parseInt(stockForm.quantity) });
      toast.success('Stock updated');
      setShowStockModal(false);
      setStockForm({ product: '', warehouse: '', quantity: '', type: 'receipt', notes: '', referenceNumber: '' });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleTransfer = async () => {
    try {
      await api.post('/inventory/transfer', { ...transferForm, quantity: parseInt(transferForm.quantity) });
      toast.success('Stock transferred');
      setShowTransferModal(false);
      setTransferForm({ product: '', fromWarehouse: '', toWarehouse: '', quantity: '', notes: '' });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleExport = () => {
    const csv = [['Product', 'SKU', 'Warehouse', 'Total', 'Reserved', 'Available', 'Reorder Point'].join(','),
      ...inventory.map((i: any) => [i.product?.name, i.product?.sku, i.warehouse?.name, i.totalStock, i.reservedStock, i.totalStock - i.reservedStock, i.reorderPoint].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'inventory.csv'; a.click();
    toast.success('Exported');
  };

  const columns = [
    { key: 'product', label: 'Product', render: (item: any) => (<div><p className="font-medium text-surface-900">{item.product?.name || 'N/A'}</p><p className="text-xs text-surface-500 font-mono">{item.product?.sku}</p></div>) },
    { key: 'warehouse', label: 'Warehouse', render: (item: any) => <span>{item.warehouse?.name || '—'}</span> },
    { key: 'totalStock', label: 'Total Stock', render: (item: any) => <span className="font-semibold">{item.totalStock}</span> },
    { key: 'reservedStock', label: 'Reserved', render: (item: any) => <span className="text-amber-600">{item.reservedStock}</span> },
    { key: 'available', label: 'Available', render: (item: any) => <span className="font-semibold text-emerald-600">{item.totalStock - item.reservedStock}</span> },
    { key: 'reorderPoint', label: 'Reorder Point', render: (item: any) => <span>{item.reorderPoint}</span> },
    { key: 'status', label: 'Status', render: (item: any) => {
      const available = item.totalStock - item.reservedStock;
      if (available <= 0) return <span className="badge badge-danger">Out of Stock</span>;
      if (item.totalStock <= item.reorderPoint) return <span className="badge badge-warning">Low Stock</span>;
      return <span className="badge badge-success">In Stock</span>;
    }},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Inventory</h1>
          <p className="text-sm text-surface-500 mt-1">Track stock levels across warehouses</p>
        </div>
        <div className="flex gap-2">
          <Button variant={lowStockOnly ? 'primary' : 'secondary'} size="sm" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => setLowStockOnly(!lowStockOnly)}>Low Stock</Button>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>Export</Button>
          <Button variant="secondary" size="sm" icon={<ArrowRightLeft className="w-4 h-4" />} onClick={() => { loadFormData(); setShowTransferModal(true); }}>Transfer</Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { loadFormData(); setShowStockModal(true); }}>Update Stock</Button>
        </div>
      </div>

      <DataTable columns={columns} data={inventory} total={total} page={page} onPageChange={setPage} loading={loading} title="Stock Levels" />

      {/* Stock Update Modal */}
      <Modal isOpen={showStockModal} onClose={() => setShowStockModal(false)} title="Update Stock">
        <div className="space-y-4">
          <Select label="Product" required options={products.map((p: any) => ({ value: p._id, label: `${p.sku} - ${p.name}` }))} value={stockForm.product} onChange={(e) => setStockForm({ ...stockForm, product: e.target.value })} placeholder="Select product" />
          <Select label="Warehouse" required options={warehouses.map((w: any) => ({ value: w._id, label: w.name }))} value={stockForm.warehouse} onChange={(e) => setStockForm({ ...stockForm, warehouse: e.target.value })} placeholder="Select warehouse" />
          <Select label="Type" options={[{ value: 'receipt', label: 'Receipt (Add Stock)' }, { value: 'issue', label: 'Issue (Remove Stock)' }, { value: 'adjustment', label: 'Adjustment (Set Stock)' }]} value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })} />
          <Input label="Quantity" type="number" min="1" required value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} />
          <Input label="Reference #" value={stockForm.referenceNumber} onChange={(e) => setStockForm({ ...stockForm, referenceNumber: e.target.value })} placeholder="e.g., GRN-2026-001" />
          <Input label="Notes" value={stockForm.notes} onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} placeholder="Optional notes" />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>Cancel</Button>
          <Button onClick={handleStockUpdate}>Update Stock</Button>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transfer Stock Between Warehouses">
        <div className="space-y-4">
          <Select label="Product" required options={products.map((p: any) => ({ value: p._id, label: `${p.sku} - ${p.name}` }))} value={transferForm.product} onChange={(e) => setTransferForm({ ...transferForm, product: e.target.value })} placeholder="Select product" />
          <Select label="From Warehouse" required options={warehouses.map((w: any) => ({ value: w._id, label: w.name }))} value={transferForm.fromWarehouse} onChange={(e) => setTransferForm({ ...transferForm, fromWarehouse: e.target.value })} placeholder="Source warehouse" />
          <Select label="To Warehouse" required options={warehouses.filter((w: any) => w._id !== transferForm.fromWarehouse).map((w: any) => ({ value: w._id, label: w.name }))} value={transferForm.toWarehouse} onChange={(e) => setTransferForm({ ...transferForm, toWarehouse: e.target.value })} placeholder="Destination warehouse" />
          <Input label="Quantity" type="number" min="1" required value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} />
          <Input label="Notes" value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowTransferModal(false)}>Cancel</Button>
          <Button onClick={handleTransfer}>Transfer Stock</Button>
        </div>
      </Modal>
    </div>
  );
}
