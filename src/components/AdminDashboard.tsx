import { useState, useEffect } from 'react';
import {
  Users,
  Music,
  FileText,
  Lock,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  CreditCard,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Briefcase,
  Star,
  Flag,
  Award,
  Zap,
} from 'lucide-react';

interface Producer {
  id: string;
  fullName: string;
  stageName: string;
  email: string;
  phone: string;
  nationalId: string;
  ipiNumber: string;
  registrationDate: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  membershipFee: number;
  songsCount: number;
  contractsCount: number;
  lockedRecordsCount: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  producerId: string;
  producerName: string;
  genre: string;
  isrc: string;
  status: 'pending' | 'approved' | 'rejected' | 'locked';
  createdAt: string;
  royaltySplit: number;
}

interface Contract {
  id: string;
  songTitle: string;
  producerId: string;
  producerName: string;
  type: string;
  territory: string;
  status: 'active' | 'pending' | 'expired' | 'locked';
  value: number;
  startDate: string;
  endDate: string;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [showProducerModal, setShowProducerModal] = useState(false);
  
  // Data states
  const [producers, setProducers] = useState<Producer[]>([]);
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [pendingContracts, setPendingContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducers: 0,
    pendingVerifications: 0,
    pendingPayments: 0,
    totalSongs: 0,
    totalContracts: 0,
    lockedRecords: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    verifiedProducers: 0,
    activeMembers: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load from localStorage
    const catalog = JSON.parse(localStorage.getItem('paeam_catalog') || '[]');
    const contracts = JSON.parse(localStorage.getItem('paeam_contracts') || '[]');
    const users = JSON.parse(localStorage.getItem('paeam_user') || '{}');
    const lockRequests = JSON.parse(localStorage.getItem('paeam_lock_requests') || '[]');
    
    // Create mock producers data
    const mockProducers: Producer[] = [
      {
        id: '1',
        fullName: 'Austin Precious Phiri',
        stageName: 'Sir EL-Phi',
        email: 'austinpreciousphiri@gmail.com',
        phone: '+265888879052',
        nationalId: '1234567890',
        ipiNumber: 'IPI-123456789',
        registrationDate: '2026-01-15',
        verificationStatus: 'verified',
        paymentStatus: 'paid',
        membershipFee: 15000,
        songsCount: catalog.filter((c: any) => c.artist === 'Austin Precious Phiri').length,
        contractsCount: contracts.filter((c: any) => c.producerName === 'Austin Precious Phiri').length,
        lockedRecordsCount: lockRequests.filter((l: any) => l.status === 'fully_locked').length,
      },
      {
        id: '2',
        fullName: 'Thoko Kapasule',
        stageName: 'DJ Thoko',
        email: 'thoko@example.com',
        phone: '+265888123456',
        nationalId: '0987654321',
        ipiNumber: '',
        registrationDate: '2026-02-20',
        verificationStatus: 'pending',
        paymentStatus: 'pending',
        membershipFee: 15000,
        songsCount: 0,
        contractsCount: 0,
        lockedRecordsCount: 0,
      },
      {
        id: '3',
        fullName: 'Binuel Phale',
        stageName: 'Binuel',
        email: 'binuel@example.com',
        phone: '+265888789012',
        nationalId: '1122334455',
        ipiNumber: 'IPI-987654321',
        registrationDate: '2026-03-01',
        verificationStatus: 'verified',
        paymentStatus: 'paid',
        membershipFee: 15000,
        songsCount: 2,
        contractsCount: 1,
        lockedRecordsCount: 1,
      },
      {
        id: '4',
        fullName: 'Chifundo Mwale',
        stageName: 'Chifundo Beatz',
        email: 'chifundo@example.com',
        phone: '+265888345678',
        nationalId: '5566778899',
        ipiNumber: '',
        registrationDate: '2026-03-15',
        verificationStatus: 'pending',
        paymentStatus: 'overdue',
        membershipFee: 15000,
        songsCount: 0,
        contractsCount: 0,
        lockedRecordsCount: 0,
      },
      {
        id: '5',
        fullName: 'Mayamiko Chisale',
        stageName: 'Mayamiko',
        email: 'mayamiko@example.com',
        phone: '+265888901234',
        nationalId: '9988776655',
        ipiNumber: 'IPI-456789123',
        registrationDate: '2026-02-10',
        verificationStatus: 'verified',
        paymentStatus: 'paid',
        membershipFee: 15000,
        songsCount: 1,
        contractsCount: 1,
        lockedRecordsCount: 0,
      },
    ];
    
    setProducers(mockProducers);
    
    // Create mock pending songs
    const mockPendingSongs: Song[] = [
      {
        id: '101',
        title: 'Yes You Reign',
        artist: 'Austin Precious Phiri',
        producerId: '1',
        producerName: 'Sir EL-Phi',
        genre: 'Afrobeat',
        isrc: 'PAEAM-001',
        status: 'pending',
        createdAt: '2026-05-07',
        royaltySplit: 60,
      },
      {
        id: '102',
        title: 'Mwana Wa Mulungu',
        artist: 'Binuel',
        producerId: '3',
        producerName: 'Binuel',
        genre: 'Gospel',
        isrc: 'PAEAM-002',
        status: 'pending',
        createdAt: '2026-05-06',
        royaltySplit: 70,
      },
    ];
    setPendingSongs(mockPendingSongs);
    
    // Calculate stats
    setStats({
      totalProducers: mockProducers.length,
      pendingVerifications: mockProducers.filter(p => p.verificationStatus === 'pending').length,
      pendingPayments: mockProducers.filter(p => p.paymentStatus === 'pending' || p.paymentStatus === 'overdue').length,
      totalSongs: catalog.length,
      totalContracts: contracts.length,
      lockedRecords: lockRequests.filter((l: any) => l.status === 'fully_locked').length,
      monthlyRevenue: 15000 * mockProducers.filter(p => p.paymentStatus === 'paid').length,
      annualRevenue: 15000 * mockProducers.filter(p => p.paymentStatus === 'paid').length * 12,
      verifiedProducers: mockProducers.filter(p => p.verificationStatus === 'verified').length,
      activeMembers: mockProducers.filter(p => p.paymentStatus === 'paid').length,
    });
    
    setLoading(false);
  };

