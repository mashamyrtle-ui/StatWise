'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { analyticsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Users, Building2, TrendingUp, AlertTriangle, Zap, Award, BookOpen, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.organization()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-8 skeleton w-64 mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 skeleton rounded-xl" />
          <div className="h-80 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Personnel', value: data?.kpis?.total_employees || 14, icon: Users, color: 'text-navy-700', bg: 'bg-navy-50' },
    { label: 'Workforce Competency Avg', value: `${data?.kpis?.avg_competency || 68}%`, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Learning Hours', value: `${data?.kpis?.learning_hours || 184} hrs`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed Trainings', value: data?.kpis?.courses_completed || 26, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const deptData = data?.department_averages || [];
  const catData = data?.category_averages || [];
  const skillGaps = data?.skill_gaps || [];
  const emerging = data?.emerging_skills || [];

  const PIE_COLORS = ['#1e3a5f', '#2563eb', '#7c3aed', '#10b981', '#f59e0b'];

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={22} className="text-navy-700" /> MoSPI Workforce Competency Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Executive oversight, department benchmarking, and strategic skill planning
          </p>
        </div>
        <div className="badge-mock">Executive Mode · Prototype</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', kpi.bg)}>
                <Icon size={18} className={kpi.color} />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{kpi.value}</p>
              <p className="text-xs text-slate-500">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Grid: Dept comparison & Domain Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Department Average Scores */}
        <div className="gov-card p-6">
          <h2 className="section-header mb-4"><Building2 size={16} className="text-navy-700" /> Department Competency Index</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData} margin={{ left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} height={45} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Average Competency']} />
              <Bar dataKey="avg_score" fill="#1e3a5f" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="gov-card p-6">
          <h2 className="section-header mb-4"><Award size={16} className="text-purple-600" /> Competency Domain Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={catData}
                dataKey="avg_score"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.category}: ${entry.avg_score}%`}
              >
                {catData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}%`, 'Avg Score']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Ministry Critical Gaps & Emerging Skills Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Skill Gaps */}
        <div className="gov-card p-6">
          <h2 className="section-header mb-4 text-red-600 flex items-center gap-2">
            <AlertTriangle size={16} /> Ministry-Wide Skill Deficits (Avg &lt; 60%)
          </h2>
          <div className="space-y-3">
            {skillGaps.map((gap: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-100">
                <span className="text-sm font-semibold text-slate-800">{gap.competency}</span>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${gap.avg_score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-red-600 w-10 text-right">{gap.avg_score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Emerging Skills */}
        <div className="gov-card p-6">
          <h2 className="section-header mb-4 text-amber-600 flex items-center gap-2">
            <Zap size={16} /> Strategic & Emerging Statistical Capabilities
          </h2>
          <div className="space-y-3">
            {emerging.map((skill: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{skill.skill}</span>
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded font-bold uppercase',
                      skill.demand === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    )}>
                      {skill.demand} Demand
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Priority #{skill.priority}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Current: {skill.current}% / Target: {skill.required}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
