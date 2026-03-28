'use client';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 12, weight: '600' as const },
      bodyFont: { size: 11 },
      padding: 12,
      cornerRadius: 8,
      boxPadding: 4,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
  },
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, actions }: ChartCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-surface-900">{title}</h3>
          {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="h-[300px]">{children}</div>
    </div>
  );
}

export function RevenueChart({ data }: { data: { labels: string[]; values: number[] } }) {
  const chartData = {
    labels: data.labels,
    datasets: [{
      label: 'Revenue',
      data: data.values,
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      borderColor: '#2563eb',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#2563eb',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  return <Line data={chartData} options={defaultOptions as any} />;
}

export function BarChart({ data }: { data: { labels: string[]; values: number[]; colors?: string[] } }) {
  const chartData = {
    labels: data.labels,
    datasets: [{
      data: data.values,
      backgroundColor: data.colors || [
        '#2563eb', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4',
        '#84cc16', '#ec4899', '#6366f1', '#10b981',
      ],
      borderRadius: 8,
      barThickness: 32,
    }],
  };

  return <Bar data={chartData} options={defaultOptions as any} />;
}

export function DoughnutChart({ data }: { data: { labels: string[]; values: number[]; colors?: string[] } }) {
  const chartData = {
    labels: data.labels,
    datasets: [{
      data: data.values,
      backgroundColor: data.colors || [
        '#2563eb', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4',
      ],
      borderWidth: 0,
      cutout: '72%',
    }],
  };

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12 } } },
      tooltip: defaultOptions.plugins.tooltip,
    },
  };

  return <Doughnut data={chartData} options={opts as any} />;
}
