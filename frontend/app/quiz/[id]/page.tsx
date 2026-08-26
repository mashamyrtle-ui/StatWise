'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizzesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Timer, Send } from 'lucide-react';

export default function QuizPlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<any>(null);

  useEffect(() => {
    quizzesApi.get(Number(id)).then(r => {
      setQuiz(r.data);
      setTimeLeft(r.data.question_count * 90); // 90s per question
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!quiz) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [quiz]);

  const handleSubmit = async () => {
    if (!quiz) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const res = await quizzesApi.submit(quiz.id, answers, timeTaken);
      // Store result in sessionStorage and navigate to results
      sessionStorage.setItem(`quiz_result_${quiz.id}`, JSON.stringify(res.data));
      router.push(`/quiz/${quiz.id}/results`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return (
    <div className="page-container">
      <div className="max-w-2xl">
        <div className="h-8 skeleton w-64 mb-4" />
        <div className="h-64 skeleton rounded-xl mb-4" />
      </div>
    </div>
  );

  if (!quiz) return <div className="page-container"><p>Quiz not found</p></div>;

  const questions = quiz.questions || [];
  const q = questions[current];
  if (!q) return null;

  const answered = Object.keys(answers).length;

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{quiz.title}</h1>
          <p className="text-slate-500 text-sm">Question {current + 1} of {questions.length} · {answered} answered</p>
        </div>
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold',
          timeLeft < 60 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-700'
        )}>
          <Timer size={16} /> {formatTime(timeLeft)}
        </div>
      </div>

      <div className="h-2 bg-slate-100 rounded-full mb-6">
        <div className="h-full bg-purple-600 rounded-full transition-all duration-300" style={{ width: `${(current + 1) / questions.length * 100}%` }} />
      </div>

      <div className="max-w-2xl">
        <div className="gov-card p-8 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">Q{current + 1}</span>
            {q.difficulty && <span className="text-xs text-slate-400">{q.difficulty}</span>}
            {q.competency_name && <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">{q.competency_name}</span>}
          </div>
          <p className="text-base font-semibold text-slate-800 mb-6 leading-relaxed">{q.question_text}</p>
          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map(opt => {
              const text = q[`option_${opt.toLowerCase()}`];
              const isSelected = answers[String(q.id)] === opt;
              return (
                <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [String(q.id)]: opt }))}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border-2 transition-all text-sm',
                    isSelected ? 'border-purple-500 bg-purple-50 text-purple-800 font-medium' : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:bg-slate-50'
                  )}>
                  <span className={cn('inline-block w-6 h-6 rounded-full text-xs font-bold text-center leading-6 mr-3', isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600')}>{opt}</span>
                  {text}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-navy-300 disabled:opacity-40 transition-all">
            <ChevronLeft size={16} /> Previous
          </button>

          <div className="flex gap-1">
            {questions.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn('w-6 h-6 rounded text-xs font-medium transition-all',
                  i === current ? 'bg-purple-600 text-white' : answers[String(questions[i]?.id)] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                {i + 1}
              </button>
            ))}
          </div>

          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-all">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-all">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
