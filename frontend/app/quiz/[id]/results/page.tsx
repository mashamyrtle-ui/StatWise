'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QuizResultsPage() {
  const { id } = useParams();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`quiz_result_${id}`);
    if (stored) setResult(JSON.parse(stored));
  }, [id]);

  if (!result) return (
    <div className="page-container">
      <p className="text-slate-500">No results found. Please take the quiz first.</p>
      <Link href="/quiz-generator" className="text-navy-700 hover:underline mt-2 inline-block">← Back to Quiz Generator</Link>
    </div>
  );

  return (
    <div className="page-container animate-fade-in">
      <Link href="/quiz-generator" className="flex items-center gap-1 text-slate-500 hover:text-navy-700 text-sm mb-4">
        <ArrowLeft size={14} /> Back to Quiz Generator
      </Link>

      <div className="max-w-3xl">
        <div className={cn(
          'gov-card p-8 text-center mb-6',
          result.score_percentage >= 80 ? 'border-emerald-200 bg-emerald-50/30' : result.score_percentage >= 60 ? 'border-blue-200' : 'border-amber-200'
        )}>
          <Trophy size={40} className={cn('mx-auto mb-3', result.score_percentage >= 80 ? 'text-amber-500' : result.score_percentage >= 60 ? 'text-blue-500' : 'text-slate-400')} />
          <p className={cn('text-4xl font-bold mb-1', result.score_percentage >= 80 ? 'text-emerald-600' : result.score_percentage >= 60 ? 'text-blue-600' : 'text-amber-600')}>
            {result.score_percentage.toFixed(0)}%
          </p>
          <p className="text-slate-600">{result.correct_count} / {result.total_count} correct</p>
          <p className="text-sm text-slate-500 mt-2">{result.summary}</p>
        </div>

        {result.competency_updates?.length > 0 && (
          <div className="gov-card p-6 mb-6">
            <h3 className="section-header mb-3">Competency Updates</h3>
            {result.competency_updates.map((u: any) => (
              <div key={u.competency_id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm font-medium text-slate-700 w-40">{u.competency_name}</span>
                <span className="text-sm text-slate-400">{u.before.toFixed(0)}%</span>
                <span className="text-slate-300">→</span>
                <span className={cn('text-sm font-bold', u.delta >= 0 ? 'text-emerald-600' : 'text-red-500')}>{u.after.toFixed(0)}%</span>
                <span className={cn('text-xs', u.delta >= 0 ? 'text-emerald-500' : 'text-red-400')}>{u.delta >= 0 ? '+' : ''}{u.delta.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}

        <div className="gov-card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="section-header">Detailed Review</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {result.question_results?.map((qr: any, idx: number) => (
              <div key={qr.question_id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  {qr.is_correct ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 mb-2">{qr.question_text}</p>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const text = qr[`option_${opt.toLowerCase()}`];
                        if (!text) return null;
                        const isCorrect = opt === qr.correct_answer;
                        const isSelected = opt === qr.selected_answer;
                        return (
                          <div key={opt} className={cn(
                            'text-xs p-2 rounded',
                            isCorrect ? 'bg-emerald-50 text-emerald-700 font-medium' :
                            isSelected && !isCorrect ? 'bg-red-50 text-red-700' : 'text-slate-500'
                          )}>
                            {opt}. {text}
                            {isCorrect && ' ✓'}
                            {isSelected && !isCorrect && ' ✗'}
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
      </div>
    </div>
  );
}
