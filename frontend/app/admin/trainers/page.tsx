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
  AlertCircle,
  UserCheck,
  FileText,
  Award,
  ChevronRight,
  Eye,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Send,
  Download,
} from 'lucide-react';
import {
  getTrainerRecords,
  updateTrainerStatus,
  TrainerRecord,
  getCurrentUser,
} from '@/lib/store';

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<TrainerRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'pending' | 'approved' | 'rejected' | 'active'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = () => {
    const list = getTrainerRecords();
    setTrainers(list);
  };

  const currentAdmin = useMemo(() => {
    const u = getCurrentUser();
    return u?.profile.name || 'Administrator';
  }, []);

  // Filtered trainers
  const filteredTrainers = useMemo(() => {
    return trainers.filter(t => {
      if (activeTab !== 'ALL' && t.status !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesEmail = t.email.toLowerCase().includes(q);
        const matchesDept = t.department.toLowerCase().includes(q);
        const matchesQual = t.qualification.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesQual) return false;
      }
      return true;
    });
  }, [trainers, activeTab, searchQuery]);

  // Handle Review Action
  const handleReviewAction = (status: TrainerRecord['status']) => {
    if (!selectedTrainer) return;

    try {
      updateTrainerStatus(selectedTrainer.id, status, reviewNotes, currentAdmin);
      setActionSuccessMsg(`Trainer application for ${selectedTrainer.name} updated to "${status.toUpperCase()}".`);
      loadTrainers();
      setSelectedTrainer(null);
      setReviewNotes('');

      setTimeout(() => {
        setActionSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating trainer status');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-700">Governance</Link>
            <span>/</span>
            <span className="text-slate-800">Trainer Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-[#1e3a5f]" />
            Trainer Governance & Accreditation Workflow
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review faculty applications, verify NSSTA/MoSPI credentials, and grant course instruction privileges.
          </p>
        </div>

        <button
          onClick={loadTrainers}
          className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      {/* Alert banner if action taken */}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Faculty</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{trainers.length}</div>
          <div className="text-xs text-slate-500 mt-1">Across NSSTA & Partner Academies</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Pending Verification
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {trainers.filter(t => t.status === 'pending').length}
          </div>
          <div className="text-xs text-amber-700 mt-1">Requires Administrator review</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active & Approved
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {trainers.filter(t => t.status === 'approved' || t.status === 'active').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Teaching official cohorts</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Avg Cohort Rating</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">88.5%</div>
          <div className="text-xs text-slate-500 mt-1">Trainer post-evaluation benchmark</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({trainers.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              Pending Review ({trainers.filter(t => t.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'approved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved ({trainers.filter(t => t.status === 'approved' || t.status === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'rejected' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected ({trainers.filter(t => t.status === 'rejected').length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculty or specialization..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Trainers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Department & Organization</th>
                <th className="py-3.5 px-4">Qualification & Experience</th>
                <th className="py-3.5 px-4">Subject Expertise</th>
                <th className="py-3.5 px-3 text-center">Taught / Cohort</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No trainer records found in this view.</p>
                  </td>
                </tr>
              ) : (
                filteredTrainers.map(t => {
                  const isPending = t.status === 'pending';

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-blue-50/40 transition group cursor-pointer"
                      onClick={() => {
                        setSelectedTrainer(t);
                        setReviewNotes(t.reviewNotes || '');
                      }}
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition flex items-center gap-2">
                              {t.name}
                              {isPending && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Action Needed
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">{t.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">{t.department}</div>
                        <div className="text-[11px] text-slate-400">Applied: {new Date(t.appliedAt).toLocaleDateString()}</div>
                      </td>

                      {/* Qualification */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-slate-800">{t.qualification}</div>
                        <div className="text-[11px] text-slate-500">{t.experienceYears} Years Academic / Official Exp</div>
                      </td>

                      {/* Expertise Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {t.expertise.map((exp, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {exp}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Learners Count & Score */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="text-xs font-bold text-slate-800">{t.assignedLearnersCount} Learners</div>
                        {t.avgCohortScore > 0 ? (
                          <div className="text-[11px] text-emerald-600 font-medium">{t.avgCohortScore}% Score</div>
                        ) : (
                          <div className="text-[11px] text-slate-400">New Applicant</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          t.status === 'approved' || t.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : t.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {t.status === 'pending' && <Clock className="w-3 h-3" />}
                          {t.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {t.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {t.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrainer(t);
                            setReviewNotes(t.reviewNotes || '');
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            isPending
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isPending ? 'Review Application' : 'View Credentials'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal / Drawer */}
      {selectedTrainer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#1e3a5f] to-[#152844] text-white flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Trainer Accreditation Portfolio
                </span>
                <h2 className="text-xl font-bold">{selectedTrainer.name}</h2>
                <p className="text-xs text-blue-200 mt-0.5">{selectedTrainer.email}</p>
              </div>
              <button
                onClick={() => setSelectedTrainer(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Status Badge & Meta */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="text-xs text-slate-500">Current Accreditation Status</div>
                  <div className="text-sm font-bold text-slate-900 capitalize mt-0.5">
                    {selectedTrainer.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Application Date</div>
                  <div className="text-xs font-medium text-slate-800 mt-0.5">
                    {new Date(selectedTrainer.appliedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Academic & Professional Dossier */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Academic & Professional Credentials
                </h3>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div>
                    <div className="text-xs text-slate-400">Highest Qualification</div>
                    <div className="text-sm font-semibold text-slate-900">{selectedTrainer.qualification}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Department / Institution</div>
                    <div className="text-sm font-semibold text-slate-900">{selectedTrainer.department}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Years of Relevant Experience</div>
                    <div className="text-sm font-semibold text-slate-900">{selectedTrainer.experienceYears} Years</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Core Subject Areas</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedTrainer.expertise.map((exp, i) => (
                        <span key={i} className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposed Programmes */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Assigned / Proposed Training Programmes
                </h3>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  {selectedTrainer.assignedProgrammes.map((p, idx) => (
                    <div key={idx} className="text-xs font-medium text-slate-800 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Supporting Documents */}
              {selectedTrainer.supportingDocuments && selectedTrainer.supportingDocuments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Uploaded Supporting Documentation
                  </h3>
                  <div className="space-y-1.5">
                    {selectedTrainer.supportingDocuments.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white text-xs">
                        <div className="flex items-center gap-2 font-mono text-slate-700">
                          <FileText className="w-4 h-4 text-blue-600" />
                          {doc}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Verified PDF
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Review History */}
              {selectedTrainer.reviewedAt && (
                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1 text-xs">
                  <div className="font-semibold text-blue-900">
                    Previous Review by {selectedTrainer.reviewedBy || 'Admin'}
                  </div>
                  <div className="text-blue-800 text-[11px]">
                    Reviewed on {new Date(selectedTrainer.reviewedAt).toLocaleDateString()}
                  </div>
                  {selectedTrainer.reviewNotes && (
                    <div className="text-slate-700 italic pt-1 border-t border-blue-200/60 mt-1">
                      "{selectedTrainer.reviewNotes}"
                    </div>
                  )}
                </div>
              )}

              {/* Administrator Decision Notes */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Administrator Review Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Enter comments, verification justification, or instructions for this faculty accreditation..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedTrainer(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewAction('rejected')}
                  className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition"
                >
                  Reject Application
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewAction('approved')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve & Accredit Faculty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
