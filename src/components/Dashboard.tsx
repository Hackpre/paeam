import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { ProducerProfile, CatalogEntry, Payment } from '../lib/types';
import { formatCurrency, formatDate, getMembershipBadge } from '../lib/utils';
import PaymentModal from './PaymentModal';
import { Disc3, FileText, Lock, Clock, Shield, CheckCircle2, AlertTriangle, CreditCard, Upload, Plus, Hash, History, Search, Music, ArrowRight, CircleUser as UserCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [producerProfile, setProducerProfile] = useState<ProducerProfile | null>(null);
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [contractCount, setContractCount] = useState(0);
  const [lockedCount, setLockedCount] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load producer profile
      const { data: prof } = await supabase
        .from('producer_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      setProducerProfile(prof);

      if (prof) {
        // Load catalog count
        const { count: catCount } = await supabase
          .from('catalog_entries')
          .select('*', { count: 'exact', head: true })
          .eq('producer_id', prof.id);
        setCatalogCount(catCount ?? 0);

        // Load recent catalog entries
        const { data: recentCatalog } = await supabase
          .from('catalog_entries')
          .select('*')
          .eq('producer_id', prof.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setCatalogEntries(recentCatalog ?? []);

        // Load contract count
        const { count: conCount } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('catalog_entry_id', `in.(select id from catalog_entries where producer_id = '${prof.id}')`);
        setContractCount(conCount ?? 0);

        // Load locked records count
        const { data: lockedCatalog } = await supabase
          .from('catalog_entries')
          .select('id')
          .eq('producer_id', prof.id)
          .eq('is_locked', true);
        const lockedCatCount = lockedCatalog?.length ?? 0;

        const { data: lockedContracts } = await supabase
          .from('contracts')
          .select('id')
          .in('catalog_entry_id', (recentCatalog ?? []).map(c => c.id))
          .eq('is_locked', true);
        const lockedConCount = lockedContracts?.length ?? 0;
        setLockedCount(lockedCatCount + lockedConCount);

        // Load pending lock approvals
        const { data: pendingLocks } = await supabase
          .from('lock_approvals')
          .select('*')
          .eq('is_fully_locked', false)
          .limit(100);
        setPendingApprovals((pendingLocks ?? []).length);

        // Count pending approvals for this producer's records
        const catalogIds = (recentCatalog ?? []).map(c => c.id);
        let pendingCount = 0;
        if (catalogIds.length > 0) {
          const { count: pendingCat } = await supabase
            .from('catalog_entries')
            .select('*', { count: 'exact', head: true })
            .eq('producer_id', prof.id)
            .eq('approval_status', 'pending');
          pendingCount += pendingCat ?? 0;
        }
        setPendingApprovals(pendingCount);

        // Load recent payments
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentPayments(payments ?? []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function navigateTo(page: string) {
    window.dispatchEvent(new CustomEvent('navigate', { detail: page }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeProfile = producerProfile ?? profile ?? null;
  const membershipStatus = activeProfile?.membership_status ?? 'trial';
  const badge = getMembershipBadge(membershipStatus);

  const stats = [
    {
      label: 'Catalog Entries',
      value: catalogCount,
      icon: <Disc3 size={20} className="text-gold-400" />,
    },
    {
      label: 'Contracts',
      value: contractCount,
      icon: <FileText size={20} className="text-gold-400" />,
    },
    {
      label: 'Locked Records',
      value: lockedCount,
      icon: <Lock size={20} className="text-gold-400" />,
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      icon: <Clock size={20} className="text-gold-400" />,
    },
  ];

  const quickActions = [
    {
      label: 'Upload New Song',
      description: 'Register a new song with metadata',
      icon: <Upload size={20} className="text-gold-400" />,
      page: 'catalog',
    },
    {
      label: 'Create Contract',
      description: 'Set up royalty agreements',
      icon: <Plus size={20} className="text-gold-400" />,
      page: 'contracts',
    },
    {
      label: 'Request IPI Number',
      description: 'Apply for your IPI number',
      icon: <Hash size={20} className="text-gold-400" />,
      page: 'profile',
    },
    {
      label: 'View Audit Trail',
      description: 'Review all account activity',
      icon: <Search size={20} className="text-gold-400" />,
      page: 'audit',
    },
  ];

  function getPaymentStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return { label: 'Completed', classes: 'text-green-400 bg-green-500/10' };
      case 'processing':
        return { label: 'Processing', classes: 'text-gold-400 bg-gold-500/10' };
      case 'pending':
        return { label: 'Pending', classes: 'text-yellow-400 bg-yellow-500/10' };
      case 'failed':
        return { label: 'Failed', classes: 'text-red-400 bg-red-500/10' };
      case 'refunded':
        return { label: 'Refunded', classes: 'text-neutral-400 bg-neutral-500/10' };
      case 'bank_transfer_pending':
        return { label: 'Pending Verification', classes: 'text-blue-400 bg-blue-500/10' };
      default:
        return { label: status, classes: 'text-neutral-400 bg-neutral-500/10' };
    }
  }

  function getLockStatusBadge(entry: CatalogEntry) {
    if (entry.approval_status === 'fully_locked' || (entry.is_locked && entry.approval_status === 'locked')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-full">
          <Lock size={10} /> Fully Locked
        </span>
      );
    }
    if (entry.approval_status === 'pending_association_approval') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
          <Shield size={10} /> Awaiting PAEAM
        </span>
      );
    }
    if (entry.approval_status === 'pending_artist_approval') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
          <Clock size={10} /> Awaiting Artist
        </span>
      );
    }
    if (entry.approval_status === 'pending' || entry.approval_status === 'pending_admin_approval') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
          <Clock size={10} /> Pending Admin Approval
        </span>
      );
    }
    if (entry.approval_status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
          <CheckCircle2 size={10} /> Approved
        </span>
      );
    }
    if (entry.approval_status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
          <AlertTriangle size={10} /> Rejected by Admin
        </span>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {/* No Profile Card */}
      {!activeProfile && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center">
              <UserCircle size={24} className="text-gold-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Complete Your Profile</h2>
              <p className="text-sm text-neutral-400">
                Set up your producer profile to access all PAEAM features.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateTo('profile')}
            className="px-5 py-2.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-lg text-sm transition-colors"
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* Payment Status Banner */}
      {activeProfile && (membershipStatus === 'trial' || membershipStatus === 'grace' || membershipStatus === 'suspended' || membershipStatus === 'bank_transfer_pending') && (
        <div className={`border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
          membershipStatus === 'bank_transfer_pending'
            ? 'bg-blue-500/10 border-blue-500/20'
            : membershipStatus === 'suspended'
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-yellow-500/10 border-yellow-500/20'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className={`flex-shrink-0 mt-0.5 ${
              membershipStatus === 'bank_transfer_pending' ? 'text-blue-500'
                : membershipStatus === 'suspended' ? 'text-red-500'
                : 'text-yellow-500'
            }`} />
            <div>
              <p className={`font-semibold ${
                membershipStatus === 'bank_transfer_pending' ? 'text-blue-500'
                  : membershipStatus === 'suspended' ? 'text-red-500'
                  : 'text-yellow-500'
              }`}>
                {membershipStatus === 'bank_transfer_pending' ? 'Payment Under Review'
                  : membershipStatus === 'suspended' ? 'Membership Suspended'
                  : membershipStatus === 'trial' ? 'Trial Period'
                  : 'Grace Period'}
              </p>
              <p className="text-neutral-400 text-sm">
                {membershipStatus === 'bank_transfer_pending'
                  ? 'Your bank transfer proof is being reviewed. You will be notified once verified.'
                  : membershipStatus === 'suspended'
                  ? 'Your membership fee of 15,000 MWK is overdue. Complete payment to restore access.'
                  : membershipStatus === 'trial'
                  ? 'Your membership fee of 15,000 MWK is pending. Complete payment to unlock full access.'
                  : 'Your membership payment is overdue. Complete payment to avoid suspension.'}
              </p>
            </div>
          </div>
          {membershipStatus !== 'bank_transfer_pending' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-lg text-sm transition-colors flex-shrink-0"
            >
              Pay Now
            </button>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />

      {/* Welcome Card */}
      {activeProfile && (
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-xl font-bold text-neutral-950 overflow-hidden">
              {activeProfile.profile_photo_url ? (
                <img
                  src={activeProfile.profile_photo_url}
                  alt={activeProfile.stage_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                activeProfile.stage_name?.charAt(0).toUpperCase() || 'P'
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {activeProfile.stage_name || 'Producer'}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                  <CreditCard size={12} /> {badge.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-gradient-to-br from-gold-500/20 to-gold-500/5 border border-gold-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-400">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigateTo(action.page)}
              className="p-4 bg-neutral-800 rounded-xl text-left hover:bg-neutral-700 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center">
                  {action.icon}
                </div>
                <ArrowRight size={16} className="text-neutral-500 group-hover:text-gold-400 transition-colors" />
              </div>
              <p className="text-white font-semibold text-sm">{action.label}</p>
              <p className="text-neutral-400 text-xs mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Catalog */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="font-semibold text-white">Recent Catalog</h3>
          <button
            onClick={() => navigateTo('catalog')}
            className="text-sm text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>
        {catalogEntries.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <Disc3 size={32} className="mx-auto mb-2 opacity-50" />
            <p>No catalog entries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {catalogEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-6 py-3 hover:bg-neutral-800/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                  <Music size={18} className="text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{entry.song_title}</p>
                  <p className="text-xs text-neutral-500">{formatDate(entry.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getLockStatusBadge(entry)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="font-semibold text-white">Recent Payments</h3>
          <button
            onClick={() => navigateTo('payment')}
            className="text-sm text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>
        {recentPayments.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
            <p>No payment history yet</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {recentPayments.map((payment) => {
              const payBadge = getPaymentStatusBadge(payment.status);
              return (
                <div key={payment.id} className="flex items-center gap-4 px-6 py-3 hover:bg-neutral-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <CreditCard size={18} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {payment.description || payment.payment_type}
                    </p>
                    <p className="text-xs text-neutral-500">{formatDate(payment.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-white">{formatCurrency(payment.amount)}</p>
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${payBadge.classes}`}>
                      {payBadge.label}
                    </span>
                  </div>
                </div>
              );
            })}
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
            <p className="text-2xl font-bold text-white mb-1">{lockedCount}</p>
            <p className="text-xs text-neutral-400">Records secured with multi-signature approval</p>
          </div>
          <div className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <History size={16} className="text-gold-400" />
              <span className="text-sm font-medium text-white">Audit Trail</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">All changes tracked with immutable logging</p>
          </div>
          <div className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={16} className="text-gold-400" />
              <span className="text-sm font-medium text-white">Content Hash</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">SHA-256 verification on locked records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
