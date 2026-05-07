import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import {
  Disc3,
  FileText,
  Lock,
  User,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [catalogCount, setCatalogCount] = useState(1);
  const [contractCount, setContractCount] = useState(1);
  const [lockedCount, setLockedCount] = useState(2);
  const [pendingCount, setPendingCount] = useState(0);
  const [recentCatalog, setRecentCatalog] = useState([
    { id: 1, title: 'Yes You Reign', artist: 'Austin Precious Phiri', genre: 'Afrobeat', status: 'unlocked' },
  ]);
  const [profile, setProfile] = useState({ stage_name: 'Sir EL-Phi', verification: 'pending' });

  useEffect(() => {
    // Load data from localStorage or Supabase
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Catalog Entries', value: catalogCount, icon: <Disc3 size={20} />, color: 'gold' },
    { label: 'Contracts', value: contractCount, icon: <FileText size={20} />, color: 'blue' },
    { label: 'Locked Records', value: lockedCount, icon: <Lock size={20} />, color: 'amber' },
    { label: 'Pending Approvals', value: pendingCount, icon: <Clock size={20} />, color: 'rose' },
  ];

  const colorMap: Record<string, string> = {
    gold: 'from-gold-500/20 to-gold-500/5 border-gold-500/20 text-gold-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-xl font-bold text-neutral-950">
            {profile.stage_name?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile.stage_name || 'Producer'}</h2>
            {profile.verification === 'pending' ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Clock size={12} /> Pending Verification
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} /> Verified Producer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${colorMap[stat.color]} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-400">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Catalog */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="font-semibold text-white">Recent Catalog</h3>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'catalog' }))}
            className="text-sm text-gold-400 hover:text-gold-300"
          >
            View All
          </button>
        </div>
        {recentCatalog.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <Disc3 size={32} className="mx-auto mb-2 opacity-50" />
            No catalog entries yet
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {recentCatalog.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-6 py-3 hover:bg-neutral-800/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                  <Disc3 size={18} className="text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{entry.title}</p>
                  <p className="text-xs text-neutral-500">{entry.artist} - {entry.genre}</p>
                </div>
                <div className="flex items-center gap-2">
                  {entry.status === 'locked' ? (
                    <span className="flex items-center gap-1 text-xs text-gold-400">
                      <Lock size={12} /> Locked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <AlertTriangle size={12} /> Unlocked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Overview */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-gold-400" />
          <h3 className="font-semibold text-white">Security Overview</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className="text-gold-400" />
              <span className="text-sm font-medium text-white">Three-Way Lock</span>
            </div>
            <p className="text-xs text-neutral-400">{lockedCount} records secured with multi-signature approval</p>
          </div>
          <div className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-white">Audit Trail</span>
            </div>
            <p className="text-xs text-neutral-400">All changes tracked with immutable logging</p>
          </div>
          <div className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-white">Content Hash</span>
            </div>
            <p className="text-xs text-neutral-400">SHA-256 verification on all locked records</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-neutral-500 text-xs pt-4 border-t border-neutral-800">
        <p>Producers & Audio Engineering Association of Malawi — Official Digital Registry</p>
        <p className="mt-1">Secure Rights Management | Immutable Record Keeping | Three-Way Lock Protection</p>
        <p className="mt-2">© 2026 PAEAM. All rights reserved. Built for the music producers of Malawi.</p>
      </div>
    </div>
  );
}