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
      if (!fullName) {
        setError('Full name is required');
        setLoading(false);
        return;
      }
      if (!nationalId) {
        setError('National ID number is required');
        setLoading(false);
        return;
      }
      if (!phone) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }

      setPendingUser({
        fullName, stageName, email, phone, nationalId, ipiNumber, password
      });
      setLoading(false);
      setShowPayment(true);
      return;
    }

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setLoading(true);
    
    const result = await signUp(pendingUser.email, pendingUser.password);
    if (result.error) {
      setError(result.error);
    } else {
      setFullName('');
      setStageName('');
      setPhone('');
      setNationalId('');
      setIpiNumber('');
      setEmail('');
      setPassword('');
      alert('Registration successful! Please check your email to verify your account.');
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
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isLogin ? 'bg-gold-600 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isLogin ? 'bg-gold-600 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Full Legal Name *</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" placeholder="e.g., Austin Precious Phiri" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Stage Name</label>
                  <input type="text" value={stageName} onChange={(e) => setStageName(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" placeholder="e.g., DJ Austin" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">National ID Number *</label>
                  <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" placeholder="e.g., 1234567890" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Phone Number *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" placeholder="e.g., +265 888 879 052" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-neutral-300">IPI Number</label>
                    <button type="button" onClick={() => setShowIpiInfo(!showIpiInfo)} className="text-gold-500 text-xs">What is IPI?</button>
                  </div>
                  <input type="text" value={ipiNumber} onChange={(e) => setIpiNumber(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" placeholder="e.g., IPI-123456789" />
                  {showIpiInfo && (
                    <p className="text-gold-500 text-xs mt-2">IPI (Interested Parties Information) is a unique international identification number for creators. Cosoma is now issuing IPI numbers.</p>
                  )}
                </div>

                <div className="p-3 bg-gold-500/10 rounded-xl border border-gold-500/20">
                  <p className="text-gold-500 text-sm font-semibold mb-1">Annual Membership Fee: 15,000 MWK</p>
                  <p className="text-neutral-400 text-xs">Pay via Airtel Money, MPamba, or National Bank</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" placeholder="producer@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white" placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-700 text-neutral-950 font-medium rounded-xl disabled:opacity-50">
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register & Pay'}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 p-2 text-center">
              <p className="text-neutral-500 text-xs">Annual membership: 15,000 MWK | <button className="text-gold-500">Pay Now</button></p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-neutral-600 mt-6">Producers & Audio Engineering Association of Malawi — Secure Digital Registry</p>
      </div>

      <PayChanguPayment isOpen={showPayment} onClose={() => setShowPayment(false)} amount={15000} email={pendingUser?.email || ''} phone={pendingUser?.phone || ''} fullName={pendingUser?.fullName || ''} onSuccess={handlePaymentSuccess} />
    </div>
  );
}
