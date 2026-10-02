'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Bot,
  UserCheck,
  RefreshCw,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  getAssessmentGovernanceList,
  updateAssessmentGovStatus,
  AssessmentGovItem,
  getCurrentUser,
} from '@/lib/store';

interface AIQuestionReview {
  id: string;
  competencyCode: string;
  competencyName: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  aiReviewStatus: 'pending_review' | 'approved' | 'rejected';
  generatedAt: string;
  sourceModule: string;
}

const SAMPLE_AI_QUESTIONS: AIQuestionReview[] = [
  {
    id: 'AI-Q-101',
    competencyCode: 'STAT02',
    competencyName: 'Survey Design & Sampling',
    questionText: 'When designing a two-stage stratified sample for NSS household consumer expenditure, what is the primary purpose of allocating sample first-stage units (FSUs) proportional to population size (PPS)?',
    options: [
      { key: 'A', text: 'To ensure every household in the district has an equal overall probability of selection (self-weighting design).' },
      { key: 'B', text: 'To minimize the total distance traversed by field enumerators during listing.' },
      { key: 'C', text: 'To completely eliminate non-sampling errors during schedule canvassing.' },
      { key: 'D', text: 'To reduce the required sample size of households by exactly 50%.' },
    ],
    correctAnswer: 'A',
    explanation: 'PPS sampling of FSUs combined with equal probability selection of households within selected FSUs yields a self-weighting design, simplifying estimation of population aggregates.',
    aiReviewStatus: 'pending_review',
    generatedAt: '2026-09-24T11:00:00Z',
    sourceModule: 'AI Quiz Generator (Trainer Sunita Rao Prompt)',
  },
  {
    id: 'AI-Q-102',
    competencyCode: 'TECH01',
    competencyName: 'Statistical Software (R/Python/SPSS)',
    questionText: 'In Python pandas, when cleaning a 10-million row official survey dataset, which data type conversion yields the highest RAM reduction for categorical survey codes with few unique values?',
    options: [
      { key: 'A', text: 'Converting object dtype to category dtype' },
      { key: 'B', text: 'Converting float64 to float128' },
      { key: 'C', text: 'Leaving strings as raw Python objects' },
      { key: 'D', text: 'Converting all values to boolean' },
    ],
    correctAnswer: 'A',
    explanation: 'Converting low-cardinality string columns to category dtype replaces repeated text with small integer pointers, typically slashing memory usage by 70–90%.',
    aiReviewStatus: 'pending_review',
    generatedAt: '2026-09-25T14:20:00Z',
    sourceModule: 'Automated Curriculum Assessment AI',
  },
  {
    id: 'AI-Q-103',
    competencyCode: 'DIG01',
    competencyName: 'Digital Data Governance',
    questionText: 'Under the Digital Personal Data Protection Act (DPDPA) 2023, what is the legal obligation of a Data Fiduciary regarding statistical processing of anonymized government datasets?',
    options: [
      { key: 'A', text: 'Anonymized data is exempt from DPDPA processing restrictions as long as re-identification is irreversibly prevented.' },
      { key: 'B', text: 'All anonymized data requires fresh explicit consent from every citizen every 3 months.' },
      { key: 'C', text: 'Government ministries cannot store anonymized data in cloud servers.' },
      { key: 'D', text: 'Anonymized datasets must be deleted after 30 days.' },
    ],
    correctAnswer: 'A',
    explanation: 'Under DPDPA 2023, true irreversible anonymization places data outside the scope of personal data regulation, allowing secure statistical analysis.',
    aiReviewStatus: 'approved',
    generatedAt: '2026-09-22T09:15:00Z',
    sourceModule: 'DPDPA Governance Module',
  },
];

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentGovItem[]>([]);
  const [aiQuestions, setAiQuestions] = useState<AIQuestionReview[]>(SAMPLE_AI_QUESTIONS);
  const [activeTab, setActiveTab] = useState<'assessments' | 'ai_review'>('assessments');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = () => {
    const list = getAssessmentGovernanceList();
    setAssessments(list);
  };

  const handleUpdateStatus = (id: string, status: AssessmentGovItem['status']) => {
    const admin = getCurrentUser()?.profile.name || 'Administrator';
    updateAssessmentGovStatus(id, status, undefined, admin);
    loadAssessments();
    setActionSuccessMsg(`Assessment status updated to "${status}".`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleAIQuestionAction = (qId: string, status: 'approved' | 'rejected') => {
    setAiQuestions(prev =>
      prev.map(q => (q.id === qId ? { ...q, aiReviewStatus: status } : q))
    );
    setActionSuccessMsg(`AI Question ${qId} marked as ${status.toUpperCase()}.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-700">Governance</Link>
            <span>/</span>
            <span className="text-slate-800">Assessment Oversight</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-[#1e3a5f]" />
            Assessment Governance & AI Question Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervise baseline exams, milestone certifications, and review AI-generated questions before official deployment.
          </p>
        </div>

        <button
          onClick={loadAssessments}
          className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {actionSuccessMsg}
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('assessments')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'assessments'
              ? 'border-[#1e3a5f] text-[#1e3a5f]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Official Assessment Protocols ({assessments.length})
        </button>
        <button
          onClick={() => setActiveTab('ai_review')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'ai_review'
              ? 'border-[#1e3a5f] text-[#1e3a5f]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-4 h-4 text-purple-600" />
          AI Question Review Pipeline ({aiQuestions.filter(q => q.aiReviewStatus === 'pending_review').length} Pending)
        </button>
      </div>

      {/* TAB 1: ASSESSMENTS LIST */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 hover:border-slate-300 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                      {item.id} • {item.type}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.domain} Domain</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.status === 'Published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Questions</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{item.questionsCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Assessed</div>
                    <div className="text-sm font-bold text-blue-700 mt-0.5">{item.learnersAssessed}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Avg Score</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">
                      {item.avgScore > 0 ? `${item.avgScore}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Source & Status Toggle */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    {item.source === 'AI Generated' ? (
                      <span className="flex items-center gap-1 text-purple-700 font-medium">
                        <Sparkles className="w-3.5 h-3.5" /> AI Generated
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <UserCheck className="w-3.5 h-3.5" /> Trainer Created
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(item.id, item.status === 'Published' ? 'Under Review' : 'Published')}
                    className="text-xs font-semibold text-[#1e3a5f] hover:underline"
                  >
                    {item.status === 'Published' ? 'Deactivate Exam' : 'Publish Exam'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AI QUESTION REVIEW PIPELINE */}
      {activeTab === 'ai_review' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Human-in-the-Loop AI Governance:</strong> AI-generated questions from the Quiz Generator or Trainer AI Assistant are held in quarantine until approved by an Administrator or Senior Faculty member. Approved items enter the official MoSPI question bank.
            </div>
          </div>

          <div className="space-y-4">
            {aiQuestions.map(q => (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                        {q.id}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {q.competencyName} ({q.competencyCode})
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{q.sourceModule}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2 leading-relaxed">
                      {q.questionText}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 capitalize ${
                    q.aiReviewStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : q.aiReviewStatus === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    {q.aiReviewStatus.replace('_', ' ')}
                  </span>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map(opt => {
                    const isCorrect = opt.key === q.correctAnswer;
                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-lg border ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-bold mr-2">{opt.key}.</span>
                        {opt.text}
                        {isCorrect && (
                          <span className="ml-2 text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded uppercase">
                            Correct Key
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-900 space-y-1">
                  <strong>Statistical Explanation / Syllabus Reference:</strong>
                  <p className="text-slate-600">{q.explanation}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleAIQuestionAction(q.id, 'rejected')}
                    className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    Reject Question
                  </button>
                  <button
                    onClick={() => handleAIQuestionAction(q.id, 'approved')}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve for Official Question Bank
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
