'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Upload, Package, Grid3X3, List } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    sku: '', name: '', description: '', category: '', brand: '', unitOfMeasure: 'PCS',
    materialGrade: '', pressureRating: '', basePrice: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get(`/products?page=${page}&limit=25&search=${search}`),
        api.get('/products/categories'),
        api.get('/products/brands'),
      ]);
      setProducts(prodRes.data.data);
      setTotal(prodRes.data.total);
      setCategories(catRes.data.data || []);
      setBrands(brandRes.data.data || []);
    } catch { } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    try {
      await api.post('/products', {
        ...formData,
        prices: [{ currency: 'QAR', basePrice: Number(formData.basePrice) || 0 }],
      });
      toast.success('Product created');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Product',
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center overflow-hidden">
            {item.images?.[0] ? (
              <img src={item.images[0].url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-5 h-5 text-surface-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-surface-900">{item.name}</p>
            <p className="text-xs text-surface-500 font-mono">{item.sku}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (item: any) => <span>{item.category?.name || '—'}</span> },
    { key: 'brand', label: 'Brand', render: (item: any) => <span>{item.brand?.name || '—'}</span> },
    { key: 'materialGrade', label: 'Material', render: (item: any) => <span className="text-xs font-mono">{item.materialGrade || '—'}</span> },
    {
      key: 'price', label: 'Price (QAR)',
      render: (item: any) => {
        const price = item.prices?.find((p: any) => p.currency === 'QAR');
        return <span className="font-semibold">{price ? formatCurrency(price.basePrice) : '—'}</span>;
      },
    },
    { key: 'status', label: 'Status', render: (item: any) => <Badge status={item.status} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Products</h1>
          <p className="text-sm text-surface-500 mt-1">Manage your product catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-100 rounded-xl p-1">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-surface-200'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-surface-200'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={products}
          total={total}
          page={page}
          onPageChange={setPage}
          onSearch={setSearch}
          loading={loading}
          title="Product Catalogue"
          actions={
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Product</Button>
          }
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{total} Products</h3>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Product</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product: any) => (
              <div key={product._id} className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-card-hover transition-all group">
                <div className="h-40 bg-surface-50 flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-surface-300" />
                  )}
                </div>
                <div className="p-4">
                  <Badge status={product.status} className="mb-2" />
                  <h4 className="font-semibold text-surface-900 text-sm line-clamp-2">{product.name}</h4>
                  <p className="text-xs text-surface-500 font-mono mt-1">{product.sku}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
                    <span className="text-lg font-bold text-brand-600">
                      {formatCurrency(product.prices?.[0]?.basePrice || 0)}
                    </span>
                    <span className="text-xs text-surface-500">{product.unitOfMeasure}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Product" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="SKU Code" required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} placeholder="e.g., VLV-GT-CS-001" />
          <Input label="Unit of Measure" value={formData.unitOfMeasure} onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })} />
          <div className="col-span-2">
            <Input label="Product Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full product name" />
          </div>
          <Select label="Category" required options={categories.map((c: any) => ({ value: c._id, label: c.name }))} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Select category" />
          <Select label="Brand" options={brands.map((b: any) => ({ value: b._id, label: b.name }))} value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Select brand" />
          <Input label="Material Grade" value={formData.materialGrade} onChange={(e) => setFormData({ ...formData, materialGrade: e.target.value })} placeholder="e.g., ASTM A106 Gr.B" />
          <Input label="Pressure Rating" value={formData.pressureRating} onChange={(e) => setFormData({ ...formData, pressureRating: e.target.value })} placeholder="e.g., 150#" />
          <div className="col-span-2">
            <Input label="Base Price (QAR)" type="number" required value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} placeholder="0.00" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Product</Button>
        </div>
      </Modal>
    </div>
  );
}
