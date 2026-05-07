import { useState } from 'react';

const PAYCHANGU_SECRET_KEY = "SEC-TEST-esDPROlaHslxXyTnc3AqkdiFI3Yt8uH";

interface PaymentProps {
  onComplete: () => void;
}

export default function Payment({ onComplete }: PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    const user = JSON.parse(localStorage.getItem('paeam_user') || '{}');
    
    try {
      const response = await fetch('https://api.paychangu.com/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`
        },
        body: JSON.stringify({
          amount: 15000,
          currency: 'MWK',
          email: user.email,
          phone: user.phone || '0999123456',
          full_name: user.fullName,
          description: 'PAEAM Annual Membership Fee',
          reference: `PAEAM-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
          callback_url: 'https://paeam.pages.dev/api/payment-callback',
          return_url: 'https://paeam.pages.dev/dashboard'
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        localStorage.setItem('paeam_paid', 'true');
        window.location.href = data.payment_url;
      } else {
        setError(data.message || 'Payment failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
        
        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg">{error}</div>}
        
        <button onClick={handlePayment} disabled={loading} className="w-full py-3 bg-gold-600 text-black font-semibold rounded-xl mb-3">
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        <button onClick={handlePayLater} className="w-full py-2 text-neutral-500 rounded-xl">Pay Later</button>
      </div>
    </div>
  );
}