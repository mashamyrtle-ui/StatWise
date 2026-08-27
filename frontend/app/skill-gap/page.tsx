'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as store from '@/lib/store';
import { getGapColor, getGapBarColor, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, CheckCircle2, ArrowRight, Info, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function SkillGapPage() {
  const { user } = useAuth();
  const [gaps, setGaps] = useState<store.SkillGapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setGaps(store.getSkillGaps(user.id));
    setLoading(false);
  }, [user]);

  const assessed = user?.assessmentCompleted ?? false;

  if (loading) return (
    <div className="page-container">
      <div className="h-8 skeleton w-48 mb-8" />
      <div className="h-72 skeleton rounded-xl mb-6" />
      <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
    </div>
  );

  if (!assessed) {
    return (
      <div className="page-container animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={22} className="text-red-500" /> Skill Gap Analysis
          </h1>
        </div>
        <div className="gov-card p-12 text-center max-w-xl mx-auto">
          <AlertTriangle size={36} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700 mb-2">Complete your assessment to identify your skill gaps.</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your skill gap analysis will be generated instantly after completing the diagnostic assessment.
          </p>
          <Link href="/assessments"
            className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            <ClipboardList size={16} /> Start Assessment
          </Link>
        </div>
      </div>
    );
  }

  const gapItems = gaps?.gaps || [];
  const withGaps = gapItems.filter(g => g.gap > 0);
  const noGaps = gapItems.filter(g => g.gap <= 0);

  const chartData = gapItems.slice(0, 10).map(g => ({
    name: g.competency_name.split(' ').slice(0, 2).join(' '),
    current: Math.round(g.current_percentage),
    required: Math.round(g.required_percentage),
    gap: g.gap,
    gapLabel: g.gap_label,
  }));

  const GAP_COLORS: Record<string, string> = {
    High: '#ef4444', Medium: '#f59e0b', Low: '#3b82f6', None: '#10b981',
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle size={22} className="text-red-500" /> Skill Gap Analysis
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Gap = Required Competency Level − Current Competency Level for your role: <strong>{user?.designation}</strong>
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'High Priority', count: gaps?.high_priority_count ?? 0, color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'Medium Priority', count: gaps?.medium_priority_count ?? 0, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Low Priority', count: gaps?.low_priority_count ?? 0, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        ].map(({ label, count, color }) => (
          <div key={label} className={cn('rounded-xl border p-4 text-center', color)}>
            <p className="text-3xl font-bold">{count}</p>
            <p className="text-sm font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {gaps?.summary && (
        <div className="gov-card p-4 mb-6 flex items-start gap-3">
          <Info size={18} className="text-navy-700 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">{gaps.summary}</p>
        </div>
      )}

      {/* Chart */}
      <div className="gov-card p-6 mb-6">
        <h2 className="section-header mb-4">Current vs Required Proficiency</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} height={55} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(val: any, name: string) => [`${val}%`, name === 'current' ? 'Current' : 'Required']} />
            <Bar dataKey="required" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Required" maxBarSize={22} />
            <Bar dataKey="current" radius={[4, 4, 0, 0]} name="Current" maxBarSize={22}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={GAP_COLORS[entry.gapLabel] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block" />Required</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" />High Gap</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Medium</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" />Low</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />No Gap</span>
        </div>
      </div>

      {/* Gap items */}
      <div className="gov-card mb-4">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="section-header">Gaps by Competency</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {withGaps.map(g => (
            <div key={g.competency_id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4 cursor-pointer"
                onClick={() => setExpanded(expanded === g.competency_id ? null : g.competency_id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-800">{g.competency_name}</span>
                    <span className={cn('px-2 py-0.5 rounded border text-xs font-medium', getGapColor(g.gap_label))}>
                      {g.gap_label} Priority
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">{g.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full relative">
                      <div className="h-full rounded-full bg-slate-300" style={{ width: `${g.required_percentage}%` }} />
                      <div className={cn('h-full rounded-full absolute top-0', getGapBarColor(g.gap_label))}
                        style={{ width: `${g.current_percentage}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-32 flex-shrink-0">
                      {g.current_percentage.toFixed(0)}% / {g.required_percentage}%
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs font-semibold text-slate-600">Gap: {g.gap} levels</span>
                </div>
              </div>
              {expanded === g.competency_id && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-600">{g.explanation}</p>
                  <Link href="/courses" className="mt-2 inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 font-medium">
                    Find courses to close this gap <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          ))}
          {noGaps.length > 0 && (
            <div className="px-6 py-3">
              <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Met Requirements
              </p>
              {noGaps.map(g => (
                <div key={g.competency_id} className="flex items-center gap-2 py-1">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{g.competency_name}</span>
                  <span className="text-xs text-slate-400 ml-auto">{g.current_percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Link href="/courses"
          className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
          View Recommended Courses <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
