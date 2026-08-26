'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { learningApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Map, CheckCircle2, Circle, Lock, ArrowDown, Clock, BookOpen, Star } from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  Completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-200' },
  'In Progress': { icon: Circle, color: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-200' },
  Recommended: { icon: Star, color: 'text-amber-600', bg: 'bg-amber-400', border: 'border-amber-200' },
  Locked: { icon: Lock, color: 'text-slate-400', bg: 'bg-slate-300', border: 'border-slate-200' },
};

export default function LearningPathPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    learningApi.getPath(user.id)
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="page-container">
      <div className="h-8 skeleton w-64 mb-8" />
      <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-32 skeleton rounded-xl" />)}</div>
    </div>
  );

  const completedCount = items.filter(i => i.status === 'Completed').length;
  const totalCount = items.length;

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Map size={22} className="text-navy-700" /> Personalized Learning Path
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Your AI-generated learning journey — {completedCount}/{totalCount} courses completed
        </p>
      </div>

      {/* Progress bar */}
      <div className="gov-card p-4 mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Overall Progress</span>
          <span className="text-navy-700 font-bold">{totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full">
          <div
            className="h-full bg-navy-700 rounded-full transition-all duration-700"
            style={{ width: `${totalCount > 0 ? completedCount / totalCount * 100 : 0}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <span key={status} className="flex items-center gap-1">
              <span className={cn('w-2 h-2 rounded-full', cfg.bg)} />
              {status}: {items.filter(i => i.status === status).length}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {items.length === 0 ? (
          <div className="gov-card p-12 text-center">
            <Map size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No learning path items found. Take a competency assessment first!</p>
          </div>
        ) : (
          <div className="space-y-0">
            {items.map((item, idx) => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Locked;
              const Icon = cfg.icon;
              const isLast = idx === items.length - 1;
              const course = item.course;

              return (
                <div key={item.id} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={cn('w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-white', cfg.border)}>
                      <Icon size={18} className={cfg.color} />
                    </div>
                    {!isLast && <div className="w-0.5 h-8 bg-slate-200 my-1" />}
                  </div>

                  {/* Content card */}
                  <div className={cn(
                    'flex-1 gov-card p-4 mb-2',
                    item.status === 'Locked' && 'opacity-60',
                    item.status === 'In Progress' && 'border-blue-200 bg-blue-50/30',
                    item.status === 'Completed' && 'border-emerald-200',
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-400">Step {idx + 1}</span>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', cfg.border, cfg.color, 'bg-white')}>
                            {item.status}
                          </span>
                          {course?.provider && (
                            <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">
                              {course.provider}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">{course?.title}</h3>
                        {item.reason && (
                          <p className="text-xs text-slate-500 mt-1">{item.reason}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {course?.duration_hours && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock size={12} /> {course.duration_hours}h
                          </div>
                        )}
                        {course?.rating && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <Star size={12} className="text-amber-400" /> {course.rating}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.status === 'In Progress' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span><span>40%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full">
                          <div className="h-full w-2/5 bg-blue-500 rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
