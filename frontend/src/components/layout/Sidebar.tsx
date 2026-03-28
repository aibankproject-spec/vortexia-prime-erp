'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSidebarStore, useAuthStore } from '@/lib/store';
import {
  LayoutDashboard, Users, Package, ShoppingCart, TrendingUp,
  BarChart3, Settings, ChevronLeft, Building2, FileText,
  Warehouse, Bell, HelpCircle, LogOut, Receipt, Target,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Customers', icon: Users, href: '/dashboard/customers' },
  { label: 'Products', icon: Package, href: '/dashboard/products' },
  { label: 'Orders', icon: ShoppingCart, href: '/dashboard/orders' },
  { label: 'Quotations', icon: FileText, href: '/dashboard/quotations' },
  { label: 'Invoices', icon: Receipt, href: '/dashboard/invoices' },
  { label: 'Inventory', icon: Warehouse, href: '/dashboard/inventory' },
  { label: 'Sales Pipeline', icon: Target, href: '/dashboard/sales' },
  { label: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const { user, logout } = useAuthStore();

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out',
      'bg-surface-950 text-white',
      isCollapsed ? 'w-[72px]' : 'w-[260px]'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Vortexia Prime</h1>
              <p className="text-[10px] text-surface-400 font-medium">ERP Platform</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-surface-400 hover:text-white hover:bg-white/5',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-white')} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-surface-400 truncate capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-surface-400" />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="w-full flex justify-center p-2 rounded-lg hover:bg-white/10 transition-colors" title="Logout">
            <LogOut className="w-5 h-5 text-surface-400" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface-800 border border-surface-700 rounded-full flex items-center justify-center hover:bg-surface-700 transition-colors z-50"
      >
        <ChevronLeft className={cn('w-3 h-3 text-surface-400 transition-transform', isCollapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
