'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Save,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertTriangle,
  History,
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronRight,
  Sparkles,
  Sliders,
  Award,
  BookOpen,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import {
  getJobRoles,
  saveJobRoleFramework,
  createJobRole,
  updateJobRoleMeta,
  JobRoleDefinition,
  JobRoleCompetencyReq,
  DEFAULT_COMPETENCY_DOMAINS,
  COMPETENCY_LIST,
  getCompetencyScale,
  getCurrentUser,
} from '@/lib/store';

export default function AdminCompetenciesPage() {
  const [jobRoles, setJobRoles] = useState<JobRoleDefinition[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [editingCompetencies, setEditingCompetencies] = useState<JobRoleCompetencyReq[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'domains' | 'roles'>('matrix');

  // Add Competency Modal
  const [showAddCompModal, setShowAddCompModal] = useState(false);
  const [selectedCompToAdd, setSelectedCompToAdd] = useState('');
  const [newCompLevel, setNewCompLevel] = useState(70);

  // New Role Modal
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Status Alerts
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadJobRoles();
  }, []);

  const loadJobRoles = () => {
    const roles = getJobRoles();
    setJobRoles(roles);
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
      setEditingCompetencies([...roles[0].competencies]);
    } else if (selectedRoleId) {
      const current = roles.find(r => r.id === selectedRoleId);
      if (current) setEditingCompetencies([...current.competencies]);
    }
  };

  const selectedRole = useMemo(() => {
    return jobRoles.find(r => r.id === selectedRoleId) || null;
  }, [jobRoles, selectedRoleId]);

  const handleSelectRole = (id: string) => {
    setSelectedRoleId(id);
    const r = jobRoles.find(item => item.id === id);
    if (r) {
      setEditingCompetencies([...r.competencies]);
    }
  };

  // Update level slider in draft
  const handleUpdateLevel = (code: string, newLevel: number) => {
    setEditingCompetencies(prev =>
      prev.map(c => (c.competencyCode === code ? { ...c, requiredLevel: newLevel } : c))
    );
  };

  // Remove competency from draft
  const handleRemoveComp = (code: string) => {
    setEditingCompetencies(prev => prev.filter(c => c.competencyCode !== code));
  };

  // Add competency
  const handleAddComp = () => {
    if (!selectedCompToAdd) return;
    const master = COMPETENCY_LIST.find(c => c.code === selectedCompToAdd);
    if (!master) return;

    if (editingCompetencies.some(c => c.competencyCode === master.code)) {
      alert('This competency is already in the framework matrix.');
      return;
    }

    const domainMapping: Record<string, JobRoleCompetencyReq['domain']> = {
      Statistical: 'Statistical',
      Technical: 'Technical',
      'Digital Governance': 'Digital Governance',
      'Behavioural & Managerial': 'Behavioural & Managerial',
    };

    const newReq: JobRoleCompetencyReq = {
      competencyCode: master.code,
      competencyName: master.name,
      domain: domainMapping[master.category] || 'Statistical',
      requiredLevel: newCompLevel,
    };

    setEditingCompetencies(prev => [...prev, newReq]);
    setShowAddCompModal(false);
    setSelectedCompToAdd('');
    setNewCompLevel(70);
  };

  // Save or Publish
  const handleSaveFramework = (publishNewVersion: boolean) => {
    if (!selectedRoleId || !selectedRole) return;
    const adminUser = getCurrentUser();
    const adminName = adminUser?.profile.name || 'Administrator';

    try {
      const updated = saveJobRoleFramework(
        selectedRoleId,
        editingCompetencies,
        publishNewVersion,
        adminName
      );

      loadJobRoles();

      if (publishNewVersion) {
        setPublishSuccessMsg(
          `Framework v${updated.frameworkVersion} Published Successfully! Real-time updates pushed to all assigned learners (e.g., Ananya Sharma) and recommendation engine.`
        );
      } else {
        setPublishSuccessMsg(`Draft changes saved for ${updated.title}.`);
      }

      setTimeout(() => {
        setPublishSuccessMsg(null);
      }, 6000);
    } catch (err: any) {
      alert(err.message || 'Error saving framework');
    }
  };

  // Create New Job Role
  const handleCreateRole = () => {
    if (!newRoleTitle || !newRoleCode || !newRoleDept) {
      alert('Please fill in Title, Code, and Department');
      return;
    }

    const adminUser = getCurrentUser();
    const created = createJobRole(
      {
        title: newRoleTitle,
        code: newRoleCode.toUpperCase(),
        department: newRoleDept,
        description: newRoleDesc,
        isActive: true,
        competencies: [
          { competencyCode: 'STAT01', competencyName: 'Statistical Theory & Methods', domain: 'Statistical', requiredLevel: 75 },
          { competencyCode: 'STAT02', competencyName: 'Survey Design & Sampling', domain: 'Statistical', requiredLevel: 70 },
          { competencyCode: 'DIG01', competencyName: 'Digital Data Governance', domain: 'Digital Governance', requiredLevel: 60 },
        ],
      },
      adminUser?.profile.name || 'Administrator'
    );

    setShowNewRoleModal(false);
    setNewRoleTitle('');
    setNewRoleCode('');
    setNewRoleDept('');
    setNewRoleDesc('');
    loadJobRoles();
    setSelectedRoleId(created.id);
    setEditingCompetencies([...created.competencies]);
    setPublishSuccessMsg(`New Job Role "${created.title}" initialized as Framework v1.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-700">Governance</Link>
            <span>/</span>
            <span className="text-slate-800">Competency Framework</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#1e3a5f]" />
            National Statistical Competency Framework
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author and publish required competency benchmarks per official job role. Changes propagate directly to learner skill gaps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewRoleModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1e3a5f] rounded-lg hover:bg-[#152844] shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Define New Job Role
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {publishSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold">Framework Published & Synchronized</div>
              <div className="text-xs text-emerald-800 mt-0.5">{publishSuccessMsg}</div>
            </div>
          </div>
          <button onClick={() => setPublishSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'border-[#1e3a5f] text-[#1e3a5f]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Job Role Matrix & Level Tuning
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'domains'
              ? 'border-[#1e3a5f] text-[#1e3a5f]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          The 4 MoSPI Competency Domains
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-[#1e3a5f] text-[#1e3a5f]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          All Registered Job Roles ({jobRoles.length})
        </button>
      </div>

      {/* TAB 1: MATRIX & LEVEL TUNING */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Job Roles Selector */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Select Official Job Role
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-2 space-y-1">
              {jobRoles.map(role => {
                const isSelected = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1e3a5f] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{role.title}</div>
                      <div className={`text-[10px] mt-0.5 truncate max-w-[180px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                        {role.department}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        v{role.frameworkVersion}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scale Helper Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                Standard 0–100 Scale
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between"><span>80–100%</span><strong className="text-emerald-700">Advanced</strong></div>
                <div className="flex justify-between"><span>60–79%</span><strong className="text-blue-700">Proficient</strong></div>
                <div className="flex justify-between"><span>40–59%</span><strong className="text-amber-700">Developing</strong></div>
                <div className="flex justify-between"><span>0–39%</span><strong className="text-slate-600">Beginner</strong></div>
              </div>
            </div>
          </div>

          {/* Right Column: Framework Editor */}
          {selectedRole ? (
            <div className="lg:col-span-3 space-y-5">
              {/* Role Header Card */}
              <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedRole.title}</h2>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800">
                      Code: {selectedRole.code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      Framework v{selectedRole.frameworkVersion}.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedRole.department} • {selectedRole.description}</p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Last Published: {new Date(selectedRole.publishedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowAddCompModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Competency
                  </button>

                  <button
                    onClick={() => handleSaveFramework(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Draft
                  </button>

                  <button
                    onClick={() => handleSaveFramework(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Publish Framework v{selectedRole.frameworkVersion + 1}
                  </button>
                </div>
              </div>

              {/* Competencies Tuning Table */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Required Competency Thresholds ({editingCompetencies.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Adjust required scores on the 0–100 scale. If learner score &lt; Required, Skill Gap = Required - Current.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {editingCompetencies.map(c => {
                    const scale = getCompetencyScale(c.requiredLevel);

                    return (
                      <div key={c.competencyCode} className="p-4 hover:bg-slate-50/60 transition space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="w-16 px-2 py-0.5 rounded text-center text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {c.competencyCode}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{c.competencyName}</div>
                              <span className="text-[11px] font-medium text-slate-500">{c.domain} Domain</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${scale.badgeClass}`}>
                              {scale.level}
                            </span>
                            <div className="text-sm font-bold text-slate-900 w-12 text-right">
                              {c.requiredLevel}%
                            </div>
                            <button
                              onClick={() => handleRemoveComp(c.competencyCode)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                              title="Remove from role framework"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Slider Control */}
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-[11px] font-mono text-slate-400 w-6">0</span>
                          <input
                            type="range"
                            min="30"
                            max="95"
                            step="5"
                            value={c.requiredLevel}
                            onChange={e => handleUpdateLevel(c.competencyCode, parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a5f]"
                          />
                          <span className="text-[11px] font-mono text-slate-400 w-8">100</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Select a job role from the left to view or edit its framework matrix.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: THE 4 MOSPI DOMAINS */}
      {activeTab === 'domains' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEFAULT_COMPETENCY_DOMAINS.map(domain => (
            <div key={domain.id} className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: domain.color }}
                    />
                    <h3 className="text-base font-bold text-slate-900">{domain.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{domain.description}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 shrink-0">
                  {domain.competencyCount} Competencies
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">MoSPI Benchmark Target</span>
                <span className="font-bold text-slate-900">{domain.benchmarkScore}% Proficiency</span>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Sample Mapped Competencies
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {domain.keyCompetencies.map((comp, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ALL REGISTERED JOB ROLES */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Role Title</th>
                <th className="py-3.5 px-3">Role Code</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-3 text-center">Version</th>
                <th className="py-3.5 px-3 text-center">Competencies</th>
                <th className="py-3.5 px-4">Published At</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {jobRoles.map(role => (
                <tr key={role.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{role.title}</td>
                  <td className="py-3.5 px-3 font-mono text-xs">{role.code}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{role.department}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800">
                      v{role.frameworkVersion}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-xs font-bold text-slate-700">
                    {role.competencies.length}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(role.publishedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        handleSelectRole(role.id);
                        setActiveTab('matrix');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#1e3a5f] bg-slate-100 hover:bg-[#1e3a5f] hover:text-white rounded-lg transition"
                    >
                      Tune Matrix
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Competency to Matrix */}
      {showAddCompModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Competency Requirement</h3>
            <p className="text-xs text-slate-500">
              Select a competency from the official master catalogue and set the target threshold for {selectedRole?.title}.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Competency</label>
                <select
                  value={selectedCompToAdd}
                  onChange={e => setSelectedCompToAdd(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="">-- Choose from catalogue --</option>
                  {COMPETENCY_LIST.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code} • {c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Required Proficiency Level</span>
                  <span>{newCompLevel}% ({getCompetencyScale(newCompLevel).level})</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="5"
                  value={newCompLevel}
                  onChange={e => setNewCompLevel(parseInt(e.target.value))}
                  className="w-full accent-[#1e3a5f]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCompModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddComp}
                disabled={!selectedCompToAdd}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1e3a5f] hover:bg-[#152844] rounded-lg disabled:opacity-50"
              >
                Add to Framework
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Define New Job Role */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Define New Job Role</h3>
            <p className="text-xs text-slate-500">
              Establish a new official cadre designation with an initial competency matrix.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Agricultural Statistician"
                  value={newRoleTitle}
                  onChange={e => setNewRoleTitle(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cadre Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SAS"
                    value={newRoleCode}
                    onChange={e => setNewRoleCode(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Agricultural Statistics"
                    value={newRoleDept}
                    onChange={e => setNewRoleDept(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Description / Scope</label>
                <textarea
                  rows={3}
                  placeholder="Describe duties, sampling authority, and operational responsibilities..."
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewRoleModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRole}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1e3a5f] hover:bg-[#152844] rounded-lg"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
