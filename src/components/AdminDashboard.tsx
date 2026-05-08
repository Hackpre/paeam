import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { ProducerProfile, CatalogEntry, Contract, Payment, Dispute, UserRoleAssignment } from '../lib/types';
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
} from 'lucide-react';

type TabKey = 'overview' | 'producers' | 'payments' | 'content' | 'disputes' | 'users';
type VerificationFilter = 'all' | 'pending' | 'verified' | 'rejected' | 'suspended';
type PaymentFilter = 'all' | 'pending' | 'completed' | 'failed' | 'bank_transfer_pending';

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

  // Filter states
  const [producerSearch, setProducerSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  // Role change states
  const [roleUpdates, setRoleUpdates] = useState<Record<string, UserRoleAssignment['role']>>({});

  // Stats - 8 overview cards
  const [stats, setStats] = useState({
    totalProducers: 0,
    pendingVerifications: 0,
    pendingPayments: 0,
    totalSongs: 0,
    totalContracts: 0,
    lockedRecords: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  const viewProof = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(filePath, 3600);
      if (data?.signedUrl) {
        setProofModalUrl(data.signedUrl);
      } else {
        alert('Unable to generate access link for this proof.');
      }
    } catch {
      alert('Error accessing proof file.');
    }
  };
  const [confirmModal, setConfirmModal] = useState<{ paymentId: string; action: 'approved' | 'rejected' } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadOverviewStats = useCallback(async () => {
    const { count: totalProducers } = await supabase
      .from('producer_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: pendingVerifications } = await supabase
      .from('producer_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('association_verification_status', 'pending');

    const { count: pendingPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: totalSongs } = await supabase
      .from('catalog_entries')
      .select('*', { count: 'exact', head: true });

    const { count: totalContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    const { count: lockedCatalog } = await supabase
      .from('catalog_entries')
      .select('*', { count: 'exact', head: true })
      .eq('is_locked', true);

    const { count: lockedContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('is_locked', true);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    const { data: monthlyPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth);

    const { data: annualPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfYear);

    const monthlyRevenue = (monthlyPayments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const annualRevenue = (annualPayments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);

    setStats({
      totalProducers: totalProducers || 0,
      pendingVerifications: pendingVerifications || 0,
      pendingPayments: pendingPayments || 0,
      totalSongs: totalSongs || 0,
      totalContracts: totalContracts || 0,
      lockedRecords: (lockedCatalog || 0) + (lockedContracts || 0),
      monthlyRevenue,
      annualRevenue,
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
    // Initialize role update states
    const updates: Record<string, UserRoleAssignment['role']> = {};
    (data || []).forEach((ur: UserRoleAssignment) => {
      updates[ur.id] = ur.role;
    });
    setRoleUpdates(updates);
  }, []);

  const loadRecentActivity = useCallback(async () => {
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (auditLogs && auditLogs.length > 0) {
      const activities = auditLogs.map((log) => ({
        type: log.record_type || log.action || 'system',
        description: `${log.action} on ${log.record_type}${log.record_id ? ` (${log.record_id.substring(0, 8)}...)` : ''}`,
        time: log.created_at,
      }));
      setRecentActivity(activities);
      return;
    }

    // Fallback: compose from individual tables if audit_logs is empty
    const activities: { type: string; description: string; time: string }[] = [];

    const { data: recentPayments } = await supabase
      .from('payments')
      .select('payment_type, status, created_at, amount')
      .order('created_at', { ascending: false })
      .limit(5);

    (recentPayments ?? []).forEach((p) => {
      activities.push({
        type: 'payment',
        description: `${p.payment_type.replace(/_/g, ' ')} payment - ${formatCurrency(p.amount)} (${p.status})`,
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
        description: `${d.dispute_type.replace(/_/g, ' ')} dispute filed (${d.status.replace(/_/g, ' ')})`,
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
    setRecentActivity(activities.slice(0, 10));
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
      await Promise.all([loadProducers(), loadOverviewStats()]);
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
      await Promise.all([loadProducers(), loadOverviewStats()]);
    }
    setActionLoading(null);
  };

  const confirmMembershipPayment = async (producerId: string) => {
    setActionLoading(producerId);
    const { error } = await supabase
      .from('producer_profiles')
      .update({
        membership_status: 'active',
      })
      .eq('id', producerId);
    if (error) {
      alert('Error confirming membership: ' + error.message);
    } else {
      await Promise.all([loadProducers(), loadOverviewStats()]);
    }
    setActionLoading(null);
  };

  const confirmPayment = async (paymentId: string, producerId: string | null) => {
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
      // If this is a membership payment, also update the producer's membership status
      if (producerId) {
        await supabase
          .from('producer_profiles')
          .update({ membership_status: 'active' })
          .eq('id', producerId);
      }
      await Promise.all([loadPayments(), loadOverviewStats()]);
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
      await Promise.all([loadContent(), loadOverviewStats()]);
    }
    setActionLoading(null);
  };

  const rejectCatalogEntry = async (entryId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(entryId);
    const { error } = await supabase
      .from('catalog_entries')
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', entryId);
    if (error) {
      alert('Error rejecting catalog entry: ' + error.message);
    } else {
      await Promise.all([loadContent(), loadOverviewStats()]);
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
      await Promise.all([loadContent(), loadOverviewStats()]);
    }
    setActionLoading(null);
  };

  const rejectContract = async (contractId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(contractId);
    const { error } = await supabase
      .from('contracts')
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', contractId);
    if (error) {
      alert('Error rejecting contract: ' + error.message);
    } else {
      await Promise.all([loadContent(), loadOverviewStats()]);
    }
    setActionLoading(null);
  };

  const resolveDispute = async (disputeId: string) => {
    const resolution = prompt('Enter resolution details:');
    if (!resolution) return;
    setActionLoading(disputeId);
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

  const handleUpdateRole = async (assignmentId: string) => {
    const newRole = roleUpdates[assignmentId];
    if (!newRole) return;
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

  const handleConfirmBankTransfer = async () => {
    if (!confirmModal || !user) return;
    setConfirmLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pay`;
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'confirm_bank_transfer',
          payment_id: confirmModal.paymentId,
          decision: confirmModal.action,
          admin_notes: confirmNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to process bank transfer confirmation.');
      } else {
        await Promise.all([loadPayments(), loadOverviewStats(), loadProducers()]);
      }
    } catch (err) {
      alert('Network error processing bank transfer.');
    } finally {
      setConfirmLoading(false);
      setConfirmModal(null);
      setConfirmNotes('');
    }
  };

  // --- Filtered lists ---

  const filteredProducers = producers.filter((p) => {
    const matchesSearch = producerSearch === '' ||
      p.full_legal_name.toLowerCase().includes(producerSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(producerSearch.toLowerCase()) ||
      p.stage_name.toLowerCase().includes(producerSearch.toLowerCase());
    const matchesVerification = verificationFilter === 'all' ||
      p.association_verification_status === verificationFilter;
    return matchesSearch && matchesVerification;
  });

  const filteredPayments = payments.filter((p) => {
    return paymentFilter === 'all' || p.status === paymentFilter;
  });

  const pendingCatalogEntries = catalogEntries.filter((e) => e.approval_status === 'pending');
  const pendingContracts = contracts.filter((c) => c.approval_status === 'pending');

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
      case 'bank_transfer_pending':
        return <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Bank Transfer Pending</span>;
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
      case 'catalog_entry':
        return <Music size={16} className="text-gold-500" />;
      case 'contract':
        return <FileText size={16} className="text-gold-600" />;
      default:
        return <Activity size={16} className="text-neutral-400" />;
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-neutral-400">PAEAM administration -- manage producers, payments, content, disputes, and users</p>
        </div>
        <button
          onClick={refreshTab}
          className="px-3 py-2 text-neutral-400 hover:text-gold-400 transition-colors border border-neutral-800 rounded-lg hover:border-gold-600/50"
          title="Refresh current tab"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-gold-600 text-neutral-950'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Overview Tab ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 8 Stat Cards in 2 rows of 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <Users size={20} className="text-gold-400" />
                </div>
                <span className="text-neutral-400 text-sm">Total Producers</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalProducers}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <UserCheck size={20} className="text-gold-500" />
                </div>
                <span className="text-neutral-400 text-sm">Pending Verifications</span>
              </div>
              <p className="text-3xl font-bold text-gold-400">{stats.pendingVerifications}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <CreditCard size={20} className="text-gold-600" />
                </div>
                <span className="text-neutral-400 text-sm">Pending Payments</span>
              </div>
              <p className="text-3xl font-bold text-gold-400">{stats.pendingPayments}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <Music size={20} className="text-gold-700" />
                </div>
                <span className="text-neutral-400 text-sm">Total Songs</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalSongs}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 2 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <FileText size={20} className="text-gold-400" />
                </div>
                <span className="text-neutral-400 text-sm">Total Contracts</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalContracts}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <Lock size={20} className="text-gold-500" />
                </div>
                <span className="text-neutral-400 text-sm">Locked Records</span>
              </div>
              <p className="text-3xl font-bold text-gold-400">{stats.lockedRecords}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <Calendar size={20} className="text-gold-600" />
                </div>
                <span className="text-neutral-400 text-sm">Monthly Revenue</span>
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-gold-700" />
                </div>
                <span className="text-neutral-400 text-sm">Annual Revenue</span>
              </div>
              <p className="text-3xl font-bold text-gold-400">{formatCurrency(stats.annualRevenue)}</p>
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
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={producerSearch}
                onChange={(e) => setProducerSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-gold-600 transition-colors"
              />
            </div>
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value as VerificationFilter)}
                className="appearance-none bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-gold-600 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Producers List */}
          {filteredProducers.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <Users size={48} className="text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No producers found matching your filters.</p>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Stage Name</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">IPI Number</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Verification</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Membership</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Registered</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredProducers.map((producer) => {
                      const membership = getMembershipBadge(producer.membership_status);
                      return (
                        <tr key={producer.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="px-5 py-4 text-sm text-white font-medium">{producer.full_legal_name}</td>
                          <td className="px-5 py-4 text-sm text-neutral-300">{producer.stage_name}</td>
                          <td className="px-5 py-4 text-sm text-neutral-400">{producer.email}</td>
                          <td className="px-5 py-4 text-sm text-neutral-400 font-mono">{producer.ipi_number || '---'}</td>
                          <td className="px-5 py-4">{verificationBadge(producer.association_verification_status)}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${membership.color}`}>{membership.label}</span>
                          </td>
                          <td className="px-5 py-4 text-sm text-neutral-500">{formatDate(producer.created_at)}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {producer.association_verification_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => approveVerification(producer.id)}
                                    disabled={actionLoading === producer.id}
                                    className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-neutral-950 text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => rejectVerification(producer.id)}
                                    disabled={actionLoading === producer.id}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {producer.membership_status !== 'active' && (
                                <button
                                  onClick={() => confirmMembershipPayment(producer.id)}
                                  disabled={actionLoading === producer.id}
                                  className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-neutral-950 text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                                >
                                  Confirm Payment
                                </button>
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

      {/* ===== Payments Tab ===== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Pending Bank Transfers Section */}
          {payments.filter(p => p.status === 'bank_transfer_pending').length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Building2 size={18} className="text-blue-400" />
                Pending Bank Transfers
                <span className="text-sm font-normal text-neutral-500">
                  ({payments.filter(p => p.status === 'bank_transfer_pending').length})
                </span>
              </h3>
              <div className="space-y-3">
                {payments.filter(p => p.status === 'bank_transfer_pending').map((payment) => {
                  const producer = producers.find((p) => p.id === payment.producer_id);
                  const producerName = producer ? producer.full_legal_name : 'Unknown';
                  const producerEmail = producer ? producer.email : payment.user_id;
                  return (
                    <div key={payment.id} className="bg-neutral-900 border border-blue-500/20 rounded-xl p-5">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <CreditCard size={24} className="text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-lg font-semibold text-white">{producerName}</h4>
                            <p className="text-neutral-400 text-sm">{producerEmail}</p>
                            <p className="text-gold-400 font-semibold text-sm mt-1">{formatCurrency(payment.amount)} MWK</p>
                            <p className="text-xs text-neutral-500 mt-1">Submitted: {formatDate(payment.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {payment.proof_of_payment_url && (
                            <button
                              onClick={() => viewProof(payment.proof_of_payment_url)}
                              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                            >
                              <Eye size={14} /> View Proof
                            </button>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmModal({ paymentId: payment.id, action: 'approved' })}
                              disabled={actionLoading === payment.id}
                              className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                              onClick={() => setConfirmModal({ paymentId: payment.id, action: 'rejected' })}
                              disabled={actionLoading === payment.id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Payments */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">All Payments</h3>
            {/* Filter Controls */}
            <div className="flex items-center gap-3 mb-4">
              <Filter size={16} className="text-neutral-500" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                className="appearance-none bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-gold-600 transition-colors pr-10"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="bank_transfer_pending">Bank Transfer Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown size={14} className="text-neutral-400 pointer-events-none -ml-7" />
            </div>

            {/* Payments List */}
            {filteredPayments.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                <CreditCard size={48} className="text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No payments found.</p>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Producer</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Amount</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Type</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Method</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {filteredPayments.map((payment) => {
                        const producer = producers.find((p) => p.id === payment.producer_id);
                        const producerName = producer ? producer.full_legal_name : payment.producer_id || 'Unknown';
                        return (
                          <tr key={payment.id} className="hover:bg-neutral-800/50 transition-colors">
                            <td className="px-5 py-4 text-sm text-white font-medium">{producerName}</td>
                            <td className="px-5 py-4 text-sm text-gold-400 font-semibold">{formatCurrency(payment.amount)}</td>
                            <td className="px-5 py-4 text-sm text-neutral-300">{payment.payment_type.replace(/_/g, ' ')}</td>
                            <td className="px-5 py-4">{paymentStatusBadge(payment.status)}</td>
                            <td className="px-5 py-4 text-sm text-neutral-500">{formatDate(payment.created_at)}</td>
                            <td className="px-5 py-4 text-sm text-neutral-400">{paymentMethodLabel(payment.payment_method)}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                {payment.status === 'pending' && (
                                  <button
                                    onClick={() => confirmPayment(payment.id, payment.producer_id)}
                                    disabled={actionLoading === payment.id}
                                    className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-neutral-950 text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                )}
                                {payment.status === 'bank_transfer_pending' && (
                                  <>
                                    {payment.proof_of_payment_url && (
                                      <button
                                        onClick={() => viewProof(payment.proof_of_payment_url)}
                                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1"
                                      >
                                        <Eye size={12} /> Proof
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setConfirmModal({ paymentId: payment.id, action: 'approved' })}
                                      className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-neutral-950 text-xs font-semibold rounded-md transition-colors"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setConfirmModal({ paymentId: payment.id, action: 'rejected' })}
                                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors"
                                    >
                                      Reject
                                    </button>
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

          {/* Proof of Payment Modal */}
          {proofModalUrl && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                  <h3 className="text-lg font-semibold text-white">Proof of Payment</h3>
                  <button onClick={() => setProofModalUrl(null)} className="text-neutral-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 overflow-auto max-h-[70vh]">
                  {proofModalUrl.endsWith('.pdf') ? (
                    <iframe src={proofModalUrl} className="w-full h-[60vh] rounded-lg" title="Proof of Payment" />
                  ) : (
                    <img src={proofModalUrl} alt="Proof of Payment" className="max-w-full mx-auto rounded-lg" />
                  )}
                </div>
                <div className="p-4 border-t border-neutral-800 flex justify-end">
                  <a
                    href={proofModalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg text-sm transition-colors"
                  >
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Bank Transfer Modal */}
          {confirmModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    confirmModal.action === 'approved' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {confirmModal.action === 'approved'
                      ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {confirmModal.action === 'approved' ? 'Approve Bank Transfer' : 'Reject Bank Transfer'}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {confirmModal.action === 'approved'
                        ? 'This will activate the user\'s membership.'
                        : 'This will mark the payment as failed.'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Admin Notes</label>
                  <textarea
                    value={confirmNotes}
                    onChange={(e) => setConfirmNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors placeholder:text-neutral-500 text-sm"
                    placeholder={confirmModal.action === 'approved' ? 'Optional approval notes...' : 'Reason for rejection...'}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setConfirmModal(null); setConfirmNotes(''); }}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-4 py-2.5 rounded-xl border border-neutral-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBankTransfer}
                    disabled={confirmLoading}
                    className={`flex-1 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm text-white disabled:opacity-50 ${
                      confirmModal.action === 'approved'
                        ? 'bg-gold-600 hover:bg-gold-700 text-neutral-950'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {confirmLoading ? 'Processing...' : confirmModal.action === 'approved' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Content Tab ===== */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Pending Songs */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Music size={18} className="text-gold-400" />
              Pending Songs
              <span className="text-sm font-normal text-neutral-500">({pendingCatalogEntries.length})</span>
            </h3>
            {pendingCatalogEntries.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                <Music size={40} className="text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-400 text-sm">No pending songs to review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCatalogEntries.map((entry) => (
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
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => approveCatalogEntry(entry.id)}
                          disabled={actionLoading === entry.id}
                          className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          onClick={() => rejectCatalogEntry(entry.id)}
                          disabled={actionLoading === entry.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Contracts */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText size={18} className="text-gold-400" />
              Pending Contracts
              <span className="text-sm font-normal text-neutral-500">({pendingContracts.length})</span>
            </h3>
            {pendingContracts.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                <FileText size={40} className="text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-400 text-sm">No pending contracts to review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingContracts.map((contract) => (
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
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => approveContract(contract.id)}
                          disabled={actionLoading === contract.id}
                          className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          onClick={() => rejectContract(contract.id)}
                          disabled={actionLoading === contract.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-neutral-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
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
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">User ID</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Current Role</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Assigned</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Change Role</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {userRoles.map((assignment) => {
                      const currentRole = roleUpdates[assignment.id] ?? assignment.role;
                      const hasChanged = currentRole !== assignment.role;
                      return (
                        <tr key={assignment.id} className="hover:bg-neutral-800/50 transition-colors">
                          <td className="px-5 py-4 text-sm text-neutral-300 font-mono">{assignment.user_id}</td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                              {assignment.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-neutral-500">{formatDate(assignment.assigned_at)}</td>
                          <td className="px-5 py-4">
                            <div className="relative">
                              <select
                                value={currentRole}
                                onChange={(e) => setRoleUpdates((prev) => ({ ...prev, [assignment.id]: e.target.value as UserRoleAssignment['role'] }))}
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
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleUpdateRole(assignment.id)}
                              disabled={!hasChanged || actionLoading === assignment.id}
                              className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-neutral-950 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Update Role
                            </button>
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
    </div>
  );
}
