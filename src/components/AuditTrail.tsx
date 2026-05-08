import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { AuditLog } from '../lib/types';
import { formatDateTime, truncateHash } from '../lib/utils';
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Download,
  Shield,
  Globe,
  Monitor,
  FileCode,
  Loader2,
} from 'lucide-react';

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'payment_completed', label: 'Payment Completed' },
  { value: 'lock_initiated', label: 'Lock Initiated' },
  { value: 'lock_approved', label: 'Lock Approved' },
  { value: 'lock_completed', label: 'Lock Completed' },
];

const RECORD_TYPES = [
  { value: '', label: 'All Record Types' },
  { value: 'catalog_entry', label: 'Catalog Entry' },
  { value: 'contract', label: 'Contract' },
  { value: 'payment', label: 'Payment' },
  { value: 'lock_approval', label: 'Lock Approval' },
];

const PAGE_SIZE = 50;

function getActionBadge(action: string): string {
  if (action === 'create') return 'text-green-400 bg-green-500/10 border border-green-500/20';
  if (action === 'update') return 'text-gold-400 bg-gold-500/10 border border-gold-500/20';
  if (action === 'delete') return 'text-red-400 bg-red-500/10 border border-red-500/20';
  if (action.startsWith('payment')) return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
  if (action.startsWith('lock')) return 'text-gold-400 bg-gold-500/10 border border-gold-500/20';
  return 'text-neutral-400 bg-neutral-500/10 border border-neutral-500/20';
}

