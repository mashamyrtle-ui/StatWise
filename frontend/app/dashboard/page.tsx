'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { competenciesApi, recommendationsApi, learningApi, analyticsApi } from '@/lib/api';
import { getGapColor, getProgressColor, getScoreColor, getHour, cn } from '@/lib/utils';
import {
  TrendingUp, Target, BookOpen, Clock, Award, AlertTriangle,
  ArrowRight, Sparkles, ChevronRight, Bell, CheckCircle2,
  BarChart3, Zap, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  Tooltip
} from 'recharts';

interface KPI {
  label: string;
  value: string | number;
  sub?: string;
  icon: any;
  color: string;
  bgColor: string;
  trend?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [compRes, gapRes, recRes, notifRes] = await Promise.all([
          competenciesApi.getUserCompetencies(user.id),
          competenciesApi.getSkillGaps(user.id),
          recommendationsApi.get(user.id),
          analyticsApi.notifications(user.id),
        ]);
        setCompetencies(compRes.data);
        setGaps(gapRes.data);
        setRecommendations(recRes.data.slice(0, 4));
        setNotifications(notifRes.data.filter((n: any) => !n.is_read).slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return null;

  const avgScore = competencies.length
    ? Math.round(competencies.reduce((s, c) => s + c.score_percentage, 0) / competencies.length)
    : 0;

  const highGaps = gaps?.high_priority_count ?? 0;
  const totalGaps = (gaps?.high_priority_count ?? 0) + (gaps?.medium_priority_count ?? 0) + (gaps?.low_priority_count ?? 0);

  // Radar chart data — group by category
  const categoryScores: Record<string, number[]> = {};
  competencies.forEach((c) => {
    const cat = c.competency?.category || 'Other';
    categoryScores[cat] = categoryScores[cat] || [];
    categoryScores[cat].push(c.score_percentage);
  });
  const radarData = Object.entries(categoryScores).map(([cat, scores]) => ({
    subject: cat.split(' ')[0],
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    fullMark: 100,
  }));

  const kpis: KPI[] = [
    { label: 'Overall Competency', value: `${avgScore}%`, sub: 'Across all areas', icon: Target, color: 'text-navy-700', bgColor: 'bg-navy-50' },
    { label: 'Skill Gaps', value: highGaps, sub: `High priority`, icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50', trend: highGaps > 0 ? `${totalGaps} total` : 'None!' },
    { label: 'Courses Completed', value: 3, sub: 'This year', icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { label: 'Learning Hours', value: '61h', sub: 'Accumulated', icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Assessment Score', value: '84%', sub: 'Last assessment', icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
  const firstName = user.name.split(' ')[0];

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-8 skeleton w-64 mb-2" />
        <div className="h-4 skeleton w-96 mb-8" />
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-80 skeleton rounded-xl" />
          <div className="h-80 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

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
          <Link
            href="/assessments"
            className="flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Sparkles size={15} />
            Assess My Competencies
          </Link>
        </div>
      </div>

      {/* iGOT mock badge */}
      <div className="mb-6 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 w-fit">
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse-soft" />
        <span className="text-orange-700 text-xs font-medium">iGOT Integration: Prototype / Mock</span>
        <span className="text-orange-400 mx-1">·</span>
        <span className="text-orange-700 text-xs font-medium">NSSTA Integration: Prototype / Mock</span>
      </div>

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
                {kpi.trend && <p className="text-slate-400 text-xs">{kpi.trend}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Competency Radar */}
        <div className="gov-card p-6 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header"><Target size={16} className="text-navy-700" /> Competency Overview</h2>
            <Link href="/competencies" className="text-xs text-navy-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Radar name="Score" dataKey="score" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {radarData.map((d) => (
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
        </div>

        {/* Skill Gaps */}
        <div className="gov-card p-6 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header"><AlertTriangle size={16} className="text-red-500" /> Priority Skill Gaps</h2>
            <Link href="/skill-gap" className="text-xs text-navy-600 hover:underline flex items-center gap-1">
              Full analysis <ChevronRight size={12} />
            </Link>
          </div>
          {gaps?.gaps?.filter((g: any) => g.gap > 0).slice(0, 6).map((gap: any) => (
            <div key={gap.competency_id} className="flex items-center gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium truncate">{gap.competency_name}</span>
                  <span className={cn('ml-2 px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0', getGapColor(gap.gap_label))}>
                    {gap.gap_label}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full relative">
                  <div
                    className="h-full rounded-full bg-slate-300"
                    style={{ width: `${gap.required_percentage}%` }}
                  />
                  <div
                    className={cn('h-full rounded-full absolute top-0', getProgressColor(gap.current_percentage))}
                    style={{ width: `${gap.current_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>Current: {gap.current_percentage.toFixed(0)}%</span>
                  <span>Required: {gap.required_percentage}%</span>
                </div>
              </div>
            </div>
          ))}
          {(!gaps?.gaps || gaps.gaps.filter((g: any) => g.gap > 0).length === 0) && (
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
        </div>

        {/* Recommended Next Steps */}
        <div className="gov-card p-6 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header"><Zap size={16} className="text-amber-500" /> Recommended Next</h2>
            <button
              onClick={async () => {
                if (!user) return;
                await recommendationsApi.get(user.id, true);
                const res = await recommendationsApi.get(user.id);
                setRecommendations(res.data.slice(0, 4));
              }}
              className="text-xs text-navy-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-3 border border-slate-100 rounded-xl hover:border-navy-200 hover:bg-navy-50/30 transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-navy-700 leading-tight">
                    {rec.course?.title}
                  </p>
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
