'use client';
import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export default function Badge({ status, label, className }: BadgeProps) {
  const displayLabel = label || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={cn('badge', getStatusColor(status), className)}>
      {displayLabel}
    </span>
  );
}
