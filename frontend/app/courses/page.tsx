'use client';

import { useEffect, useState } from 'react';
import { coursesApi, recommendationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn, getProviderColor, getDifficultyColor } from '@/lib/utils';
import { BookOpen, Search, Filter, Star, Clock, Tag, CheckCircle2 } from 'lucide-react';

const PROVIDERS = ['All', 'iGOT Karmayogi', 'NSSTA', 'Other Govt Training'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [enrolled, setEnrolled] = useState<Set<number>>(new Set());

  useEffect(() => {
    const load = async () => {
      const [cRes, rRes] = await Promise.all([
        coursesApi.list(),
        user ? recommendationsApi.get(user.id) : Promise.resolve({ data: [] }),
      ]);
      setCourses(cRes.data);
      setRecommendations(rRes.data);
      setLoading(false);
    };
    load().catch(console.error);
  }, [user]);

  const recByCoure: Record<number, any> = {};
  recommendations.forEach(r => { recByCoure[r.course_id] = r; });

  const filtered = courses.filter(c => {
    if (provider !== 'All' && c.provider !== provider) return false;
    if (difficulty !== 'All' && c.difficulty !== difficulty) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleEnroll = async (courseId: number) => {
    setEnrolling(courseId);
    try {
      await coursesApi.enroll(courseId);
      setEnrolled(prev => new Set(Array.from(prev).concat([courseId])));
    } catch (e) { }
    setEnrolling(null);
  };

  if (loading) return (
    <div className="page-container">
      <div className="h-8 skeleton w-48 mb-8" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-48 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen size={22} className="text-navy-700" /> Course Catalogue
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {filtered.length} courses from iGOT Karmayogi, NSSTA, and other government training programmes
        </p>
        <div className="badge-mock mt-2 w-fit">iGOT Integration: Prototype / Mock</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
        <div className="flex gap-2">
          {PROVIDERS.map(p => (
            <button key={p} onClick={() => setProvider(p)}
              className={cn('px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                provider === p ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300')}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={cn('px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                difficulty === d ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300')}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Courses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(course => {
          const rec = recByCoure[course.id];
          const isEnrolled = enrolled.has(course.id);

          return (
            <div key={course.id} className={cn(
              'gov-card p-5 flex flex-col gap-3',
              rec && 'ring-2 ring-navy-300 ring-offset-1'
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-2 flex-wrap">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded border', getProviderColor(course.provider))}>
                    {course.provider}
                  </span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded border', getDifficultyColor(course.difficulty))}>
                    {course.difficulty}
                  </span>
                </div>
                {rec && (
                  <span className="flex-shrink-0 text-xs font-bold text-navy-700 bg-navy-50 border border-navy-200 px-2 py-0.5 rounded-full">
                    {rec.match_score.toFixed(0)}% match
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-800 leading-snug">{course.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 flex-1">{course.description}</p>

              {rec && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                  <p className="text-xs text-blue-700 line-clamp-2">{rec.reason}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={12} /> {course.duration_hours}h</span>
                  <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" /> {course.rating}</span>
                </div>
                <button
                  onClick={() => handleEnroll(course.id)}
                  disabled={isEnrolled || enrolling === course.id}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
                    isEnrolled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-navy-700 hover:bg-navy-800 text-white'
                  )}
                >
                  {enrolling === course.id ? '...' : isEnrolled ? (
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Enrolled</span>
                  ) : 'Enroll'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No courses match your filters. Try adjusting the search.</p>
        </div>
      )}
    </div>
  );
}
