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

type Page = 'dashboard' | 'profile' | 'catalog' | 'contracts' | 'locks' | 'audit' | 'payment';
type AppView = 'landing' | 'auth' | 'app' | 'payment';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [view, setView] = useState<AppView>('landing');

  useEffect(() => {
    if (user) {
      const paymentStatus = localStorage.getItem('paeam_paid');
      if (paymentStatus === 'false' || !paymentStatus) {
        setView('payment');
      } else {
        setView('app');
      }
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

  if (view === 'payment') {
    return <Payment onComplete={() => setView('app')} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'profile': return <ProducerProfilePage />;
      case 'catalog': return <Catalog />;
      case 'contracts': return <Contracts />;
      case 'locks': return <LockApprovals />;
      case 'audit': return <AuditTrail />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
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