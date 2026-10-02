'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  getAdminAuditLogs,
  AdminAuditEntry,
} from '@/lib/store';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    setLogs(getAdminAuditLogs());
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAdmin = log.adminName.toLowerCase().includes(q) || log.adminEmail.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesRes = log.resource.toLowerCase().includes(q);
        if (!matchesAdmin && !matchesAction && !matchesRes) return false;
      }
      return true;
    });
  }, [logs, statusFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Admin Name', 'Admin Email', 'Action', 'Resource', 'Previous Value', 'New Value', 'Status'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.adminName}"`,
      l.adminEmail,
      l.action,
      `"${l.resource}"`,
      `"${l.previousValue.replace(/"/g, '""')}"`,
      `"${l.newValue.replace(/"/g, '""')}"`,
      l.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mospi_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-700">Governance</Link>
            <span>/</span>
            <span className="text-slate-800">Compliance & Audit</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#1e3a5f]" />
            Administrative Action Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-evident record of all governance changes, framework version publications, trainer approvals, and catalog adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadLogs}
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
            Export Audit Trail (CSV)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="FAILED">FAILED</option>
          </select>

          <span className="text-xs text-slate-500">
            Total Logged Events: <strong>{logs.length}</strong>
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, administrator, resource..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Event ID & Time</th>
                <th className="py-3.5 px-4">Administrator</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">State Transition</th>
                <th className="py-3.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No audit records match your search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    {/* Timestamp & ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800">{log.id}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>

                    {/* Admin */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{log.adminName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{log.adminEmail}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {log.action}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {log.resource}
                    </td>

                    {/* Transition */}
                    <td className="py-3.5 px-4 max-w-xs text-[11px] text-slate-600">
                      <div className="truncate" title={`From: ${log.previousValue} -> To: ${log.newValue}`}>
                        <span className="text-slate-400">Prev:</span> {log.previousValue}
                        <br />
                        <span className="text-emerald-600 font-medium">New:</span> {log.newValue}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                        {log.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
