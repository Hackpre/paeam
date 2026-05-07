import { useState, useEffect } from 'react';
import {
  Users, Music, FileText, Lock, TrendingUp, DollarSign, CheckCircle2, XCircle,
  Clock, AlertTriangle, Shield, Search, Download, RefreshCw, UserCheck,
  CreditCard, Calendar, BarChart3, Activity, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, ArrowLeft, Printer, FileSpreadsheet, FileText as FilePdf,
  Globe, Moon, Sun, Laptop, Languages, Mail, Phone, MapPin, Award, Star, Flag
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
  royaltyPercent: number;
  mechanicalPercent: number;
  performancePercent: number;
  publishingPercent: number;
}

interface Payment {
  id: string;
  producerId: string;
  producerName: string;
  amount: number;
  date: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [showProducerModal, setShowProducerModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [language, setLanguage] = useState('en');
  
  // Data states
  const [producers, setProducers] = useState<Producer[]>([]);
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
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
    // Apply theme
    applyTheme(theme);
  }, []);

  const applyTheme = (selectedTheme: string) => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (selectedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const loadData = () => {
    const catalog = JSON.parse(localStorage.getItem('paeam_catalog') || '[]');
    const existingContracts = JSON.parse(localStorage.getItem('paeam_contracts') || '[]');
    const lockRequests = JSON.parse(localStorage.getItem('paeam_lock_requests') || '[]');
    
    const mockProducers: Producer[] = [
      { id: '1', fullName: 'Austin Precious Phiri', stageName: 'Sir EL-Phi', email: 'austinpreciousphiri@gmail.com', phone: '+265888879052', nationalId: '1234567890', ipiNumber: 'IPI-123456789', registrationDate: '2026-01-15', verificationStatus: 'pending', paymentStatus: 'paid', membershipFee: 15000, songsCount: catalog.length, contractsCount: existingContracts.length, lockedRecordsCount: lockRequests.filter((l: any) => l.status === 'fully_locked').length },
      { id: '2', fullName: 'Thoko Kapasule', stageName: 'DJ Thoko', email: 'thoko@example.com', phone: '+265888123456', nationalId: '0987654321', ipiNumber: '', registrationDate: '2026-02-20', verificationStatus: 'pending', paymentStatus: 'pending', membershipFee: 15000, songsCount: 0, contractsCount: 0, lockedRecordsCount: 0 },
      { id: '3', fullName: 'Binuel Phale', stageName: 'Binuel', email: 'binuel@example.com', phone: '+265888789012', nationalId: '1122334455', ipiNumber: 'IPI-987654321', registrationDate: '2026-03-01', verificationStatus: 'verified', paymentStatus: 'paid', membershipFee: 15000, songsCount: 2, contractsCount: 1, lockedRecordsCount: 1 },
    ];
    
    setProducers(mockProducers);
    
    const mockPendingSongs: Song[] = [
      { id: '101', title: 'Yes You Reign', artist: 'Austin Precious Phiri', producerId: '1', producerName: 'Sir EL-Phi', genre: 'Afrobeat', isrc: 'PAEAM-001', status: 'pending', createdAt: '2026-05-07', royaltySplit: 60 },
      { id: '102', title: 'Mwana Wa Mulungu', artist: 'Binuel', producerId: '3', producerName: 'Binuel', genre: 'Gospel', isrc: 'PAEAM-002', status: 'pending', createdAt: '2026-05-06', royaltySplit: 70 },
    ];
    setPendingSongs(mockPendingSongs);
    
    const mockContracts: Contract[] = [
      { id: '201', songTitle: 'Yes You Reign', producerId: '1', producerName: 'Sir EL-Phi', type: 'Non-Exclusive', territory: 'Worldwide', status: 'active', value: 5000, startDate: '2026-01-15', endDate: '2027-01-15', royaltyPercent: 60, mechanicalPercent: 20, performancePercent: 15, publishingPercent: 5 },
    ];
    setContracts(mockContracts);
    
    const mockPayments: Payment[] = [
      { id: '301', producerId: '1', producerName: 'Sir EL-Phi', amount: 15000, date: '2026-01-20', method: 'Airtel Money', status: 'completed', reference: 'PAY-001' },
    ];
    setPayments(mockPayments);
    
    setStats({
      totalProducers: mockProducers.length,
      pendingVerifications: mockProducers.filter(p => p.verificationStatus === 'pending').length,
      pendingPayments: mockProducers.filter(p => p.paymentStatus === 'pending' || p.paymentStatus === 'overdue').length,
      totalSongs: catalog.length,
      totalContracts: existingContracts.length,
      lockedRecords: lockRequests.filter((l: any) => l.status === 'fully_locked').length,
      monthlyRevenue: 15000 * mockProducers.filter(p => p.paymentStatus === 'paid').length,
      annualRevenue: 15000 * mockProducers.filter(p => p.paymentStatus === 'paid').length * 12,
      verifiedProducers: mockProducers.filter(p => p.verificationStatus === 'verified').length,
      activeMembers: mockProducers.filter(p => p.paymentStatus === 'paid').length,
    });
    
    setLoading(false);
  };

  const verifyProducer = (producerId: string) => {
    setProducers(prev => prev.map(p => 
      p.id === producerId ? { ...p, verificationStatus: 'verified' as const } : p
    ));
    setStats(prev => ({
      ...prev,
      pendingVerifications: prev.pendingVerifications - 1,
      verifiedProducers: prev.verifiedProducers + 1,
    }));
    alert('Producer verified successfully!');
  };

  const rejectProducer = (producerId: string) => {
    setProducers(prev => prev.map(p => 
      p.id === producerId ? { ...p, verificationStatus: 'rejected' as const } : p
    ));
    setStats(prev => ({
      ...prev,
      pendingVerifications: prev.pendingVerifications - 1,
    }));
    alert('Producer verification rejected.');
  };

  const confirmPayment = (producerId: string) => {
    setProducers(prev => prev.map(p => 
      p.id === producerId ? { ...p, paymentStatus: 'paid' as const } : p
    ));
    setStats(prev => ({
      ...prev,
      pendingPayments: prev.pendingPayments - 1,
      activeMembers: prev.activeMembers + 1,
      monthlyRevenue: prev.monthlyRevenue + 15000,
      annualRevenue: prev.annualRevenue + 180000,
    }));
    alert('Payment confirmed!');
  };

  const approveSong = (songId: string) => {
    setPendingSongs(prev => prev.filter(s => s.id !== songId));
    setStats(prev => ({
      ...prev,
      totalSongs: prev.totalSongs + 1,
    }));
    alert('Song approved!');
  };

  const rejectSong = (songId: string) => {
    setPendingSongs(prev => prev.filter(s => s.id !== songId));
    alert('Song rejected.');
  };

  const exportToPDF = () => {
    alert('PDF export ready. In production, this would generate a PDF report.');
  };

  const exportToCSV = () => {
    let csvContent = "Type,Name,Status,Date,Amount\n";
    producers.forEach(p => {
      csvContent += `Producer,${p.fullName},${p.verificationStatus},${p.registrationDate},${p.membershipFee}\n`;
    });
    pendingSongs.forEach(s => {
      csvContent += `Song,${s.title},${s.status},${s.createdAt},\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paeam_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('CSV exported!');
  };

  const exportToExcel = () => {
    exportToCSV();
  };

  const handleBackToDashboard = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }));
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
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
              <button onClick={() => setSidebarOpen(false)} className="text-neutral-400 hover:text-white"><ChevronLeft size={20} /></button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="mx-auto text-neutral-400 hover:text-white"><ChevronRight size={20} /></button>
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
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors">
            <Settings size={20} /> {sidebarOpen && <span>Settings</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors mt-1">
            <LogOut size={20} /> {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-neutral-900 border-b border-neutral-800 p-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={handleBackToDashboard} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">
                <ArrowLeft size={18} /> Back to Dashboard
              </button>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gold-500" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-neutral-800 rounded-lg"><Bell size={20} className="text-neutral-400" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span></button>
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center"><span className="text-black font-bold text-sm">A</span></div><div><p className="text-white text-sm font-medium">Admin</p><p className="text-neutral-500 text-xs">Super Admin</p></div></div>
            </div>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <main className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6"><div className="flex justify-between items-start"><div><p className="text-neutral-400 text-sm">Total Producers</p><p className="text-3xl font-bold text-white">{stats.totalProducers}</p></div><div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center"><Users size={24} className="text-gold-400" /></div></div></div>
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6"><div className="flex justify-between items-start"><div><p className="text-neutral-400 text-sm">Pending Verifications</p><p className="text-2xl font-bold text-yellow-500">{stats.pendingVerifications}</p></div><div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center"><Clock size={24} className="text-yellow-400" /></div></div></div>
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6"><div className="flex justify-between items-start"><div><p className="text-neutral-400 text-sm">Pending Payments</p><p className="text-2xl font-bold text-red-500">{stats.pendingPayments}</p></div><div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center"><DollarSign size={24} className="text-red-400" /></div></div></div>
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6"><div className="flex justify-between items-start"><div><p className="text-neutral-400 text-sm">Monthly Revenue</p><p className="text-3xl font-bold text-gold-400">MWK {stats.monthlyRevenue.toLocaleString()}</p></div><div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center"><TrendingUp size={24} className="text-gold-400" /></div></div></div>
            </div>
          </main>
        )}

        {/* Producers Tab */}
        {activeTab === 'producers' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800 border-b border-neutral-700"><tr><th className="text-left p-4 text-white">Producer</th><th className="text-left p-4 text-white">Stage Name</th><th className="text-left p-4 text-white">Email</th><th className="text-left p-4 text-white">Verification</th><th className="text-left p-4 text-white">Payment</th><th className="text-left p-4 text-white">Actions</th></tr></thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredProducers.map(p => (<tr key={p.id} className="hover:bg-neutral-800/50"><td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gold-500/20 rounded-full flex items-center justify-center"><span className="text-gold-400 font-bold">{p.fullName.charAt(0)}</span></div><span className="text-white">{p.fullName}</span></div></td><td className="p-4 text-white">{p.stageName}</td><td className="p-4 text-neutral-400">{p.email}</td><td className="p-4">{p.verificationStatus === 'verified' ? <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs"><CheckCircle2 size={12} /> Verified</span> : p.verificationStatus === 'pending' ? <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs"><Clock size={12} /> Pending</span> : <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs"><XCircle size={12} /> Rejected</span>}</td><td className="p-4">{p.paymentStatus === 'paid' ? <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs"><CheckCircle2 size={12} /> Paid</span> : <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs"><AlertTriangle size={12} /> Unpaid</span>}</td><td className="p-4"><div className="flex gap-2">{p.verificationStatus === 'pending' && <><button onClick={() => verifyProducer(p.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs">Verify</button><button onClick={() => rejectProducer(p.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs">Reject</button></>}{p.paymentStatus !== 'paid' && <button onClick={() => confirmPayment(p.id)} className="px-3 py-1 bg-gold-600 text-black rounded-lg text-xs">Confirm Payment</button>}<button onClick={() => { setSelectedProducer(p); setShowProducerModal(true); }} className="px-3 py-1 bg-neutral-700 text-white rounded-lg text-xs">View</button></div></td></tr>))}
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
              <table className="w-full"><thead className="bg-neutral-800"><tr><th className="p-4 text-left text-white">Title</th><th className="p-4 text-left text-white">Producer</th><th className="p-4 text-left text-white">Genre</th><th className="p-4 text-left text-white">Date</th><th className="p-4 text-left text-white">Actions</th></tr></thead>
              <tbody>{pendingSongs.map(s => (<tr key={s.id} className="hover:bg-neutral-800/50"><td className="p-4 text-white">{s.title}</td><td className="p-4 text-neutral-400">{s.producerName}</td><td className="p-4 text-neutral-400">{s.genre}</td><td className="p-4 text-neutral-500">{s.createdAt}</td><td className="p-4"><button onClick={() => approveSong(s.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs mr-2">Approve</button><button onClick={() => rejectSong(s.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs">Reject</button></td></tr>))}</tbody></table>
            </div>
          </main>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <table className="w-full"><thead className="bg-neutral-800"><tr><th className="p-4 text-left text-white">Song</th><th className="p-4 text-left text-white">Producer</th><th className="p-4 text-left text-white">Type</th><th className="p-4 text-left text-white">Territory</th><th className="p-4 text-left text-white">Status</th><th className="p-4 text-left text-white">Royalty Split</th></tr></thead>
              <tbody>{contracts.map(c => (<tr key={c.id} className="hover:bg-neutral-800/50"><td className="p-4 text-white">{c.songTitle}</td><td className="p-4 text-neutral-400">{c.producerName}</td><td className="p-4 text-neutral-400">{c.type}</td><td className="p-4 text-neutral-400">{c.territory}</td><td className="p-4"><span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">{c.status}</span></td><td className="p-4 text-neutral-400">R:{c.royaltyPercent}% M:{c.mechanicalPercent}% P:{c.performancePercent}% Pub:{c.publishingPercent}%</td></tr>))}</tbody></table>
            </div>
          </main>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <table className="w-full"><thead className="bg-neutral-800"><tr><th className="p-4 text-left text-white">Producer</th><th className="p-4 text-left text-white">Amount</th><th className="p-4 text-left text-white">Date</th><th className="p-4 text-left text-white">Method</th><th className="p-4 text-left text-white">Reference</th><th className="p-4 text-left text-white">Status</th></tr></thead>
              <tbody>{payments.map(p => (<tr key={p.id} className="hover:bg-neutral-800/50"><td className="p-4 text-white">{p.producerName}</td><td className="p-4 text-gold-400">MWK {p.amount.toLocaleString()}</td><td className="p-4 text-neutral-400">{p.date}</td><td className="p-4 text-neutral-400">{p.method}</td><td className="p-4 text-neutral-400">{p.reference}</td><td className="p-4"><span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Completed</span></td></tr>))}</tbody></table>
            </div>
          </main>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <main className="p-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Generate Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={exportToPDF} className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"><div><p className="text-white font-semibold">PDF Report</p><p className="text-neutral-400 text-sm">Download as PDF</p></div><FilePdf size={24} className="text-red-500" /></button>
                <button onClick={exportToCSV} className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"><div><p className="text-white font-semibold">CSV Export</p><p className="text-neutral-400 text-sm">Spreadsheet format</p></div><FileSpreadsheet size={24} className="text-green-500" /></button>
                <button onClick={exportToExcel} className="flex items-center justify-between p-4 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"><div><p className="text-white font-semibold">Excel Export</p><p className="text-neutral-400 text-sm">XLSX format</p></div><Printer size={24} className="text-blue-500" /></button>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Producer Modal */}
      {showProducerModal && selectedProducer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowProducerModal(false)}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-neutral-800"><h2 className="text-xl font-bold text-white">Producer Details</h2><button onClick={() => setShowProducerModal(false)} className="text-neutral-400 hover:text-white"><XCircle size={24} /></button></div>
            <div className="p-6"><div className="grid grid-cols-2 gap-4"><div><p className="text-neutral-500">Full Name</p><p className="text-white">{selectedProducer.fullName}</p></div><div><p className="text-neutral-500">Stage Name</p><p className="text-white">{selectedProducer.stageName}</p></div><div><p className="text-neutral-500">Email</p><p className="text-white">{selectedProducer.email}</p></div><div><p className="text-neutral-500">Phone</p><p className="text-white">{selectedProducer.phone}</p></div><div><p className="text-neutral-500">IPI Number</p><p className="text-white">{selectedProducer.ipiNumber || 'Not assigned'}</p></div></div></div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowSettings(false)}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-neutral-800"><h2 className="text-xl font-bold text-white">Settings</h2><button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white"><XCircle size={24} /></button></div>
            <div className="p-6 space-y-6">
              <div><label className="block text-sm font-medium text-neutral-300 mb-2">Theme</label><div className="flex gap-3"><button onClick={() => { setTheme('dark'); applyTheme('dark'); }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${theme === 'dark' ? 'border-gold-500 bg-gold-500/10' : 'border-neutral-700'} hover:border-gold-500 transition-colors`}><Moon size={18} /> Dark</button><button onClick={() => { setTheme('light'); applyTheme('light'); }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${theme === 'light' ? 'border-gold-500 bg-gold-500/10' : 'border-neutral-700'} hover:border-gold-500 transition-colors`}><Sun size={18} /> Light</button><button onClick={() => { setTheme('system'); applyTheme('system'); }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${theme === 'system' ? 'border-gold-500 bg-gold-500/10' : 'border-neutral-700'} hover:border-gold-500 transition-colors`}><Laptop size={18} /> System</button></div></div>
              <div><label className="block text-sm font-medium text-neutral-300 mb-2">Language</label><div className="flex gap-3"><button onClick={() => setLanguage('en')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${language === 'en' ? 'border-gold-500 bg-gold-500/10' : 'border-neutral-700'} hover:border-gold-500 transition-colors`}><Globe size={18} /> English</button><button onClick={() => setLanguage('ny')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${language === 'ny' ? 'border-gold-500 bg-gold-500/10' : 'border-neutral-700'} hover:border-gold-500 transition-colors`}><Languages size={18} /> Chichewa</button></div></div>
              <div><label className="block text-sm font-medium text-neutral-300 mb-2">Notifications</label><div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"><span>Email notifications</span><button className="w-10 h-5 bg-gold-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div></button></div></div>
            </div>
            <div className="p-6 border-t border-neutral-800 flex justify-end"><button onClick={() => { alert('Settings saved!'); setShowSettings(false); }} className="px-4 py-2 bg-gold-500 text-black rounded-lg">Save Changes</button></div>
          </div>
        </div>
      )}
    </div>
  );
}