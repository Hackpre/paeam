import { useState, useMemo } from 'react';
import { useAuth } from '../lib/auth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Fingerprint,
  CreditCard,
  Check,
  X,
} from 'lucide-react';

export default function Auth() {
  const { signUp, signIn, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [fullName, setFullName] = useState('');
  const [stageName, setStageName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ipiNumber, setIpiNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);

  // Password validation
  const passwordChecks = useMemo(() => [
    { label: 'At least 12 characters', met: regPassword.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(regPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(regPassword) },
    { label: 'One number', met: /[0-9]/.test(regPassword) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(regPassword) },
  ], [regPassword]);

  const allPasswordChecksMet = passwordChecks.every((c) => c.met);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError);
    }
    setSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !nationalId || !phoneNumber || !regEmail) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!allPasswordChecksMet) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: authError } = await signUp(regEmail, regPassword);
    if (authError) {
      setError(authError);
      setSubmitting(false);
      return;
    }

    // Store extra profile data for post-signup profile creation
    localStorage.setItem(
      'paeam_registration_data',
      JSON.stringify({
        fullName,
        stageName,
        nationalId,
        phoneNumber,
        ipiNumber,
      })
    );

    setSubmitting(false);
    setShowPayment(true);
  };

  const handlePayLater = () => {
    setShowPayment(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and heading */}
        <div className="text-center mb-8">
          <img
            src="/PAEAM_Logo-Photoroom.png"
            alt="PAEAM"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">
            Malawi Producer Registry
          </h1>
          <p className="text-neutral-400 mt-1">
            Secure Rights & Royalty Management
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex mb-6 bg-neutral-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-gold-600 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-gold-600 text-neutral-950'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Sign In form */}
          {isLogin && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
              </div>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full py-2.5 bg-gold-600 text-neutral-950 font-semibold rounded-xl hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting || loading ? 'Please wait...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register form */}
          {!isLogin && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Legal Name */}
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Legal Name *"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
              </div>

              {/* Stage Name */}
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  placeholder="Stage Name"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
              </div>

              {/* National ID */}
              <div className="relative">
                <Fingerprint
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="National ID Number *"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone Number *"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
              </div>

              {/* IPI Number (optional) */}
              <div className="relative">
                <CreditCard
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  value={ipiNumber}
                  onChange={(e) => setIpiNumber(e.target.value)}
                  placeholder="IPI Number (optional)"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
              </div>

              {/* Membership Fee Notice */}
              <div className="p-3 bg-gold-500/10 border border-gold-500/20 rounded-xl">
                <p className="text-gold-500 text-sm font-semibold">
                  Annual Membership Fee: 15,000 MWK
                </p>
                <p className="text-neutral-400 text-xs mt-1">
                  Pay via PayChangu (Airtel Money, MPamba, National Bank)
                </p>
              </div>

              {/* Email */}
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email *"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Password *"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showRegPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {/* Password requirements */}
              {regPassword.length > 0 && (
                <div className="space-y-1.5 px-1">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className="flex items-center gap-2 text-sm"
                    >
                      {check.met ? (
                        <Check
                          size={14}
                          className="text-gold-400 shrink-0"
                        />
                      ) : (
                        <X
                          size={14}
                          className="text-neutral-500 shrink-0"
                        />
                      )}
                      <span
                        className={
                          check.met ? 'text-gold-400' : 'text-neutral-500'
                        }
                      >
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm Password */}
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password *"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {/* Confirm password mismatch */}
              {confirmPassword.length > 0 &&
                regPassword !== confirmPassword && (
                  <p className="text-red-400 text-sm px-1">
                    Passwords do not match
                  </p>
                )}

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full py-2.5 bg-gold-600 text-neutral-950 font-semibold rounded-xl hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting || loading ? 'Please wait...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-gold-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Membership Fee
            </h2>
            <p className="text-gold-400 text-xl font-semibold mb-1">
              15,000 MWK
            </p>
            <p className="text-neutral-400 text-sm mb-6">
              Pay via PayChangu (Airtel Money, MPamba, National Bank)
            </p>
            <div className="flex gap-3">
              <a
                href="/payment"
                className="flex-1 py-3 bg-gold-600 text-neutral-950 font-semibold rounded-xl hover:bg-gold-700 transition-colors text-center"
              >
                Pay Now
              </a>
              <button
                onClick={handlePayLater}
                className="flex-1 py-3 bg-neutral-800 text-white font-semibold rounded-xl hover:bg-neutral-700 transition-colors"
              >
                Pay Later
              </button>
            </div>
            <button
              onClick={() => setShowPayment(false)}
              className="w-full py-2 text-neutral-400 hover:text-neutral-300 mt-3 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