  const verifyProducer = (producerId: string) => {
    setProducers(producers.map(p => 
      p.id === producerId ? { ...p, verificationStatus: 'verified' as const } : p
    ));
    alert('Producer verified successfully!');
  };

  const rejectProducer = (producerId: string) => {
    setProducers(producers.map(p => 
      p.id === producerId ? { ...p, verificationStatus: 'rejected' as const } : p
    ));
    alert('Producer verification rejected.');
  };

  const confirmPayment = (producerId: string) => {
    setProducers(producers.map(p => 
      p.id === producerId ? { ...p, paymentStatus: 'paid' as const } : p
    ));
    alert('Payment confirmed! Producer now has full access.');
  };

  const approveSong = (songId: string) => {
    setPendingSongs(pendingSongs.filter(s => s.id !== songId));
    alert('Song approved and published to catalog!');
  };

  const rejectSong = (songId: string) => {
    setPendingSongs(pendingSongs.filter(s => s.id !== songId));
    alert('Song rejected. Producer notified for revision.');
  };

  const filteredProducers = producers.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.stageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-neutral-900 border-r border-neutral-800 transition-all duration-300 z-30 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-sm">PA</span>
                </div>
                <span className="text-white font-bold">PAEAM Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-neutral-400 hover:text-white">
                <ChevronLeft size={20} />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="mx-auto text-neutral-400 hover:text-white">
              <ChevronRight size={20} />
            </button>
          )}
        </div>
        
        <nav className="p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-gold-500 text-black' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
            <BarChart3 size={20} /> {sidebarOpen && <span>Overview</span>}
          </button>
          <button onClick={() => setActiveTab('producers')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'producers' ? 'bg-gold-500 text-black' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
            <Users size={20} /> {sidebarOpen && <span>Producers</span>}
            {sidebarOpen && stats.pendingVerifications > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingVerifications}</span>}
          </button>
          <button onClick={() => setActiveTab('pendingSongs')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'pendingSongs' ? 'bg-gold-500 text-black' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
            <Music size={20} /> {sidebarOpen && <span>Pending Songs</span>}
            {sidebarOpen && pendingSongs.length > 0 && <span className="ml-auto bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{pendingSongs.length}</span>}
          </button>
          <button onClick={() => setActiveTab('contracts')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'contracts' ? 'bg-gold-500 text-black' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
            <FileText size={20} /> {sidebarOpen && <span>Contracts</span>}
          </button>
          <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'payments' ? 'bg-gold-500 text-black' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
            <DollarSign size={20} /> {sidebarOpen && <span>Payments</span>}
            {sidebarOpen && stats.pendingPayments > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingPayments}</span>}
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-gold-500 text-black' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
            <Activity size={20} /> {sidebarOpen && <span>Reports</span>}
          </button>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors">
            <Settings size={20} /> {sidebarOpen && <span>Settings</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors mt-1">
            <LogOut size={20} /> {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-neutral-900 border-b border-neutral-800 p-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">National Association Admin Portal</h1>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search producers, songs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                <Bell size={20} className="text-neutral-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">A</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Admin User</p>
                  <p className="text-neutral-500 text-xs">Super Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <main className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-neutral-400 text-sm">Total Producers</p>
                    <p className="text-3xl font-bold text-white">{stats.totalProducers}</p>
                  </div>
                  <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
                    <Users size={24} className="text-gold-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-green-500">+{stats.verifiedProducers}</span>
                  <span className="text-neutral-500">verified</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-neutral-400 text-sm">Pending Verifications</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats.pendingVerifications}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Clock size={24} className="text-yellow-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-neutral-400 text-sm">Pending Payments</p>
                    <p className="text-2xl font-bold text-red-500">{stats.pendingPayments}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign size={24} className="text-red-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-neutral-400 text-sm">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-gold-400">MWK {stats.monthlyRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp size={24} className="text-gold-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Producer Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-400">Verified</span>
                      <span className="text-white">{stats.verifiedProducers} / {stats.totalProducers}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.verifiedProducers / stats.totalProducers) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-400">Pending Verification</span>
                      <span className="text-white">{stats.pendingVerifications}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(stats.pendingVerifications / stats.totalProducers) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-400">Active Members (Paid)</span>
                      <span className="text-white">{stats.activeMembers}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div className="bg-gold-500 h-2 rounded-full" style={{ width: `${(stats.activeMembers / stats.totalProducers) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Content Overview</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalSongs}</p>
                    <p className="text-xs text-neutral-500">Songs Registered</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalContracts}</p>
                    <p className="text-xs text-neutral-500">Contracts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gold-400">{stats.lockedRecords}</p>
                    <p className="text-xs text-neutral-500">Locked Records</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <UserCheck size={16} className="text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">New producer registration</p>
                    <p className="text-neutral-500 text-xs">Austin Precious Phiri (Sir EL-Phi) registered</p>
                  </div>
                  <span className="text-xs text-neutral-500">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-gold-500/20 rounded-lg flex items-center justify-center">
                    <Music size={16} className="text-gold-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">New song uploaded</p>
                    <p className="text-neutral-500 text-xs">"Yes You Reign" - Sir EL-Phi</p>
                  </div>
                  <span className="text-xs text-neutral-500">5 hours ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Payment confirmed</p>
                    <p className="text-neutral-500 text-xs">Annual membership fee - Sir EL-Phi</p>
                  </div>
                  <span className="text-xs text-neutral-500">1 day ago</span>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Producers Tab */}
        {activeTab === 'producers' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800 border-b border-neutral-700">
                    <tr>
                      <th className="text-left p-4 text-white font-semibold">Producer</th>
                      <th className="text-left p-4 text-white font-semibold">Stage Name</th>
                      <th className="text-left p-4 text-white font-semibold">Email</th>
                      <th className="text-left p-4 text-white font-semibold">IPI Number</th>
                      <th className="text-left p-4 text-white font-semibold">Verification</th>
                      <th className="text-left p-4 text-white font-semibold">Payment</th>
                      <th className="text-left p-4 text-white font-semibold">Songs</th>
                      <th className="text-left p-4 text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredProducers.map((producer) => (
                      <tr key={producer.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gold-500/20 rounded-full flex items-center justify-center">
                              <span className="text-gold-400 text-sm font-bold">{producer.fullName.charAt(0)}</span>
                            </div>
                            <span className="text-white">{producer.fullName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-white">{producer.stageName}</td>
                        <td className="p-4 text-neutral-400">{producer.email}</td>
                        <td className="p-4 text-neutral-400">{producer.ipiNumber || '—'}</td>
                        <td className="p-4">
                          {producer.verificationStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs"><CheckCircle2 size={12} /> Verified</span>
                          ) : producer.verificationStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs"><Clock size={12} /> Pending</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs"><XCircle size={12} /> Rejected</span>
                          )}
                        </td>
                        <td className="p-4">
                          {producer.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs"><CheckCircle2 size={12} /> Paid</span>
                          ) : producer.paymentStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs"><Clock size={12} /> Pending</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs"><AlertTriangle size={12} /> Overdue</span>
                          )}
                        </td>
                        <td className="p-4 text-white">{producer.songsCount}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {producer.verificationStatus === 'pending' && (
                              <>
                                <button onClick={() => verifyProducer(producer.id)} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs transition-colors">Verify</button>
                                <button onClick={() => rejectProducer(producer.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs transition-colors">Reject</button>
                              </>
                            )}
                            {producer.paymentStatus !== 'paid' && (
                              <button onClick={() => confirmPayment(producer.id)} className="px-3 py-1 bg-gold-600 hover:bg-gold-500 text-black rounded-lg text-xs transition-colors">Confirm Payment</button>
                            )}
                            <button onClick={() => { setSelectedProducer(producer); setShowProducerModal(true); }} className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs transition-colors">View</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* Pending Songs Tab */}
        {activeTab === 'pendingSongs' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800 border-b border-neutral-700">
                    <tr>
                      <th className="text-left p-4 text-white font-semibold">Song Title</th>
                      <th className="text-left p-4 text-white font-semibold">Artist/Producer</th>
                      <th className="text-left p-4 text-white font-semibold">Genre</th>
                      <th className="text-left p-4 text-white font-semibold">ISRC</th>
                      <th className="text-left p-4 text-white font-semibold">Royalty %</th>
                      <th className="text-left p-4 text-white font-semibold">Submitted</th>
                      <th className="text-left p-4 text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {pendingSongs.map((song) => (
                      <tr key={song.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="p-4 text-white font-medium">{song.title}</td>
                        <td className="p-4 text-neutral-400">{song.artist}</td>
                        <td className="p-4 text-neutral-400">{song.genre}</td>
                        <td className="p-4 text-neutral-400">{song.isrc}</td>
                        <td className="p-4 text-white">{song.royaltySplit}%</td>
                        <td className="p-4 text-neutral-500">{song.createdAt}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => approveSong(song.id)} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs transition-colors">Approve</button>
                            <button onClick={() => rejectSong(song.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs transition-colors">Reject</button>
                            <button className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs transition-colors">Preview</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">All Contracts</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-4 p-3 bg-neutral-800 rounded-lg text-neutral-400 text-sm font-semibold">
                  <span>Song</span>
                  <span>Producer</span>
                  <span>Type</span>
                  <span>Territory</span>
                  <span>Status</span>
                </div>
                <div className="text-center text-neutral-500 py-8">No contracts found</div>
              </div>
            </div>
          </main>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-neutral-800 rounded-xl p-4 text-center">
                  <p className="text-neutral-400 text-sm">Total Collected</p>
                  <p className="text-2xl font-bold text-gold-400">MWK {stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-neutral-500">This month</p>
                </div>
                <div className="bg-neutral-800 rounded-xl p-4 text-center">
                  <p className="text-neutral-400 text-sm">Annual Projection</p>
                  <p className="text-2xl font-bold text-gold-400">MWK {stats.annualRevenue.toLocaleString()}</p>
                  <p className="text-xs text-neutral-500">Based on current members</p>
                </div>
                <div className="bg-neutral-800 rounded-xl p-4 text-center">
                  <p className="text-neutral-400 text-sm">Pending Invoices</p>
                  <p className="text-2xl font-bold text-red-400">{stats.pendingPayments}</p>
                  <p className="text-xs text-neutral-500">Producers</p>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Generate Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors">
                  <div>
                    <p className="text-white font-semibold">Producer Registration Report</p>
                    <p className="text-neutral-400 text-sm">Monthly producer signups and verifications</p>
                  </div>
                  <Download size={20} className="text-gold-400" />
                </button>
                <button className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors">
                  <div>
                    <p className="text-white font-semibold">Revenue Report</p>
                    <p className="text-neutral-400 text-sm">Membership fee collection summary</p>
                  </div>
                  <Download size={20} className="text-gold-400" />
                </button>
                <button className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors">
                  <div>
                    <p className="text-white font-semibold">Content Report</p>
                    <p className="text-neutral-400 text-sm">Catalog entries, contracts, locked records</p>
                  </div>
                  <Download size={20} className="text-gold-400" />
                </button>
                <button className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors">
                  <div>
                    <p className="text-white font-semibold">Audit Trail Export</p>
                    <p className="text-neutral-400 text-sm">Complete immutable audit log</p>
                  </div>
                  <Download size={20} className="text-gold-400" />
                </button>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Producer Modal */}
      {showProducerModal && selectedProducer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowProducerModal(false)}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white">Producer Details</h2>
              <button onClick={() => setShowProducerModal(false)} className="text-neutral-400 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-neutral-500 text-sm">Full Name</p>
                  <p className="text-white">{selectedProducer.fullName}</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-sm">Stage Name</p>
                  <p className="text-white">{selectedProducer.stageName}</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-sm">Email</p>
                  <p className="text-white">{selectedProducer.email}</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-sm">Phone</p>
                  <p className="text-white">{selectedProducer.phone}</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-sm">IPI Number</p>
                  <p className="text-white">{selectedProducer.ipiNumber || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-sm">Registration Date</p>
                  <p className="text-white">{selectedProducer.registrationDate}</p>
                </div>
              </div>
              <div className="border-t border-neutral-800 pt-4">
                <h3 className="text-white font-semibold mb-3">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{selectedProducer.songsCount}</p>
                    <p className="text-xs text-neutral-500">Songs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{selectedProducer.contractsCount}</p>
                    <p className="text-xs text-neutral-500">Contracts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gold-400">{selectedProducer.lockedRecordsCount}</p>
                    <p className="text-xs text-neutral-500">Locked</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}