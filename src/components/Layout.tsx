import { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Disc3, 
  FileText, 
  Lock, 
  History,
  Shield,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

export default function Layout({ children, currentPage, onNavigate, isAdmin = true }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'profile', label: 'Producer Profile', icon: <User size={20} /> },
    { id: 'catalog', label: 'Catalog', icon: <Disc3 size={20} /> },
    { id: 'contracts', label: 'Contracts', icon: <FileText size={20} /> },
    { id: 'locks', label: 'Lock Approvals', icon: <Lock size={20} /> },
    { id: 'audit', label: 'Audit Trail', icon: <History size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('paeam_user');
    localStorage.removeItem('paeam_paid');
    localStorage.removeItem('paeam_logged_in');
    window.location.href = '/';
  };

  const handleAdminPanel = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'admin' }));
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

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
                <div>
                  <h1 className="text-white font-bold">PAEAM</h1>
                  <p className="text-neutral-500 text-xs">Producer Registry</p>
                </div>
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'bg-gold-500 text-black'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
          
          {/* Admin Panel Link */}
          {isAdmin && (
            <button
              onClick={handleAdminPanel}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-neutral-400 hover:bg-neutral-800 hover:text-white mt-4 border-t border-neutral-800 pt-4`}
            >
              <Shield size={20} />
              {sidebarOpen && <span className="text-sm">Admin Panel</span>}
            </button>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800 space-y-2">
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <Settings size={20} />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-6`}>
        {children}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Theme Preference</label>
                <select className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white">
                  <option>Dark (Default)</option>
                  <option>Light</option>
                  <option>System Default</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Notifications</label>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Email notifications</span>
                  <button className="w-10 h-5 bg-gold-500 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Language</label>
                <select className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white">
                  <option>English</option>
                  <option>Chichewa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Email Address</label>
                <input type="email" className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Change Password</label>
                <button className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm">Reset Password</button>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-800 flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-neutral-800 text-white rounded-lg">Cancel</button>
              <button onClick={() => { alert('Settings saved!'); setShowSettings(false); }} className="px-4 py-2 bg-gold-500 text-black rounded-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}