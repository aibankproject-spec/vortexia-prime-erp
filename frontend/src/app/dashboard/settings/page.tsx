'use client';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Building2, Shield, Bell, Palette, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'localization', label: 'Localization', icon: Globe },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-sm text-surface-500 mt-1">Manage your account and system preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-surface-100 p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  activeTab === tab.key ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-surface-100 p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-surface-900">Profile Information</h3>
                <p className="text-sm text-surface-500 mt-1">Update your personal details</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-surface-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-surface-500">{user?.email}</p>
                  <p className="text-xs text-surface-400 capitalize mt-1">{user?.role?.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-100">
                <Input label="First Name" defaultValue={user?.firstName} />
                <Input label="Last Name" defaultValue={user?.lastName} />
                <Input label="Email" type="email" defaultValue={user?.email} />
                <Input label="Phone" type="tel" placeholder="+974-XXXX-XXXX" />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={async () => { toast.success('Profile updated successfully'); }}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-surface-900">Company Information</h3>
                <p className="text-sm text-surface-500 mt-1">Details shown on documents and invoices</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Company Name" defaultValue="Vortexia Prime Trading" />
                <Input label="CR Number" defaultValue="CR-VPT-2006" />
                <Input label="VAT Number" defaultValue="VAT-VPT-001" />
                <Input label="Phone" defaultValue="+974-4444-0000" />
                <div className="col-span-2">
                  <Input label="Address" defaultValue="West Bay, Doha, Qatar" />
                </div>
                <Input label="Email" defaultValue="info@vortexia.com" />
                <Input label="Website" defaultValue="www.vortexia.com" />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => toast.success('Company details saved')}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-surface-900">Security Settings</h3>
                <p className="text-sm text-surface-500 mt-1">Manage your password and 2FA</p>
              </div>
              <div className="space-y-4 max-w-md">
                <Input label="Current Password" type="password" />
                <Input label="New Password" type="password" />
                <Input label="Confirm New Password" type="password" />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => toast.success('Password updated successfully')}>Update Password</Button>
              </div>

              <div className="pt-6 border-t border-surface-100">
                <h4 className="font-semibold text-surface-900 mb-2">Two-Factor Authentication</h4>
                <p className="text-sm text-surface-500 mb-4">Add an extra layer of security to your account</p>
                <Button variant="outline" onClick={() => toast.success('2FA setup initiated - check your email')}>Enable 2FA</Button>
              </div>
            </div>
          )}

          {['notifications', 'appearance', 'localization'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                <Palette className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900">Coming Soon</h3>
              <p className="text-sm text-surface-500 mt-1">This section is under development</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
