'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { Plus, Trash2, Send, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RFQItem { product: string; name: string; sku: string; price: number; quantity: number; }

export default function SubmitRFQPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<RFQItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    api.get('/portal/catalogue?limit=200').then(res => {
      setProducts(res.data.data);
      // If a product was passed via URL
      const preselect = searchParams.get('product');
      if (preselect) {
        const prod = res.data.data.find((p: any) => p._id === preselect);
        if (prod) {
          setItems([{ product: prod._id, name: prod.name, sku: prod.sku, price: prod.prices?.[0]?.basePrice || 0, quantity: 1 }]);
        }
      }
    }).catch(() => {});
  }, [searchParams]);

  const addItem = () => {
    const prod = products.find((p: any) => p._id === selectedProduct);
    if (!prod) return toast.error('Select a product');
    if (items.find(i => i.product === prod._id)) return toast.error('Product already added');
    setItems([...items, { product: prod._id, name: prod.name, sku: prod.sku, price: prod.prices?.[0]?.basePrice || 0, quantity: 1 }]);
    setSelectedProduct('');
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const updateQty = (idx: number, qty: number) => {
    const updated = [...items];
    updated[idx].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (items.length === 0) return toast.error('Add at least one product');
    setLoading(true);
    try {
      await api.post('/portal/rfq', {
        items: items.map(i => ({ product: i.product, quantity: i.quantity })),
        notes,
      });
      toast.success('RFQ submitted successfully! We will get back to you shortly.');
      setItems([]);
      setNotes('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting RFQ');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Submit RFQ</h1>
        <p className="text-sm text-surface-500 mt-1">Request a quotation for the products you need</p>
      </div>

      {/* Add product */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <h3 className="font-semibold text-surface-900 mb-4">Add Products</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select label="Select Product" options={products.filter(p => !items.find(i => i.product === p._id)).map((p: any) => ({ value: p._id, label: `${p.sku} - ${p.name} (${formatCurrency(p.prices?.[0]?.basePrice || 0)})` }))}
              value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} placeholder="Choose a product..." />
          </div>
          <Button onClick={addItem} icon={<Plus className="w-4 h-4" />}>Add</Button>
        </div>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">RFQ Items ({items.length})</h3>
          </div>
          <table className="w-full">
            <thead><tr className="bg-surface-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-surface-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-surface-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-surface-500 uppercase">Subtotal</th>
              <th className="px-6 py-3 w-12"></th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {items.map((item, idx) => (
                <tr key={item.product}>
                  <td className="px-6 py-3 font-medium text-sm">{item.name}</td>
                  <td className="px-6 py-3 text-sm font-mono text-surface-500">{item.sku}</td>
                  <td className="px-6 py-3 text-center">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateQty(idx, parseInt(e.target.value) || 1)}
                      className="w-20 text-center input-field !py-1.5" />
                  </td>
                  <td className="px-6 py-3 text-right text-sm">{formatCurrency(item.price)}</td>
                  <td className="px-6 py-3 text-right text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                  <td className="px-6 py-3">
                    <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex justify-between items-center">
            <span className="text-sm text-surface-500">Estimated Total (final pricing in quotation)</span>
            <span className="text-xl font-bold text-brand-600">{formatCurrency(totalValue)}</span>
          </div>
        </div>
      )}

      {/* Notes & Submit */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <Input label="Additional Notes / Requirements" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Delivery urgency, special requirements, preferred delivery date, etc." />
        <div className="flex justify-end mt-6">
          <Button onClick={handleSubmit} loading={loading} icon={<Send className="w-4 h-4" />} disabled={items.length === 0}>
            Submit RFQ ({items.length} items)
          </Button>
        </div>
      </div>
    </div>
  );
}
