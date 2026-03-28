'use client';
import { useState, useEffect } from 'react';
import { useAuthStore, useSidebarStore } from '@/lib/store';
import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function TopBar() {
  const { user } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const [notifications, setNotifications] = useState({ unreadCount: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    api.get('/notifications').then(res => setNotifications(res.data.data)).catch(() => {});
  }, []);

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 z-30 flex items-center justify-between px-6 transition-all duration-300',
      'bg-white/80 backdrop-blur-xl border-b border-surface-100',
      isCollapsed ? 'left-[72px]' : 'left-[260px]'
    )}>
      {/* Left - Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm w-80 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-surface-200 bg-surface-100 px-1.5 text-[10px] font-medium text-surface-500">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl hover:bg-surface-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-surface-600" />
            {notifications.unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifications.unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-surface-200 mx-1" />

        {/* User */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-surface-800">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-surface-500 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-brand-500/20">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </div>
    </header>
  );
}
