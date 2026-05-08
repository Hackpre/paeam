import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Payment } from '../lib/types';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  CreditCard,
  Smartphone,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Shield,
  ArrowRight,
  X,
} from 'lucide-react';

interface PaymentProps {
  onComplete?: () => void;
}

type PaymentMethodOption = 'airtel_money' | 'tnm_mpamba' | 'national_bank';

interface PaymentMethodConfig {
  id: PaymentMethodOption;
  label: string;
  description: string;
  icon: typeof Smartphone;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'airtel_money',
    label: 'Airtel Money',
    description: 'Pay via Airtel Money mobile wallet',
    icon: Smartphone,
  },
  {
    id: 'tnm_mpamba',
    label: 'TNM Mpamba',
    description: 'Pay via TNM Mpamba mobile wallet',
    icon: Smartphone,
  },
  {
    id: 'national_bank',
    label: 'National Bank',
    description: 'Pay via National Bank transfer',
    icon: Building2,
  },
];

const MEMBERSHIP_FEE = 15000;
const LATE_RENEWAL_FEE = 18750;

function getStatusBadge(status: Payment['status']) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
    case 'pending':
      return { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    case 'failed':
      return { label: 'Failed', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
    case 'processing':
      return { label: 'Processing', className: 'bg-gold-500/10 text-gold-400 border-gold-500/20' };
    case 'refunded':
      return { label: 'Refunded', className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' };
    default:
      return { label: 'Unknown', className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' };
  }
}

function getMembershipStatusBadge(status: string) {
  switch (status) {
    case 'trial':
      return { label: 'Free Trial', className: 'bg-gold-500/10 text-gold-400 border-gold-500/20' };
    case 'grace':
      return { label: 'Grace Period', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    case 'suspended':
      return { label: 'Suspended', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
    case 'active':
      return { label: 'Active', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
    default:
      return { label: 'Unknown', className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' };
  }
}

export default function Payment({ onComplete }: PaymentProps) {
  const { user, session, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>('airtel_money');
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);

  const membershipStatus = profile?.membership_status ?? 'trial';
  const isLateRenewal = membershipStatus === 'suspended';
  const amountDue = isLateRenewal ? LATE_RENEWAL_FEE : MEMBERSHIP_FEE;
  const statusBadge = getMembershipStatusBadge(membershipStatus);

  useEffect(() => {
    loadPaymentHistory();
  }, [user]);

  async function loadPaymentHistory() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading payment history:', fetchError);
      } else {
        setPaymentHistory((data ?? []) as Payment[]);
      }
    } catch (err) {
      console.error('Error loading payment history:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayNow() {
    if (!session) {
      setError('You must be signed in to make a payment.');
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pay`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'initiate',
          payment_type: 'membership',
          return_url: window.location.origin + '/dashboard',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Payment initiation failed.');
      }

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error('No payment URL returned. Please try again.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Network error. Please check your connection and try again.');
    } finally {
      setPaying(false);
    }
  }

  function handlePayLater() {
    if (onComplete) {
      onComplete();
    }
  }

  function toggleReceipt(paymentId: string) {
    setExpandedReceipt(prev => (prev === paymentId ? null : paymentId));
  }

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Membership Payment</h1>
          <p className="text-neutral-400 text-sm mt-1">PAEAM - Performing Arts and Entertainment Association of Malawi</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Payment Error</p>
              <p className="text-red-400/80 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400/60 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Payment Overview Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {/* Status and Amount */}
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Payment Overview</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>

            <div className="bg-neutral-800 rounded-xl p-5">
              <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1">
                {isLateRenewal ? 'Late Renewal Fee' : 'Annual Membership Fee'}
              </p>
              <p className="text-3xl font-bold text-gold-400">
                {formatCurrency(amountDue)}
              </p>
              {isLateRenewal && (
                <p className="text-xs text-red-400/80 mt-2">
                  Includes 25% late fee after grace period
                </p>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-300 mb-3">Select Payment Method</h3>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
                      isSelected
                        ? 'bg-gold-600/10 border-gold-600/40'
                        : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    {/* Radio indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-gold-500'
                          : 'border-neutral-600'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-gold-600/20 text-gold-400'
                          : 'bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? 'text-gold-400' : 'text-neutral-300'}`}>
                        {method.label}
                      </p>
                      <p className="text-xs text-neutral-500">{method.description}</p>
                    </div>

                    {/* Arrow */}
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-gold-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay Now
                </>
              )}
            </button>

            <button
              onClick={handlePayLater}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-300 font-medium rounded-xl transition-colors text-sm"
            >
              Pay Later
            </button>
          </div>
        </div>

        {/* Membership Info */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-600/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Membership Details</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                14-day free trial, then 15,000 MWK/year. 30-day grace period after expiry. 25% late fee after grace period.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                <Shield className="w-4 h-4" />
                <span>Payments are processed securely via PayChangu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="w-full p-6 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gold-400" />
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white">Payment History</h3>
                  <p className="text-xs text-neutral-500">{paymentHistory.length} transaction{paymentHistory.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {historyExpanded ? (
                <ChevronUp className="w-5 h-5 text-neutral-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-neutral-500" />
              )}
            </button>

            {historyExpanded && (
              <div className="border-t border-neutral-800">
                <div className="divide-y divide-neutral-800">
                  {paymentHistory.map((payment) => {
                    const badge = getStatusBadge(payment.status);
                    const isCompleted = payment.status === 'completed';
                    const isReceiptOpen = expandedReceipt === payment.id;

                    return (
                      <div key={payment.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0">
                              {payment.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                              ) : payment.status === 'failed' ? (
                                <XCircle className="w-5 h-5 text-red-400" />
                              ) : (
                                <Clock className="w-5 h-5 text-gold-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {payment.description || payment.payment_type.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatDate(payment.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="text-sm font-semibold text-gold-400">
                              {formatCurrency(payment.amount)}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        {/* Receipt toggle for completed payments */}
                        {isCompleted && (
                          <div className="mt-3">
                            <button
                              onClick={() => toggleReceipt(payment.id)}
                              className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {isReceiptOpen ? 'Hide Receipt' : 'View Receipt'}
                            </button>

                            {isReceiptOpen && (
                              <div className="mt-3 bg-neutral-800 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">Transaction ID</span>
                                  <span className="text-neutral-300 font-mono">
                                    {payment.paychangu_tx_id || '--'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">Reference</span>
                                  <span className="text-neutral-300 font-mono">
                                    {payment.paychangu_reference || '--'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">Amount</span>
                                  <span className="text-gold-400 font-medium">
                                    {formatCurrency(payment.amount)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">Date</span>
                                  <span className="text-neutral-300">
                                    {formatDate(payment.completed_at || payment.created_at)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">Method</span>
                                  <span className="text-neutral-300 capitalize">
                                    {payment.payment_method.replace(/_/g, ' ') || '--'}
                                  </span>
                                </div>
                                {payment.receipt_url && (
                                  <div className="pt-2 border-t border-neutral-700">
                                    <a
                                      href={payment.receipt_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      Download Receipt
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
