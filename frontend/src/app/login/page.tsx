'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-right" />

      {/* Left - Branding Panel */}
      <div className="hidden lg:flex lg:w-[55%] gradient-brand relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Vortexia Prime Trading</h1>
              <p className="text-xs text-blue-200">Oil & Gas Industrial Automation</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                Enterprise Resource<br />Planning Platform
              </h2>
              <p className="text-blue-200 mt-4 text-lg max-w-md leading-relaxed">
                Streamline your operations with our comprehensive ERP solution designed for the Oil & Gas industry across the GCC region.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Customer Management', desc: 'CRM & Client Portal' },
                { label: 'Order Lifecycle', desc: 'RFQ to Payment' },
                { label: 'Product Catalogue', desc: '12+ Categories' },
                { label: 'Sales Analytics', desc: 'Real-time Insights' },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-blue-200 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-300 text-xs">
            Serving the Middle East & GCC Region since 2006
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-surface-900">Vortexia Prime</h1>
              <p className="text-xs text-surface-500">ERP Platform</p>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
            <p className="text-surface-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-surface-700">Password</label>
                <a href="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500" />
              <label htmlFor="remember" className="text-sm text-surface-600">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-800 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-amber-700">
              <p>Admin: <span className="font-mono">admin@vortexia.com</span> / <span className="font-mono">Admin@2026</span></p>
              <p>Sales Mgr: <span className="font-mono">sales.mgr@vortexia.com</span> / <span className="font-mono">Sales@2026</span></p>
              <p>Client: <span className="font-mono">client@qatarenergy.com</span> / <span className="font-mono">Client@2026</span></p>
            </div>
          </div>

          <p className="text-center text-xs text-surface-400 mt-6">
            Vortexia Prime Trading &copy; 2026. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
