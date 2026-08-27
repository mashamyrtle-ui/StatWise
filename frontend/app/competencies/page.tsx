'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as store from '@/lib/store';
import { getProgressColor, getScoreColor, cn, getLevelName } from '@/lib/utils';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Target, TrendingUp, Star, Filter, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function CompetenciesPage() {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<store.CompetencyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (!user) return;
    setCompetencies(store.getCompetencies(user.id));
    setLoading(false);
  }, [user]);

  const assessed = user?.assessmentCompleted ?? false;
  const categories = ['All', ...Array.from(new Set(competencies.map(c => c.category || 'Other')))];
  const filtered = selectedCategory === 'All' ? competencies : competencies.filter(c => c.category === selectedCategory);

  const radarData = competencies.slice(0, 8).map(c => ({
    subject: c.competency_name?.split(' ')[0] || 'Skill',
    score: Math.round(c.score_percentage),
    fullMark: 100,
  }));

  const barData = filtered.map(c => ({
    name: c.competency_name || 'Skill',
    score: Math.round(c.score_percentage),
    level: c.current_level,
  }));

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-8 skeleton w-64 mb-8" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 skeleton rounded-xl" />
          <div className="col-span-2 h-64 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (!assessed) {
    return (
      <div className="page-container animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target size={22} className="text-navy-700" /> My Competencies
          </h1>
          <p className="text-slate-500 text-sm mt-1">Your competency profile across all domains</p>
        </div>
        <div className="gov-card p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-2">Assessment not completed yet.</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your competency profile will appear here after you complete the diagnostic assessment.
          </p>
          <Link href="/assessments"
            className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            <ClipboardList size={16} /> Start Assessment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Target size={22} className="text-navy-700" /> My Competencies
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Your current competency profile across all domains — {competencies.length} competencies assessed
        </p>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="gov-card p-6">
          <h2 className="section-header mb-4"><Star size={16} className="text-amber-500" /> Competency Radar</h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Radar name="Score" dataKey="score" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="gov-card p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header"><TrendingUp size={16} className="text-blue-600" /> Score by Competency</h2>
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={cn('px-2 py-1 rounded text-xs font-medium border transition-all',
                    selectedCategory === cat ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300')}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" interval={0} height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} />
              <Bar dataKey="score" fill="#1e3a5f" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competency list */}
      <div className="gov-card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="section-header"><Filter size={16} className="text-slate-500" /> Detailed Breakdown</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map(uc => (
            <div key={uc.competency_id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-800">{uc.competency_name}</span>
                    <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">{uc.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full">
                      <div className={cn('h-full rounded-full transition-all duration-500', getProgressColor(uc.score_percentage))}
                        style={{ width: `${uc.score_percentage}%` }} />
                    </div>
                    <span className={cn('text-sm font-bold w-12 text-right', getScoreColor(uc.score_percentage))}>
                      {uc.score_percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 w-28">
                  <p className="text-xs font-semibold text-slate-700">{getLevelName(uc.current_level)}</p>
                  <p className="text-xs text-slate-400">Level {uc.current_level}/5</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(l => (
                    <div key={l} className={cn('w-3 h-3 rounded-sm', l <= uc.current_level ? 'bg-navy-700' : 'bg-slate-200')} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
