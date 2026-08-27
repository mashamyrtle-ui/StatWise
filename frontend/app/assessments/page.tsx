'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import * as store from '@/lib/store';
import { cn } from '@/lib/utils';
import { ClipboardList, ChevronLeft, ChevronRight, Timer, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

const QUESTIONS = store.ASSESSMENT_QUESTIONS;
const TIME_LIMIT_SECONDS = 35 * 60;

// ── Inner component uses useSearchParams (needs Suspense) ─────────────────────

function AssessmentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new') === '1';

  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<store.AssessmentResult | null>(null);
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const timerRef = useRef<any>(null);

  const startAssessment = () => {
    setAnswers({});
    setCurrent(0);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setPhase('quiz');
  };

  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleSubmit = () => {
    if (!user) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = store.submitAssessment(user.id, answers);
      setResult(res);
      setPhase('result');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const q = QUESTIONS[current];
  const answered = Object.keys(answers).length;

  // ── INTRO ──
  if (phase === 'intro') return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList size={22} className="text-navy-700" /> Competency Assessment
        </h1>
        <p className="text-slate-500 text-sm mt-1">Test your current skills and update your competency profile</p>
      </div>

      <div className="max-w-2xl">
        {isNewUser && (
          <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800">Your profile is ready!</p>
              <p className="text-blue-600 text-sm mt-0.5">Complete the competency assessment to generate your personalized learning profile.</p>
            </div>
          </div>
        )}

        <div className="gov-card p-8 text-center mb-6">
          <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-navy-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Competency Diagnostic Assessment</h2>
          <p className="text-slate-500 text-sm mb-6">
            A comprehensive diagnostic covering Statistical, Technical, Digital Governance, and Behavioural competencies.
            Your results update your competency profile and generate personalized recommendations instantly.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            {[['20', 'Questions'], ['35 min', 'Time Limit'], ['4 domains', 'Covered']].map(([v, l]) => (
              <div key={l} className="bg-slate-50 rounded-xl p-3">
                <p className="font-bold text-navy-700 text-lg">{v}</p>
                <p className="text-slate-500 text-xs">{l}</p>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left mb-6">
            <p className="text-blue-700 text-sm font-medium mb-1">AI-Powered Intelligence</p>
            <p className="text-blue-600 text-xs">
              Answers are scored per competency domain. Skill gaps, recommendations, and your learning path are computed instantly from your results — no server required.
            </p>
          </div>
          <button onClick={startAssessment}
            className="bg-navy-700 hover:bg-navy-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto">
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );

  // ── QUIZ ──
  if (phase === 'quiz' && q) return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Competency Assessment</h1>
          <p className="text-slate-500 text-sm">Question {current + 1} of {QUESTIONS.length} · {answered} answered</p>
        </div>
        <div className={cn('flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg',
          timeLeft < 120 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-700')}>
          <Timer size={18} /> {formatTime(timeLeft)}
        </div>
      </div>

      <div className="h-2 bg-slate-100 rounded-full mb-6">
        <div className="h-full bg-navy-700 rounded-full transition-all duration-300"
          style={{ width: `${(current + 1) / QUESTIONS.length * 100}%` }} />
      </div>

      <div className="max-w-2xl">
        <div className="gov-card p-8 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">Q{current + 1}</span>
            <span className="text-xs font-medium text-slate-500">{q.difficulty}</span>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border">{q.competency_code}</span>
          </div>
          <p className="text-base font-semibold text-slate-800 mb-6 leading-relaxed">{q.question_text}</p>
          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map(opt => {
              const text = q[`option_${opt.toLowerCase()}` as keyof typeof q] as string;
              const isSelected = answers[q.id] === opt;
              return (
                <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                  className={cn('w-full text-left p-4 rounded-xl border-2 transition-all text-sm',
                    isSelected ? 'border-navy-600 bg-navy-50 text-navy-800 font-medium' : 'border-slate-200 bg-white text-slate-700 hover:border-navy-300 hover:bg-slate-50')}>
                  <span className={cn('inline-block w-6 h-6 rounded-full text-xs font-bold text-center leading-6 mr-3 flex-shrink-0',
                    isSelected ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600')}>{opt}</span>
                  {text}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-navy-300 disabled:opacity-40 transition-all">
            <ChevronLeft size={16} /> Previous
          </button>

          <div className="flex gap-1">
            {QUESTIONS.slice(0, 20).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn('w-6 h-6 rounded text-xs font-medium transition-all',
                  i === current ? 'bg-navy-700 text-white' :
                  answers[QUESTIONS[i]?.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                {i + 1}
              </button>
            ))}
          </div>

          {current < QUESTIONS.length - 1 ? (
            <button onClick={() => setCurrent(c => Math.min(QUESTIONS.length - 1, c + 1))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-700 text-white text-sm font-medium hover:bg-navy-800 transition-all">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60">
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Submit Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── RESULT ──
  if (phase === 'result' && result) return (
    <div className="page-container animate-fade-in">
      <div className="max-w-3xl">
        <div className={cn('gov-card p-8 text-center mb-6',
          result.score_percentage >= 80 ? 'border-emerald-200' : result.score_percentage >= 60 ? 'border-blue-200' : 'border-amber-200')}>
          <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
            result.score_percentage >= 80 ? 'bg-emerald-50' : result.score_percentage >= 60 ? 'bg-blue-50' : 'bg-amber-50')}>
            <span className={cn('text-3xl font-bold',
              result.score_percentage >= 80 ? 'text-emerald-600' : result.score_percentage >= 60 ? 'text-blue-600' : 'text-amber-600')}>
              {result.score_percentage.toFixed(0)}%
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Assessment Complete!</h2>
          <p className="text-slate-500">{result.correct_count} / {result.total_count} correct</p>
          <p className="text-sm text-slate-600 mt-3">{result.summary}</p>
        </div>

        {result.competency_updates?.length > 0 && (
          <div className="gov-card p-6 mb-6">
            <h3 className="section-header mb-4">Competency Profile Updated</h3>
            <div className="space-y-3">
              {result.competency_updates.map(u => (
                <div key={u.competency_id} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-700 w-44 flex-shrink-0 truncate">{u.competency_name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full">
                    <div className="h-full bg-navy-700 rounded-full" style={{ width: `${u.after}%` }} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">{u.before.toFixed(0)}%</span>
                    <ChevronRight size={14} className="text-slate-400" />
                    <span className={cn('font-bold', u.delta >= 0 ? 'text-emerald-600' : 'text-red-500')}>{u.after.toFixed(0)}%</span>
                    <span className={cn('text-xs', u.delta >= 0 ? 'text-emerald-500' : 'text-red-400')}>
                      {u.delta >= 0 ? '+' : ''}{u.delta.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="gov-card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="section-header">Detailed Review</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {result.question_results.map((qr, idx) => (
              <div key={qr.question_id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  {qr.is_correct
                    ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 mb-2">Q{idx + 1}. {qr.question_text}</p>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const text = qr[`option_${opt.toLowerCase()}` as keyof typeof qr] as string;
                        const isCorrect = opt === qr.correct_answer;
                        const isSelected = opt === qr.selected_answer;
                        return (
                          <div key={opt} className={cn('text-xs p-2 rounded',
                            isCorrect ? 'bg-emerald-50 text-emerald-700 font-medium' :
                            isSelected && !isCorrect ? 'bg-red-50 text-red-700' : 'text-slate-500')}>
                            <span className="font-bold">{opt}.</span> {text}
                            {isCorrect && <span className="ml-1">✓</span>}
                            {isSelected && !isCorrect && <span className="ml-1">✗</span>}
                          </div>
                        );
                      })}
                    </div>
                    {qr.explanation && (
                      <div className="bg-blue-50 border border-blue-100 rounded p-2">
                        <p className="text-xs text-blue-700">{qr.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Link href="/skill-gap" className="flex-1 text-center bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors">
            View Updated Skill Gaps
          </Link>
          <Link href="/courses" className="flex-1 text-center bg-white border border-slate-200 hover:border-navy-300 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
            View Recommendations
          </Link>
        </div>
      </div>
    </div>
  );

  return null;
}

// ── Export with Suspense boundary ─────────────────────────────────────────────

export default function AssessmentsPage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="h-8 skeleton w-64 mb-8" /><div className="h-72 skeleton rounded-xl" /></div>}>
      <AssessmentsContent />
    </Suspense>
  );
}
