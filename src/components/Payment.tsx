import { useState } from 'react';

interface PaymentProps {
  onComplete: () => void;
}

export default function Payment({ onComplete }: PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = () => {
    setLoading(true);
    // Simulate payment success for demo
    setTimeout(() => {
      localStorage.setItem('paeam_paid', 'true');
      onComplete();
    }, 1000);
  };

  const handlePayLater = () => {
    localStorage.setItem('paeam_paid', 'false');
    onComplete();
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl p-8 max-w-md w-full text-center border border-neutral-800">
        <div className="w-20 h-20 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">💰</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Complete Your Payment</h1>
        <p className="text-4xl font-bold text-gold-500 mb-2">15,000 MWK</p>
        <p className="text-neutral-400 text-sm mb-6">Annual Membership Fee</p>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg">{error}</div>}
        
        <div className="bg-neutral-800 rounded-xl p-4 mb-6">
          <p className="text-neutral-300 text-sm">Demo Mode: Click "Pay Now" to simulate payment</p>
        </div>
        
        <button 
          onClick={handlePayment} 
          disabled={loading}
          className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl mb-3 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        
        <button 
          onClick={handlePayLater}
          className="w-full py-2 text-neutral-500 hover:text-neutral-400 rounded-xl transition-colors"
        >
          Pay Later
        </button>
      </div>
    </div>
  );
}