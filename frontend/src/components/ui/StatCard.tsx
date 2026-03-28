'use client';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'teal';
  className?: string;
}

export default function StatCard({ title, value, icon, trend, color = 'blue', className }: StatCardProps) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
  };

  const bgMap = {
    blue: 'bg-blue-50',
    green: 'bg-emerald-50',
    purple: 'bg-violet-50',
    amber: 'bg-amber-50',
    red: 'bg-red-50',
    teal: 'bg-teal-50',
  };

  return (
    <div className={cn('stat-card group', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-surface-500">{title}</p>
          <p className="text-3xl font-bold text-surface-900 tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5">
              {trend.value >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={cn('text-xs font-semibold', trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-surface-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform duration-300', colorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
