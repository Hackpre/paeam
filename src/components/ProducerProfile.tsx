import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { ProducerProfile } from '../lib/types';
import {
  User,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  Camera,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building2,
} from 'lucide-react';

export default function ProducerProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    full_legal_name: '',
    stage_name: '',
    national_id: '',
    phone_number: '',
    email: '',
    studio_address: '',
    association_membership_number: '',
    tax_id: '',
    bank_details_encrypted: '',
  });

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('producer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setForm({
          full_legal_name: data.full_legal_name,
          stage_name: data.stage_name,
          national_id: data.national_id ?? '',
          phone_number: data.phone_number,
          email: data.email,
          studio_address: data.studio_address,
          association_membership_number: data.association_membership_number ?? '',
          tax_id: data.tax_id ?? '',
          bank_details_encrypted: data.bank_details_encrypted ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      if (profile) {
        const { error } = await supabase
          .from('producer_profiles')
          .update({
            ...form,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        const { error } = await supabase.from('producer_profiles').insert({
          user_id: user.id,
          ...form,
        });

        if (error) throw error;
        setMessage({ type: 'success', text: 'Profile created successfully' });

        const { data } = await supabase
          .from('producer_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) setProfile(data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to save profile' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: <Clock size={14} />, label: 'Pending Verification', color: 'text-amber-400 bg-amber-500/10' },
    verified: { icon: <CheckCircle2 size={14} />, label: 'Verified', color: 'text-gold-400 bg-gold-500/10' },
    rejected: { icon: <XCircle size={14} />, label: 'Rejected', color: 'text-red-400 bg-red-500/10' },
    suspended: { icon: <XCircle size={14} />, label: 'Suspended', color: 'text-red-400 bg-red-500/10' },
  };

  const status = profile ? statusConfig[profile.association_verification_status] : null;

  const inputClass = 'w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-2xl font-bold text-neutral-950 relative">
            {form.stage_name ? form.stage_name.charAt(0).toUpperCase() : <User size={28} />}
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-700 border-2 border-neutral-900 flex items-center justify-center">
              <Camera size={10} className="text-neutral-300" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{form.stage_name || 'New Producer'}</h2>
            <p className="text-sm text-neutral-400">{form.full_legal_name || 'Enter your details below'}</p>
            {status && (
              <span className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                {status.icon} {status.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-gold-500/10 border border-gold-500/20 text-gold-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-gold-400" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Full Legal Name *</label>
              <input type="text" required value={form.full_legal_name}
                onChange={(e) => setForm({ ...form, full_legal_name: e.target.value })}
                className={inputClass} placeholder="John Banda" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Stage Name *</label>
              <input type="text" required value={form.stage_name}
                onChange={(e) => setForm({ ...form, stage_name: e.target.value })}
                className={inputClass} placeholder="DJ Malawi Beats" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">National ID</label>
              <input type="text" value={form.national_id}
                onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                className={inputClass} placeholder="MW-XXXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Tax ID</label>
              <input type="text" value={form.tax_id}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                className={inputClass} placeholder="TPIN-XXXXX" />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Phone size={20} className="text-blue-400" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                <Mail size={14} className="inline mr-1" /> Email *
              </label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass} placeholder="producer@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                <Phone size={14} className="inline mr-1" /> Phone Number *
              </label>
              <input type="tel" required value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className={inputClass} placeholder="+265 XXX XXX XXX" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                <MapPin size={14} className="inline mr-1" /> Studio Address
              </label>
              <input type="text" value={form.studio_address}
                onChange={(e) => setForm({ ...form, studio_address: e.target.value })}
                className={inputClass} placeholder="Blantyre, Malawi" />
            </div>
          </div>
        </div>

        {/* Association & Financial */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-amber-400" />
            Association & Financial
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                <FileText size={14} className="inline mr-1" /> Association Membership Number
              </label>
              <input type="text" value={form.association_membership_number}
                onChange={(e) => setForm({ ...form, association_membership_number: e.target.value })}
                className={inputClass} placeholder="PAM-XXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Bank Details (Encrypted)</label>
              <input type="password" value={form.bank_details_encrypted}
                onChange={(e) => setForm({ ...form, bank_details_encrypted: e.target.value })}
                className={inputClass} placeholder="Encrypted bank information" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-medium rounded-xl transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}
