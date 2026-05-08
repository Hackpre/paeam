import { useState } from 'react';
import { useAuth } from '../lib/auth';
import {
  Music,
  LayoutDashboard,
  User,
  Disc3,
  FileText,
  Lock,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

type Page = 'dashboard' | 'profile' | 'catalog' | 'contracts' | 'locks' | 'audit';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'profile', label: 'Producer Profile', icon: <User size={20} /> },
  { id: 'catalog', label: 'Catalog', icon: <Disc3 size={20} /> },
  { id: 'contracts', label: 'Contracts', icon: <FileText size={20} /> },
  { id: 'locks', label: 'Lock Approvals', icon: <Lock size={20} /> },
  { id: 'audit', label: 'Audit Trail', icon: <ChevronRight size={20} /> },
];

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
          <img src="/PAEAM_Logo-Photoroom.png" alt="PAEAM" className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Malawi Producer</h1>
            <p className="text-xs text-neutral-400">Rights & Royalty System</p>
          </div>
          <button
            className="ml-auto lg:hidden text-neutral-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                currentPage === item.id
                  ? 'bg-gold-600/20 text-gold-400 border border-gold-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300">
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.email}</p>
              <p className="text-xs text-neutral-500">Authenticated</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 py-3 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800">
          <button
            className="lg:hidden text-neutral-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-white capitalize">
            {navItems.find((i) => i.id === currentPage)?.label ?? 'Dashboard'}
          </h2>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        <footer className="border-t border-neutral-800 px-4 sm:px-6 lg:px-8 py-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/PAEAM_Logo-Photoroom.png" alt="PAEAM" className="w-8 h-8" />
              <div>
                <p className="text-sm font-semibold text-white">Producers & Audio Engineering Association of Malawi</p>
                <p className="text-xs text-neutral-500">PAEAM — Official Digital Registry</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-neutral-500">
              <span>Secure Rights Management</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Immutable Record Keeping</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Three-Way Lock Protection</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-800/50 text-center">
            <p className="text-xs text-neutral-600">
              &copy; {new Date().getFullYear()} PAEAM. All rights reserved. Built for the music producers of Malawi.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
