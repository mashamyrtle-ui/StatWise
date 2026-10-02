'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/layout/Sidebar';
import { Camera, Shield, X, CheckCircle2 } from 'lucide-react';
import FaceEnrollmentView from '@/components/biometrics/FaceEnrollmentView';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, enrollFace, isLoading } = useAuth();
  const router = useRouter();

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const handleEnrollComplete = async (template: string, thumbnail?: string) => {
    await enrollFace(template, thumbnail, true);
    setEnrollModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-navy-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading StatWise...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const showMigrationPrompt =
    !bannerDismissed &&
    (!user.faceEnrolled || user.faceEnrollmentStatus === 'NOT_ENROLLED');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Existing User Migration Enrollment Modal */}
      {enrollModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,18,35,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div className="relative w-full max-w-lg">
            <button
              onClick={() => setEnrollModalOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-lg"
            >
              <X size={20} />
            </button>
            <FaceEnrollmentView
              userName={user.name}
              stepLabel="Account Security · Face Setup"
              onComplete={handleEnrollComplete}
              onSkip={() => setEnrollModalOpen(false)}
            />
          </div>
        </div>
      )}

      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Section 19: Existing User Migration Banner */}
        {showMigrationPrompt && (
          <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-navy-700">
            <div className="flex items-center gap-2.5">
              <div className="p-1 bg-saffron-400/20 text-saffron-400 rounded">
                <Camera size={14} />
              </div>
              <span>
                <strong>Set up Face Authentication:</strong> Register your face once to enable quick, secure biometric sign-in.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEnrollModalOpen(true)}
                className="bg-saffron-400 hover:bg-saffron-500 text-navy-950 font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm text-xs"
              >
                Enroll My Face
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="text-navy-300 hover:text-white transition-colors"
                title="Dismiss for this session"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
