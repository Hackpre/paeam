import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { ProducerProfile, CatalogEntry, LockApproval } from '../lib/types';
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
  CreditCard,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [catalogCount, setCatalogCount] = useState(0);
  const [contractCount, setContractCount] = useState(0);
  const [lockedCount, setLockedCount] = useState(0);
  const [pendingLocks, setPendingLocks] = useState<LockApproval[]>([]);
  const [recentCatalog, setRecentCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const paymentPaid = localStorage.getItem('paeam_paid');
      setPaymentStatus(paymentPaid === 'true' ? 'paid' : 'pending');

      try {
        const { data: prof } = await supabase
          .from('producer_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setProfile(prof);

        if (prof) {
          const { count: cCount } = await supabase
            .from('catalog_entries')
            .select('*', { count: 'exact', head: true })
            .eq('producer_id', prof.id);
          setCatalogCount(cCount ?? 0);

          const { data: catalogData } = await supabase
            .from('catalog_entries')
            .select('*')
            .eq('producer_id', prof.id)
            .order('created_at', { ascending: false })
            .limit(5);
          setRecentCatalog(catalogData ?? []);

          const { count: conCount } = await supabase
            .from('contracts')
            .select('*', { count: 'exact', head: true })
            .in('catalog_entry_id', (catalogData ?? []).map((c: CatalogEntry) => c.id));
          setContractCount(conCount ?? 0);

          const { count: lCount } = await supabase
            .from('catalog_entries')
            .select('*', { count: 'exact', head: true })
            .eq('producer_id', prof.id)
            .eq('is_locked', true);
          setLockedCount(lCount ?? 0);

          const { data: locks } = await supabase
            .from('lock_approvals')
            .select('*')
            .eq('is_fully_locked', false)
            .limit(10);
          setPendingLocks(locks ?? []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleCompletePayment = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'payment' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <User size={32} className="text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Complete Your Profile</h2>
        <p className="text-neutral-400 mb-6">
          Register your producer profile to start managing your catalog, contracts, and royalties.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'profile' }))}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-medium rounded-xl transition-colors"
        >
          Create Producer Profile
        </button>
      </div>
    );
  }

  const stats = [
    { label: 'Catalog Entries', value: catalogCount, icon: <Disc3 size={20} />, color: 'gold' },
    { label: 'Contracts', value: contractCount, icon: <FileText size={20} />, color: 'blue' },
    { label: 'Locked Records', value: lockedCount, icon: <Lock size={20} />, color: 'amber' },
    { label: 'Pending Approvals', value: pendingLocks.length, icon: <Clock size={20} />, color: 'rose' },
  ];

  const colorMap: Record<string, string> = {
    gold: 'from-gold-500/20 to-gold-500/5 border-gold-500/20 text-gold-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
  };

  return (
    <div className="space-y-6">
      {/* Payment Status Banner */}
      {paymentStatus === 'pending' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <CreditCard size={24} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-500 font-semibold">⚠️ Payment Pending</p>
              <p className="text-neutral-400 text-sm">Your membership fee of 15,000 MWK is pending.</p>
            </div>
          </div>
          <button onClick={handleCompletePayment} className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-lg text-sm">Complete Payment</button>
        </div>
      )}

      {paymentStatus === 'paid' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-500 font-semibold">✓ Payment Confirmed</p>
              <p className="text-neutral-400 text-sm">Your membership is active and you have full access.</p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-xl font-bold text-neutral-950">
            {profile.stage_name?.charAt(0).toUpperCase() || profile.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile.stage_name || profile.full_name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile.association_verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Verified Producer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Clock size={12} /> Pending Verification
                </span>
              )}
              {paymentStatus === 'pending' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                  <CreditCard size={12} /> Payment Pending
                </span>
              )}
              {paymentStatus === 'paid' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Active Member
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
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
                  <p className="text-sm font-medium text-white truncate">{entry.song_title}</p>
                  <p className="text-xs text-neutral-500">{entry.artist_names?.join(', ') || 'No artist'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {entry.is_locked ? (
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
    </div>
  );
}