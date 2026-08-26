'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { materialsApi, quizzesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Sparkles, Upload, FileText, ChevronRight, CheckCircle2, XCircle,
  Pencil, Trash2, RefreshCw, Eye, EyeOff, Plus, BookOpen
} from 'lucide-react';
import Link from 'next/link';

type Phase = 'upload' | 'configure' | 'generating' | 'review' | 'done';

export default function QuizGeneratorPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('upload');
  const [material, setMaterial] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState({ count: 10, difficulty: 'Medium', focus: 'Sampling' });
  const [editingQ, setEditingQ] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAnswers, setShowAnswers] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await materialsApi.upload(file);
      setMaterial(res.data);
      const detected = res.data.competencies_detected?.[0] || res.data.concepts_detected?.[0] || '';
      setConfig(c => ({ ...c, focus: detected }));
      setPhase('configure');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!material) return;
    setPhase('generating');
    setGenerating(true);
    try {
      const res = await quizzesApi.generate(material.id, config.count, config.difficulty, config.focus);
      setQuiz(res.data);
      setPhase('review');
    } catch (e: any) {
      alert('Generation failed: ' + (e?.response?.data?.detail || e.message));
      setPhase('configure');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!quiz) return;
    setPublishing(true);
    try {
      await quizzesApi.publish(quiz.id);
      setPhase('done');
    } catch (e) { }
    setPublishing(false);
  };

  const handleDeleteQ = async (qId: number) => {
    if (!quiz) return;
    await quizzesApi.deleteQuestion(quiz.id, qId);
    setQuiz((prev: any) => ({ ...prev, questions: prev.questions.filter((q: any) => q.id !== qId) }));
  };

  const handleSaveEdit = async () => {
    if (!quiz || editingQ === null) return;
    await quizzesApi.updateQuestion(quiz.id, editingQ, editForm);
    setQuiz((prev: any) => ({
      ...prev,
      questions: prev.questions.map((q: any) => q.id === editingQ ? { ...q, ...editForm } : q),
    }));
    setEditingQ(null);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles size={22} className="text-purple-600" /> AI Assessment Studio
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload learning material → AI generates MCQs → Review & edit → Publish quiz
        </p>
      </div>

      {/* Phase stepper */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'configure', 'review', 'done'] as const).map((p, i) => {
          const labels = ['Upload', 'Configure', 'Review', 'Published'];
          const current = ['upload', 'configure', 'generating', 'review', 'done'].indexOf(phase);
          const stepIdx = ['upload', 'configure', 'review', 'done'].indexOf(p);
          const done = current > stepIdx || (p === 'done' && phase === 'done');
          const active = (p === 'upload' && (phase === 'upload')) ||
                         (p === 'configure' && (phase === 'configure' || phase === 'generating')) ||
                         (p === 'review' && phase === 'review') ||
                         (p === 'done' && phase === 'done');
          return (
            <div key={p} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                active ? 'bg-navy-700 text-white' : done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
              )}>
                {done && !active && <CheckCircle2 size={12} />}
                {i + 1}. {labels[i]}
              </div>
              {i < 3 && <ChevronRight size={14} className="text-slate-300" />}
            </div>
          );
        })}
      </div>

      {/* PHASE: Upload */}
      {phase === 'upload' && (
        <div className="max-w-xl">
          <div
            className={cn(
              'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
              dragOver ? 'border-navy-500 bg-navy-50' : 'border-slate-300 hover:border-navy-400 hover:bg-slate-50'
            )}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf,.docx,.pptx" className="hidden"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            {uploading ? (
              <div>
                <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-700 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-purple-700 font-medium">Uploading and extracting text...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload size={28} className="text-purple-600" />
                </div>
                <p className="text-slate-700 font-semibold mb-1">Drop your learning material here</p>
                <p className="text-slate-400 text-sm mb-4">Supports PDF, DOCX, PPTX — Max 20MB</p>
                <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors">
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* PHASE: Configure */}
      {(phase === 'configure' || phase === 'generating') && material && (
        <div className="max-w-xl">
          {/* Material info */}
          <div className="gov-card p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{material.filename}</p>
              <p className="text-xs text-slate-500">
                {material.page_count} pages · {material.chunk_count} chunks · Status: <span className={material.status === 'Ready' ? 'text-emerald-600' : 'text-amber-600'}>{material.status}</span>
              </p>
              {material.competencies_detected?.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">Detected: {material.competencies_detected.join(', ')}</p>
              )}
            </div>
            <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
          </div>

          <div className="gov-card p-6">
            <h2 className="section-header mb-4">Configure Quiz Generation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Number of Questions</label>
                <div className="flex gap-2">
                  {[5, 10, 20, 30].map(n => (
                    <button key={n} onClick={() => setConfig(c => ({ ...c, count: n }))}
                      className={cn('px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                        config.count === n ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300')}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {['Easy', 'Medium', 'Hard', 'Adaptive'].map(d => (
                    <button key={d} onClick={() => setConfig(c => ({ ...c, difficulty: d }))}
                      className={cn('px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                        config.difficulty === d ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300')}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Competency Focus (optional)</label>
                <input
                  value={config.focus}
                  onChange={e => setConfig(c => ({ ...c, focus: e.target.value }))}
                  placeholder="e.g. Sampling, Python, GIS, Statistical Analysis..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 mb-2"
                />
                {material.competencies_detected?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-slate-400">Suggested:</span>
                    {material.competencies_detected.map((c: string) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setConfig(cfg => ({ ...cfg, focus: c }))}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition-all font-medium',
                          config.focus === c
                            ? 'bg-purple-100 border-purple-300 text-purple-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-purple-50'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                    {config.focus && (
                      <button
                        type="button"
                        onClick={() => setConfig(cfg => ({ ...cfg, focus: '' }))}
                        className="text-xs text-slate-400 hover:text-slate-600 underline ml-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-700">
                <strong>AI Assessment Engine:</strong> Generates context-aware multiple choice questions, correct answers, and full pedagogical explanations directly from your uploaded document.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={phase === 'generating'}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {phase === 'generating' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating {config.count} questions with AI...
                </>
              ) : (
                <><Sparkles size={18} /> Generate {config.count} Questions</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE: Review */}
      {phase === 'review' && quiz && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Review Generated Questions</h2>
              <p className="text-slate-500 text-sm">{quiz.questions?.length} questions generated · Edit, delete or approve before publishing</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-navy-300 transition-all"
              >
                {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAnswers ? 'Hide' : 'Show'} Answers
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60"
              >
                {publishing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
                Publish Quiz
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {quiz.questions?.map((q: any, idx: number) => (
              <div key={q.id} className="gov-card p-5">
                {editingQ === q.id ? (
                  // Edit form
                  <div className="space-y-3">
                    <textarea
                      value={editForm.question_text ?? q.question_text}
                      onChange={e => setEditForm((f: any) => ({ ...f, question_text: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                      rows={2}
                    />
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <span className="w-6 text-sm font-bold text-slate-400">{opt}.</span>
                        <input
                          value={editForm[`option_${opt.toLowerCase()}`] ?? q[`option_${opt.toLowerCase()}`]}
                          onChange={e => setEditForm((f: any) => ({ ...f, [`option_${opt.toLowerCase()}`]: e.target.value }))}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                        <button
                          onClick={() => setEditForm((f: any) => ({ ...f, correct_answer: opt }))}
                          className={cn('px-2 py-1 rounded text-xs font-medium border transition-all',
                            (editForm.correct_answer ?? q.correct_answer) === opt
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'border-slate-200 text-slate-400')}
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit}
                        className="px-4 py-2 bg-navy-700 text-white text-sm rounded-lg hover:bg-navy-800 transition-all">
                        Save
                      </button>
                      <button onClick={() => { setEditingQ(null); setEditForm({}); }}
                        className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:border-navy-300 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Q{idx + 1}</span>
                        <span className="text-xs text-slate-400">{q.difficulty}</span>
                        {q.competency_name && <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">{q.competency_name}</span>}
                        {q.status === 'Edited' && <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Edited</span>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { setEditingQ(q.id); setEditForm({}); }}
                          className="p-1.5 text-slate-400 hover:text-navy-600 hover:bg-navy-50 rounded transition-all" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteQ(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-3">{q.question_text}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const text = q[`option_${opt.toLowerCase()}`];
                        const isCorrect = opt === q.correct_answer;
                        return (
                          <div key={opt} className={cn(
                            'text-xs p-2 rounded border',
                            showAnswers && isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'
                          )}>
                            <span className="font-bold">{opt}.</span> {text}
                            {showAnswers && isCorrect && <span className="ml-1 text-emerald-600 font-bold">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                    {showAnswers && q.explanation && (
                      <div className="mt-2 bg-blue-50 border border-blue-100 rounded p-2">
                        <p className="text-xs text-blue-700">{q.explanation}</p>
                        {q.source_reference && <p className="text-xs text-blue-400 mt-1">Source: {q.source_reference}</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE: Done */}
      {phase === 'done' && quiz && (
        <div className="max-w-xl text-center">
          <div className="gov-card p-12">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Quiz Published!</h2>
            <p className="text-slate-500 text-sm mb-6">
              {quiz.questions?.length} questions are now available for learners.
            </p>
            <Link
              href={`/quiz/${quiz.id}`}
              className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <BookOpen size={16} /> Take this Quiz
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
