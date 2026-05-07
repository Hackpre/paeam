import { useState } from 'react';
import { History, CheckCircle2, AlertTriangle, Clock, User, FileText, Lock, Edit } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: 'create' | 'update' | 'lock' | 'approve' | 'delete';
  entityType: 'catalog' | 'contract' | 'profile' | 'lock';
  entityTitle: string;
  user: string;
  timestamp: string;
  details: string;
}

export default function AuditTrail() {
  const [entries] = useState<AuditEntry[]>([
    {
      id: '1',
      action: 'create',
      entityType: 'catalog',
      entityTitle: 'Yes You Reign',
      user: 'Sir EL-Phi',
      timestamp: '2026-05-07 14:30:00',
      details: 'Created catalog entry with ISRC: 13 Sept 1990',
    },
    {
      id: '2',
      action: 'create',
      entityType: 'contract',
      entityTitle: 'Yes You Reign Contract',
      user: 'Sir EL-Phi',
      timestamp: '2026-05-07 14:35:00',
      details: 'Created non-exclusive contract with 60% royalty split',
    },
    {
      id: '3',
      action: 'approve',
      entityType: 'lock',
      entityTitle: 'Contract Lock Approval',
      user: 'Artist',
      timestamp: '2026-05-07 15:00:00',
      details: 'Artist approved the three-way lock',
    },
    {
      id: '4',
      action: 'lock',
      entityType: 'contract',
      entityTitle: 'Yes You Reign Contract',
      user: 'PAEAM Association',
      timestamp: '2026-05-07 15:30:00',
      details: 'Contract fully locked and immutable',
    },
  ]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'update': return <Edit size={16} className="text-blue-500" />;
      case 'lock': return <Lock size={16} className="text-gold-500" />;
      case 'approve': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return <AlertTriangle size={16} className="text-amber-500" />;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'catalog': return <FileText size={14} className="text-blue-400" />;
      case 'contract': return <FileText size={14} className="text-amber-400" />;
      case 'profile': return <User size={14} className="text-gold-400" />;
      case 'lock': return <Lock size={14} className="text-gold-400" />;
      default: return <History size={14} className="text-neutral-500" />;
    }
  };

  return {
    jsx: (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <History size={28} className="text-gold-400" />
            <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
          </div>
          <p className="text-neutral-400 text-sm">Immutable logging of all actions — every change is tracked and cannot be altered</p>
        </div>

        {/* Audit Entries */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-neutral-800">
            <p className="text-neutral-400 text-sm">{entries.length} events recorded</p>
          </div>

          {entries.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <History size={48} className="mx-auto mb-3 opacity-50" />
              <p>No audit events yet</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(entry.entityType)}
                            <span className="text-sm font-medium text-white">{entry.entityTitle}</span>
                            <span className="text-xs text-neutral-500 capitalize">({entry.entityType})</span>
                          </div>
                          <p className="text-sm text-neutral-400 mt-1">{entry.details}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-500">{entry.timestamp}</p>
                          <p className="text-xs text-neutral-600">by {entry.user}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-neutral-500 text-xs pt-4 border-t border-neutral-800">
          <p>Producers & Audio Engineering Association of Malawi — Official Digital Registry</p>
          <p className="mt-1">Secure Rights Management | Immutable Record Keeping | Three-Way Lock Protection</p>
          <p className="mt-2">© 2026 PAEAM. All rights reserved. Built for the music producers of Malawi.</p>
        </div>
      </div>
    )
  };
}