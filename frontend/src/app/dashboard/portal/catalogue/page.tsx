'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Package, Search, Grid3X3, List, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function ClientCataloguePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/portal/catalogue?page=${page}&limit=20&search=${search}${selectedCategory ? `&category=${selectedCategory}` : ''}`),
        api.get('/products/categories/tree'),
      ]);
      setProducts(prodRes.data.data); setTotal(prodRes.data.total);
      setCategories(catRes.data.data);
    } catch { } finally { setLoading(false); }
  }, [page, search, selectedCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Product Catalogue</h1>
        <p className="text-sm text-surface-500 mt-1">Browse our full range of industrial products</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search products by name, SKU, material..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10" />
        </div>
        <select className="input-field !w-auto" value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button onClick={() => { setSelectedCategory(''); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!selectedCategory ? 'bg-accent-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'}`}>
          All Products
        </button>
        {categories.slice(0, 8).map((cat: any) => (
          <button key={cat._id} onClick={() => { setSelectedCategory(cat._id); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat._id ? 'bg-accent-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      <p className="text-sm text-surface-500">{total} products found</p>

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product: any) => (
            <div key={product._id} className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-card-hover transition-all group">
              <div className="h-40 bg-surface-50 flex items-center justify-center">
                {product.images?.[0] ? <img src={product.images[0].url} alt="" className="w-full h-full object-cover" /> : <Package className="w-12 h-12 text-surface-300" />}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {product.category && <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-600 bg-accent-50 px-2 py-0.5 rounded">{product.category.name}</span>}
                  {product.brand && <span className="text-[10px] font-medium text-surface-500">{product.brand.name}</span>}
                </div>
                <h4 className="font-semibold text-surface-900 text-sm line-clamp-2">{product.name}</h4>
                <p className="text-xs text-surface-500 font-mono mt-1">{product.sku}</p>
                {product.materialGrade && <p className="text-xs text-surface-400 mt-1">Material: {product.materialGrade}</p>}
                {product.complianceStandards?.length > 0 && (
                  <div className="flex gap-1 mt-2">{product.complianceStandards.map((s: string) => <span key={s} className="text-[10px] bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded">{s}</span>)}</div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
                  <span className="text-lg font-bold text-brand-600">{formatCurrency(product.prices?.[0]?.basePrice || 0)}</span>
                  <Link href={`/dashboard/portal/rfq?product=${product._id}`}>
                    <Button size="sm">Request Quote</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-20 text-surface-500">No products found matching your criteria</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="px-4 py-2 text-sm text-surface-600">Page {page} of {Math.ceil(total / 20)}</span>
          <Button variant="secondary" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
