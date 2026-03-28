'use client';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children, variant = 'primary', size = 'md', loading, icon, className, disabled, ...props
}: ButtonProps) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    outline: 'px-6 py-3 bg-transparent text-brand-600 font-medium rounded-xl border-2 border-brand-600 hover:bg-brand-50 transition-all',
  };
  const sizes = {
    sm: '!px-3 !py-1.5 text-xs',
    md: '',
    lg: '!px-8 !py-4 text-base',
  };

  return (
    <button
      className={cn(variants[variant], sizes[size], 'inline-flex items-center justify-center gap-2', disabled && 'opacity-50 cursor-not-allowed', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
