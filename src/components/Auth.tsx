import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, Fingerprint } from 'lucide-react';
import PayChanguPayment from './PayChanguPayment';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [stageName, setSimport { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, Fingerprint } from 'lucide-react';

const PAYCHANGU_SECRET_KEY = "SEC-TEST-esDPROlaHslxXyTnc3AqkdiFI3Yt8uH";

export default function Auth() {
  const { signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [stageName, setStageName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [ipiNumber, setIpiNumber] = useState('');
  const [showIpiInfo, setShowIpiInfo] = useState(false);
  
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLogin) {
      if (!fullName || !nationalId || !phone) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Store registration data temporarily
      const registrationData = {
        email,
        password,
        fullName,
        stageName,
        phone,
        nationalId,
        ipiNumber,
        paymentStatus: 'pending'
      };
      sessionStorage.setItem('paeam_registration', JSON.stringify(registrationData));
      setShowPayment(true);
      setLoading(false);
      return;
    }

    // Login
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error.message || 'Login failed');
    }
    setLoading(false);
  };

  const handlePayChanguPayment = async () => {
    setPaymentLoading(true);
    const regData = JSON.parse(sessionStorage.getItem('paeam_registration') || '{}');
    
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
          email: regData.email,
          phone: regData.phone,
          full_name: regData.fullName,
          description: 'PAEAM Annual Membership Fee',
          reference: `PAEAM-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
          callback_url: 'https://paeam.pages.dev/api/payment-callback',
          return_url: 'https://paeam.pages.dev/dashboard'
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Store user data as pending payment
        const result = await signUp(regData.email, regData.password, {
          fullName: regData.fullName,
          stageName: regData.stageName,
          phone: regData.phone,
          nationalId: regData.nationalId,
          ipiNumber: regData.ipiNumber,
          paymentStatus: 'pending'
        });
        
        if (result.error) {
          setError(result.error.message);
          setPaymentLoading(false);
        } else {
          window.location.href = data.payment_url;
        }
      } else {
        setError('Payment initialization failed');
        setPaymentLoading(false);
      }
    } catch (err) {
      setError('Unable to process payment. Please try again.');
      setPaymentLoading(false);
    }
  };

  const handlePayLater = async () => {
    const regData = JSON.parse(sessionStorage.getItem('paeam_registration') || '{}');
    const result = await signUp(regData.email, regData.password, {
      fullName: regData.fullName,
      stageName: regData.stageName,
      phone: regData.phone,
      nationalId: regData.nationalId,
      ipiNumber: regData.ipiNumber,
      paymentStatus: 'pending'
    });
    
    if (result.error) {
      setError(result.error.message);
    }
    setShowPayment(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/PAEAM_Logo-Photoroom.png" alt="PAEAM" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Malawi Producer Registry</h1>
          <p className="text-neutral-400 mt-1">Secure Rights & Royalty Management</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8">
          <div className="flex mb-6 bg-neutral-800 rounded-xl p-1">
            <button onClick={() => { setIsLogin(true); setError(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${isLogin ? 'bg-gold-600 text-neutral-950' : 'text-neutral-400'}`}>Sign In</button>
            <button onClick={() => { setIsLogin(false); setError(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${!isLogin ? 'bg-gold-600 text-neutral-950' : 'text-neutral-400'}`}>Register</button>
          </div>

          {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Legal Name *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
                <input type="text" value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Stage Name" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" />
                <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="National ID Number *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
                <input type="text" value={ipiNumber} onChange={(e) => setIpiNumber(e.target.value)} placeholder="IPI Number" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" />
                <div className="p-3 bg-gold-500/10 rounded-xl">
                  <p className="text-gold-500 text-sm font-semibold">Annual Membership Fee: 15,000 MWK</p>
                  <p className="text-neutral-400 text-xs">Pay via PayChangu (Airtel Money, MPamba, Bank Transfer)</p>
                </div>
              </>
            )}

            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-gold-600 text-black font-semibold rounded-xl">{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register'}</button>
          </form>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-neutral-900 rounded-2xl p-6 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Membership Fee: 15,000 MWK</h2>
            <div className="flex gap-3 mt-6">
              <button onClick={handlePayChanguPayment} disabled={paymentLoading} className="flex-1 py-3 bg-gold-600 text-black font-semibold rounded-xl">Pay Now</button>
              <button onClick={handlePayLater} className="flex-1 py-3 bg-neutral-800 text-white font-semibold rounded-xl">Pay Later</button>
            </div>
            <button onClick={() => setShowPayment(false)} className="w-full py-2 text-neutral-400 mt-3">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}tageName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [ipiNumber, setIpiNumber] = useState('');
  const [showIpiInfo, setShowIpiInfo] = useState(false);
  
  const [showPayment, setShowPayment] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLogin) {
      if (!fullName || !nationalId || !phone) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      setPendingUser({ fullName, stageName, email, phone, nationalId, ipiNumber, password });
      setLoading(false);
      setShowPayment(true);
      return;
    }

    // For demo, just show success on login
    if (email && password) {
      alert('Login successful!');
    } else {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setLoading(true);
    alert('Registration successful! Your account has been created.');
    setLoading(false);
    setPendingUser(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/PAEAM_Logo-Photoroom.png" alt="PAEAM" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Malawi Producer Registry</h1>
          <p className="text-neutral-400 mt-1">Secure Rights & Royalty Management</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8">
          <div className="flex mb-6 bg-neutral-800 rounded-xl p-1">
            <button onClick={() => { setIsLogin(true); setError(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${isLogin ? 'bg-gold-600 text-neutral-950' : 'text-neutral-400'}`}>Sign In</button>
            <button onClick={() => { setIsLogin(false); setError(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${!isLogin ? 'bg-gold-600 text-neutral-950' : 'text-neutral-400'}`}>Register</button>
          </div>

          {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Legal Name *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
                <input type="text" value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Stage Name" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" />
                <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="National ID Number *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
                
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-sm text-neutral-300">IPI Number</label>
                    <button type="button" onClick={() => setShowIpiInfo(!showIpiInfo)} className="text-gold-500 text-xs">What is IPI?</button>
                  </div>
                  <input type="text" value={ipiNumber} onChange={(e) => setIpiNumber(e.target.value)} placeholder="e.g., IPI-123456789" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" />
                  {showIpiInfo && <p className="text-gold-500 text-xs mt-1">IPI is a unique international ID for creators. Cosoma is now issuing IPI numbers.</p>}
                </div>

                <div className="p-3 bg-gold-500/10 rounded-xl">
                  <p className="text-gold-500 text-sm font-semibold">Annual Membership Fee: 15,000 MWK</p>
                  <p className="text-neutral-400 text-xs">Pay via Airtel Money, MPamba, or National Bank</p>
                </div>
              </>
            )}

            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
            
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password *" className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-700 text-neutral-950 font-medium rounded-xl disabled:opacity-50">{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register & Pay'}</button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-600 mt-6">Producers & Audio Engineering Association of Malawi — Secure Digital Registry</p>
      </div>

      <PayChanguPayment isOpen={showPayment} onClose={() => setShowPayment(false)} amount={15000} email={pendingUser?.email || ''} phone={pendingUser?.phone || ''} fullName={pendingUser?.fullName || ''} onSuccess={handlePaymentSuccess} />
    </div>
  );
}
