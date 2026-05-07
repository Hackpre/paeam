import { useState, useEffect } from 'react';
import { History, CheckCircle2, AlertTriangle, Clock, User, FileText, Lock, Edit, Plus, Trash2, Disc3 } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: 'create' | 'update' | 'lock' | 'approve' | 'delete' | 'login' | 'register';
  entityType: 'catalog' | 'contract' | 'profile' | 'lock' | 'user';
  entityTitle: string;
  user: string;
  timestamp: string;
  details: string;
}

export default function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('paeam_audit');
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      const sampleEntries: AuditEntry[] = [
        {
          id: '1',
          action: 'create',
          entityType: 'catalog',
          entityTitle: 'Yes You Reign',
          user: 'Sir EL-Phi',
          timestamp: new Date().toLocaleString(),
          details: 'Created catalog entry with complete metadata including ISRC, BPM, and split sheet',
        },
        {
          id: '2',
          action: 'create',
          entityType: 'contract',
          entityTitle: 'Yes You Reign Contract',
          user: 'Sir EL-Phi',
          timestamp: new Date().toLocaleString(),
          details: 'Created non-exclusive contract with royalty splits',
        },
        {
          id: '3',
          action: 'lock',
          entityType: 'catalog',
          entityTitle: 'Yes You Reign',
          user: 'Sir EL-Phi',
          timestamp: new Date().toLocaleString(),
          details: 'Initiated Three-Way Lock - Waiting for Artist and Association approval',
        },
        {
          id: '4',
          action: 'approve',
          entityType: 'lock',
          entityTitle: 'Yes You Reign Lock',
          user: 'Artist',
          timestamp: new Date().toLocaleString(),
          details: 'Artist approved the Three-Way Lock',
        },
        {
          id: '5',
          action: 'approve',
          entityType: 'lock',
          entityTitle: 'Yes You Reign Lock',
          user: 'PAEAM Association',
          timestamp: new Date().toLocaleString(),
          details: 'Association approved and sealed the record - Now immutable',
        },
        {
          id: '6',
          action: 'create',
          entityType: 'profile',
          entityTitle: 'Producer Profile',
          user: 'Sir EL-Phi',
          timestamp: new Date().toLocaleString(),
          details: 'Updated personal information and contact details',
        },
      ];
      setEntries(sampleEntries);
      localStorage.setItem('paeam_audit', JSON.stringify(sampleEntries));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleNewAudit = (e: CustomEvent) => {
      const newEntry = e.detail;
      setEntries(prev => [newEntry, ...prev]);
      const allEntries = [newEntry, ...entries];
      localStorage.setItem('paeam_audit', JSON.stringify(allEntries));
    };

    window.addEventListener('newAudit', handleNewAudit as EventListener);
    return () => window.removeEventListener('newAudit', handleNewAudit as EventListener);
  }, [entries]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus size={14} className="text-green-500" />;
      case 'update': return <Edit size={14} className="text-blue-500" />;
      case 'lock': return <Lock size={14} className="text-gold-500" />;
      case 'approve': return <CheckCircle2 size={14} className="text-green-500" />;
      case 'delete': return <Trash2 size={14} className="text-red-500" />;
      default: return <History size={14} className="text-neutral-500" />;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'catalog': return <Disc3 size={14} className="text-blue-400" />;
      case 'contract': return <FileText size={14} className="text-amber-400" />;
      case 'profile': return <User size={14} className="text-gold-400" />;
      case 'lock': return <Lock size={14} className="text-gold-400" />;
      default: return <History size={14} className="text-neutral-500" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'create': return 'Created';
      case 'update': return 'Updated';
      case 'lock': return 'Locked';
      case 'approve': return 'Approved';
      case 'delete': return 'Deleted';
      default: return action;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <History size={28} className="text-gold-400" />
          <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
        </div>
        <p className="text-neutral-400 text-sm">Immutable logging of all actions — every change is tracked and cannot be altered</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{entries.length}</p>
          <p className="text-neutral-400 text-sm">Total Events</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{entries.filter(e => e.action === 'create').length}</p>
          <p className="text-neutral-400 text-sm">Creations</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-gold-400">{entries.filter(e => e.action === 'lock' || e.action === 'approve').length}</p>
          <p className="text-neutral-400 text-sm">Lock Approvals</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{entries.filter(e => e.action === 'update').length}</p>
          <p className="text-neutral-400 text-sm">Updates</p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-neutral-800">
          <p className="text-neutral-400 text-sm">Chronological event log (newest first)</p>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <History size={48} className="mx-auto mb-3 opacity-50" />
            <p>No audit events yet</p>
            <p className="text-sm">Actions will be logged here as you use the system</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800 max-h-[600px] overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-neutral-800/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-6">{getActionIcon(entry.action)}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getEntityIcon(entry.entityType)}
                        <span className="text-sm font-medium text-white">{entry.entityTitle}</span>
                        <span className="text-xs text-neutral-400">({entry.entityType})</span>
                        <span className="text-xs text-gold-400">• {getActionText(entry.action)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">{entry.timestamp}</p>
                        <p className="text-xs text-neutral-600">by {entry.user}</p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-400 mt-1">{entry.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-neutral-500 text-xs pt-4 border-t border-neutral-800">
        <p>Producers & Audio Engineering Association of Malawi — Official Digital Registry</p>
        <p className="mt-1">Secure Rights Management | Immutable Record Keeping | Three-Way Lock Protection</p>
        <p className="mt-2">© 2026 PAEAM. All rights reserved. Built for the music producers of Malawi.</p>
      </div>
    </div>
  );
}