'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { competenciesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TrendingUp, BarChart2, Award, Zap, Target } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    competenciesApi.getUserCompetencies(user.id)
      .then(r => setCompetencies(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Mock progress over time
  const timelineData = [
    { month: 'Jun', score: 52 },
    { month: 'Jul', score: 56 },
    { month: 'Aug', score: 61 },
    { month: 'Sep', score: 65 },
    { month: 'Oct', score: 70 },
    { month: 'Nov (Current)', score: 74 },
  ];

  const categoryData = [
    { category: 'Statistical Methods', current: 78, benchmark: 80 },
    { category: 'Technical / Tools', current: 48, benchmark: 75 },
    { category: 'Digital Governance', current: 52, benchmark: 60 },
    { category: 'Behavioural', current: 70, benchmark: 70 },
  ];

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
          <p className="text-xs text-slate-500 mb-4">Tracking average skill index across all 4 domains over the last 6 months.</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Average Competency']} />
              <Area type="monotone" dataKey="score" stroke="#1e3a5f" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Benchmark */}
        <div className="gov-card p-6">
          <h2 className="section-header mb-4"><Target size={16} className="text-navy-700" /> Domain vs Ministry Benchmark</h2>
          <p className="text-xs text-slate-500 mb-4">Comparison of your current level against target level for Statistical Officers.</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="current" name="Your Score" fill="#1e3a5f" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="benchmark" name="Ministry Benchmark" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
