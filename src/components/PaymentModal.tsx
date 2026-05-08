import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { formatCurrency } from '../lib/utils';
import {
  X,
  Smartphone,
  Building2,
  CreditCard,
  Loader2,
  Phone,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

type PaymentMethodOption = 'airtel_money' | 'tnm_mpamba' | 'national_bank';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount?: number;
  paymentType?: string;
}

const BANK_DETAILS = {
  accountName: 'Producers & Audio Engineering Association of Malawi',
  accountNumber: '1014312125',
  bank: 'National Bank of Malawi',
  branch: 'Henderson Street Branch, Blantyre',
};

const MEMBERSHIP_FEE = 15000;
const LATE_RENEWAL_FEE = 18750;

export default function PaymentModal({ isOpen, onClose, amount, paymentType }: PaymentModalProps) {
  const { user, session, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>('airtel_money');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isLateRenewal = profile?.membership_status === 'suspended';
  const amountDue = amount || (isLateRenewal ? LATE_RENEWAL_FEE : MEMBERSHIP_FEE);
  const type = paymentType || (isLateRenewal ? 'late_renewal' : 'membership');

  if (!isOpen) return null;

  function validatePhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('265')) return digits.length === 12;
    if (digits.startsWith('0')) return digits.length === 10;
    return digits.length >= 9 && digits.length <= 12;
  }

  async function handleMobileMoneyPay() {
    if (!session) {
      setError('You must be signed in to make a payment.');
      return;
    }
    if (!validatePhone(phoneNumber)) {
      setError('Please enter a valid Malawi phone number (e.g., 0999123456 or +265999123456).');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the terms to proceed.');
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
          payment_type: type,
          amount: amountDue,
          payment_method: selectedMethod,
          phone_number: phoneNumber,
          return_url: window.location.origin,
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
      setError(err.message || 'Network error. Please check your connection and try again.');
    } finally {
      setPaying(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, JPG, or PNG file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setError(null);
    setProofFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setProofPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  }

  async function handleBankTransferSubmit() {
    if (!session) {
      setError('You must be signed in.');
      return;
    }
    if (!proofFile) {
      setError('Please upload proof of payment (receipt or screenshot).');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the terms to proceed.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const ext = proofFile.name.split('.').pop() || 'pdf';
      const filePath = `${user!.id}/proof_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, proofFile, { upsert: false });

      if (uploadError) {
        throw new Error('Failed to upload proof: ' + uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      const proofUrl = urlData.publicUrl;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pay`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'bank_transfer',
          payment_type: type,
          amount: amountDue,
          proof_url: proofUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bank transfer submission failed.');
      }

      toast('success', 'Proof of payment submitted! Your account will be activated within 24 hours after verification.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit bank transfer proof.');
    } finally {
      setUploading(false);
    }
  }

  const methods: { id: PaymentMethodOption; label: string; icon: typeof Smartphone; description: string }[] = [
    { id: 'airtel_money', label: 'Airtel Money', icon: Smartphone, description: 'Pay via Airtel Money mobile wallet' },
    { id: 'tnm_mpamba', label: 'TNM Mpamba', icon: Smartphone, description: 'Pay via TNM Mpamba mobile wallet' },
    { id: 'national_bank', label: 'National Bank', icon: Building2, description: 'Pay via National Bank transfer' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-white">Complete Your Payment</h2>
            <p className="text-sm text-neutral-400 mt-1">PAEAM Membership Fee</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Amount Display */}
        <div className="px-6 pt-6">
          <div className="bg-neutral-800 rounded-xl p-5 text-center">
            <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1">
              {isLateRenewal ? 'Late Renewal Fee' : 'Annual Membership Fee'}
            </p>
            <p className="text-4xl font-bold text-gold-400">{formatCurrency(amountDue)}</p>
            {isLateRenewal && (
              <p className="text-xs text-red-400/80 mt-2">Includes 25% late fee after grace period</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="p-6 space-y-3">
          <h3 className="text-sm font-medium text-neutral-300">Select Payment Method</h3>
          {methods.map((method) => {
            const isSelected = selectedMethod === method.id;
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => { setSelectedMethod(method.id); setError(null); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-colors text-left ${
                  isSelected ? 'bg-gold-600/10 border-gold-600/40' : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-gold-500' : 'border-neutral-600'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-gold-600/20 text-gold-400' : 'bg-neutral-700 text-neutral-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isSelected ? 'text-gold-400' : 'text-neutral-300'}`}>
                    {method.label}
                  </p>
                  <p className="text-xs text-neutral-500">{method.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Money Phone Input */}
        {(selectedMethod === 'airtel_money' || selectedMethod === 'tnm_mpamba') && (
          <div className="px-6 pb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Phone size={14} className="inline mr-1.5" />
              Phone Number ({selectedMethod === 'airtel_money' ? 'Airtel Money' : 'TNM Mpamba'})
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setError(null); }}
              placeholder="0999123456"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 transition-all"
            />
            <p className="text-xs text-neutral-500 mt-2">
              Enter the phone number linked to your {selectedMethod === 'airtel_money' ? 'Airtel Money' : 'TNM Mpamba'} account
            </p>
          </div>
        )}

        {/* National Bank Transfer Details */}
        {selectedMethod === 'national_bank' && (
          <div className="px-6 pb-4 space-y-4">
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gold-400 mb-4 flex items-center gap-2">
                <Building2 size={16} />
                National Bank Transfer Details
              </h4>
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

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Upload size={14} className="inline mr-1.5" />
                Upload Proof of Payment
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-gold-600/50 transition-colors"
              >
                {proofFile ? (
                  <div className="space-y-2">
                    {proofPreview ? (
                      <img src={proofPreview} alt="Proof preview" className="max-h-32 mx-auto rounded-lg" />
                    ) : (
                      <FileText className="w-10 h-10 text-gold-400 mx-auto" />
                    )}
                    <p className="text-sm text-neutral-300">{proofFile.name}</p>
                    <p className="text-xs text-neutral-500">{(proofFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-neutral-500 mx-auto" />
                    <p className="text-sm text-neutral-400">Click to upload proof of payment</p>
                    <p className="text-xs text-neutral-500">PDF, JPG, or PNG (max 5MB)</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Terms Checkbox */}
        <div className="px-6 pb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-gold-600 focus:ring-gold-500 focus:ring-offset-0"
            />
            <span className="text-xs text-neutral-400">
              I confirm this payment is for PAEAM membership and agree to the association's terms and conditions.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-2 space-y-3 border-t border-neutral-800">
          {selectedMethod === 'national_bank' ? (
            <button
              onClick={handleBankTransferSubmit}
              disabled={uploading || !proofFile || !termsAccepted}
              className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Submit Proof of Payment</>
              )}
            </button>
          ) : (
            <button
              onClick={handleMobileMoneyPay}
              disabled={paying || !termsAccepted}
              className="w-full py-3 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {paying ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="w-5 h-5" /> Pay {formatCurrency(amountDue)}</>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-300 font-medium rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
