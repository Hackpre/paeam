import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import PaymentModal from './PaymentModal';
import type { Payment } from '../lib/types';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  CreditCard,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Shield,
} from 'lucide-react';

const BANK_DETAILS = {
  accountName: 'Producers & Audio Engineering Association of Malawi',
  accountNumber: '1014312125',
  bank: 'National Bank of Malawi',
  branch: 'Henderson Street Branch, Blantyre',
};

const MEMBERSHIP_FEE = 15000;
const LATE_RENEWAL_FEE = 18750;

function getStatusBadge(status: Payment['status']) {
  switch (status) {
    case 'completed': return { label: 'Completed', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
    case 'pending': return { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    case 'failed': return { label: 'Failed', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
    case 'processing': return { label: 'Processing', className: 'bg-gold-500/10 text-gold-400 border-gold-500/20' };
    case 'refunded': return { label: 'Refunded', className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' };
    case 'bank_transfer_pending': return { label: 'Pending Verification', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    default: return { label: 'Unknown', className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' };
  }
}

function getMembershipStatusBadge(status: string) {
  switch (status) {
    case 'trial': return { label: 'Free Trial', className: 'bg-gold-500/10 text-gold-400 border-gold-500/20' };
    case 'grace': return { label: 'Grace Period', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    case 'suspended': return { label: 'Suspended', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
    case 'active': return { label: 'Active', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
    case 'bank_transfer_pending': return { label: 'Pending Verification', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    default: return { label: 'Unknown', className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' };
  }
}

export default function Payment() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const membershipStatus = profile?.membership_status ?? 'trial';
  const isLateRenewal = membershipStatus === 'suspended';
  const amountDue = isLateRenewal ? LATE_RENEWAL_FEE : MEMBERSHIP_FEE;
  const statusBadge = getMembershipStatusBadge(membershipStatus);
  const needsPayment = membershipStatus !== 'active';

  useEffect(() => {
    loadPaymentHistory();
  }, [user]);

  async function loadPaymentHistory() {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPaymentHistory((data ?? []) as Payment[]);
    } catch (err) {
      console.error('Error loading payment history:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={amountDue}
        paymentType={isLateRenewal ? 'late_renewal' : 'membership'}
      />

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Membership Payment</h1>
        <p className="text-neutral-400 text-sm mt-1">PAEAM - Producers & Audio Engineering Association of Malawi</p>
      </div>

      {/* Payment Overview */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
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
            <p className="text-3xl font-bold text-gold-400">{formatCurrency(amountDue)}</p>
            {isLateRenewal && (
              <p className="text-xs text-red-400/80 mt-2">Includes 25% late fee after grace period</p>
            )}
          </div>

          {needsPayment && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="mt-4 w-full py-3 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" /> Pay Now
            </button>
          )}

          {membershipStatus === 'bank_transfer_pending' && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium text-sm">Bank Transfer Under Review</p>
                <p className="text-neutral-400 text-xs mt-1">Your proof of payment has been submitted and is being reviewed by an admin. You will receive an email confirmation once verified.</p>
              </div>
            </div>
          )}
        </div>

        {/* Bank Transfer Details (always visible for reference) */}
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-gold-400" />
            National Bank Transfer Details
          </h3>
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Account Name</p>
                <p className="text-sm text-white font-medium">{BANK_DETAILS.accountName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Account Number</p>
                <p className="text-sm text-white font-mono font-bold text-lg">{BANK_DETAILS.accountNumber}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Bank</p>
                <p className="text-sm text-white">{BANK_DETAILS.bank}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Branch</p>
                <p className="text-sm text-white">{BANK_DETAILS.branch}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Reference</p>
                <p className="text-sm text-gold-400 font-mono">{user?.email || 'your.email@example.com'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-700">
              <p className="text-xs text-neutral-400">
                After transfer, your account will be activated within 24 hours. You will receive email confirmation once payment is verified.
              </p>
            </div>
          </div>
        </div>

        {/* Membership Info */}
        <div className="p-6">
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
                <span>Mobile money payments processed securely via PayChangu</span>
              </div>
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
            {historyExpanded ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
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
                            {payment.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                              : payment.status === 'failed' ? <XCircle className="w-5 h-5 text-red-400" />
                              : payment.status === 'bank_transfer_pending' ? <Clock className="w-5 h-5 text-blue-400" />
                              : <Clock className="w-5 h-5 text-gold-400" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {payment.description || payment.payment_type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-neutral-500">{formatDate(payment.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-sm font-semibold text-gold-400">{formatCurrency(payment.amount)}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                      {(isCompleted || payment.status === 'bank_transfer_pending') && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedReceipt(prev => prev === payment.id ? null : payment.id)}
                            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {isReceiptOpen ? 'Hide Details' : 'View Details'}
                          </button>
                          {isReceiptOpen && (
                            <div className="mt-3 bg-neutral-800 rounded-xl p-4 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">Transaction ID</span>
                                <span className="text-neutral-300 font-mono">{payment.paychangu_tx_id || '--'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">Reference</span>
                                <span className="text-neutral-300 font-mono">{payment.paychangu_reference || '--'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">Amount</span>
                                <span className="text-gold-400 font-medium">{formatCurrency(payment.amount)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">Date</span>
                                <span className="text-neutral-300">{formatDate(payment.completed_at || payment.created_at)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">Method</span>
                                <span className="text-neutral-300 capitalize">{payment.payment_method.replace(/_/g, ' ') || '--'}</span>
                              </div>
                              {payment.admin_notes && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">Admin Notes</span>
                                  <span className="text-neutral-300">{payment.admin_notes}</span>
                                </div>
                              )}
                              {payment.proof_of_payment_url && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">Proof</span>
                                  <button
                                    onClick={async () => {
                                      const { data } = await supabase.storage
                                        .from('payment-proofs')
                                        .createSignedUrl(payment.proof_of_payment_url, 3600);
                                      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                    }}
                                    className="text-gold-400 hover:underline"
                                  >
                                    View Proof
                                  </button>
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
  );
}
