'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as store from '@/lib/store';
import { getInitials } from '@/lib/utils';
import {
  User, Mail, Briefcase, GraduationCap, Building2, Calendar, Target,
  CheckCircle2, Camera, Shield, AlertCircle, RefreshCw, X, Trash2
} from 'lucide-react';
import FaceEnrollmentView from '@/components/biometrics/FaceEnrollmentView';

export default function ProfilePage() {
  const { user, enrollFace, disableFace, resetFace, refreshUser } = useAuth();
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || '');
  const [currentAssignment, setCurrentAssignment] = useState(user?.current_assignment || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Face enrollment modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [faceNotice, setFaceNotice] = useState<string | null>(null);
  const [faceNoticeType, setFaceNoticeType] = useState<'success' | 'info'>('info');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    store.updateUserProfile(user.id, { career_goal: careerGoal, current_assignment: currentAssignment });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReEnrollComplete = async (template: string, thumbnail?: string) => {
    try {
      await enrollFace(template, thumbnail, true);
      setEnrollModalOpen(false);
      setFaceNoticeType('success');
      setFaceNotice('Face successfully registered and biometric template updated.');
      setTimeout(() => setFaceNotice(null), 5000);
    } catch (err: any) {
      alert(err?.message || 'Re-enrollment failed.');
    }
  };

  const handleDisableFace = async () => {
    if (!confirm('Are you sure you want to disable face authentication for this account?')) return;
    try {
      await disableFace();
      setFaceNoticeType('info');
      setFaceNotice('Face authentication disabled. You can re-enroll at any time.');
      setTimeout(() => setFaceNotice(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to disable face authentication.');
    }
  };

  const handleDevReset = async () => {
    if (!user) return;
    if (!confirm('Development Tool: Reset face enrollment for this account to test the onboarding enrollment flow?')) return;
    try {
      await resetFace(user.id);
      setFaceNoticeType('info');
      setFaceNotice('Face enrollment reset. Status is now NOT_ENROLLED.');
      setTimeout(() => setFaceNotice(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Reset failed.');
    }
  };

  if (!user) return null;

  const record = store.getUserById(user.id);
  const isEnrolled = !!(user.faceEnrolled && user.faceEnrollmentStatus === 'ENROLLED');
  const enrollmentDateStr = user.faceEnrolledAt
    ? new Date(user.faceEnrolledAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '27 September 2026';

  return (
    <>
      {/* Re-enrollment / Enrollment Modal */}
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
              isReEnrollment={true}
              stepLabel="Account Settings · Face Re-enrollment"
              onComplete={handleReEnrollComplete}
              onSkip={() => setEnrollModalOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="page-container animate-fade-in max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User size={22} className="text-navy-700" /> Official Profile
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Service details, biometric security settings, and career aspirations
          </p>
        </div>

        {faceNotice && (
          <div
            className={`p-3 rounded-xl mb-5 flex items-center gap-2 text-xs font-semibold animate-fade-in ${
              faceNoticeType === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>{faceNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left card */}
          <div className="gov-card p-6 text-center md:col-span-1">
            <div className="w-20 h-20 rounded-full bg-navy-700 text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              {getInitials(user.name)}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{user.name}</h2>
            <p className="text-xs text-navy-600 font-semibold mb-1">{user.designation}</p>
            <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-mono mb-4">
              {user.employee_id}
            </span>

            {record?.assessmentCompleted && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4 text-left">
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Assessment Completed
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Score: {record.assessmentScore}% ·{' '}
                  {new Date(record.assessmentDate!).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 text-left space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-slate-400" />
                <span>{user.department?.name || 'Department of Statistics'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-slate-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-slate-400" />
                <span>{user.years_experience || 0} Years of Service</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap size={15} className="text-slate-400" />
                <span>{user.education || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-slate-400" />
                <span className="capitalize">{user.role}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Biometrics & Goals */}
          <div className="space-y-6 md:col-span-2">
            {/* FACE AUTHENTICATION MANAGEMENT CARD */}
            <div className="gov-card p-6 border-l-4 border-l-navy-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-navy-50 text-navy-800 rounded-xl">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Face Authentication</h3>
                    <p className="text-xs text-slate-500">
                      1:1 biometric identity verification for secure sign-in
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                    isEnrolled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isEnrolled ? (
                    <>
                      <CheckCircle2 size={12} /> Enabled
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} /> Not Enrolled
                    </>
                  )}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Enrollment Status:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {user.faceEnrollmentStatus?.replace('_', ' ').toLowerCase() || (isEnrolled ? 'Enabled' : 'Not Enrolled')}
                  </span>
                </div>
                {isEnrolled && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Enrollment Date:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {enrollmentDateStr}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Biometric Template:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {isEnrolled ? 'AES-Encrypted (64-D Vector)' : 'None'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {isEnrolled ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEnrollModalOpen(true)}
                      className="px-4 py-2 bg-navy-700 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Camera size={14} /> Re-enroll Face
                    </button>
                    <button
                      type="button"
                      onClick={handleDisableFace}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      Disable Face Authentication
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEnrollModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Camera size={14} /> Enroll Face Authentication
                  </button>
                )}

                {/* Development Reset Button */}
                <button
                  type="button"
                  onClick={handleDevReset}
                  title="Prototype Utility: Reset biometric enrollment to test registration"
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium transition-colors ml-auto flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Reset Enrollment (Dev)
                </button>
              </div>
            </div>

            {/* PROFESSIONAL OBJECTIVES CARD */}
            <div className="gov-card p-6">
              <h3 className="section-header mb-4">
                <Target size={18} className="text-navy-700" /> Professional Objectives &amp; Focus
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Updating your career goal helps our AI engine prioritize relevant training programmes and competency pathways.
              </p>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Current Assignment / Project
                  </label>
                  <input
                    type="text"
                    value={currentAssignment}
                    onChange={e => setCurrentAssignment(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    placeholder="e.g. Annual Survey of Industries — Data Analysis Unit"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                    Career Goal &amp; Learning Aspirations
                  </label>
                  <textarea
                    rows={4}
                    value={careerGoal}
                    onChange={e => setCareerGoal(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    placeholder="Describe the domain, role, or technical expertise you aim to develop over the next 1-3 years..."
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {saved ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 size={16} /> Profile updated &amp; recommendations recalculated!
                    </span>
                  ) : (
                    <div />
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-navy-700 hover:bg-navy-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
