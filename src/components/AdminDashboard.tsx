import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { ProducerProfile, CatalogEntry, Contract, Payment, Dispute, UserRoleAssignment } from '../lib/types';
import { formatDate, formatCurrency, getMembershipBadge } from '../lib/utils';
import {
  Users,
  UserCheck,
  CreditCard,
  Clock,
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
} from 'lucide-react';

type TabKey = 'overview' | 'producers' | 'payments' | 'content' | 'disputes' | 'users';

const ROLES: UserRoleAssignment['role'][] = [
  'super_admin',
  'paeam_admin',
  'moderator',
  'producer',
  'artist',
  'viewer',
  'auditor',
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Data states
  const [producers, setProducers] = useState<ProducerProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleAssignment[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; description: string; time: string }[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalProducers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOverviewStats = useCallback(async () => {
    const { count: totalProducers } = await supabase
      .from('producer_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeMembers } = await supabase
      .from('producer_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('membership_status', 'active');

    const { data: completedPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = (completedPayments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);

    const { count: pendingCats } = await supabase
      .from('catalog_entries')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    const { count: pendingContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    const { count: pendingVerifications } = await supabase
      .from('producer_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('association_verification_status', 'pending');

    setStats({
      totalProducers: totalProducers || 0,
      activeMembers: activeMembers || 0,
      totalRevenue,
      pendingApprovals: (pendingCats || 0) + (pendingContracts || 0) + (pendingVerifications || 0),
    });
  }, []);

  const loadProducers = useCallback(async () => {
    const { data } = await supabase
      .from('producer_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setProducers(data || []);
  }, []);

  const loadPayments = useCallback(async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    setPayments(data || []);
  }, []);

  const loadContent = useCallback(async () => {
    const [catResult, conResult] = await Promise.all([
      supabase.from('catalog_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
    ]);
    setCatalogEntries(catResult.data || []);
    setContracts(conResult.data || []);
  }, []);

  const loadDisputes = useCallback(async () => {
    const { data } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });
    setDisputes(data || []);
  }, []);

  const loadUserRoles = useCallback(async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .order('assigned_at', { ascending: false });
    setUserRoles(data || []);
  }, []);

  const loadRecentActivity = useCallback(async () => {
    const activities: { type: string; description: string; time: string }[] = [];

    const { data: recentPayments } = await supabase
      .from('payments')
      .select('payment_type, status, created_at, amount')
      .order('created_at', { ascending: false })
      .limit(5);

    (recentPayments ?? []).forEach((p) => {
      activities.push({
        type: 'payment',
        description: `${p.payment_type} payment - ${formatCurrency(p.amount)} (${p.status})`,
        time: p.created_at,
      });
    });

    const { data: recentDisputes } = await supabase
      .from('disputes')
      .select('dispute_type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    (recentDisputes ?? []).forEach((d) => {
      activities.push({
        type: 'dispute',
        description: `${d.dispute_type} dispute filed (${d.status})`,
        time: d.created_at,
      });
    });

    const { data: recentProfiles } = await supabase
      .from('producer_profiles')
      .select('full_legal_name, association_verification_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    (recentProfiles ?? []).forEach((p) => {
      activities.push({
        type: 'producer',
        description: `${p.full_legal_name} registered (verification: ${p.association_verification_status})`,
        time: p.created_at,
      });
    });

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 15));
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOverviewStats(),
        loadProducers(),
        loadPayments(),
        loadContent(),
        loadDisputes(),
        loadUserRoles(),
        loadRecentActivity(),
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadOverviewStats, loadProducers, loadPayments, loadContent, loadDisputes, loadUserRoles, loadRecentActivity]);

  const refreshTab = useCallback(async () => {
    switch (activeTab) {
      case 'overview':
        await Promise.all([loadOverviewStats(), loadRecentActivity()]);
        break;
      case 'producers':
        await loadProducers();
        break;
      case 'payments':
        await loadPayments();
        break;
      case 'content':
        await loadContent();
        break;
      case 'disputes':
        await loadDisputes();
        break;
      case 'users':
        await loadUserRoles();
        break;
    }
  }, [activeTab, loadOverviewStats, loadRecentActivity, loadProducers, loadPayments, loadContent, loadDisputes, loadUserRoles]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // --- Actions ---

  const approveVerification = async (producerId: string) => {
    setActionLoading(producerId);
    const { error } = await supabase
      .from('producer_profiles')
      .update({
        association_verification_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
      })
      .eq('id', producerId);
    if (error) {
      alert('Error approving verification: ' + error.message);
    } else {
      await loadProducers();
      await loadOverviewStats();
    }
    setActionLoading(null);
  };

  const rejectVerification = async (producerId: string) => {
    setActionLoading(producerId);
    const { error } = await supabase
      .from('producer_profiles')
      .update({
        association_verification_status: 'rejected',
      })
      .eq('id', producerId);
    if (error) {
      alert('Error rejecting verification: ' + error.message);
    } else {
      await loadProducers();
      await loadOverviewStats();
    }
    setActionLoading(null);
  };

  const confirmPayment = async (paymentId: string) => {
    setActionLoading(paymentId);
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
    if (error) {
      alert('Error confirming payment: ' + error.message);
    } else {
      await loadPayments();
      await loadOverviewStats();
    }
    setActionLoading(null);
  };

  const approveCatalogEntry = async (entryId: string) => {
    setActionLoading(entryId);
    const { error } = await supabase
      .from('catalog_entries')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      })
      .eq('id', entryId);
    if (error) {
      alert('Error approving catalog entry: ' + error.message);
    } else {
      await loadContent();
      await loadOverviewStats();
    }
    setActionLoading(null);
  };

  const rejectCatalogEntry = async (entryId: string) => {
    setActionLoading(entryId);
    const { error } = await supabase
      .from('catalog_entries')
      .update({
        approval_status: 'rejected',
        rejection_reason: 'Did not meet requirements',
      })
      .eq('id', entryId);
    if (error) {
      alert('Error rejecting catalog entry: ' + error.message);
    } else {
      await loadContent();
      await loadOverviewStats();
    }
    setActionLoading(null);
  };

  const approveContract = async (contractId: string) => {
    setActionLoading(contractId);
    const { error } = await supabase
      .from('contracts')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      })
      .eq('id', contractId);
    if (error) {
      alert('Error approving contract: ' + error.message);
    } else {
      await loadContent();
      await loadOverviewStats();
    }
    setActionLoading(null);
  };

  const rejectContract = async (contractId: string) => {
    setActionLoading(contractId);
    const { error } = await supabase
      .from('contracts')
      .update({
        approval_status: 'rejected',
        rejection_reason: 'Did not meet requirements',
      })
      .eq('id', contractId);
    if (error) {
      alert('Error rejecting contract: ' + error.message);
    } else {
      await loadContent();
      await loadOverviewStats();
    }
    setActionLoading(null);
  };

  const resolveDispute = async (disputeId: string) => {
    setActionLoading(disputeId);
    const resolution = prompt('Enter resolution details:');
    if (!resolution) {
      setActionLoading(null);
      return;
    }
    const { error } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolution,
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId);
    if (error) {
      alert('Error resolving dispute: ' + error.message);
    } else {
      await loadDisputes();
    }
    setActionLoading(null);
  };

  const changeUserRole = async (assignmentId: string, newRole: UserRoleAssignment['role']) => {
    setActionLoading(assignmentId);
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole, assigned_by: user?.id, assigned_at: new Date().toISOString() })
      .eq('id', assignmentId);
    if (error) {
      alert('Error updating role: ' + error.message);
    } else {
      await loadUserRoles();
    }
    setActionLoading(null);
  };

  // --- Helpers ---

  const verificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Verified</span>;
      case 'pending':
        return <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">Pending</span>;
      case 'rejected':
        return <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Rejected</span>;
      case 'suspended':
        return <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Suspended</span>;
      default:
        return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const paymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Completed</span>;
      case 'pending':
        return <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">Pending</span>;
      case 'processing':
        return <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Processing</span>;
      case 'failed':
        return <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Failed</span>;
      case 'refunded':
        return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">Refunded</span>;
      default:
        return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const disputeStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Resolved</span>;
      case 'filed':
        return <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">Filed</span>;
      case 'under_review':
        return <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Under Review</span>;
      case 'mediation':
        return <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Mediation</span>;
      case 'arbitration':
        return <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">Arbitration</span>;
      case 'dismissed':
        return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">Dismissed</span>;
      default:
        return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const approvalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Approved</span>;
      case 'pending':
        return <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">Pending</span>;
      case 'rejected':
        return <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Rejected</span>;
      default:
        return <span className="text-xs text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard size={16} className="text-gold-400" />;
      case 'dispute':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'producer':
        return <Users size={16} className="text-green-400" />;
      default:
        return <Activity size={16} className="text-neutral-400" />;
    }
  };

  // --- Loading ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Tabs ---

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { key: 'producers', label: 'Producers', icon: <Users size={16} /> },
    { key: 'payments', label: 'Payments', icon: <CreditCard size={16} /> },
    { key: 'content', label: 'Content', icon: <FileText size={16} /> },
    { key: 'disputes', label: 'Disputes', icon: <AlertTriangle size={16} /> },
    { key: 'users', label: 'Users', icon: <Shield size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-neutral-400">PAEAM administration -- manage producers, payments, content, disputes, and users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-gold-400" />
            <span className="text-neutral-400 text-sm">Total Producers</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalProducers}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck size={20} className="text-gold-500" />
            <span className="text-neutral-400 text-sm">Active Members</span>
          </div>
          <p className="text-3xl font-bold text-gold-400">{stats.activeMembers}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={20} className="text-gold-600" />
            <span className="text-neutral-400 text-sm">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-gold-700" />
            <span className="text-neutral-400 text-sm">Pending Approvals</span>
          </div>
          <p className="text-3xl font-bold text-gold-400">{stats.pendingApprovals}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gold-600 text-neutral-950'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <button
          onClick={refreshTab}
          className="ml-auto px-3 py-2 text-neutral-400 hover:text-gold-400 transition-colors"
          title="Refresh current tab"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* ===== Overview Tab ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Module Counts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Catalog Entries</h3>
                <Music size={20} className="text-gold-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Approved</span>
                  <span className="text-green-400">{catalogEntries.filter((e) => e.approval_status === 'approved').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Pending</span>
                  <span className="text-gold-400">{catalogEntries.filter((e) => e.approval_status === 'pending').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Rejected</span>
                  <span className="text-red-400">{catalogEntries.filter((e) => e.approval_status === 'rejected').length}</span>
                </div>
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Contracts</h3>
                <FileText size={20} className="text-gold-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Approved</span>
                  <span className="text-green-400">{contracts.filter((c) => c.approval_status === 'approved').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Pending</span>
                  <span className="text-gold-400">{contracts.filter((c) => c.approval_status === 'pending').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Rejected</span>
                  <span className="text-red-400">{contracts.filter((c) => c.approval_status === 'rejected').length}</span>
                </div>
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Disputes</h3>
                <AlertTriangle size={20} className="text-gold-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Resolved</span>
                  <span className="text-green-400">{disputes.filter((d) => d.status === 'resolved').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Open</span>
                  <span className="text-gold-400">{disputes.filter((d) => d.status !== 'resolved' && d.status !== 'dismissed').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Dismissed</span>
                  <span className="text-neutral-400">{disputes.filter((d) => d.status === 'dismissed').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-gold-400" />
              Recent Activity
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-neutral-500 text-sm">No recent activity to display.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-2 border-b border-neutral-800 last:border-0">
                    <div className="mt-0.5">{activityIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-200 truncate">{item.description}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{formatDate(item.time)}</p>
                    </div>
                    <ArrowRight size={14} className="text-neutral-600 mt-1 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Producers Tab ===== */}
      {activeTab === 'producers' && (
        <div className="space-y-3">
          {producers.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <Users size={48} className="text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No producers found.</p>
            </div>
          ) : (
            producers.map((producer) => {
              const membership = getMembershipBadge(producer.membership_status);
              return (
                <div key={producer.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                        <Users size={24} className="text-gold-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{producer.full_legal_name}</h3>
                        <p className="text-neutral-400 text-sm">{producer.stage_name} -- {producer.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {verificationBadge(producer.association_verification_status)}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${membership.color}`}>{membership.label}</span>
                          <span className="text-xs text-neutral-500">Joined: {formatDate(producer.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {producer.association_verification_status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => approveVerification(producer.id)}
                          disabled={actionLoading === producer.id}
                          className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          onClick={() => rejectVerification(producer.id)}
                          disabled={actionLoading === producer.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===== Payments Tab ===== */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <CreditCard size={48} className="text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No payments found.</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={24} className="text-gold-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {formatCurrency(payment.amount)} -- {payment.payment_type.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-neutral-400 text-sm">{payment.description || payment.payment_method || 'No description'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {paymentStatusBadge(payment.status)}
                        <span className="text-xs text-neutral-500">{formatDate(payment.created_at)}</span>
                        {payment.completed_at && (
                          <span className="text-xs text-neutral-500">Completed: {formatDate(payment.completed_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {payment.status === 'pending' && (
                    <button
                      onClick={() => confirmPayment(payment.id)}
                      disabled={actionLoading === payment.id}
                      className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 flex-shrink-0"
                    >
                      <CheckCircle2 size={14} /> Confirm Payment
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== Content Tab ===== */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Pending Catalog Entries */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Music size={18} className="text-gold-400" />
              Catalog Entries
            </h3>
            <div className="space-y-3">
              {catalogEntries.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                  <Music size={40} className="text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-400 text-sm">No catalog entries found.</p>
                </div>
              ) : (
                catalogEntries.map((entry) => (
                  <div key={entry.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                          <Music size={24} className="text-gold-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-semibold text-white truncate">{entry.song_title}</h4>
                          <p className="text-neutral-400 text-sm">Producer: {entry.producer_name} -- ISRC: {entry.isrc_code || 'N/A'}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {approvalStatusBadge(entry.approval_status)}
                            <span className="text-xs text-neutral-500">{formatDate(entry.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      {entry.approval_status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => approveCatalogEntry(entry.id)}
                            disabled={actionLoading === entry.id}
                            className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button
                            onClick={() => rejectCatalogEntry(entry.id)}
                            disabled={actionLoading === entry.id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Contracts */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText size={18} className="text-gold-400" />
              Contracts
            </h3>
            <div className="space-y-3">
              {contracts.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                  <FileText size={40} className="text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-400 text-sm">No contracts found.</p>
                </div>
              ) : (
                contracts.map((contract) => (
                  <div key={contract.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                          <FileText size={24} className="text-gold-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-semibold text-white truncate">
                            {contract.contract_type.replace(/_/g, ' ')} Contract
                          </h4>
                          <p className="text-neutral-400 text-sm">
                            Royalty: {contract.royalty_percentage}% | Duration: {contract.agreement_duration_months} months | Territory: {contract.territory}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {approvalStatusBadge(contract.approval_status)}
                            <span className="text-xs text-neutral-500">{formatDate(contract.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      {contract.approval_status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => approveContract(contract.id)}
                            disabled={actionLoading === contract.id}
                            className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button
                            onClick={() => rejectContract(contract.id)}
                            disabled={actionLoading === contract.id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Disputes Tab ===== */}
      {activeTab === 'disputes' && (
        <div className="space-y-3">
          {disputes.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <AlertTriangle size={48} className="text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No disputes found.</p>
            </div>
          ) : (
            disputes.map((dispute) => (
              <div key={dispute.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={24} className="text-gold-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {dispute.dispute_type.replace(/_/g, ' ')} Dispute
                      </h3>
                      <p className="text-neutral-400 text-sm truncate">{dispute.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {disputeStatusBadge(dispute.status)}
                        <span className="text-xs text-neutral-500">Filed: {formatDate(dispute.created_at)}</span>
                        {dispute.resolved_at && (
                          <span className="text-xs text-green-500">Resolved: {formatDate(dispute.resolved_at)}</span>
                        )}
                      </div>
                      {dispute.resolution && (
                        <p className="text-sm text-neutral-300 mt-2 border-t border-neutral-800 pt-2">
                          Resolution: {dispute.resolution}
                        </p>
                      )}
                    </div>
                  </div>
                  {dispute.status !== 'resolved' && dispute.status !== 'dismissed' && (
                    <button
                      onClick={() => resolveDispute(dispute.id)}
                      disabled={actionLoading === dispute.id}
                      className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 flex-shrink-0"
                    >
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== Users Tab ===== */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {userRoles.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <Shield size={48} className="text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No user roles found.</p>
            </div>
          ) : (
            userRoles.map((assignment) => (
              <div key={assignment.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                      <Shield size={24} className="text-gold-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate font-mono text-sm">
                        {assignment.user_id}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                          {assignment.role}
                        </span>
                        <span className="text-xs text-neutral-500">Assigned: {formatDate(assignment.assigned_at)}</span>
                        {assignment.assigned_by && (
                          <span className="text-xs text-neutral-500">By: {assignment.assigned_by}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <select
                      value={assignment.role}
                      onChange={(e) => changeUserRole(assignment.id, e.target.value as UserRoleAssignment['role'])}
                      disabled={actionLoading === assignment.id}
                      className="appearance-none bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-gold-500 transition-colors disabled:opacity-50"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
