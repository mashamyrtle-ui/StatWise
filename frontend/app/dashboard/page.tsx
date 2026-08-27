'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as store from '@/lib/store';
import { getGapColor, getProgressColor, getScoreColor, cn } from '@/lib/utils';
import {
  TrendingUp, Target, BookOpen, Clock, Award, AlertTriangle,
  ArrowRight, Sparkles, ChevronRight, Bell, CheckCircle2,
  BarChart3, Zap, RefreshCw, ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<store.CompetencyScore[]>([]);
  const [gaps, setGaps] = useState<store.SkillGapResult | null>(null);
  const [recommendations, setRecommendations] = useState<store.Recommendation[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [history, setHistory] = useState<store.HistoryItem[]>([]);

  useEffect(() => {
    if (!user) return;
    setCompetencies(store.getCompetencies(user.id));
    setGaps(store.getSkillGaps(user.id));
    setRecommendations(store.getRecommendations(user.id).slice(0, 4));
    setNotifications(store.getNotifications(user.id).filter((n: any) => !n.is_read).slice(0, 3));
    setHistory(store.getLearningHistory(user.id));
  }, [user]);

  if (!user) return null;

  const assessed = user.assessmentCompleted;
  const avgScore = competencies.length
    ? Math.round(competencies.reduce((s, c) => s + c.score_percentage, 0) / competencies.length)
    : 0;

  const highGaps = gaps?.high_priority_count ?? 0;
  const totalGaps = (gaps?.high_priority_count ?? 0) + (gaps?.medium_priority_count ?? 0) + (gaps?.low_priority_count ?? 0);
  const completedCourses = history.filter(h => h.status === 'Completed').length;
  const totalHours = Math.round(history.reduce((a, h) => a + (h.hours_spent || 0), 0));

  // Radar chart
  const categoryScores: Record<string, number[]> = {};
  competencies.forEach(c => {
    const cat = c.category || 'Other';
    categoryScores[cat] = categoryScores[cat] || [];
    categoryScores[cat].push(c.score_percentage);
  });
  const radarData = Object.entries(categoryScores).map(([cat, scores]) => ({
    subject: cat.split(' ')[0],
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    fullMark: 100,
  }));

  const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
  const firstName = user.name.split(' ')[0];

  const kpis = [
    {
      label: 'Overall Competency', icon: Target, color: 'text-navy-700', bgColor: 'bg-navy-50',
      value: assessed ? `${avgScore}%` : 'Not assessed', sub: assessed ? 'Across all areas' : 'Take assessment',
    },
    {
      label: 'Skill Gaps', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50',
      value: assessed ? highGaps : '—', sub: assessed ? `High priority` : 'Complete assessment',
      trend: assessed && highGaps > 0 ? `${totalGaps} total` : undefined,
    },
    {
      label: 'Courses Completed', icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50',
      value: completedCourses, sub: 'Total completed',
    },
    {
      label: 'Learning Hours', icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50',
      value: assessed ? `${totalHours}h` : '0h', sub: 'Accumulated',
    },
    {
      label: 'Assessment Score', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-50',
      value: assessed ? `${user.assessmentCompleted ? (store.getUserById(user.id)?.assessmentScore ?? '—') : '—'}%` : 'Not attempted',
      sub: assessed ? 'Diagnostic score' : 'Not attempted',
    },
  ];

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Good {timeOfDay}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Your personalized competency and learning overview</p>
        </div>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <div className="relative">
              <button className="p-2 bg-white rounded-xl border border-slate-200 hover:border-navy-300 transition-all">
                <Bell size={18} className="text-slate-600" />
              </button>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            </div>
          )}
          <Link href="/assessments"
            className="flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Sparkles size={15} /> Assess My Competencies
          </Link>
        </div>
      </div>

      {/* iGOT badge */}
      <div className="mb-6 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 w-fit">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse-soft" />
        <span className="text-orange-700 text-xs font-medium">iGOT Integration: Prototype / Mock</span>
        <span className="text-orange-400 mx-1">·</span>
        <span className="text-orange-700 text-xs font-medium">NSSTA Integration: Prototype / Mock</span>
      </div>

      {/* Not-assessed banner */}
      {!assessed && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-800 mb-1">Complete your competency assessment to unlock personalized recommendations.</p>
            <p className="text-blue-600 text-sm">The 20-question diagnostic takes about 35 minutes and immediately generates your skill gap analysis, learning path, and course recommendations.</p>
          </div>
          <Link href="/assessments"
            className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Start Now <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', kpi.bgColor)}>
                <Icon size={18} className={kpi.color} />
              </div>
              <div>
                <p className={cn('text-2xl font-bold', kpi.color)}>{kpi.value}</p>
                <p className="text-slate-500 text-xs">{kpi.label}</p>
                {(kpi as any).trend && <p className="text-slate-400 text-xs">{(kpi as any).trend}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Competency Radar */}
        <div className="gov-card p-6 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header"><Target size={16} className="text-navy-700" /> Competency Overview</h2>
            <Link href="/competencies" className="text-xs text-navy-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {!assessed ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Target size={36} className="text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm font-medium">Assessment not completed yet.</p>
              <p className="text-slate-300 text-xs mt-1">Complete the diagnostic to see your competency radar.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar name="Score" dataKey="score" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {radarData.map(d => (
                  <div key={d.subject} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{d.subject}</span>
                        <span className={cn('font-medium', getScoreColor(d.score))}>{d.score}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full">
                        <div className={cn('h-full rounded-full', getProgressColor(d.score))} style={{ width: `${d.score}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Skill Gaps */}
        <div className="gov-card p-6 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header"><AlertTriangle size={16} className="text-red-500" /> Priority Skill Gaps</h2>
            <Link href="/skill-gap" className="text-xs text-navy-600 hover:underline flex items-center gap-1">
              Full analysis <ChevronRight size={12} />
            </Link>
          </div>
          {!assessed ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <AlertTriangle size={36} className="text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm font-medium">Complete your assessment to identify your skill gaps.</p>
            </div>
          ) : (
            <>
              {gaps?.gaps?.filter(g => g.gap > 0).slice(0, 6).map(gap => (
                <div key={gap.competency_id} className="flex items-center gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium truncate">{gap.competency_name}</span>
                      <span className={cn('ml-2 px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0', getGapColor(gap.gap_label))}>
                        {gap.gap_label}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full relative">
                      <div className="h-full rounded-full bg-slate-300" style={{ width: `${gap.required_percentage}%` }} />
                      <div className={cn('h-full rounded-full absolute top-0', getProgressColor(gap.current_percentage))}
                        style={{ width: `${gap.current_percentage}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                      <span>Current: {gap.current_percentage.toFixed(0)}%</span>
                      <span>Required: {gap.required_percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!gaps?.gaps || gaps.gaps.filter(g => g.gap > 0).length === 0) && (
                <div className="text-center py-8">
                  <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No skill gaps! Great work.</p>
                </div>
              )}
              {gaps?.summary && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600">{gaps.summary}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Recommendations */}
        <div className="gov-card p-6 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header"><Zap size={16} className="text-amber-500" /> Recommended Next</h2>
          </div>
          {!assessed ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Zap size={36} className="text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm font-medium">Your personalized learning path will be generated after your assessment.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {recommendations.map(rec => (
                  <div key={rec.id} className="p-3 border border-slate-100 rounded-xl hover:border-navy-200 hover:bg-navy-50/30 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-navy-700 leading-tight">{rec.course?.title}</p>
                      <span className="flex-shrink-0 text-xs font-bold text-navy-700 bg-navy-50 border border-navy-200 px-2 py-0.5 rounded-full">
                        {rec.match_score.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{rec.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">{rec.course?.provider}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{rec.course?.duration_hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/courses" className="mt-4 flex items-center justify-center gap-2 text-navy-700 hover:text-navy-800 text-sm font-medium py-2 border border-navy-200 rounded-xl hover:bg-navy-50 transition-all">
                Browse all courses <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/assessments', icon: BarChart3, label: 'Take Assessment', desc: 'Test your current skills', color: 'text-navy-700 bg-navy-50 border-navy-200' },
          { href: '/learning-path', icon: TrendingUp, label: 'Learning Path', desc: 'Your personalized journey', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { href: '/quiz-generator', icon: Sparkles, label: 'AI Quiz', desc: 'Generate from your material', color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { href: '/assistant', icon: Zap, label: 'AI Assistant', desc: 'Get learning guidance', color: 'text-amber-700 bg-amber-50 border-amber-200' },
        ].map(({ href, icon: Icon, label, desc, color }) => (
          <Link key={href} href={href} className={cn('gov-card p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform border', color)}>
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Icon size={18} className={color.split(' ')[0]} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
