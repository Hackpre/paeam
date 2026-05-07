import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { AuditLog } from '../lib/types';
import { formatDate } from '../lib/utils';
import {
  History,
  FileText,
  Disc3,
  User,
  Shield,
} from 'lucide-react';

export default function AuditTrail() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('actor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs(data ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'text-gold-400 bg-gold-500/10';
    if (action.includes('update')) return 'text-blue-400 bg-blue-500/10';
    if (action.includes('delete')) return 'text-red-400 bg-red-500/10';
    if (action.includes('lock')) return 'text-amber-400 bg-amber-500/10';
    return 'text-neutral-400 bg-neutral-500/10';
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'catalog_entry': return <Disc3 size={16} className="text-gold-400" />;
      case 'contract': return <FileText size={16} className="text-blue-400" />;
      case 'producer_profile': return <User size={16} className="text-amber-400" />;
      case 'lock_approval': return <Shield size={16} className="text-rose-400" />;
      default: return <History size={16} className="text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-gold-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Immutable Audit Trail</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Every action is permanently logged and cannot be modified or deleted. This provides a tamper-evident record of all changes to your data.
            </p>
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <History size={48} className="mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-semibold text-white mb-2">No audit logs yet</h3>
          <p className="text-neutral-400">Actions will appear here as you use the system.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-neutral-800">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-neutral-800/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center mt-0.5">
                  {getRecordIcon(log.record_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-neutral-500 capitalize">
                      {log.record_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-mono truncate">{log.record_id}</p>
                  {Object.keys(log.new_data).length > 0 && (
                    <div className="mt-2 bg-neutral-800 rounded-lg p-2 text-xs text-neutral-400 font-mono overflow-x-auto">
                      {JSON.stringify(log.new_data, null, 2).substring(0, 200)}
                      {JSON.stringify(log.new_data).length > 200 ? '...' : ''}
                    </div>
                  )}
                </div>
                <div className="text-xs text-neutral-500 whitespace-nowrap">
                  {formatDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
