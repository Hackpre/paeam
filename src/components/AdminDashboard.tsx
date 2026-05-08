import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { ProducerProfile, CatalogEntry, Contract, Payment, Dispute, UserRoleAssignment, LockApproval } from '../lib/types';
import { formatDate, formatCurrency, getMembershipBadge } from '../lib/utils';
import {
  Users,
  UserCheck,
  CreditCard,
  Music,
  FileText,
  AlertTriangle,
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  BarChart3,
  Activity,
  ArrowRight,
  ChevronDown,
  Lock,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Eye,
  X,
  Building2,
  Clock,
} from 'lucide-react';

type TabKey = 'overview' | 'producers' | 'songs' | 'contracts' | 'locks' | 'payments' | 'disputes' | 'users';
type VerificationFilter = 'all' | 'pending' | 'verified' | 'rejected' | 'suspended';
type PaymentFilter = 'all' | 'pending' | 'completed' | 'failed' | 'bank_transfer_pending';

const ROLES: UserRoleAssignment['role'][] = [
  'super_admin', 'paeam_admin', 'moderator', 'producer', 'artist', 'viewer', 'auditor',
];

async function callAdminAction(action: string, payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Action failed.');
  return data;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [producers, setProducers] = useState<ProducerProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleAssignment[]>([]);
  const [lockApprovals, setLockApprovals] = useState<LockApproval[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; description: string; time: string }[]>([]);

  const [producerSearch, setProducerSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [roleUpdates, setRoleUpdates] = useState<Record<string, UserRoleAssignment['role']>>({});

  const [stats, setStats] = useState({
    totalProducers: 0, pendingVerifications: 0, pendingPayments: 0,
    totalSongs: 0, totalContracts: 0, lockedRecords: 0,
    monthlyRevenue: 0, annualRevenue: 0,
    pendingSongs: 0, pendingContracts: 0, pendingLocks: 0, pendingBankTransfers: 0,
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ paymentId: string; action: 'approved' | 'rejected' } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ type: 'song' | 'contract'; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const viewProof = async (filePath: string) => {
    try {
      const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(filePath, 3600);
      if (data?.signedUrl) setProofModalUrl(data.signedUrl);
      else alert('Unable to generate access link for this proof.');
    } catch { alert('Error accessing proof file.'); }
  };

  const loadOverviewStats = useCallback(async () => {
    const [p, pv, pp, ts, tc, lc, lcon] = await Promise.all([
      supabase.from('producer_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('producer_profiles').select('*', { count: 'exact', head: true }).eq('association_verification_status', 'pending'),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('catalog_entries').select('*', { count: 'exact', head: true }),
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      supabase.from('catalog_entries').select('*', { count: 'exact', head: true }).eq('is_locked', true),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('is_locked', true),
    ]);

    const { count: ps } = await supabase.from('catalog_entries').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending');
    const { count: pc } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending');
    const { count: pl } = await supabase.from('lock_approvals').select('*', { count: 'exact', head: true }).eq('producer_approved', true).eq('artist_approved', true).eq('association_approved', false);
    const { count: pbt } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'bank_transfer_pending');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const { data: mp } = await supabase.from('payments').select('amount').eq('status', 'completed').gte('created_at', startOfMonth);
    const { data: ap } = await supabase.from('payments').select('amount').eq('status', 'completed').gte('created_at', startOfYear);

    setStats({
      totalProducers: p.count || 0, pendingVerifications: pv.count || 0, pendingPayments: pp.count || 0,
      totalSongs: ts.count || 0, totalContracts: tc.count || 0, lockedRecords: (lc.count || 0) + (lcon.count || 0),
      monthlyRevenue: (mp ?? []).reduce((s, x) => s + (x.amount || 0), 0),
      annualRevenue: (ap ?? []).reduce((s, x) => s + (x.amount || 0), 0),
      pendingSongs: ps || 0, pendingContracts: pc || 0, pendingLocks: pl || 0, pendingBankTransfers: pbt || 0,
    });
  }, []);

  const loadProducers = useCallback(async () => {
    const { data } = await supabase.from('producer_profiles').select('*').order('created_at', { ascending: false });
    setProducers(data || []);
  }, []);

  const loadPayments = useCallback(async () => {
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    setPayments(data || []);
  }, []);

  const loadContent = useCallback(async () => {
    const [cat, con] = await Promise.all([
      supabase.from('catalog_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
    ]);
    setCatalogEntries(cat.data || []);
    setContracts(con.data || []);
  }, []);

  const loadLockApprovals = useCallback(async () => {
    const { data } = await supabase.from('lock_approvals').select('*').order('created_at', { ascending: false });
    setLockApprovals(data || []);
  }, []);

  const loadDisputes = useCallback(async () => {
    const { data } = await supabase.from('disputes').select('*').order('created_at', { ascending: false });
    setDisputes(data || []);
  }, []);

  const loadUserRoles = useCallback(async () => {
    const { data } = await supabase.from('user_roles').select('*').order('assigned_at', { ascending: false });
    setUserRoles(data || []);
    const updates: Record<string, UserRoleAssignment['role']> = {};
    (data || []).forEach((ur: UserRoleAssignment) => { updates[ur.id] = ur.role; });
    setRoleUpdates(updates);
  }, []);

  const loadRecentActivity = useCallback(async () => {
    const { data: auditLogs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10);
    if (auditLogs && auditLogs.length > 0) {
      setRecentActivity(auditLogs.map((log) => ({
        type: log.record_type || log.action || 'system',
        description: `${log.action} on ${log.record_type}${log.record_id ? ` (${log.record_id.substring(0, 8)}...)` : ''}`,
        time: log.created_at,
      })));
      return;
    }
    const activities: { type: string; description: string; time: string }[] = [];
    const { data: rp } = await supabase.from('payments').select('payment_type, status, created_at, amount').order('created_at', { ascending: false }).limit(5);
    (rp ?? []).forEach((p) => activities.push({ type: 'payment', description: `${p.payment_type.replace(/_/g, ' ')} - ${formatCurrency(p.amount)} (${p.status})`, time: p.created_at }));
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 10));
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadOverviewStats(), loadProducers(), loadPayments(), loadContent(), loadLockApprovals(), loadDisputes(), loadUserRoles(), loadRecentActivity()]);
    } catch (e) { console.error('Error loading admin data:', e); }
    finally { setLoading(false); }
  }, [loadOverviewStats, loadProducers, loadPayments, loadContent, loadLockApprovals, loadDisputes, loadUserRoles, loadRecentActivity]);

  const refreshTab = useCallback(async () => {
    switch (activeTab) {
      case 'overview': await Promise.all([loadOverviewStats(), loadRecentActivity()]); break;
      case 'producers': await loadProducers(); break;
      case 'songs': await loadContent(); break;
      case 'contracts': await loadContent(); break;
      case 'locks': await loadLockApprovals(); break;
      case 'payments': await loadPayments(); break;
      case 'disputes': await loadDisputes(); break;
      case 'users': await loadUserRoles(); break;
    }
  }, [activeTab, loadOverviewStats, loadRecentActivity, loadProducers, loadPayments, loadContent, loadLockApprovals, loadDisputes, loadUserRoles]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // --- Actions via edge function ---

  const handleVerifyProducer = async (producerId: string) => {
    setActionLoading(producerId);
    try {
      await callAdminAction('verify_producer', { producer_id: producerId });
      await Promise.all([loadProducers(), loadOverviewStats()]);
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  };

  const handleRejectProducer = async (producerId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(producerId);
    try {
      await callAdminAction('reject_producer', { producer_id: producerId, reason });
      await Promise.all([loadProducers(), loadOverviewStats()]);
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  };

  const handleApproveSong = async (songId: string) => {
    setActionLoading(songId);
    try {
      await callAdminAction('approve_song', { song_id: songId });
      await Promise.all([loadContent(), loadOverviewStats()]);
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  };

  const handleRejectSong = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) { alert('Rejection reason is required.'); return; }
    setRejectLoading(true);
    try {
      await callAdminAction('reject_song', { song_id: rejectModal.id, reason: rejectReason });
      await Promise.all([loadContent(), loadOverviewStats()]);
      setRejectModal(null);
      setRejectReason('');
    } catch (e: any) { alert(e.message); }
    setRejectLoading(false);
  };

  const handleApproveContract = async (contractId: string) => {
    setActionLoading(contractId);
    try {
      await callAdminAction('approve_contract', { contract_id: contractId });
      await Promise.all([loadContent(), loadOverviewStats()]);
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  };

  const handleRejectContract = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) { alert('Rejection reason is required.'); return; }
    setRejectLoading(true);
    try {
      await callAdminAction('reject_contract', { contract_id: rejectModal.id, reason: rejectReason });
      await Promise.all([loadContent(), loadOverviewStats()]);
      setRejectModal(null);
      setRejectReason('');
    } catch (e: any) { alert(e.message); }
    setRejectLoading(false);
  };

  const handleFinalizeLock = async (lockId: string) => {
    if (!confirm('Finalize this Three-Way Lock? The record will become immutable.')) return;
    setActionLoading(lockId);
    try {
      await callAdminAction('finalize_lock', { lock_id: lockId });
      await Promise.all([loadLockApprovals(), loadContent(), loadOverviewStats()]);
    } catch (e: any) { alert(e.message); }
    setActionLoading(null);
  };

  const handleConfirmBankTransfer = async () => {
    if (!confirmModal || !user) return;
    setConfirmLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pay`;
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: 'confirm_bank_transfer', payment_id: confirmModal.paymentId, decision: confirmModal.action, admin_notes: confirmNotes }),
      });
      const data = await response.json();
      if (!response.ok) alert(data.error || 'Failed to process.');
      else await Promise.all([loadPayments(), loadOverviewStats(), loadProducers()]);
    } catch { alert('Network error.'); }
    finally { setConfirmLoading(false); setConfirmModal(null); setConfirmNotes(''); }
  };

  const handleUpdateRole = async (assignmentId: string) => {
    const newRole = roleUpdates[assignmentId];
    if (!newRole) return;
    setActionLoading(assignmentId);
    const { error } = await supabase.from('user_roles').update({ role: newRole, assigned_by: user?.id, assigned_at: new Date().toISOString() }).eq('id', assignmentId);
    if (error) alert('Error: ' + error.message);
    else await loadUserRoles();
    setActionLoading(null);
  };

  const resolveDispute = async (disputeId: string) => {
    const resolution = prompt('Enter resolution details:');
    if (!resolution) return;
    setActionLoading(disputeId);
    const { error } = await supabase.from('disputes').update({ status: 'resolved', resolution, resolved_by: user?.id, resolved_at: new Date().toISOString() }).eq('id', disputeId);
    if (error) alert('Error: ' + error.message);
    else await loadDisputes();
    setActionLoading(null);
  };

  // --- Filtered lists ---
  const filteredProducers = producers.filter((p) => {
    const ms = producerSearch === '' || p.full_legal_name.toLowerCase().includes(producerSearch.toLowerCase()) || p.email.toLowerCase().includes(producerSearch.toLowerCase()) || p.stage_name.toLowerCase().includes(producerSearch.toLowerCase());
    const mv = verificationFilter === 'all' || p.association_verification_status === verificationFilter;
    return ms && mv;
  });
  const filteredPayments = payments.filter((p) => paymentFilter === 'all' || p.status === paymentFilter);
  const pendingCatalogEntries = catalogEntries.filter((e) => e.approval_status === 'pending');
  const pendingContracts = contracts.filter((c) => c.approval_status === 'pending');
  const pendingLockFinalizations = lockApprovals.filter((l) => l.producer_approved && l.artist_approved && !l.association_approved);

  // --- Badge helpers ---
  const verificationBadge = (status: string) => {
    switch (status) {
      case 'verified': return <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Verified</span>;
      case 'pending': return <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">Pending</span>;
      case 'rejected': return <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Rejected</span>;
      case 'suspended': return <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Suspended</span>;
      default: return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const paymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Completed</span>;
      case 'pending': return <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">Pending</span>;
      case 'processing': return <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Processing</span>;
      case 'failed': return <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Failed</span>;
      case 'refunded': return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">Refunded</span>;
      case 'bank_transfer_pending': return <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Bank Transfer Pending</span>;
      default: return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const disputeStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Resolved</span>;
      case 'filed': return <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">Filed</span>;
      case 'under_review': return <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Under Review</span>;
      case 'mediation': return <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Mediation</span>;
      case 'arbitration': return <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">Arbitration</span>;
      case 'dismissed': return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">Dismissed</span>;
      default: return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const approvalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Approved</span>;
      case 'pending': return <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">Pending</span>;
      case 'rejected': return <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Rejected</span>;
      case 'locked': return <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Locked</span>;
      default: return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard size={16} className="text-gold-400" />;
      case 'dispute': return <AlertTriangle size={16} className="text-red-400" />;
      case 'producer': return <Users size={16} className="text-green-400" />;
      case 'catalog_entry': return <Music size={16} className="text-gold-500" />;
      case 'contract': return <FileText size={16} className="text-gold-600" />;
      default: return <Activity size={16} className="text-neutral-400" />;
    }
  };

  const paymentMethodLabel = (method: string): string => {
    switch (method) {
      case 'airtel_money': return 'Airtel Money';
      case 'tnm_mpamba': return 'TNM Mpamba';
      case 'national_bank': return 'National Bank';
      case 'card': return 'Card';
      default: return method || 'N/A';
    }
  };

  if (loading) {
    return (<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>);
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { key: 'producers', label: 'Producers', icon: <Users size={16} />, badge: stats.pendingVerifications },
    { key: 'songs', label: 'Songs', icon: <Music size={16} />, badge: stats.pendingSongs },
    { key: 'contracts', label: 'Contracts', icon: <FileText size={16} />, badge: stats.pendingContracts },
    { key: 'locks', label: 'Locks', icon: <Lock size={16} />, badge: stats.pendingLocks },
    { key: 'payments', label: 'Payments', icon: <CreditCard size={16} />, badge: stats.pendingBankTransfers },
    { key: 'disputes', label: 'Disputes', icon: <AlertTriangle size={16} /> },
    { key: 'users', label: 'Users', icon: <Shield size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-neutral-400">PAEAM Association Witness -- manage approvals, locks, and verifications</p>
        </div>
        <button onClick={refreshTab} className="px-3 py-2 text-neutral-400 hover:text-gold-400 transition-colors border border-neutral-800 rounded-lg hover:border-gold-600/50" title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tab Navigation with badges */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-gold-600 text-neutral-950' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge ? <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ===== Overview Tab ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Users size={20} className="text-gold-400" />, label: 'Pending Verifications', value: stats.pendingVerifications, color: 'text-gold-400' },
              { icon: <Music size={20} className="text-gold-500" />, label: 'Pending Songs', value: stats.pendingSongs, color: 'text-gold-400' },
              { icon: <FileText size={20} className="text-gold-400" />, label: 'Pending Contracts', value: stats.pendingContracts, color: 'text-gold-400' },
              { icon: <Lock size={20} className="text-gold-500" />, label: 'Pending Lock Finalizations', value: stats.pendingLocks, color: 'text-gold-400' },
            ].map((card) => (
              <div key={card.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">{card.icon}</div>
                  <span className="text-neutral-400 text-sm">{card.label}</span>
                </div>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <CreditCard size={20} className="text-gold-600" />, label: 'Pending Bank Transfers', value: stats.pendingBankTransfers, color: 'text-gold-400' },
              { icon: <Users size={20} className="text-gold-400" />, label: 'Total Producers', value: stats.totalProducers, color: 'text-white' },
              { icon: <Lock size={20} className="text-gold-500" />, label: 'Locked Records', value: stats.lockedRecords, color: 'text-gold-400' },
              { icon: <TrendingUp size={20} className="text-gold-700" />, label: 'Annual Revenue', value: formatCurrency(stats.annualRevenue), color: 'text-gold-400' },
            ].map((card) => (
              <div key={card.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">{card.icon}</div>
                  <span className="text-neutral-400 text-sm">{card.label}</span>
                </div>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity size={20} className="text-gold-400" />Recent Activity</h3>
            {recentActivity.length === 0 ? <p className="text-neutral-500 text-sm">No recent activity.</p> : (
              <div className="space-y-3">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-2 border-b border-neutral-800 last:border-0">
                    <div className="mt-0.5">{activityIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-200 truncate">{item.description}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{formatDate(item.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Producers Tab ===== */}
      {activeTab === 'producers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input type="text" placeholder="Search by name or email..." value={producerSearch} onChange={(e) => setProducerSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-gold-600 transition-colors" />
            </div>
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value as VerificationFilter)}
                className="appearance-none bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-gold-600 transition-colors">
                <option value="all">All Statuses</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          {filteredProducers.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"><Users size={48} className="text-neutral-600 mx-auto mb-3" /><p className="text-neutral-400">No producers found.</p></div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-neutral-800">
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Stage Name</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Verification</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Membership</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredProducers.map((producer) => {
                      const membership = getMembershipBadge(producer.membership_status);
                      return (
                        <tr key={producer.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="px-5 py-4 text-sm text-white font-medium">{producer.full_legal_name}</td>
                          <td className="px-5 py-4 text-sm text-neutral-300">{producer.stage_name}</td>
                          <td className="px-5 py-4 text-sm text-neutral-400">{producer.email}</td>
                          <td className="px-5 py-4">{verificationBadge(producer.association_verification_status)}</td>
                          <td className="px-5 py-4"><span className={`text-xs px-2 py-0.5 rounded-full ${membership.color}`}>{membership.label}</span></td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {producer.association_verification_status === 'pending' && (
                                <>
                                  <button onClick={() => handleVerifyProducer(producer.id)} disabled={actionLoading === producer.id}
                                    className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-neutral-950 text-xs font-semibold rounded-md transition-colors disabled:opacity-50">Verify</button>
                                  <button onClick={() => handleRejectProducer(producer.id)} disabled={actionLoading === producer.id}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50">Reject</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Songs Tab ===== */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Music size={18} className="text-gold-400" />Pending Song Approvals <span className="text-sm font-normal text-neutral-500">({pendingCatalogEntries.length})</span></h3>
          {pendingCatalogEntries.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"><Music size={40} className="text-neutral-600 mx-auto mb-2" /><p className="text-neutral-400 text-sm">No pending songs.</p></div>
          ) : (
            <div className="space-y-3">
              {pendingCatalogEntries.map((entry) => (
                <div key={entry.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0"><Music size={24} className="text-gold-400" /></div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-semibold text-white truncate">{entry.song_title}</h4>
                        <p className="text-neutral-400 text-sm">Artist: {entry.artist_names?.join(', ') || 'N/A'} | Producer: {entry.producer_name} | Genre: {entry.genre}</p>
                        <p className="text-xs text-neutral-500 mt-1">Uploaded: {formatDate(entry.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApproveSong(entry.id)} disabled={actionLoading === entry.id}
                        className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm">
                        <CheckCircle2 size={14} /> Approve</button>
                      <button onClick={() => setRejectModal({ type: 'song', id: entry.id })} disabled={actionLoading === entry.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm">
                        <XCircle size={14} /> Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Contracts Tab ===== */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FileText size={18} className="text-gold-400" />Pending Contract Approvals <span className="text-sm font-normal text-neutral-500">({pendingContracts.length})</span></h3>
          {pendingContracts.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"><FileText size={40} className="text-neutral-600 mx-auto mb-2" /><p className="text-neutral-400 text-sm">No pending contracts.</p></div>
          ) : (
            <div className="space-y-3">
              {pendingContracts.map((contract) => (
                <div key={contract.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0"><FileText size={24} className="text-gold-400" /></div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-semibold text-white truncate">{contract.contract_type.replace(/_/g, ' ')} Contract</h4>
                        <p className="text-neutral-400 text-sm">Royalty: {contract.royalty_percentage}% | Duration: {contract.agreement_duration_months}mo | Territory: {contract.territory}</p>
                        <p className="text-xs text-neutral-500 mt-1">Created: {formatDate(contract.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApproveContract(contract.id)} disabled={actionLoading === contract.id}
                        className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm">
                        <CheckCircle2 size={14} /> Approve</button>
                      <button onClick={() => setRejectModal({ type: 'contract', id: contract.id })} disabled={actionLoading === contract.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm">
                        <XCircle size={14} /> Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Locks Tab ===== */}
      {activeTab === 'locks' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Lock size={18} className="text-gold-400" />Pending Lock Finalizations <span className="text-sm font-normal text-neutral-500">({pendingLockFinalizations.length})</span></h3>
          <p className="text-sm text-neutral-400">These records have both Producer and Artist approvals. As Association Witness, your approval seals the lock and makes the record immutable.</p>
          {pendingLockFinalizations.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"><Lock size={40} className="text-neutral-600 mx-auto mb-2" /><p className="text-neutral-400 text-sm">No locks awaiting finalization.</p></div>
          ) : (
            <div className="space-y-3">
              {pendingLockFinalizations.map((lock) => {
                const recordTitle = lock.record_type === 'catalog_entry'
                  ? catalogEntries.find(e => e.id === lock.record_id)?.song_title || 'Unknown Song'
                  : contracts.find(c => c.id === lock.record_id)?.contract_type?.replace(/_/g, ' ') + ' Contract' || 'Unknown Contract';
                return (
                  <div key={lock.id} className="bg-neutral-900 border border-gold-500/20 rounded-xl p-5">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0"><Lock size={24} className="text-gold-400" /></div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-semibold text-white truncate">{recordTitle}</h4>
                          <p className="text-neutral-400 text-sm capitalize">{lock.record_type.replace(/_/g, ' ')}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 size={12} /> Producer</span>
                            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 size={12} /> Artist</span>
                            <span className="flex items-center gap-1 text-xs text-yellow-400"><Clock size={12} /> Association</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">Initiated: {formatDate(lock.created_at)}</p>
                        </div>
                      </div>
                      <button onClick={() => handleFinalizeLock(lock.id)} disabled={actionLoading === lock.id}
                        className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 text-sm flex-shrink-0">
                        <Lock size={14} /> Finalize Lock</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== Payments Tab ===== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {payments.filter(p => p.status === 'bank_transfer_pending').length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Building2 size={18} className="text-blue-400" />Pending Bank Transfers <span className="text-sm font-normal text-neutral-500">({payments.filter(p => p.status === 'bank_transfer_pending').length})</span></h3>
              <div className="space-y-3">
                {payments.filter(p => p.status === 'bank_transfer_pending').map((payment) => {
                  const producer = producers.find((p) => p.id === payment.producer_id);
                  return (
                    <div key={payment.id} className="bg-neutral-900 border border-blue-500/20 rounded-xl p-5">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0"><CreditCard size={24} className="text-blue-400" /></div>
                          <div className="min-w-0">
                            <h4 className="text-lg font-semibold text-white">{producer?.full_legal_name || 'Unknown'}</h4>
                            <p className="text-neutral-400 text-sm">{producer?.email || payment.user_id}</p>
                            <p className="text-gold-400 font-semibold text-sm mt-1">{formatCurrency(payment.amount)} MWK</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {payment.proof_of_payment_url && (
                            <button onClick={() => viewProof(payment.proof_of_payment_url)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm"><Eye size={14} /> View Proof</button>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmModal({ paymentId: payment.id, action: 'approved' })} className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm"><CheckCircle2 size={14} /> Approve</button>
                            <button onClick={() => setConfirmModal({ paymentId: payment.id, action: 'rejected' })} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm"><XCircle size={14} /> Reject</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">All Payments</h3>
            <div className="flex items-center gap-3 mb-4">
              <Filter size={16} className="text-neutral-500" />
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                className="appearance-none bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-gold-600 transition-colors pr-10">
                <option value="all">All Statuses</option><option value="pending">Pending</option><option value="bank_transfer_pending">Bank Transfer Pending</option><option value="completed">Completed</option><option value="failed">Failed</option>
              </select>
            </div>
            {filteredPayments.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"><CreditCard size={48} className="text-neutral-600 mx-auto mb-3" /><p className="text-neutral-400">No payments found.</p></div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-neutral-800">
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Producer</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Type</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Method</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-neutral-800">
                      {filteredPayments.map((payment) => {
                        const producer = producers.find((p) => p.id === payment.producer_id);
                        return (
                          <tr key={payment.id} className="hover:bg-neutral-800/50 transition-colors">
                            <td className="px-5 py-4 text-sm text-white font-medium">{producer?.full_legal_name || 'Unknown'}</td>
                            <td className="px-5 py-4 text-sm text-gold-400 font-semibold">{formatCurrency(payment.amount)}</td>
                            <td className="px-5 py-4 text-sm text-neutral-300">{payment.payment_type.replace(/_/g, ' ')}</td>
                            <td className="px-5 py-4">{paymentStatusBadge(payment.status)}</td>
                            <td className="px-5 py-4 text-sm text-neutral-500">{formatDate(payment.created_at)}</td>
                            <td className="px-5 py-4 text-sm text-neutral-400">{paymentMethodLabel(payment.payment_method)}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                {payment.status === 'bank_transfer_pending' && payment.proof_of_payment_url && (
                                  <button onClick={() => viewProof(payment.proof_of_payment_url)} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1"><Eye size={12} /> Proof</button>
                                )}
                                {payment.status === 'bank_transfer_pending' && (
                                  <>
                                    <button onClick={() => setConfirmModal({ paymentId: payment.id, action: 'approved' })} className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-neutral-950 text-xs font-semibold rounded-md transition-colors">Approve</button>
                                    <button onClick={() => setConfirmModal({ paymentId: payment.id, action: 'rejected' })} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors">Reject</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          {/* Proof Modal */}
          {proofModalUrl && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-neutral-800"><h3 className="text-lg font-semibold text-white">Proof of Payment</h3><button onClick={() => setProofModalUrl(null)} className="text-neutral-400 hover:text-white"><X size={20} /></button></div>
                <div className="p-4 overflow-auto max-h-[70vh]">
                  {proofModalUrl.includes('.pdf') ? <iframe src={proofModalUrl} className="w-full h-[60vh] rounded-lg" title="Proof" /> : <img src={proofModalUrl} alt="Proof" className="max-w-full mx-auto rounded-lg" />}
                </div>
              </div>
            </div>
          )}
          {/* Bank Transfer Confirm Modal */}
          {confirmModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${confirmModal.action === 'approved' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {confirmModal.action === 'approved' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div><h3 className="text-lg font-semibold text-white">{confirmModal.action === 'approved' ? 'Approve Bank Transfer' : 'Reject Bank Transfer'}</h3>
                    <p className="text-xs text-neutral-400">{confirmModal.action === 'approved' ? 'This will activate the user\'s membership.' : 'This will mark the payment as failed.'}</p></div>
                </div>
                <div className="mb-4"><label className="block text-sm font-medium text-neutral-300 mb-2">Admin Notes</label>
                  <textarea value={confirmNotes} onChange={(e) => setConfirmNotes(e.target.value)} rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-gold-600 transition-colors placeholder:text-neutral-500 text-sm"
                    placeholder={confirmModal.action === 'approved' ? 'Optional notes...' : 'Reason for rejection...'} /></div>
                <div className="flex gap-3">
                  <button onClick={() => { setConfirmModal(null); setConfirmNotes(''); }} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-4 py-2.5 rounded-xl border border-neutral-700 transition-colors text-sm">Cancel</button>
                  <button onClick={handleConfirmBankTransfer} disabled={confirmLoading}
                    className={`flex-1 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50 ${confirmModal.action === 'approved' ? 'bg-gold-600 hover:bg-gold-700 text-neutral-950' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                    {confirmLoading ? 'Processing...' : confirmModal.action === 'approved' ? 'Approve' : 'Reject'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Disputes Tab ===== */}
      {activeTab === 'disputes' && (
        <div className="space-y-3">
          {disputes.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"><AlertTriangle size={48} className="text-neutral-600 mx-auto mb-3" /><p className="text-neutral-400">No disputes found.</p></div>
          ) : disputes.map((dispute) => (
            <div key={dispute.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0"><AlertTriangle size={24} className="text-gold-400" /></div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{dispute.dispute_type.replace(/_/g, ' ')} Dispute</h3>
                    <p className="text-neutral-400 text-sm truncate">{dispute.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">{disputeStatusBadge(dispute.status)}<span className="text-xs text-neutral-500">Filed: {formatDate(dispute.created_at)}</span></div>
                    {dispute.resolution && <p className="text-sm text-neutral-300 mt-2 border-t border-neutral-800 pt-2">Resolution: {dispute.resolution}</p>}
                  </div>
                </div>
                {dispute.status !== 'resolved' && dispute.status !== 'dismissed' && (
                  <button onClick={() => resolveDispute(dispute.id)} disabled={actionLoading === dispute.id}
                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0 text-sm"><CheckCircle2 size={14} /> Resolve</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Users Tab ===== */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {userRoles.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"><Shield size={48} className="text-neutral-600 mx-auto mb-3" /><p className="text-neutral-400">No user roles found.</p></div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-neutral-800">
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">User ID</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Assigned</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Change Role</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-neutral-800">
                    {userRoles.map((assignment) => {
                      const currentRole = roleUpdates[assignment.id] ?? assignment.role;
                      const hasChanged = currentRole !== assignment.role;
                      return (
                        <tr key={assignment.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="px-5 py-4 text-sm text-neutral-300 font-mono">{assignment.user_id}</td>
                          <td className="px-5 py-4"><span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">{assignment.role}</span></td>
                          <td className="px-5 py-4 text-sm text-neutral-500">{formatDate(assignment.assigned_at)}</td>
                          <td className="px-5 py-4">
                            <div className="relative">
                              <select value={currentRole} onChange={(e) => setRoleUpdates((prev) => ({ ...prev, [assignment.id]: e.target.value as UserRoleAssignment['role'] }))}
                                disabled={actionLoading === assignment.id}
                                className="appearance-none bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-gold-500 transition-colors disabled:opacity-50">
                                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <button onClick={() => handleUpdateRole(assignment.id)} disabled={!hasChanged || actionLoading === assignment.id}
                              className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-neutral-950 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Update</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Reject Modal (Songs/Contracts) ===== */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-400" /></div>
              <div><h3 className="text-lg font-semibold text-white">Reject {rejectModal.type === 'song' ? 'Song' : 'Contract'}</h3>
                <p className="text-xs text-neutral-400">The submitter will be notified with the reason.</p></div>
            </div>
            <div className="mb-4"><label className="block text-sm font-medium text-neutral-300 mb-2">Rejection Reason</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-gold-600 transition-colors placeholder:text-neutral-500 text-sm"
                placeholder="Explain why this is being rejected..." /></div>
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-4 py-2.5 rounded-xl border border-neutral-700 transition-colors text-sm">Cancel</button>
              <button onClick={rejectModal.type === 'song' ? handleRejectSong : handleRejectContract} disabled={rejectLoading || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">
                {rejectLoading ? 'Processing...' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
