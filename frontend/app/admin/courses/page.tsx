'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Edit2,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag,
  Building2,
} from 'lucide-react';
import {
  getCourseGovernanceList,
  updateCourseGovernance,
  CourseGovernanceItem,
  COMPETENCY_LIST,
  getCurrentUser,
} from '@/lib/store';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseGovernanceItem[]>([]);
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseGovernanceItem | null>(null);
  const [editingAudience, setEditingAudience] = useState('');
  const [editingImprovement, setEditingImprovement] = useState('');
  const [editingCodes, setEditingCodes] = useState<string[]>([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    const list = getCourseGovernanceList();
    setCourses(list);
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (providerFilter !== 'ALL' && c.provider !== providerFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesProv = c.provider.toLowerCase().includes(q);
        const matchesDomain = c.domain.toLowerCase().includes(q);
        if (!matchesTitle && !matchesProv && !matchesDomain) return false;
      }
      return true;
    });
  }, [courses, providerFilter, statusFilter, searchQuery]);

  const handleOpenEdit = (course: CourseGovernanceItem) => {
    setSelectedCourse(course);
    setEditingAudience(course.targetAudience);
    setEditingImprovement(course.expectedImprovement);
    setEditingCodes([...course.competencyCodes]);
  };

  const handleSaveCourseUpdates = () => {
    if (!selectedCourse) return;
    const admin = getCurrentUser()?.profile.name || 'Administrator';

    try {
      updateCourseGovernance(
        selectedCourse.id,
        {
          targetAudience: editingAudience,
          expectedImprovement: editingImprovement,
          competencyCodes: editingCodes,
        },
        admin
      );

      setActionSuccessMsg(`Governance mapping updated for "${selectedCourse.title}".`);
      loadCourses();
      setSelectedCourse(null);

      setTimeout(() => {
        setActionSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating course');
    }
  };

  const handleToggleStatus = (courseId: string, currentStatus: CourseGovernanceItem['status']) => {
    const admin = getCurrentUser()?.profile.name || 'Administrator';
    const newStatus: CourseGovernanceItem['status'] = currentStatus === 'Active' ? 'Under Review' : 'Active';

    updateCourseGovernance(courseId, { status: newStatus }, admin);
    loadCourses();
    setActionSuccessMsg(`Course status updated to "${newStatus}".`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const toggleCompetencyCode = (code: string) => {
    setEditingCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-700">Governance</Link>
            <span>/</span>
            <span className="text-slate-800">Training Catalog</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#1e3a5f]" />
            Training Catalog & Competency Mapping
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Govern accredited offerings across iGOT Karmayogi, NSSTA, and TPAC. Map learning outcomes to specific MoSPI competencies.
          </p>
        </div>

        <button
          onClick={loadCourses}
          className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Catalog
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

      {/* Provider Distribution Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">iGOT Karmayogi</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {courses.filter(c => c.provider === 'iGOT Karmayogi').length} Courses
          </div>
          <div className="text-xs text-slate-500 mt-1">Digital public learning infrastructure</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">NSSTA Academy</div>
          <div className="text-2xl font-bold text-[#1e3a5f] mt-1">
            {courses.filter(c => c.provider === 'NSSTA').length} Courses
          </div>
          <div className="text-xs text-slate-500 mt-1">Resident & virtual statistical modules</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">TPAC & Other Govt</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {courses.filter(c => c.provider === 'TPAC' || c.provider === 'Other Govt Training').length} Courses
          </div>
          <div className="text-xs text-slate-500 mt-1">Inter-ministerial specialized skills</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Active Programs</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {courses.filter(c => c.status === 'Active').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Directly feeding recommendation engine</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="ALL">All Providers</option>
            <option value="iGOT Karmayogi">iGOT Karmayogi</option>
            <option value="NSSTA">NSSTA</option>
            <option value="TPAC">TPAC</option>
            <option value="Other Govt Training">Other Govt Training</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, domain, or provider..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses.map(course => (
          <div
            key={course.id}
            className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 hover:border-blue-300 transition space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    course.provider === 'NSSTA' ? 'bg-[#1e3a5f] text-white' :
                    course.provider === 'iGOT Karmayogi' ? 'bg-blue-600 text-white' :
                    'bg-emerald-600 text-white'
                  }`}>
                    {course.provider}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">ID: {course.id}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{course.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {course.domain} Domain • {course.durationHours} Hours • {course.level} Level
                </p>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                course.status === 'Active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {course.status}
              </span>
            </div>

            {/* Mapped Competencies */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-slate-400" />
                Mapped Competencies ({course.competencyCodes.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {course.competencyCodes.map(code => {
                  const comp = COMPETENCY_LIST.find(c => c.code === code);
                  return (
                    <span
                      key={code}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                    >
                      {comp ? comp.name : code} ({code})
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Target Audience & Expected Outcome */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1 text-slate-600">
              <div>
                <strong>Target Audience:</strong> {course.targetAudience}
              </div>
              <div>
                <strong>Outcome:</strong> {course.expectedImprovement}
              </div>
              {course.batchSchedule && (
                <div className="text-blue-700 font-medium">
                  <strong>Schedule:</strong> {course.batchSchedule}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => handleToggleStatus(course.id, course.status)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                {course.status === 'Active' ? 'Pause / Under Review' : 'Activate Course'}
              </button>

              <button
                onClick={() => handleOpenEdit(course)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1e3a5f] bg-slate-100 hover:bg-[#1e3a5f] hover:text-white rounded-lg transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Competency Mapping
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Edit Course Governance & Mappings
            </h3>
            <p className="text-xs text-slate-500">
              Course: <strong className="text-slate-800">{selectedCourse.title}</strong> ({selectedCourse.provider})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={editingAudience}
                  onChange={e => setEditingAudience(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Competency Improvement
                </label>
                <input
                  type="text"
                  value={editingImprovement}
                  onChange={e => setEditingImprovement(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Mapped Competency Codes (Select to toggle)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {COMPETENCY_LIST.map(c => {
                    const isChecked = editingCodes.includes(c.code);
                    return (
                      <button
                        type="button"
                        key={c.code}
                        onClick={() => toggleCompetencyCode(c.code)}
                        className={`text-left p-2 rounded text-xs transition flex items-center justify-between border ${
                          isChecked
                            ? 'bg-blue-100 text-blue-900 border-blue-300 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate pr-1">{c.name}</span>
                        <span className="text-[10px] font-mono shrink-0 font-bold">{c.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCourseUpdates}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1e3a5f] hover:bg-[#152844] rounded-lg shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
