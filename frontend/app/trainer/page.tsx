'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  GraduationCap, Users, BookOpen, Sparkles, CheckCircle2,
  Clock, Award, BarChart3, ArrowRight, Calendar, FileText
} from 'lucide-react';
import Link from 'next/link';

export default function TrainerDashboardPage() {
  const { user } = useAuth();

  const trainerBatches = [
    {
      id: 'B-2024-01',
      title: 'National Accounts & GVA Frameworks (Batch 14)',
      learners: 28,
      progress: 74,
      status: 'Active',
      nextSession: 'Tomorrow, 10:30 AM',
      topic: 'Supply and Use Tables (SUT)',
    },
    {
      id: 'B-2024-02',
      title: 'Annual Survey of Industries — Field Methodologies',
      learners: 32,
      progress: 90,
      status: 'Review Phase',
      nextSession: '29 Sept 2026, 02:00 PM',
      topic: 'Factory Sector Sampling Validation',
    },
    {
      id: 'B-2024-03',
      title: 'SDG Indicator Monitoring & Plausibility Audits',
      learners: 22,
      progress: 45,
      status: 'Active',
      nextSession: '30 Sept 2026, 11:00 AM',
      topic: 'Indicator 8.1.1 & 8.2.1 Data Pipelines',
    },
  ];

  return (
    <div className="page-container animate-fade-in max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full w-fit mb-2">
            <GraduationCap size={14} /> National Statistical Systems Training Academy (NSSTA)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Trainer Faculty Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome, {user?.name || 'Faculty Officer'} · Capacity building &amp; cohort evaluation management
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/quiz-generator"
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={14} /> AI Quiz Generator
          </Link>
          <Link
            href="/courses"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <BookOpen size={14} /> Course Catalogue
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Trainees</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">82</p>
          <p className="text-[11px] text-slate-400 mt-1">Across 3 MoSPI training cohorts</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg. Cohort Score</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Award size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">76.4%</p>
          <p className="text-[11px] text-emerald-600 mt-1">↑ +8.2% after baseline assessments</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Modules Delivered</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <BookOpen size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">18</p>
          <p className="text-[11px] text-slate-400 mt-1">4 pending final assessment</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Training Hours</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">142 hrs</p>
          <p className="text-[11px] text-slate-400 mt-1">Official learning credits logged</p>
        </div>
      </div>

      {/* Cohorts / Batches Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Training Batches</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time competency progression and syllabus completion</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Academic Year 2026-27</span>
        </div>

        <div className="space-y-3">
          {trainerBatches.map(b => (
            <div
              key={b.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {b.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{b.title}</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Current Topic: <strong className="text-slate-700">{b.topic}</strong> · {b.learners} Officers Enrolled
                </p>
              </div>

              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="w-32">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-bold text-slate-800">{b.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${b.progress}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Next Live Session</span>
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1 justify-end">
                    <Calendar size={12} className="text-purple-600" /> {b.nextSession}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
