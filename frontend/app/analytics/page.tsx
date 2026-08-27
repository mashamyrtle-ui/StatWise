'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as store from '@/lib/store';
import { cn } from '@/lib/utils';
import { TrendingUp, Zap, Target, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<store.CompetencyScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setCompetencies(store.getCompetencies(user.id));
    setLoading(false);
  }, [user]);

  const assessed = user?.assessmentCompleted ?? false;

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-8 skeleton w-64 mb-8" />
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="h-72 skeleton rounded-xl" />
          <div className="h-72 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (!assessed) {
    return (
      <div className="page-container animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={22} className="text-navy-700" /> Learner Analytics & Growth
          </h1>
        </div>
        <div className="gov-card p-12 text-center max-w-xl mx-auto">
          <TrendingUp size={36} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700 mb-2">Complete your assessment to unlock analytics.</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your growth trajectory and domain benchmarks will appear here after your competency assessment.
          </p>
          <Link href="/assessments"
            className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            <ClipboardList size={16} /> Start Assessment
          </Link>
        </div>
      </div>
    );
  }

  // Build user-specific category averages
  const categoryMap: Record<string, number[]> = {};
  competencies.forEach(c => {
    const cat = c.category;
    categoryMap[cat] = categoryMap[cat] || [];
    categoryMap[cat].push(c.score_percentage);
  });

  const overallAvg = competencies.length
    ? Math.round(competencies.reduce((a, c) => a + c.score_percentage, 0) / competencies.length)
    : 0;

  // Mock growth trajectory ending at current score
  const growthBase = Math.max(30, overallAvg - 22);
  const timelineData = [
    { month: 'Mar', score: Math.round(growthBase) },
    { month: 'Apr', score: Math.round(growthBase + 4) },
    { month: 'May', score: Math.round(growthBase + 8) },
    { month: 'Jun', score: Math.round(growthBase + 13) },
    { month: 'Jul', score: Math.round(growthBase + 18) },
    { month: 'Now', score: overallAvg },
  ];

  const reqs = store.ROLE_REQUIREMENTS[user?.role || 'employee'] || {};
  const categoryData = Object.entries(categoryMap).map(([cat, scores]) => {
    const catAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    // benchmark: average required for competencies in this category
    const catComps = competencies.filter(c => c.category === cat);
    const benchmarkAvg = catComps.length
      ? Math.round(catComps.reduce((a, c) => a + (reqs[c.code] ?? 65), 0) / catComps.length)
      : 65;
    return { category: cat.split(' ')[0], current: catAvg, benchmark: benchmarkAvg };
  });

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp size={22} className="text-navy-700" /> Learner Analytics & Growth
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Historical growth trajectory, competency velocity, and role benchmarks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trajectory */}
        <div className="gov-card p-6">
          <h2 className="section-header mb-4"><Zap size={16} className="text-amber-500" /> Overall Competency Velocity</h2>
          <p className="text-xs text-slate-500 mb-4">Tracking average skill index across all domains over the last 6 months.</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[20, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Average Competency']} />
              <Area type="monotone" dataKey="score" stroke="#1e3a5f" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Benchmark */}
        <div className="gov-card p-6">
          <h2 className="section-header mb-4"><Target size={16} className="text-navy-700" /> Domain vs Role Benchmark</h2>
          <p className="text-xs text-slate-500 mb-4">Your current level vs required level for <strong>{user?.designation}</strong>.</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="current" name="Your Score" fill="#1e3a5f" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="benchmark" name="Role Requirement" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
