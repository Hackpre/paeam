import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  Users,
  Music,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  UserCheck,
  Search,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingSongs, setPendingSongs] = useState<any[]>([]);
  const [pendingContracts, setPendingContracts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducers: 0,
    pendingPayments: 0,
    pendingApprovals: 0,
    totalSongs: 0,
  });
  const [activeTab, setActiveTab] = useState<'payments' | 'songs' | 'contracts'>('payments');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load pending payments from users table
      const { data: pendingUsersData } = await supabase
        .from('users')
        .select('*')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });
      setPendingUsers(pendingUsersData || []);

      // Load pending songs
      const { data: pendingSongsData } = await supabase
        .from('catalog_entries')
        .select(`
          *,
          producer_profiles (
            stage_name,
            full_name,
            users (
              email
            )
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      setPendingSongs(pendingSongsData || []);

      // Load pending contracts
      const { data: pendingContractsData } = await supabase
        .from('contracts')
        .select(`
          *,
          catalog_entries (
            song_title,
            producer_profiles (
              stage_name,
              full_name
            )
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      setPendingContracts(pendingContractsData || []);

      // Load stats
      const { count: totalProducers } = await supabase
        .from('producer_profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalSongs } = await supabase
        .from('catalog_entries')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProducers: totalProducers || 0,
        pendingPayments: pendingUsersData?.length || 0,
        pendingApprovals: (pendingSongsData?.length || 0) + (pendingContractsData?.length || 0),
        totalSongs: totalSongs || 0,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (userId: string) => {
    setLoading(true);
    
    const { error } = await supabase
      .from('users')
      .update({ 
        payment_status: 'paid',
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: user?.id
      })
      .eq('id', userId);
    
    if (error) {
      alert('Error confirming payment: ' + error.message);
    } else {
      alert('Payment confirmed successfully!');
      // Also approve all pending songs for this user
      await supabase
        .from('catalog_entries')
        .update({ approval_status: 'approved' })
        .eq('user_id', userId)
        .eq('approval_status', 'pending');
      
      loadData();
    }
    setLoading(false);
  };

  const approveSong = async (songId: string) => {
    setLoading(true);
    
    const { error } = await supabase
      .from('catalog_entries')
      .update({ 
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', songId);
    
    if (error) {
      alert('Error approving song: ' + error.message);
    } else {
      alert('Song approved successfully!');
      loadData();
    }
    setLoading(false);
  };

  const rejectSong = async (songId: string) => {
    setLoading(true);
    
    const { error } = await supabase
      .from('catalog_entries')
      .update({ 
        approval_status: 'rejected',
        rejection_reason: 'Content needs revision'
      })
      .eq('id', songId);
    
    if (error) {
      alert('Error rejecting song: ' + error.message);
    } else {
      alert('Song rejected.');
      loadData();
    }
    setLoading(false);
  };

  const approveContract = async (contractId: string) => {
    setLoading(true);
    
    const { error } = await supabase
      .from('contracts')
      .update({ 
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', contractId);
    
    if (error) {
      alert('Error approving contract: ' + error.message);
    } else {
      alert('Contract approved successfully!');
      loadData();
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-neutral-400">Manage producer payments, approve songs and contracts</p>
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
            <CreditCard size={20} className="text-yellow-400" />
            <span className="text-neutral-400 text-sm">Pending Payments</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{stats.pendingPayments}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-blue-400" />
            <span className="text-neutral-400 text-sm">Pending Approvals</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{stats.pendingApprovals}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Music size={20} className="text-green-400" />
            <span className="text-neutral-400 text-sm">Total Songs</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalSongs}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-gold-600 text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Pending Payments ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'songs'
              ? 'bg-gold-600 text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Pending Songs ({pendingSongs.length})
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'contracts'
              ? 'bg-gold-600 text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Pending Contracts ({pendingContracts.length})
        </button>
        <button
          onClick={loadData}
          className="ml-auto px-3 py-2 text-neutral-400 hover:text-white transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Pending Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {pendingUsers.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
              <p className="text-neutral-400">No pending payments. All caught up!</p>
            </div>
          ) : (
            pendingUsers.map((producer) => (
              <div key={producer.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <UserCheck size={24} className="text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{producer.full_name || producer.email}</h3>
                      <p className="text-neutral-400 text-sm">{producer.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                          Pending Payment
                        </span>
                        <span className="text-xs text-neutral-500">
                          Registered: {new Date(producer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => confirmPayment(producer.id)}
                    className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Confirm Payment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Songs Tab */}
      {activeTab === 'songs' && (
        <div className="space-y-3">
          {pendingSongs.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
              <p className="text-neutral-400">No pending song approvals.</p>
            </div>
          ) : (
            pendingSongs.map((song) => (
              <div key={song.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Music size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{song.song_title}</h3>
                      <p className="text-neutral-400 text-sm">
                        Producer: {song.producer_profiles?.stage_name || song.producer_profiles?.full_name}
                      </p>
                      <p className="text-neutral-500 text-xs mt-1">
                        Artist: {song.artist_names?.join(', ') || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveSong(song.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => rejectSong(song.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-3">
          {pendingContracts.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
              <p className="text-neutral-400">No pending contract approvals.</p>
            </div>
          ) : (
            pendingContracts.map((contract) => (
              <div key={contract.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <FileText size={24} className="text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Contract for: {contract.catalog_entries?.song_title || 'Unknown Song'}
                      </h3>
                      <p className="text-neutral-400 text-sm">
                        Royalty Split: {contract.royalty_percentage}% | Type: {contract.contract_type}
                      </p>
                      <p className="text-neutral-500 text-xs mt-1">
                        Created: {new Date(contract.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => approveContract(contract.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Approve Contract
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
