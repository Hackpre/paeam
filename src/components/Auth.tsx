import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, Fingerprint } from 'lucide-react';
import PayChanguPayment from './PayChanguPayment';

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

    const result = await signIn(email, password);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setLoading(true);
    const result = await signUp(pendingUser.email, pendingUser.password);
    if (result.error) {
      setError(result.error);
    } else {
      alert('Registration successful! Please check your email.');
    }
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
