'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as store from '@/lib/store';
import { getInitials } from '@/lib/utils';
import { User, Mail, Briefcase, GraduationCap, Building2, Calendar, Target, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || '');
  const [currentAssignment, setCurrentAssignment] = useState(user?.current_assignment || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    store.updateUserProfile(user.id, { career_goal: careerGoal, current_assignment: currentAssignment });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user) return null;

  const record = store.getUserById(user.id);

  return (
    <div className="page-container animate-fade-in max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <User size={22} className="text-navy-700" /> Official Profile
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Service details, educational background, and career aspirations
        </p>
      </div>

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
                Score: {record.assessmentScore}% · {new Date(record.assessmentDate!).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
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

        {/* Right card */}
        <div className="gov-card p-6 md:col-span-2">
          <h3 className="section-header mb-4">
            <Target size={18} className="text-navy-700" /> Professional Objectives & Focus
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Updating your career goal helps our AI engine prioritize relevant training programmes and competency pathways.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Current Assignment / Project
              </label>
              <input type="text" value={currentAssignment} onChange={e => setCurrentAssignment(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                placeholder="e.g. Annual Survey of Industries — Data Analysis Unit" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Career Goal & Learning Aspirations
              </label>
              <textarea rows={4} value={careerGoal} onChange={e => setCareerGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                placeholder="Describe the domain, role, or technical expertise you aim to develop over the next 1-3 years..." />
            </div>

            <div className="flex items-center justify-between pt-2">
              {saved ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 size={16} /> Profile updated & recommendations recalculated!
                </span>
              ) : <div />}
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-navy-700 hover:bg-navy-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
