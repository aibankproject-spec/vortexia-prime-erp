'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ClientQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/portal/quotations?page=${page}&limit=25`);
      setQuotations(data.data); setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'quotationNumber', label: 'Quote #', render: (item: any) => <span className="font-mono font-semibold text-brand-600">{item.quotationNumber}</span> },
    { key: 'items', label: 'Items', render: (item: any) => <span>{item.lines?.length || 0}</span> },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span className="font-semibold">{formatCurrency(item.totalAmount)}</span> },
    { key: 'validityDate', label: 'Valid Until', render: (item: any) => formatDate(item.validityDate) },
    { key: 'status', label: 'Status', render: (item: any) => <Badge status={item.status} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Quotations</h1>
        <p className="text-sm text-surface-500 mt-1">Quotations received from Vortexia Prime Trading</p>
      </div>
      <DataTable columns={columns} data={quotations} total={total} page={page} onPageChange={setPage} loading={loading} />
    </div>
  );
}
