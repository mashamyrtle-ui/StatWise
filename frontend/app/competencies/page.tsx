'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as store from '@/lib/store';
import { getProgressColor, getScoreColor, cn, getLevelName } from '@/lib/utils';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Target, TrendingUp, Star, Filter, ClipboardList, ShieldCheck,
  Award, Info, ChevronDown, ChevronUp, BookOpen, AlertCircle,
  Briefcase, CheckCircle2, ArrowRight, Sparkles, History
} from 'lucide-react';
import Link from 'next/link';

export default function CompetenciesPage() {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<store.CompetencyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedCompId, setExpandedCompId] = useState<string | null>(null);

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
            Your verified competency profile will appear here after you complete the diagnostic assessment.
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
          Evidence-based competency profile across official statistical and technical domains — {competencies.length} competencies diagnosed
        </p>
      </div>

      {/* Verification Standard Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <ShieldCheck size={20} className="text-navy-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-xs text-slate-600">
          <p className="font-semibold text-slate-800 text-sm">Official Multi-Evidence Competency Verification Standard</p>
          <p className="mt-0.5 leading-relaxed">
            StatWise competency scores are determined using our AI Competency Engine, synthesizing{' '}
            <span className="font-semibold text-slate-700">Diagnostic Assessments</span>,{' '}
            <span className="font-semibold text-slate-700">Accredited Coursework</span>,{' '}
            <span className="font-semibold text-slate-700">Cadre Work Experience</span>, and{' '}
            <span className="font-semibold text-slate-700">Self-Reported Familiarity</span>. Self-assessment alone never inflates official verified scores.
          </p>
        </div>
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="section-header"><Filter size={16} className="text-slate-500" /> Detailed Competency Breakdown &amp; Evidence Audit</h2>
          <span className="text-xs text-slate-400">Click any competency to inspect full multi-source evidence trail</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map(uc => {
            const isExpanded = expandedCompId === uc.competency_id;
            const confidence = uc.confidence || 'Medium';
            const evidenceCount = uc.evidence?.length || 0;

            return (
              <div key={uc.competency_id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
                <div
                  className="flex items-center gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedCompId(isExpanded ? null : uc.competency_id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{uc.competency_name}</span>
                      <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full font-mono">{uc.code}</span>
                      <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">{uc.category}</span>

                      {/* Confidence Badge */}
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border',
                        confidence === 'High'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : confidence === 'Medium'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}>
                        <ShieldCheck size={11} />
                        {confidence} Confidence
                      </span>

                      {/* Primary Evidence Source Tag */}
                      {uc.primaryEvidence && (
                        <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md truncate max-w-xs">
                          {uc.primaryEvidence}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', getProgressColor(uc.score_percentage))}
                          style={{ width: `${uc.score_percentage}%` }}
                        />
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

                  <div className="flex gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map(l => (
                      <div
                        key={l}
                        className={cn('w-3 h-3 rounded-sm', l <= uc.current_level ? 'bg-navy-700' : 'bg-slate-200')}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-navy-700 transition-colors"
                    title={isExpanded ? 'Collapse evidence audit' : 'Expand evidence audit'}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded Multi-Source Evidence Audit Trail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 bg-slate-50/80 -mx-6 -mb-4 px-6 py-4 rounded-b-xl animate-fade-in text-xs">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-navy-700" />
                        <span className="font-bold text-slate-800 uppercase tracking-wide">
                          AI Competency Engine Audit Trail &amp; Provenance
                        </span>
                      </div>
                      <span className="text-slate-500">
                        {evidenceCount} verified source{evidenceCount !== 1 ? 's' : ''} evaluated
                      </span>
                    </div>

                    {/* Engine Reasoning Observation Box */}
                    {(uc.observation || uc.evidenceSummary) && (
                      <div className={cn(
                        'p-3 rounded-lg border mb-4 flex items-start gap-2.5',
                        uc.observation?.includes('substantially lower')
                          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                          : uc.observation?.includes('substantially higher')
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                          : 'bg-blue-50/90 border-blue-200 text-blue-900'
                      )}>
                        <Info size={15} className="flex-shrink-0 mt-0.5" />
                        <div>
                          {uc.observation && (
                            <p className="font-medium leading-relaxed">{uc.observation}</p>
                          )}
                          {uc.evidenceSummary && (
                            <p className="text-xs opacity-90 mt-0.5">{uc.evidenceSummary}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Evidence Sources Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {/* 1. Self-Reported Proficiency */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <ClipboardList size={13} className="text-slate-500" />
                            Self-Reported Familiarity
                          </span>
                          <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Non-verified subjective
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">
                          {uc.selfReportedProficiency && uc.selfReportedProficiency !== 'None'
                            ? `Officer self-reported: "${uc.selfReportedProficiency}"`
                            : 'No self-assessment recorded'}
                        </p>
                        <p className="text-slate-400 text-2xs mt-0.5">
                          Weighted as supporting evidence only (never determines official score).
                        </p>
                      </div>

                      {/* 2. Primary Objective Assessment Anchor */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Award size={13} className="text-navy-700" />
                            Verified Objective Assessment
                          </span>
                          <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">
                          {uc.primaryEvidence || `${uc.score_percentage}% demonstrated capability`}
                        </p>
                        <p className="text-slate-400 text-2xs mt-0.5">
                          High confidence objective anchor from standardized evaluation.
                        </p>
                      </div>

                      {/* 3. Training & Coursework Provenance */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <BookOpen size={13} className="text-blue-600" />
                            Accredited Coursework &amp; Training
                          </span>
                          <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            iGOT / NSSTA
                          </span>
                        </div>
                        {uc.evidence?.some(e => e.type === 'training_completion' && e.score !== undefined) ? (
                          <div className="space-y-1">
                            {uc.evidence
                              .filter(e => e.type === 'training_completion' && e.score !== undefined)
                              .map((e, idx) => (
                                <p key={idx} className="text-slate-700 font-medium">
                                  ✓ {e.details}
                                </p>
                              ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic">No accredited course completed for this competency yet.</p>
                        )}
                      </div>

                      {/* 4. Cadre Work Experience */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Briefcase size={13} className="text-purple-600" />
                            Cadre Experience &amp; Projects
                          </span>
                          <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Cadre Records
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium">
                          {uc.evidence?.find(e => e.type === 'work_experience')?.details ||
                            `${user?.years_experience || 0} years official cadre service in ${user?.department?.name || 'Department of Statistics'}`}
                        </p>
                      </div>
                    </div>

                    {/* History Progression Timeline */}
                    {uc.history && uc.history.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-2">
                          <History size={13} className="text-slate-500" />
                          Competency Progression History
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {uc.history.map((h, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-medium">
                                {h.stage}: {h.score}%
                              </span>
                              {h.delta !== undefined && (
                                <span className={cn('font-bold', h.delta >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                                  ({h.delta >= 0 ? '+' : ''}{h.delta} pts)
                                </span>
                              )}
                              <span className="text-slate-400 text-2xs">{h.date}</span>
                              {idx < uc.history!.length - 1 && <span className="text-slate-300">→</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Prompt */}
                    <div className="mt-3 flex items-center justify-between text-2xs text-slate-500">
                      <span>Status: <strong className="text-slate-700">{uc.status || 'Verified'}</strong></span>
                      <Link
                        href={`/courses?competency=${uc.code}`}
                        className="text-navy-700 hover:text-navy-900 font-semibold inline-flex items-center gap-1"
                      >
                        Target this competency in Course Catalogue <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

