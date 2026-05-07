import { useState } from 'react';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Payment from './components/Payment';
import Dashboard from './components/Dashboard';

function App() {
  const [step, setStep] = useState<'landing' | 'auth' | 'payment' | 'dashboard'>('landing');
  const [user, setUser] = useState<any>(null);

  const handleAuthSuccess = () => {
    setStep('payment');
  };

  const handlePaymentComplete = () => {
    setStep('dashboard');
  };

  if (step === 'landing') {
    return (
      <Landing
        onGetStarted={() => setStep('auth')}
        onSignIn={() => setStep('auth')}
      />
    );
  }

  if (step === 'auth') {
    return <Auth onSuccess={handleAuthSuccess} />;
  }

  if (step === 'payment') {
    return <Payment onComplete={handlePaymentComplete} />;
  }

  return <Dashboard />;
}

export default App;