function formatActionLabel(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatRecordType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function truncateUserAgent(ua: string): string {
  if (!ua) return '\u2014';
  if (ua.length <= 80) return ua;
  return ua.substring(0, 80) + '...';
}

export default function AuditTrail() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const buildQuery = useCallback(
    (offset: number) => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }
      if (recordTypeFilter) {
        query = query.eq('record_type', recordTypeFilter);
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      return query;
    },
    [actionFilter, recordTypeFilter, dateFrom, dateTo]
  );

  const loadLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await buildQuery(0);
    setLogs(data ?? []);
    setHasMore((data ?? []).length === PAGE_SIZE);
    setLoading(false);
  }, [user, buildQuery]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const loadMore = async () => {
    if (!user || loadingMore) return;
    setLoadingMore(true);
    const { data } = await buildQuery(logs.length);
    const newLogs = data ?? [];
    setLogs((prev) => [...prev, ...newLogs]);
    setHasMore(newLogs.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const exportCSV = () => {
    const headers = [
      'Timestamp',
      'Actor ID',
      'Action',
      'Record Type',
      'Record ID',
      'IP Address',
      'User Agent',
      'Old Data',
      'New Data',
    ];

    const rows = filteredLogs.map((log) => [
      formatDateTime(log.created_at),
      log.actor_id,
      log.action,
      log.record_type,
      log.record_id,
      log.ip_address,
      log.user_agent,
      JSON.stringify(log.old_data),
      JSON.stringify(log.new_data),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Client-side search filter (searches actor_id, record_id, ip_address, user_agent)
  const filteredLogs = search
    ? logs.filter((log) => {
        const q = search.toLowerCase();
        return (
          log.actor_id.toLowerCase().includes(q) ||
          log.record_id.toLowerCase().includes(q) ||
          log.ip_address.toLowerCase().includes(q) ||
          log.user_agent.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.record_type.toLowerCase().includes(q)
        );
      })
    : logs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History size={28} className="text-gold-400" />
          <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full text-gold-400 bg-gold-500/10 border border-gold-500/20">
            Forensic Grade
          </span>
        </div>
        <button
          onClick={exportCSV}
          disabled={filteredLogs.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gold-600 text-neutral-950 hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-gold-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-white">Immutable Record</h3>
            <p className="text-sm text-neutral-400 mt-1">
              This audit trail is immutable and append-only. Any modification would invalidate the chain.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-gold-400" />
          <span className="text-sm font-medium text-white">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-colors"
            />
          </div>

          {/* Action Type */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-colors appearance-none cursor-pointer"
          >
            {ACTION_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From date"
            className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-colors"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To date"
            className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-colors"
          />

          {/* Record Type */}
          <select
            value={recordTypeFilter}
            onChange={(e) => setRecordTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 transition-colors appearance-none cursor-pointer"
          >
            {RECORD_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <History size={48} className="mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-semibold text-white mb-2">No audit logs found</h3>
          <p className="text-neutral-400">
            {logs.length === 0
              ? 'Actions will appear here as the system is used.'
              : 'No logs match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-neutral-800 border-b border-neutral-700 text-xs font-medium text-neutral-400 uppercase tracking-wider">
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2">Actor</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-2">Record</div>
            <div className="col-span-2">IP Address</div>
            <div className="col-span-2">User Agent</div>
          </div>

          {/* Log Entries */}
          <div className="divide-y divide-neutral-800">
            {filteredLogs.map((log) => (
              <div key={log.id}>
                {/* Row */}
                <button
                  onClick={() => toggleExpand(log.id)}
                  className="w-full text-left grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-4 py-3 hover:bg-neutral-800/50 transition-colors"
                >
                  {/* Timestamp */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-neutral-500 lg:hidden">
                      {expandedId === log.id ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </span>
                    <span className="text-sm text-neutral-300 font-mono">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>

                  {/* Actor */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-neutral-400 font-mono truncate">
                      {truncateHash(log.actor_id)}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-2 flex items-center">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {formatActionLabel(log.action)}
                    </span>
                  </div>

                  {/* Record */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-xs text-neutral-500 capitalize">
                      {formatRecordType(log.record_type)}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {truncateHash(log.record_id)}
                    </span>
                  </div>

                  {/* IP Address */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Globe size={12} className="text-neutral-600 flex-shrink-0" />
                    <span className="text-sm text-neutral-500 font-mono">
                      {log.ip_address || '\u2014'}
                    </span>
                  </div>

                  {/* User Agent */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Monitor size={12} className="text-neutral-600 flex-shrink-0" />
                    <span className="text-xs text-neutral-500 truncate">
                      {truncateUserAgent(log.user_agent)}
                    </span>
                    <span className="hidden lg:inline-flex ml-auto text-neutral-600">
                      {expandedId === log.id ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </span>
                  </div>
                </button>

                {/* Expanded Detail */}
                {expandedId === log.id && (
                  <div className="px-4 pb-4 bg-neutral-950/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {/* Old Data */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileCode size={14} className="text-red-400" />
                          <span className="text-xs font-medium text-red-400 uppercase tracking-wider">
                            Old Data
                          </span>
                        </div>
                        <pre className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-400 font-mono overflow-x-auto max-h-64 overflow-y-auto">
                          {log.old_data && Object.keys(log.old_data).length > 0
                            ? JSON.stringify(log.old_data, null, 2)
                            : 'null'}
                        </pre>
                      </div>

                      {/* New Data */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileCode size={14} className="text-green-400" />
                          <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
                            New Data
                          </span>
                        </div>
                        <pre className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-400 font-mono overflow-x-auto max-h-64 overflow-y-auto">
                          {log.new_data && Object.keys(log.new_data).length > 0
                            ? JSON.stringify(log.new_data, null, 2)
                            : 'null'}
                        </pre>
                      </div>
                    </div>

                    {/* Full metadata row */}
                    <div className="mt-4 pt-3 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-neutral-500 mb-0.5">Full Actor ID</p>
                        <p className="text-neutral-300 font-mono break-all">{log.actor_id}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500 mb-0.5">IP Address</p>
                        <p className="text-neutral-300 font-mono">{log.ip_address || '\u2014'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500 mb-0.5">User Agent</p>
                        <p className="text-neutral-300 break-all">{log.user_agent || '\u2014'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load More */}
      {hasMore && !search && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Load More
              </>
            )}
          </button>
        </div>
      )}

      {/* Result count */}
      <div className="text-center text-xs text-neutral-500">
        Showing {filteredLogs.length} of {logs.length} log{logs.length !== 1 ? 's' : ''}
        {search && ' (filtered)'}
      </div>
    </div>
  );
}
