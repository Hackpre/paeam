import { ReactNode } from 'react';
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
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

export default function Layout({ children, currentPage, onNavigate, isAdmin }: LayoutProps) {
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

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 z-20">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">PA</span>
              </div>
              <div>
                <h1 className="text-white font-bold">PAEAM</h1>
                <p className="text-neutral-500 text-xs">Producer Registry</p>
              </div>
            </div>
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
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
            
            {/* Admin Link - Only show for admin users */}
            {isAdmin && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'admin' }))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-neutral-400 hover:bg-neutral-800 hover:text-white mt-4 border-t border-neutral-800 pt-4"
              >
                <Shield size={20} />
                <span className="text-sm">Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-800 space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors">
              <Settings size={20} />
              <span className="text-sm">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
}