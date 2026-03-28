'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/portal/invoices?page=${page}&limit=25`);
      setInvoices(data.data); setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', render: (item: any) => <span className="font-mono font-semibold text-brand-600">{item.invoiceNumber}</span> },
    { key: 'issueDate', label: 'Issue Date', render: (item: any) => formatDate(item.issueDate) },
    { key: 'dueDate', label: 'Due Date', render: (item: any) => formatDate(item.dueDate) },
    { key: 'totalAmount', label: 'Total', render: (item: any) => <span className="font-semibold">{formatCurrency(item.totalAmount)}</span> },
    { key: 'paidAmount', label: 'Paid', render: (item: any) => <span className="text-emerald-600">{formatCurrency(item.paidAmount)}</span> },
    { key: 'balanceDue', label: 'Balance Due', render: (item: any) => <span className={item.balanceDue > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{formatCurrency(item.balanceDue)}</span> },
    { key: 'status', label: 'Status', render: (item: any) => <Badge status={item.status} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Invoices</h1>
        <p className="text-sm text-surface-500 mt-1">View your invoices and payment status</p>
      </div>
      <DataTable columns={columns} data={invoices} total={total} page={page} onPageChange={setPage} loading={loading} />
    </div>
  );
}
