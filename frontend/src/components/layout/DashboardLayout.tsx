'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useSidebarStore } from '@/lib/store';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500 font-medium">Loading Vortexia Prime ERP...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-surface-50">
      <Toaster position="top-right" toastOptions={{
        className: '!bg-white !shadow-elevated !rounded-xl !text-sm',
        duration: 4000,
      }} />
      <Sidebar />
      <TopBar />
      <main className={cn(
        'pt-16 min-h-screen transition-all duration-300',
        isCollapsed ? 'ml-[72px]' : 'ml-[260px]'
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
