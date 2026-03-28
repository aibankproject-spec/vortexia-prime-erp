import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'QAR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'badge-success', prospect: 'badge-info', 'on-hold': 'badge-warning',
    dormant: 'badge-neutral', blacklisted: 'badge-danger',
    draft: 'badge-neutral', sent: 'badge-info', accepted: 'badge-success',
    rejected: 'badge-danger', expired: 'badge-warning', converted: 'badge-success',
    rfq_received: 'badge-info', quotation_prepared: 'badge-info', quotation_sent: 'badge-info',
    negotiation: 'badge-warning', po_received: 'badge-success', order_confirmed: 'badge-success',
    picking_packing: 'badge-warning', dispatched: 'badge-info', delivered: 'badge-success',
    invoiced: 'badge-info', payment_received: 'badge-success', closed: 'badge-neutral',
    cancelled: 'badge-danger',
    paid: 'badge-success', partially_paid: 'badge-warning', overdue: 'badge-danger',
    pending: 'badge-warning',
    lead: 'badge-neutral', qualified: 'badge-info', proposal: 'badge-warning',
    won: 'badge-success', lost: 'badge-danger',
  };
  return colors[status] || 'badge-neutral';
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  rfq_received: 'RFQ Received', quotation_prepared: 'Quote Prepared',
  quotation_sent: 'Quote Sent', negotiation: 'Negotiation',
  po_received: 'PO Received', order_confirmed: 'Confirmed',
  picking_packing: 'Picking/Packing', dispatched: 'Dispatched',
  delivered: 'Delivered', invoiced: 'Invoiced',
  payment_received: 'Payment Received', closed: 'Closed', cancelled: 'Cancelled',
};
