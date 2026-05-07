import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PAYCHANGU_SECRET_KEY = "SEC-TEST-esDPROlaHslxXyTnc3AqkdiFI3Yt8uH";

export default function Payment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Get user profile to get phone number
      const { data: profile } = await supabase
        .from('producer_profiles')
        .select('phone, full_name')
        .eq('user_id', user?.id)
        .single();

      const response = await fetch('https://api.paychangu.com/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`
        },
        body: JSON.stringify({
          amount: 15000,
          currency: 'MWK',
          email: user?.email,
          phone: profile?.phone || '',
          full_name: profile?.full_name || user?.user_metadata?.full_name,
          description: 'PAEAM Annual Membership Fee',
          reference: `PAEAM-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
          callback_url: 'https://paeam.pages.dev/api/payment-callback',
          return_url: 'https://paeam.pages.dev/dashboard'
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        window.location.href = data.payment_url;
      } else {
        alert('Payment failed: ' + (data.message || 'Please try again'));
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment error. Please try again.');
    } finally {
      setLoading(false);
    }
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
        
        <div className="bg-neutral-800 rounded-xl p-4 mb-6">
          <p className="text-neutral-300 text-sm">You will be redirected to PayChangu to complete your payment.</p>
          <p className="text-neutral-500 text-xs mt-2">Supported: Airtel Money, MPamba, National Bank</p>
        </div>
        
        <button 
          onClick={handlePayment} 
          disabled={loading}
          className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-2 text-neutral-500 mt-3 hover:text-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
