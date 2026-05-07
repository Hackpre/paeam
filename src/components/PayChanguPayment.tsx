import { useState } from 'react';
import { X, Smartphone, Building, Loader2, CheckCircle } from 'lucide-react';

interface PayChanguPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  email: string;
  phone: string;
  fullName: string;
  onSuccess: () => void;
}

export default function PayChanguPayment({ 
  isOpen, 
  onClose, 
  amount, 
  email, 
  phone, 
  fullName, 
  onSuccess 
}: PayChanguPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'airtel' | 'mpamba' | 'bank' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Pay Annual Membership Fee</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {showSuccess ? (
            <div className="text-center py-8">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-neutral-400">Your membership has been activated.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-neutral-400 text-sm mb-2">Amount to Pay</p>
                <p className="text-3xl font-bold text-gold-500">{amount.toLocaleString()} MWK</p>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-white text-sm font-semibold mb-2">Select Payment Method</p>
                
                <button
                  onClick={() => setPaymentMethod('airtel')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-red-500" />
                    <span className="text-white">Airtel Money</span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('mpamba')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-green-500" />
                    <span className="text-white">MPamba</span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('bank')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <Building size={20} className="text-blue-500" />
                    <span className="text-white">National Bank</span>
                  </div>
                </button>

                <button
                  onClick={() => { onSuccess(); onClose(); }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📝</span>
                    <span className="text-white">Pay Later (Manual)</span>
                  </div>
                </button>
              </div>

              <button
                onClick={handlePayment}
                disabled={!paymentMethod || loading}
                className="w-full py-3 bg-gradient-to-r from-gold-600 to-gold-700 text-neutral-950 font-semibold rounded-xl disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Pay ${amount.toLocaleString()} MWK`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
