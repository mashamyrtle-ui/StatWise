'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, ArrowRight, Shield, Zap, Users } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Employee — Ananya Sharma', email: 'ananya@statwise.gov.in', role: 'Statistical Officer' },
  { label: 'Trainer — Dr. Ramesh Sharma', email: 'trainer@statwise.gov.in', role: 'Senior Training Officer' },
  { label: 'Admin — Vijay Sharma', email: 'admin@statwise.gov.in', role: 'Director' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-700 via-navy-800 to-slate-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-saffron-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">SW</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">StatWise</p>
              <p className="text-navy-300 text-xs">Powered by AI · MoSPI Initiative</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Bridge the Skill Gap.<br />
            Build a Future-Ready<br />
            Statistical Workforce.
          </h1>
          <p className="text-navy-300 text-lg max-w-md">
            AI-powered competency intelligence for India's Official Statistical System.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {[
            { icon: Zap, title: 'AI-Powered Learning', desc: 'Personalized paths based on your skill gaps' },
            { icon: Shield, title: 'Government-Grade Security', desc: 'Role-based access with audit logging' },
            { icon: Users, title: 'iGOT + NSSTA Integration', desc: 'Connected to official training platforms' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 items-start bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 bg-saffron-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-saffron-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{title}</p>
                <p className="text-navy-300 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-navy-400 text-xs">
          Prototype — Hackathon build. iGOT and NSSTA integrations are mocked.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-saffron-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">SW</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">StatWise</p>
              <p className="text-navy-300 text-xs">AI-Powered Competency Platform</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in to your StatWise account</p>

            {/* Demo quick login */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Demo Accounts</p>
              <div className="grid gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-slate-200 hover:border-navy-300 hover:bg-navy-50 transition-all text-left group"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700 group-hover:text-navy-700">{acc.label}</p>
                      <p className="text-xs text-slate-400">{acc.role}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-navy-500" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">Password for all demo accounts: <code className="bg-slate-100 px-1 rounded">demo123</code></p>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-slate-400">or sign in manually</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Government Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@ministry.gov.in"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-navy-400 text-xs mt-6">
            StatWise Prototype · Ministry of Statistics & Programme Implementation
          </p>
        </div>
      </div>
    </div>
  );
}
