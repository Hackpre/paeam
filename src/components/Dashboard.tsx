import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [catalogCount, setCatalogCount] = useState(0);
  const [pendingSongsCount, setPendingSongsCount] = useState(0);
  const [recentCatalog, setRecentCatalog] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | null>('pending');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('paeam_user');
    const storedPaid = localStorage.getItem('paeam_paid');
    
    if (storedUser) {
      setProfile(JSON.parse(storedUser));
    }
    
    if (storedPaid === 'true') {
      setPaymentStatus('paid');
    }
    
    const songs = JSON.parse(localStorage.getItem('paeam_songs') || '[]');
    const pending = songs.filter((s: any) => s.status === 'pending_approval').length;
    
    setCatalogCount(songs.length);
    setPendingSongsCount(pending);
    setRecentCatalog(songs.slice(0, 5));
    setLoading(false);
  }, []);

  const handleAddSong = () => {
    const title = prompt('Enter song title:');
    if (title) {
      const newSong = {
        id: Date.now(),
        title,
        status: paymentStatus === 'paid' ? 'approved' : 'pending_approval',
        createdAt: new Date().toISOString(),
      };
      const songs = JSON.parse(localStorage.getItem('paeam_songs') || '[]');
      songs.push(newSong);
      localStorage.setItem('paeam_songs', JSON.stringify(songs));
      setCatalogCount(songs.length);
      setPendingSongsCount(songs.filter((s: any) => s.status === 'pending_approval').length);
      setRecentCatalog(songs.slice(0, 5));
      alert(paymentStatus === 'paid' ? 'Song added!' : 'Song submitted for approval.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Catalog Entries', value: catalogCount, icon: <Disc3 size={20} />, color: 'gold' },
    { label: 'Contracts', value: 0, icon: <FileText size={20} />, color: 'blue' },
    { label: 'Locked Records', value: 0, icon: <Lock size={20} />, color: 'amber' },
    { label: 'Pending Approval', value: pendingSongsCount, icon: <Clock size={20} />, color: 'rose' },
  ];

  const colorMap: Record<string, string> = {
    gold: 'from-gold-500/20 to-gold-500/5 border-gold-500/20 text-gold-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
  };

  return (
    <div className="space-y-6">
      {paymentStatus === 'pending' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-500 font-semibold">⚠️ Payment Pending</p>
              <p className="text-neutral-400 text-sm">Your membership fee of 15,000 MWK is pending.</p>
            </div>
          </div>
          <button onClick={() => navigate('/payment')} className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-lg text-sm">Complete Payment</button>
        </div>
      )}

      {paymentStatus === 'paid' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-500 font-semibold">✓ Payment Confirmed</p>
              <p className="text-neutral-400 text-sm">Your membership is active.</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-xl font-bold text-neutral-950">
            {profile?.fullName?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile?.fullName || 'Producer'}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
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

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleAddSong} className="p-4 bg-neutral-800 rounded-xl text-left hover:bg-neutral-700 transition-colors">
            <div className="text-2xl mb-2">🎵</div>
            <p className="text-white font-semibold">Upload New Song</p>
            <p className="text-neutral-400 text-sm">Register a new song with metadata</p>
          </button>
          <button className="p-4 bg-neutral-800 rounded-xl text-left hover:bg-neutral-700 transition-colors">
            <div className="text-2xl mb-2">📄</div>
            <p className="text-white font-semibold">Create Contract</p>
            <p className="text-neutral-400 text-sm">Set up royalty agreements</p>
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="font-semibold text-white">Recent Catalog</h3>
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
                </div>
                <div className="flex items-center gap-2">
                  {entry.status === 'pending_approval' ? (
                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                      <Clock size={12} /> Pending Approval
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle2 size={12} /> Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
            <p className="text-xs text-neutral-400">Records secured with multi-signature approval</p>
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
            <p className="text-xs text-neutral-400">SHA-256 verification on locked records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
