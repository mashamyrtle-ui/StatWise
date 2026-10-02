'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  getWorkforceSummaryKPIs,
  getWorkforceDomainAverages,
  getTopOrgSkillGaps,
  getTrainerRecords,
  getJobRoles,
  getAdminAuditLogs,
} from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Users, Award, BookOpen, AlertTriangle, CheckCircle2,
  TrendingUp, Shield, ArrowRight, Zap, Target,
  GraduationCap, Clock, FileCheck2, ArrowUpRight, BarChart3,
  Layers, ChevronRight, UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(getWorkforceSummaryKPIs());
  const [domainAverages, setDomainAverages] = useState(getWorkforceDomainAverages());
  const [topGaps, setTopGaps] = useState(getTopOrgSkillGaps());
  const [pendingTrainersCount, setPendingTrainersCount] = useState(0);
  const [jobRolesCount, setJobRolesCount] = useState(0);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);

  useEffect(() => {
    setKpis(getWorkforceSummaryKPIs());
    setDomainAverages(getWorkforceDomainAverages());
    setTopGaps(getTopOrgSkillGaps());

    const trainers = getTrainerRecords();
    setPendingTrainersCount(trainers.filter(t => t.status === 'pending').length);

    const roles = getJobRoles();
    setJobRolesCount(roles.length);

    const audits = getAdminAuditLogs();
    setRecentAudits(audits.slice(0, 4));
  }, []);

  // Summary KPI Cards (Section 3)
  const summaryCards = [
    {
      label: 'Total Employees',
      value: kpis.totalEmployees.toLocaleString(),
      sub: 'Civil officers & investigators',
      icon: Users,
      color: 'text-navy-700',
      bg: 'bg-navy-50',
      border: 'border-navy-200/80',
    },
    {
      label: 'Active Learners',
      value: kpis.activeLearners.toLocaleString(),
      sub: 'Currently in training pipelines',
      icon: GraduationCap,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200/80',
    },
    {
      label: 'Active Trainers',
      value: kpis.activeTrainers.toLocaleString(),
      sub: 'NSSTA & certified faculty',
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200/80',
    },
    {
      label: 'Courses',
      value: kpis.courses.toLocaleString(),
      sub: 'iGOT, NSSTA & TPAC catalogue',
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200/80',
    },
    {
      label: 'Average Competency',
      value: `${kpis.avgCompetency}%`,
      sub: 'Organization-wide index',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200/80',
    },
    {
      label: 'Critical Skill Gaps',
      value: kpis.criticalSkillGaps,
      sub: 'High priority workforce deficits',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200/80',
    },
    {
      label: 'Training Completion',
      value: `${kpis.trainingCompletion}%`,
      sub: 'Annual target progress',
      icon: CheckCircle2,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-200/80',
    },
  ];

  return (
    <div className="page-container animate-fade-in space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-800 via-navy-700 to-navy-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-saffron-500/10 rounded-l-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-saffron-400 text-slate-900">
                MoSPI Executive Governance
              </span>
              <span className="text-xs text-navy-200 font-mono">
                Framework Version 2026.2 Active
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-saffron-400" />
              Workforce Competency &amp; Governance Center
            </h1>
            <p className="text-xs text-navy-200 mt-1 max-w-2xl leading-relaxed">
              Define required job-role competencies, review trainer accreditation, monitor organization-wide skill gaps, and audit training effectiveness across all statistical directorates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Link
              href="/admin/competencies"
              className="px-4 py-2 bg-saffron-400 hover:bg-saffron-500 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Target size={15} /> Manage Framework
            </Link>
            <Link
              href="/admin/trainers"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <UserCheck size={15} />
              Trainer Approvals
              {pendingTrainersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingTrainersCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Section 3: Summary Cards (7 KPI Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={16} className="text-navy-700" />
            Executive Summary Key Metrics
          </h2>
          <span className="text-xs text-slate-400">Data Layer Synced · Centralised MoSPI Repository</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {summaryCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className={cn(
                  'bg-white rounded-xl p-4 border transition-all duration-150 hover:shadow-md flex flex-col justify-between',
                  kpi.border
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', kpi.bg)}>
                    <Icon size={15} className={kpi.color} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{kpi.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Workforce Competency Overview (Section 4) & Top Org-wide Gaps (Section 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 4: Workforce Competency Overview across 4 domains */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Target size={16} className="text-navy-700" />
                  Workforce Competency Overview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Benchmark distribution across the four core MoSPI competency domains
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold">
                Overall: 68%
              </span>
            </div>

            {/* Radar / Spider chart representation */}
            <div className="h-60 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  data={domainAverages.map(d => ({
                    domain: d.domain,
                    score: d.score,
                    benchmark: d.benchmark,
                  }))}
                >
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} angle={30} stroke="#94a3b8" />
                  <Radar
                    name="Current Workforce Score"
                    dataKey="score"
                    stroke="#1e3a5f"
                    fill="#1e3a5f"
                    fillOpacity={0.4}
                  />
                  <Radar
                    name="Required Benchmark"
                    dataKey="benchmark"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.15}
                  />
                  <Tooltip formatter={(value: any) => [`${value}%`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4 Major Domains Progress Bars (Exact specs from Section 4) */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            {domainAverages.map((domain, i) => (
              <div key={i} className="flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: domain.color }} />
                    {domain.domain}
                  </span>
                  <span className="font-bold font-mono text-slate-900">{domain.score}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${domain.score}%`, backgroundColor: domain.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Top Organization-Wide Skill Gaps */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  Top Organization-Wide Skill Gaps
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Critical training requirements computed directly from employee profiles vs. Admin Job Role requirements
                </p>
              </div>
              <Link
                href="/admin/analytics?tab=gaps"
                className="text-xs font-semibold text-navy-600 hover:text-navy-800 flex items-center gap-1"
              >
                Detailed Gaps <ArrowRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Competency</th>
                    <th className="py-2.5 px-3">Current</th>
                    <th className="py-2.5 px-3">Required</th>
                    <th className="py-2.5 px-3 text-red-600">Gap</th>
                    <th className="py-2.5 px-3 text-right">Affected Personnel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {topGaps.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {item.competency}
                        </div>
                        <span className="text-[10px] text-slate-400 pl-7">{item.domain}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                        {item.current}%
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                        {item.required}%
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-red-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-red-500 h-full rounded-full"
                              style={{ width: `${item.gap * 2}%` }}
                            />
                          </div>
                          <span className="font-bold text-red-600 font-mono">
                            -{item.gap}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {item.affectedEmployees.toLocaleString()} officers
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-navy-50/60 rounded-xl border border-navy-100 text-xs text-navy-800 flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-600 flex-shrink-0" />
              <span>
                <strong>Policy Recommendation:</strong> Commission 3 new targeted cohorts on <em>AI/ML for Official Statistics</em> and <em>Interactive Data Visualization</em>.
              </span>
            </div>
            <Link
              href="/admin/courses"
              className="text-xs font-bold text-navy-700 hover:text-navy-900 underline whitespace-nowrap ml-2"
            >
              Map Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Governance Modules Quick Access & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Governance Modules Cards */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-navy-700" />
                Administrative Governance Modules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralised controls for job roles, trainer accreditation, curriculum mappings, and assessments
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* Job Roles & Competencies */}
            <Link
              href="/admin/competencies"
              className="p-4 rounded-xl border border-slate-200 hover:border-navy-400 hover:bg-navy-50/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Target size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-navy-800">
                  Competency Framework
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage {jobRolesCount} official Job Roles, configure required levels (0–100), and publish versioned frameworks.
                </p>
              </div>
              <span className="text-[11px] font-bold text-navy-600 mt-3 flex items-center gap-1">
                Configure Roles <ArrowUpRight size={13} />
              </span>
            </Link>

            {/* Employees Directory */}
            <Link
              href="/admin/employees"
              className="p-4 rounded-xl border border-slate-200 hover:border-navy-400 hover:bg-navy-50/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Users size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-navy-800">
                  Employee Directory
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  View personnel profiles, target vs current competency levels, verified certificates, and learning history.
                </p>
              </div>
              <span className="text-[11px] font-bold text-navy-600 mt-3 flex items-center gap-1">
                Inspect Personnel <ArrowUpRight size={13} />
              </span>
            </Link>

            {/* Trainer Approvals */}
            <Link
              href="/admin/trainers"
              className="p-4 rounded-xl border border-slate-200 hover:border-navy-400 hover:bg-navy-50/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Award size={18} />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-navy-800">
                    Trainer Accreditation
                  </h3>
                  {pendingTrainersCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {pendingTrainersCount} Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Review faculty applications, inspect credentials, and manage trainer approval/rejection workflows.
                </p>
              </div>
              <span className="text-[11px] font-bold text-navy-600 mt-3 flex items-center gap-1">
                Review Applications <ArrowUpRight size={13} />
              </span>
            </Link>

            {/* Course Management */}
            <Link
              href="/admin/courses"
              className="p-4 rounded-xl border border-slate-200 hover:border-navy-400 hover:bg-navy-50/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <BookOpen size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-navy-800">
                  Course Management
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage iGOT Karmayogi, NSSTA, and TPAC training modules and map expected competency impact.
                </p>
              </div>
              <span className="text-[11px] font-bold text-navy-600 mt-3 flex items-center gap-1">
                Catalogue Mappings <ArrowUpRight size={13} />
              </span>
            </Link>

            {/* Assessment Governance */}
            <Link
              href="/admin/assessments"
              className="p-4 rounded-xl border border-slate-200 hover:border-navy-400 hover:bg-navy-50/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <FileCheck2 size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-navy-800">
                  Assessment Governance
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Governance oversight of baseline/diagnostic tests and AI-generated question review pipelines.
                </p>
              </div>
              <span className="text-[11px] font-bold text-navy-600 mt-3 flex items-center gap-1">
                Review Pipeline <ArrowUpRight size={13} />
              </span>
            </Link>

            {/* Workforce Analytics */}
            <Link
              href="/admin/analytics"
              className="p-4 rounded-xl border border-slate-200 hover:border-navy-400 hover:bg-navy-50/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <TrendingUp size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-navy-800">
                  Workforce Analytics
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Department benchmarking, pre vs post training effectiveness, and emerging capabilities analysis.
                </p>
              </div>
              <span className="text-[11px] font-bold text-navy-600 mt-3 flex items-center gap-1">
                Open Analytics <ArrowUpRight size={13} />
              </span>
            </Link>
          </div>
        </div>

        {/* Recent Audit Logs (Section 26) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Shield size={16} className="text-navy-700" />
                Recent Audit Trail
              </h2>
              <Link
                href="/admin/audit-logs"
                className="text-xs font-semibold text-navy-600 hover:text-navy-800 flex items-center gap-0.5"
              >
                All Logs <ChevronRight size={13} />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Cryptographically timestamped record of administrative modifications
            </p>

            <div className="space-y-3">
              {recentAudits.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-1">{log.resource}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    By: {log.adminName}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tamper-evident logging active
            </span>
            <Link
              href="/admin/audit-logs"
              className="text-navy-700 font-semibold hover:underline"
            >
              Export Log (CSV)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
