'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as store from '@/lib/store';
import { getGapColor, getGapBarColor, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  AlertTriangle, CheckCircle2, ArrowRight, Info, ClipboardList,
  ShieldCheck, Sparkles, BookOpen, Layers, Target, ChevronRight
} from 'lucide-react';
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
            Your skill gap analysis will be generated dynamically by the AI Competency Engine after completing the diagnostic assessment.
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
  const withGaps = gapItems.filter(g => (g.gap_percentage ? g.gap_percentage > 0 : g.gap > 0));
  const noGaps = gaps?.strengths?.length ? gaps.strengths : gapItems.filter(g => (g.gap_percentage ? g.gap_percentage <= 0 : g.gap <= 0));

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

  const userRole = user?.targetRole || user?.jobRole || user?.designation || 'Statistical Officer';

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle size={22} className="text-red-500" /> Skill Gap Analysis &amp; Diagnostic Reasoning
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Dynamic calculation: <strong>Skill Gap = Role Target Requirement − Demonstrated Competency Level</strong> for:{' '}
          <span className="font-semibold text-slate-700">{userRole}</span>
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'High Priority Gaps', count: gaps?.high_priority_count ?? 0, color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'Medium Priority Gaps', count: gaps?.medium_priority_count ?? 0, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Low Priority Gaps', count: gaps?.low_priority_count ?? 0, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        ].map(({ label, count, color }) => (
          <div key={label} className={cn('rounded-xl border p-4 text-center', color)}>
            <p className="text-3xl font-bold">{count}</p>
            <p className="text-sm font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {gaps?.summary && (
        <div className="gov-card p-4 mb-6 flex items-start gap-3 bg-gradient-to-r from-slate-50 to-blue-50/40">
          <Info size={18} className="text-navy-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Diagnostic Summary: </span>
            {gaps.summary}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="gov-card p-6 mb-6">
        <h2 className="section-header mb-4">Current vs Required Proficiency Benchmark</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} height={55} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(val: any, name: string) => [`${val}%`, name === 'current' ? 'Current Demonstrated' : 'Required for Role']} />
            <Bar dataKey="required" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Required" maxBarSize={22} />
            <Bar dataKey="current" radius={[4, 4, 0, 0]} name="Current" maxBarSize={22}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={GAP_COLORS[entry.gapLabel] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block" />Role Requirement</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" />High Gap (&gt;20 pts)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Medium Gap (10–20 pts)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" />Low Gap (1–10 pts)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />Met Target (0 pts)</span>
        </div>
      </div>

      {/* Gap items */}
      <div className="gov-card mb-4">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="section-header">Identified Gaps by Competency ({withGaps.length})</h2>
          <span className="text-xs text-slate-400">Click any card to reveal dynamic AI reasoning and action pathway</span>
        </div>
        <div className="divide-y divide-slate-100">
          {withGaps.map(g => {
            const isExpanded = expanded === g.competency_id;
            const gapPoints = g.gap_percentage ?? Math.max(0, g.required_percentage - g.current_percentage);
            const confidence = g.confidence || 'Medium';

            return (
              <div key={g.competency_id} className="px-6 py-4 hover:bg-slate-50/70 transition-colors">
                <div
                  className="flex items-center gap-4 cursor-pointer select-none"
                  onClick={() => setExpanded(isExpanded ? null : g.competency_id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{g.competency_name}</span>
                      <span className="text-xs text-slate-500 font-mono px-1.5 py-0.2 bg-slate-100 rounded">
                        {g.competency_id}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded border text-xs font-semibold', getGapColor(g.gap_label))}>
                        {g.gap_label} Priority
                      </span>
                      {g.isCoreForRole && (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                          Core Role Requirement
                        </span>
                      )}
                      <span className={cn(
                        'text-2xs font-semibold px-1.5 py-0.5 rounded border',
                        confidence === 'High'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : confidence === 'Medium'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}>
                        <ShieldCheck size={10} className="inline mr-0.5" />
                        {confidence} Confidence
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">{g.category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full relative overflow-hidden">
                        <div className="h-full rounded-full bg-slate-300" style={{ width: `${g.required_percentage}%` }} />
                        <div
                          className={cn('h-full rounded-full absolute top-0', getGapBarColor(g.gap_label))}
                          style={{ width: `${g.current_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-600 w-36 flex-shrink-0 text-right">
                        {g.current_percentage.toFixed(0)}% / {g.required_percentage}% req
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right w-28">
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md inline-block">
                      -{gapPoints} pts
                    </span>
                    <p className="text-2xs text-slate-400 mt-0.5">Gap: {g.gap} level{g.gap !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Expanded Dynamic Reasoning & Action Panel */}
                {isExpanded && (
                  <div className="mt-4 p-4 bg-slate-50/90 rounded-xl border border-slate-200/80 animate-fade-in text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles size={13} className="text-navy-700" />
                        Dynamic Gap Reasoning &amp; Impact Analysis
                      </span>
                      {g.primaryEvidence && (
                        <span className="text-2xs text-slate-500">
                          Source: <strong>{g.primaryEvidence}</strong>
                        </span>
                      )}
                    </div>

                    {/* Main Explanation */}
                    <p className="text-slate-700 text-sm leading-relaxed">{g.explanation}</p>

                    {/* Specific Evidence-Based Priority Drivers */}
                    {g.priorityReasons && g.priorityReasons.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200/90 space-y-1.5">
                        <span className="font-semibold text-slate-700 text-xs block mb-1">
                          Diagnostic Drivers for {g.priority || g.gap_label} Priority Ranking:
                        </span>
                        {g.priorityReasons.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-600">
                            <span className="text-navy-700 font-bold">•</span>
                            <span className="leading-snug">{reason}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Pathways */}
                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                      <div className="text-2xs text-slate-500">
                        {confidence === 'Low' ? (
                          <span className="text-amber-700 font-medium">
                            ⚠ Unverified score: take diagnostic assessment to verify true competency.
                          </span>
                        ) : (
                          <span>Targeted training will immediately reduce this gap upon module completion.</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {confidence === 'Low' && (
                          <Link
                            href="/assessments"
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <ClipboardList size={12} /> Take Verification Assessment
                          </Link>
                        )}
                        <Link
                          href={`/courses?competency=${g.competency_id}`}
                          className="px-3 py-1.5 bg-navy-700 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <BookOpen size={12} /> Find Courses for {g.competency_name.split(' ')[0]} <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {noGaps.length > 0 && (
            <div className="px-6 py-4 bg-emerald-50/20">
              <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Verified Strengths &amp; Met Role Benchmarks ({noGaps.length})
              </p>
              <div className="divide-y divide-emerald-100/60">
                {noGaps.map(g => (
                  <div key={g.competency_id} className="flex items-center gap-3 py-2 text-xs">
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="font-medium text-slate-700">{g.competency_name}</span>
                    <span className="text-slate-400 font-mono text-2xs">{g.competency_id}</span>
                    <span className="text-emerald-600 font-semibold ml-auto font-mono">
                      {g.current_percentage.toFixed(0)}% (Req: {g.required_percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Link href="/courses"
          className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-xs">
          View Recommended Courses <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

