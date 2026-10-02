'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Award,
  BookOpen,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getEmployeeDirectory,
  EmployeeDirectoryRecord,
  getCompetencyScale,
  getJobRoles,
  JobRoleDefinition,
} from '@/lib/store';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeDirectoryRecord[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRoleDefinition[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDirectoryRecord | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'competencies' | 'training' | 'assessments' | 'recommendations'>('competencies');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [trainingFilter, setTrainingFilter] = useState('ALL');
  const [targetRoleFilter, setTargetRoleFilter] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = getEmployeeDirectory();
    setEmployees(list);
    const roles = getJobRoles();
    setJobRoles(roles);
  };

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesEmail = emp.email.toLowerCase().includes(q);
        const matchesId = emp.employee_id.toLowerCase().includes(q);
        const matchesDesig = emp.designation.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesId && !matchesDesig) return false;
      }
      // Department
      if (deptFilter !== 'ALL' && emp.department !== deptFilter) return false;
      // Level
      if (levelFilter !== 'ALL' && emp.competencyLevel !== levelFilter) return false;
      // Training Status
      if (trainingFilter !== 'ALL' && emp.trainingStatus !== trainingFilter) return false;
      // Target Role
      if (targetRoleFilter !== 'ALL' && emp.targetRole !== targetRoleFilter) return false;

      return true;
    });
  }, [employees, searchQuery, deptFilter, levelFilter, trainingFilter, targetRoleFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Department',
      'Designation',
      'Current Role',
      'Target Role',
      'Overall Competency',
      'Level',
      'Critical Gaps',
      'Training Status',
      'Status',
    ];

    const rows = filteredEmployees.map(e => [
      e.employee_id,
      `"${e.name}"`,
      e.email,
      `"${e.department}"`,
      `"${e.designation}"`,
      `"${e.currentRole}"`,
      `"${e.targetRole}"`,
      `${e.overallCompetency}%`,
      e.competencyLevel,
      e.criticalGapsCount,
      e.trainingStatus,
      e.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mospi_workforce_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-700">Governance</Link>
            <span>/</span>
            <span className="text-slate-800">Workforce Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#1e3a5f]" />
            Workforce Management & Competency Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise registry of MoSPI personnel, active job roles, evaluated competencies, and open skill gaps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1e3a5f] rounded-lg hover:bg-[#152844] shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Directory (CSV)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Registered Workforce</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{employees.length} Officers</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">100% Verified</span> across 6 Divisions
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Competency</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {employees.length > 0
              ? Math.round(employees.reduce((acc, e) => acc + e.overallCompetency, 0) / employees.length)
              : 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Scale: 0–39 Beg | 40–59 Dev | 60–79 Prof | 80+ Adv
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">In Active Training</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {employees.filter(e => e.trainingStatus === 'In Progress' || e.trainingStatus === 'Enrolled').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Enrolled in iGOT / NSSTA cohorts
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Officers with Critical Gaps</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {employees.filter(e => e.criticalGapsCount > 0).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Priority training intervention required
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, employee ID, email, or designation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="w-full lg:w-48">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Competency Level Filter */}
          <div className="w-full lg:w-40">
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="ALL">All Levels</option>
              <option value="Advanced">Advanced (80–100%)</option>
              <option value="Proficient">Proficient (60–79%)</option>
              <option value="Developing">Developing (40–59%)</option>
              <option value="Beginner">Beginner (0–39%)</option>
            </select>
          </div>

          {/* Training Status Filter */}
          <div className="w-full lg:w-40">
            <select
              value={trainingFilter}
              onChange={e => setTrainingFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="ALL">All Training</option>
              <option value="In Progress">In Progress</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Completed">Completed</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {(searchQuery || deptFilter !== 'ALL' || levelFilter !== 'ALL' || trainingFilter !== 'ALL' || targetRoleFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDeptFilter('ALL');
                setLevelFilter('ALL');
                setTrainingFilter('ALL');
                setTargetRoleFilter('ALL');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap self-center"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800">{filteredEmployees.length}</strong> of{' '}
            <strong className="text-slate-800">{employees.length}</strong> employees
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 80–100% Adv</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 60–79% Prof</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 40–59% Dev</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> 0–39% Beg</span>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-3">Emp ID</th>
                <th className="py-3.5 px-4">Department & Designation</th>
                <th className="py-3.5 px-4">Current / Target Role</th>
                <th className="py-3.5 px-4">Overall Competency</th>
                <th className="py-3.5 px-3 text-center">Critical Gaps</th>
                <th className="py-3.5 px-3 text-center">Training Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No employees match your filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing search terms or department filters.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const scale = getCompetencyScale(emp.overallCompetency);
                  const isCritical = emp.criticalGapsCount > 0;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-blue-50/40 transition group cursor-pointer"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f] font-bold text-xs flex items-center justify-center shrink-0 border border-[#1e3a5f]/20">
                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition">
                              {emp.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">{emp.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Emp ID */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {emp.employee_id}
                        </span>
                      </td>

                      {/* Department & Designation */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">{emp.department}</div>
                        <div className="text-[11px] text-slate-500">{emp.designation}</div>
                      </td>

                      {/* Roles */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-700 font-medium">{emp.currentRole}</div>
                        <div className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5">
                          <span>Target:</span>
                          <span className="font-medium">{emp.targetRole}</span>
                        </div>
                      </td>

                      {/* Overall Competency */}
                      <td className="py-3.5 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{emp.overallCompetency}%</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${scale.badgeClass}`}>
                              {scale.level}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                emp.overallCompetency >= 80 ? 'bg-emerald-500' :
                                emp.overallCompetency >= 60 ? 'bg-blue-600' :
                                emp.overallCompetency >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${Math.min(100, emp.overallCompetency)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Critical Gaps */}
                      <td className="py-3.5 px-3 text-center">
                        {isCritical ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3 h-3" />
                              {emp.criticalGapsCount} Gap{emp.criticalGapsCount > 1 ? 's' : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5" title={emp.topGapName}>
                              {emp.topGapName}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            On Track
                          </span>
                        )}
                      </td>

                      {/* Training Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          emp.trainingStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : emp.trainingStatus === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : emp.trainingStatus === 'Enrolled'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {emp.trainingStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(emp);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#1e3a5f] bg-slate-100 hover:bg-[#1e3a5f] hover:text-white rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Profile
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

      {/* Employee Detail Slide-Over Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-[#1e3a5f] to-[#152844] text-white flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 text-white font-bold text-xl flex items-center justify-center border border-white/20 shrink-0">
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">{selectedEmployee.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/20 text-white border border-white/30">
                      {selectedEmployee.employee_id}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-0.5">{selectedEmployee.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="bg-white/15 px-2 py-0.5 rounded text-white font-medium">
                      {selectedEmployee.department}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-100">{selectedEmployee.designation}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 text-center divide-x divide-slate-200 py-3">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Overall Score</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{selectedEmployee.overallCompetency}%</div>
                <div className="text-[10px] text-slate-500">
                  Level: <strong className="text-slate-700">{selectedEmployee.competencyLevel}</strong>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Target Role</div>
                <div className="text-xs font-bold text-blue-700 mt-1 truncate px-2" title={selectedEmployee.targetRole}>
                  {selectedEmployee.targetRole}
                </div>
                <div className="text-[10px] text-slate-500">Framework v2</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Open Skill Gaps</div>
                <div className="text-lg font-bold text-red-600 mt-0.5">
                  {selectedEmployee.skillGaps?.gaps?.length || 0}
                </div>
                <div className="text-[10px] text-red-500">
                  {selectedEmployee.criticalGapsCount} High Priority
                </div>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              <button
                onClick={() => setActiveDrawerTab('competencies')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeDrawerTab === 'competencies'
                    ? 'border-[#1e3a5f] text-[#1e3a5f]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                Competency Profile (Read-Only)
              </button>
              <button
                onClick={() => setActiveDrawerTab('training')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeDrawerTab === 'training'
                    ? 'border-[#1e3a5f] text-[#1e3a5f]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Training History ({selectedEmployee.enrolledCoursesCount})
              </button>
              <button
                onClick={() => setActiveDrawerTab('assessments')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeDrawerTab === 'assessments'
                    ? 'border-[#1e3a5f] text-[#1e3a5f]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Assessments
              </button>
              <button
                onClick={() => setActiveDrawerTab('recommendations')}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                  activeDrawerTab === 'recommendations'
                    ? 'border-[#1e3a5f] text-[#1e3a5f]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Recommended Learning
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeDrawerTab === 'competencies' && (
                <div className="space-y-6">
                  {/* Explanatory Banner */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Official Governance Record:</strong> Evaluated scores are calculated from validated baseline assessments and training outcomes against the published <strong>{selectedEmployee.targetRole}</strong> competency matrix.
                    </div>
                  </div>

                  {/* Competency Scores List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Evaluated Competencies vs Target Role Threshold
                    </h3>

                    {selectedEmployee.competencies.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4 text-center">No competency scores recorded yet.</p>
                    ) : (
                      selectedEmployee.competencies.map(c => {
                        // Find matching gap if any
                        const gapItem = selectedEmployee.skillGaps?.gaps?.find(g => g.competency_id === c.competency_id || g.competency_name === c.competency_name);
                        const required = gapItem ? gapItem.required_percentage : 70;
                        const gapVal = Math.max(0, required - c.score_percentage);
                        const scale = getCompetencyScale(c.score_percentage);

                        return (
                          <div key={c.competency_id} className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-900">{c.competency_name}</span>
                                <span className="ml-2 text-[10px] font-mono text-slate-400">({c.code})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${scale.badgeClass}`}>
                                  {scale.level}
                                </span>
                                {gapVal > 0 ? (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    gapItem?.gap_label === 'High' ? 'bg-red-100 text-red-700' :
                                    gapItem?.gap_label === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    Gap: -{gapVal}% ({gapItem?.gap_label || 'Low'})
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    Meets Target
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Bar comparison */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-500">
                                <span>Current: <strong className="text-slate-800">{c.score_percentage}%</strong></span>
                                <span>Required for Role: <strong className="text-slate-800">{required}%</strong></span>
                              </div>
                              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    c.score_percentage >= required ? 'bg-emerald-500' :
                                    c.score_percentage >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, c.score_percentage)}%` }}
                                />
                                {/* Marker for required */}
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                                  style={{ left: `${Math.min(100, required)}%` }}
                                  title={`Target requirement: ${required}%`}
                                />
                              </div>
                            </div>

                            {gapItem?.explanation && (
                              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-50">
                                {gapItem.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeDrawerTab === 'training' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Enrolled & Completed Courses
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedEmployee.completedCoursesCount} Completed • {selectedEmployee.enrolledCoursesCount} Total
                    </span>
                  </div>

                  {selectedEmployee.learningHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">No training programmes logged yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Enrollment updates synchronize from iGOT Karmayogi & NSSTA cohorts.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedEmployee.learningHistory.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-sm text-slate-900">{item.course.title}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="font-medium text-[#1e3a5f]">{item.course.provider}</span>
                                <span>•</span>
                                <span>{item.course.duration_hours} Hours</span>
                                <span>•</span>
                                <span>{item.course.difficulty}</span>
                              </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
                            <div>Enrolled: <strong className="text-slate-800">{item.enrolled_at || 'N/A'}</strong></div>
                            <div>Completed: <strong className="text-slate-800">{item.completed_at || 'In Progress'}</strong></div>
                            {item.score !== null && (
                              <div className="col-span-2 text-emerald-700 font-semibold">
                                Score Achieved: {item.score}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeDrawerTab === 'assessments' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Official Assessment Submissions
                  </h3>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-bold text-slate-900">Baseline Competency Assessment</div>
                          <div className="text-xs text-slate-500">Official MoSPI Statistical Framework Baseline</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {selectedEmployee.assessmentScore !== null ? `${selectedEmployee.assessmentScore}%` : 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <div>Status: <strong className="text-slate-800">{selectedEmployee.assessmentScore !== null ? 'Verified' : 'Not Taken'}</strong></div>
                      <div>Completed Date: <strong className="text-slate-800">{selectedEmployee.assessmentDate ? new Date(selectedEmployee.assessmentDate).toLocaleDateString() : 'N/A'}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'recommendations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Recommended Training Path
                    </h3>
                    <span className="text-xs text-blue-600 font-medium">Auto-matched to open gaps</span>
                  </div>

                  {selectedEmployee.recommendations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">No active course recommendations needed.</p>
                      <p className="text-xs text-slate-400 mt-1">This officer currently satisfies or exceeds role requirements.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedEmployee.recommendations.map(rec => (
                        <div key={rec.id} className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-sm text-slate-900">{rec.course.title}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="font-medium text-[#1e3a5f]">{rec.course.provider}</span>
                                <span>•</span>
                                <span>{rec.course.duration_hours}h</span>
                                <span>•</span>
                                <span>{rec.course.difficulty}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              {rec.match_score}% Match
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{rec.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                MoSPI Identity: <strong className="text-slate-700">{selectedEmployee.email}</strong>
              </span>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
