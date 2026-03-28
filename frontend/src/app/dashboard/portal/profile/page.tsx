'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import { Building2, MapPin, CreditCard, Users, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portal/profile').then(res => setProfile(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-20 text-surface-500">Profile not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Company Profile</h1>
        <p className="text-sm text-surface-500 mt-1">Your account information</p>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center text-2xl font-bold text-white">
            {profile.companyName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900">{profile.companyName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge status={profile.status} />
              <span className="badge badge-info capitalize">{profile.pricingTier} Tier</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div><p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-1">CR Number</p><p className="font-medium">{profile.crNumber || '—'}</p></div>
          <div><p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-1">VAT Number</p><p className="font-medium">{profile.vatNumber || '—'}</p></div>
          <div><p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-1">Industry</p><p className="font-medium">{profile.segment || '—'}</p></div>
          <div><p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-1">Territory</p><p className="font-medium">{profile.territory || '—'}</p></div>
          <div><p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-1">Payment Terms</p><p className="font-medium">{profile.paymentTerms}</p></div>
          <div><p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-1">Preferred Currency</p><p className="font-medium">{profile.preferredCurrency}</p></div>
        </div>
      </div>

      {/* Financial */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <h3 className="text-base font-semibold text-surface-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-500" /> Financial Details</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-sm text-surface-500">Credit Limit</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(profile.creditLimit)}</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-sm text-surface-500">Current Balance</p>
            <p className="text-xl font-bold mt-1 text-amber-600">{formatCurrency(profile.currentBalance)}</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-sm text-surface-500">Available Credit</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(profile.creditLimit - profile.currentBalance)}</p>
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <h3 className="text-base font-semibold text-surface-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-brand-500" /> Contacts</h3>
        {profile.contacts?.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {profile.contacts.map((contact: any) => (
              <div key={contact._id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-surface-900">{contact.name} {contact.isPrimary && <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full ml-2">Primary</span>}</p>
                  <p className="text-sm text-surface-500">{contact.designation} {contact.department ? `- ${contact.department}` : ''}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-surface-700">{contact.email}</p>
                  <p className="text-surface-500">{contact.phone}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-surface-500">No contacts on file</p>}
      </div>

      {/* Addresses */}
      {profile.addresses?.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h3 className="text-base font-semibold text-surface-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-500" /> Addresses</h3>
          <div className="grid grid-cols-2 gap-4">
            {profile.addresses.map((addr: any, i: number) => (
              <div key={i} className="bg-surface-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-surface-500 uppercase mb-1">{addr.type} {addr.isDefault && '(Default)'}</p>
                <p className="text-sm">{addr.street}</p>
                <p className="text-sm">{addr.city}, {addr.country} {addr.postalCode}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
