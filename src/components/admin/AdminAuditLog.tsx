import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { ShieldCheck, Search, Clock, User, FileText } from 'lucide-react';

interface AdminAuditLogProps {
  logs: AuditLog[];
}

export const AdminAuditLog: React.FC<AdminAuditLogProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => {
    const q = searchTerm.toLowerCase();
    const actorName = (l.actor || l.adminUsername || '').toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      actorName.includes(q) ||
      (l.targetType || l.recordType || '').toLowerCase().includes(q) ||
      (l.targetId || l.recordId || '').toLowerCase().includes(q) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 block">
            IMMUTABLE SECURITY TRAIL
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight">
            Security & Activity Audit Log
          </h1>
        </div>

        <div className="text-xs font-mono text-neutral-400">
          Total Events: <span className="text-white font-bold">{logs.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Filter audit logs by action, actor, or details..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white font-mono"
        />
      </div>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-16 bg-neutral-950 border border-neutral-900 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 mx-auto text-neutral-600 stroke-[1.2]" />
          <h3 className="text-sm font-mono text-neutral-300 uppercase tracking-wider">
            No audit logs found.
          </h3>
        </div>
      ) : (
        <div className="bg-neutral-950 border border-neutral-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-900/60 border-b border-neutral-900 text-neutral-500 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-neutral-900/30">
                    <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white font-bold">{l.action}</td>
                    <td className="py-3 px-4 text-neutral-300">
                      <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px]">
                        {l.actor || l.adminUsername || 'system'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {(l.targetType || l.recordType) ? `${l.targetType || l.recordType} (${l.targetId || l.recordId || ''})` : '—'}
                    </td>
                    <td className="py-3 px-4 text-neutral-400 truncate max-w-xs">
                      {l.details ? JSON.stringify(l.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
