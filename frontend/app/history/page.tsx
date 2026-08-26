'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { learningApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { History, Award, Clock, BookOpen, CheckCircle2, Star, Download } from 'lucide-react';

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    learningApi.getHistory(user.id)
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const completed = history.filter(h => h.status === 'Completed');
  const inProgress = history.filter(h => h.status === 'In Progress');
  const totalHours = history.reduce((acc, h) => acc + (h.hours_spent || 0), 0);

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-8 skeleton w-64 mb-8" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <History size={22} className="text-navy-700" /> Learning History & Achievements
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Track completed courses, ongoing training, and official certifications
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="kpi-card">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
            <Award size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-800">{completed.length}</p>
          <p className="text-xs text-slate-500">Completed Courses</p>
        </div>

        <div className="kpi-card">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <Clock size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalHours.toFixed(1)} hrs</p>
          <p className="text-xs text-slate-500">Total Learning Time</p>
        </div>

        <div className="kpi-card">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
            <BookOpen size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-800">{inProgress.length}</p>
          <p className="text-xs text-slate-500">Currently In Progress</p>
        </div>
      </div>

      {/* History List */}
      <div className="gov-card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="section-header">Course Log & Certifications</h2>
          <span className="text-xs text-slate-400">{history.length} records</span>
        </div>

        <div className="divide-y divide-slate-100">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No learning history recorded yet.</div>
          ) : (
            history.map((record) => {
              const isComp = record.status === 'Completed';
              return (
                <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={cn(
                          'text-xs font-semibold px-2.5 py-0.5 rounded-full border',
                          isComp
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        )}>
                          {record.status}
                        </span>
                        {record.course?.provider && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {record.course.provider}
                          </span>
                        )}
                        {record.completed_at && (
                          <span className="text-xs text-slate-400">
                            Completed on {formatDate(record.completed_at)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        {record.course?.title || 'Training Programme'}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {record.course?.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Time Spent</p>
                        <p className="text-sm font-semibold text-slate-700">{record.hours_spent || 0} hrs</p>
                      </div>

                      {record.score !== null && record.score !== undefined && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Score</p>
                          <p className="text-sm font-bold text-emerald-600">{record.score}%</p>
                        </div>
                      )}

                      {isComp && (
                        <button
                          onClick={() => alert(`Certificate verification code for ${record.course?.title}: STATWISE-CERT-${record.id}-2024`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy-700 bg-navy-50 hover:bg-navy-100 rounded-lg border border-navy-200 transition-colors"
                        >
                          <Download size={14} /> Certificate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
