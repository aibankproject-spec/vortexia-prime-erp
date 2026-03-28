'use client';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (term: string) => void;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  title?: string;
  actions?: React.ReactNode;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, total = 0, page = 1, limit = 25,
  onPageChange, onSearch, onRowClick, loading, title, actions, emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="table-container">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-surface-900">{title}</h3>}
            {total > 0 && <p className="text-sm text-surface-500 mt-0.5">{total} total records</p>}
          </div>
          <div className="flex items-center gap-3">
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); onSearch(e.target.value); }}
                  className="pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-64 transition-all"
                />
              </div>
            )}
            {actions}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50/50">
              {columns.map((col) => (
                <th key={col.key} className={cn('px-6 py-3.5 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider', col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {loading ? (
              <tr><td colSpan={columns.length} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-surface-500">Loading...</p>
                </div>
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-2">
                  <SlidersHorizontal className="w-10 h-10 text-surface-300" />
                  <p className="text-sm text-surface-500">{emptyMessage}</p>
                </div>
              </td></tr>
            ) : (
              data.map((item, i) => (
                <tr
                  key={item._id || item.id || i}
                  className={cn('hover:bg-surface-50/80 transition-colors', onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-6 py-4 text-sm text-surface-700', col.className)}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={cn('w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    p === page ? 'bg-brand-600 text-white' : 'hover:bg-surface-100 text-surface-600'
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
