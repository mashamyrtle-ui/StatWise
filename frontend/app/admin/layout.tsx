'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AppLayout from '@/components/layout/AppLayout';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'admin') {
        const redirectPath = user.role === 'trainer' ? '/trainer' : '/dashboard';
        const timer = setTimeout(() => {
          router.replace(redirectPath);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-10 h-10 border-4 border-navy-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying Administrator Privileges...</p>
        </div>
      </AppLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    const fallbackPath = user?.role === 'trainer' ? '/trainer' : '/dashboard';
    const roleLabel = user?.role === 'trainer' ? 'Trainer' : user?.role === 'employee' ? 'Learner' : 'Guest';

    return (
      <AppLayout>
        <div className="page-container py-12">
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center animate-fade-in">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-inner">
              <ShieldAlert size={28} />
            </div>
            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-red-100 text-red-800 tracking-wider mb-2">
              Unauthorized Access (403)
            </span>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Administrator Access Required
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              You are currently signed in as a <strong>{roleLabel}</strong>. Administrative governance, competency frameworks, trainer approvals, and workforce auditing require Administrator credentials.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href={fallbackPath}
                className="px-4 py-2 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={14} /> Return to {roleLabel} Portal
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Switch Account
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
