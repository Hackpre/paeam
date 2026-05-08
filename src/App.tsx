import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import Auth from './components/Auth';
import Landing from './components/Landing';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProducerProfilePage from './components/ProducerProfile';
import Catalog from './components/Catalog';
import Contracts from './components/Contracts';
import LockApprovals from './components/LockApprovals';
import AuditTrail from './components/AuditTrail';
import Payment from './components/Payment';
import AdminDashboard from './components/AdminDashboard';
import Disputes from './components/Disputes';

type Page = 'dashboard' | 'profile' | 'catalog' | 'contracts' | 'locks' | 'audit' | 'payment' | 'admin' | 'disputes';
type AppView = 'landing' | 'auth' | 'app';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [view, setView] = useState<AppView>('landing');

  useEffect(() => {
    if (user) {
      setView('app');
    }
  }, [user]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setCurrentPage(detail as Page);
    };
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <Landing
        onGetStarted={() => setView('auth')}
        onSignIn={() => setView('auth')}
      />
    );
  }

  if (view === 'auth' && !user) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'profile': return <ProducerProfilePage />;
      case 'catalog': return <Catalog />;
      case 'contracts': return <Contracts />;
      case 'locks': return <LockApprovals />;
      case 'audit': return <AuditTrail />;
      case 'payment': return <Payment />;
      case 'admin': return <AdminDashboard />;
      case 'disputes': return <Disputes />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard' },
    { id: 'profile' as Page, label: 'Producer Profile' },
    { id: 'catalog' as Page, label: 'Catalog' },
    { id: 'contracts' as Page, label: 'Contracts' },
    { id: 'locks' as Page, label: 'Lock Approvals' },
    { id: 'disputes' as Page, label: 'Disputes' },
    { id: 'audit' as Page, label: 'Audit Trail' },
    ...(isAdmin ? [{ id: 'admin' as Page, label: 'Admin Dashboard' }] : []),
  ];

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} navItems={navItems}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
