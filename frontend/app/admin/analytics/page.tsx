'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  BarChart3,
  Award,
  Layers,
  ArrowUpRight,
  Download,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  getDepartmentAnalytics,
  getTrainingEffectivenessData,
  getEmergingSkillsData,
  getWorkforceDomainAverages,
  getTopOrgSkillGaps,
} from '@/lib/store';

export default function AdminAnalyticsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [effectiveness, setEffectiveness] = useState<any[]>([]);
  const [emergingSkills, setEmergingSkills] = useState<any[]>([]);
  const [domainAverages, setDomainAverages] = useState<any[]>([]);
  const [topGaps, setTopGaps] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDepartments(getDepartmentAnalytics());
    setEffectiveness(getTrainingEffectivenessData());
    setEmergingSkills(getEmergingSkillsData());
    setDomainAverages(getWorkforceDomainAverages());
    setTopGaps(getTopOrgSkillGaps());
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-700">Governance</Link>
            <span>/</span>
            <span className="text-slate-800">Intelligence & Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-[#1e3a5f]" />
            Workforce Competency Analytics & Impact Assessment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise analytics on departmental proficiencies, pre vs post training uplift (+28%), and emerging skill demands.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Analytics
        </button>
      </div>

      {/* Top Impact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Training Uplift</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1">
            +28%
            <ArrowUpRight className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="text-xs text-slate-500 mt-1">Pre vs post training assessment differential</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Evaluated Cadre Size</div>
          <div className="text-3xl font-extrabold text-[#1e3a5f] mt-1">12,540</div>
          <div className="text-xs text-slate-500 mt-1">Personnel evaluated across 6 divisions</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Top Performing Wing</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">National Accounts</div>
          <div className="text-xs text-slate-500 mt-1">76% Average Departmental Proficiency</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Highest Demand Emerging Skill</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">AI / ML in Official Stats</div>
          <div className="text-xs text-purple-600 mt-1">+34% YoY increase in mandate requirements</div>
        </div>
      </div>

      {/* Section 1: Pre- vs Post-Training Effectiveness (+28%) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Pre- vs Post-Training Effectiveness (Cohort Impact Analysis)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Measured competency scores before and after completion of accredited iGOT and NSSTA cohorts.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
            Avg Uplift: +27.4 Points (+28%)
          </span>
        </div>

        <div className="space-y-4">
          {effectiveness.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-bold text-slate-900">{item.skill}</span>
                  <span className="ml-3 text-xs text-slate-500">Cohort: {item.cohortSize} officers</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Before: <strong className="text-slate-700">{item.before}%</strong></span>
                  <span className="text-xs text-slate-500">After: <strong className="text-slate-900">{item.after}%</strong></span>
                  <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-700">
                    +{item.delta}%
                  </span>
                </div>
              </div>

              {/* Comparative Bar */}
              <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-blue-400 rounded-l-full"
                  style={{ width: `${item.before}%` }}
                  title={`Pre-Training: ${item.before}%`}
                />
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500 rounded-full"
                  style={{ left: `${item.before}%`, width: `${item.delta}%` }}
                  title={`Post-Training Uplift: +${item.delta}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Department Competency Benchmark */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1e3a5f]" />
            Departmental Proficiency & Gap Distribution
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-divisional comparison of average evaluated competency vs critical open skill gaps.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Division / Directorate</th>
                <th className="py-3 px-4">Personnel Count</th>
                <th className="py-3 px-4">Avg Competency</th>
                <th className="py-3 px-4">Primary Skill Gap</th>
                <th className="py-3 px-4 text-center">Training Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {departments.map((dept, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{dept.department}</td>
                  <td className="py-3.5 px-4 text-slate-600">{dept.employeesCount} Officers</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{dept.avgCompetency}%</span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dept.avgCompetency >= 70 ? 'bg-emerald-500' :
                            dept.avgCompetency >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${dept.avgCompetency}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      {dept.criticalGaps}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-slate-800">{dept.completionRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Emerging Skills Radar & Trend Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Emerging Strategic Skills & National Mandates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            High-growth technological and methodological capabilities prioritized for 2026–2027 curriculum expansion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emergingSkills.map((item, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase">
                    Priority #{item.priority}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{item.skill}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                  {item.demand} Demand
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Current: <strong>{item.current}%</strong></span>
                  <span>Target: <strong>{item.required}%</strong></span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${(item.current / item.required) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 pt-1 border-t border-slate-200">
                <TrendingUp className="w-3.5 h-3.5" />
                Growth: {item.trend}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
