import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { ProducerProfile } from '../lib/types';
import { formatDate, getMembershipBadge, generateContentHash } from '../lib/utils';
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
  Shield,
  Pencil,
  Upload,
  Hash,
  Info,
  Ban,
  Fingerprint,
  X,
} from 'lucide-react';

interface FormState {
  full_legal_name: string;
  stage_name: string;
  national_id: string;
  phone_number: string;
  email: string;
  studio_address: string;
  tax_id: string;
  bank_name: string;
  bank_details_encrypted: string;
  ipi_number: string;
  association_membership_number: string;
}

type DocType = 'national_id' | 'proof_of_address' | 'membership_proof' | 'tax_clearance';

interface UploadedDoc {
  name: string;
  url: string;
  type: DocType;
  uploaded_at: string;
}

const DOC_LABELS: Record<DocType, string> = {
  national_id: 'National ID',
  proof_of_address: 'Proof of Address',
  membership_proof: 'Membership Proof',
  tax_clearance: 'Tax Clearance',
};

const DOC_ICONS: Record<DocType, typeof FileText> = {
  national_id: FileText,
  proof_of_address: MapPin,
  membership_proof: Shield,
  tax_clearance: Building2,
};

function VerificationBadge({ status }: { status: ProducerProfile['association_verification_status'] }) {
  const config = {
    pending: { icon: Clock, label: 'Pending Verification', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    verified: { icon: CheckCircle2, label: 'Verified', color: 'text-gold-400 bg-gold-500/10 border-gold-500/20' },
    rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    suspended: { icon: Ban, label: 'Suspended', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  };
  const { icon: Icon, label, color } = config[status] ?? config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

function Tooltip({ text, visible, onClose }: { text: string; visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-neutral-300 shadow-xl">
      <button onClick={onClose} className="absolute top-1.5 right-1.5 text-neutral-500 hover:text-white">
        <X size={12} />
      </button>
      {text}
      <div className="absolute top-full left-4 w-2 h-2 bg-neutral-800 border-l border-b border-neutral-700 rotate-45 -translate-y-1" />
    </div>
  );
}

export default function ProducerProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showIpiTooltip, setShowIpiTooltip] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<DocType | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [signatureHash, setSignatureHash] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    full_legal_name: '',
    stage_name: '',
    national_id: '',
    phone_number: '',
    email: '',
    studio_address: '',
    tax_id: '',
    bank_name: '',
    bank_details_encrypted: '',
    ipi_number: '',
    association_membership_number: '',
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('producer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setForm({
        full_legal_name: data.full_legal_name ?? '',
        stage_name: data.stage_name ?? '',
        national_id: data.national_id ?? '',
        phone_number: data.phone_number ?? '',
        email: data.email ?? user.email ?? '',
        studio_address: data.studio_address ?? '',
        tax_id: data.tax_id ?? '',
        bank_name: data.bank_name ?? '',
        bank_details_encrypted: data.bank_details_encrypted ?? '',
        ipi_number: data.ipi_number ?? '',
        association_membership_number: data.association_membership_number ?? '',
      });

      // Load uploaded documents
      if (data.document_urls && data.document_urls.length > 0) {
        const docs: UploadedDoc[] = data.document_urls.map((url: string) => {
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1] || 'document';
          const typeMatch = fileName.match(/^(national_id|proof_of_address|membership_proof|tax_clearance)/);
          const docType: DocType = (typeMatch ? typeMatch[1] : 'national_id') as DocType;
          return { name: fileName, url, type: docType, uploaded_at: data.updated_at };
        });
        setUploadedDocs(docs);
      }

      // Load existing signature
      if (data.digital_signature) {
        setSignatureHash(data.digital_signature);
      }
    } else {
      setForm(prev => ({ ...prev, email: user.email ?? '' }));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
            full_legal_name: form.full_legal_name,
            stage_name: form.stage_name,
            national_id: form.national_id || null,
            phone_number: form.phone_number,
            email: form.email,
            studio_address: form.studio_address,
            tax_id: form.tax_id || null,
            bank_name: form.bank_name,
            bank_details_encrypted: form.bank_details_encrypted,
            ipi_number: form.ipi_number || null,
            association_membership_number: form.association_membership_number || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        const { error: profileError } = await supabase.from('producer_profiles').insert({
          user_id: user.id,
          full_legal_name: form.full_legal_name,
          stage_name: form.stage_name,
          national_id: form.national_id || null,
          phone_number: form.phone_number,
          email: form.email,
          studio_address: form.studio_address,
          tax_id: form.tax_id || null,
          bank_name: form.bank_name,
          bank_details_encrypted: form.bank_details_encrypted,
          ipi_number: form.ipi_number || null,
          association_membership_number: form.association_membership_number || null,
          document_urls: [],
          association_verification_status: 'pending',
          membership_status: 'trial',
        });

        if (profileError) throw profileError;

        // Insert producer role into user_roles
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: user.id,
          role: 'producer',
        });

        if (roleError) {
          // Role may already exist, not a critical error
          console.warn('Could not assign producer role:', roleError.message);
        }

        setMessage({ type: 'success', text: 'Producer profile created successfully' });
      }

      await refreshProfile();
      await loadProfile();
      setEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to save profile' });
    }

    setSaving(false);
  };

  const handleDocumentUpload = async (docType: DocType, file: File) => {
    if (!user || !profile) return;
    setUploading(true);
    setUploadingDoc(docType);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${docType}/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('producer-docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('producer-docs')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const existingUrls = profile.document_urls ?? [];
      const updatedUrls = [...existingUrls, publicUrl];

      const { error: updateError } = await supabase
        .from('producer_profiles')
        .update({ document_urls: updatedUrls, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setUploadedDocs(prev => [
        ...prev,
        { name: file.name, url: publicUrl, type: docType, uploaded_at: new Date().toISOString() },
      ]);

      setProfile(prev => prev ? { ...prev, document_urls: updatedUrls } : prev);
      setMessage({ type: 'success', text: `${DOC_LABELS[docType]} uploaded successfully` });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to upload document' });
    }

    setUploading(false);
    setUploadingDoc(null);
  };

  const handleGenerateSignature = async () => {
    if (!profile) return;
    const dataString = JSON.stringify({
      full_legal_name: form.full_legal_name,
      stage_name: form.stage_name,
      national_id: form.national_id,
      user_id: profile.user_id,
      created_at: profile.created_at,
      timestamp: new Date().toISOString(),
    });
    const hash = await generateContentHash(dataString);
    setSignatureHash(hash);

    try {
      const { error } = await supabase
        .from('producer_profiles')
        .update({ digital_signature: hash, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, digital_signature: hash } : prev);
      setMessage({ type: 'success', text: 'Digital signature generated and stored' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to store signature' });
    }
  };

  const handleRequestIPI = async () => {
    if (!profile || !user) return;
    try {
      const { error } = await supabase.from('ipi_applications').insert({
        producer_id: profile.id,
        requested_by: user.id,
        status: 'pending',
        notes: 'Requested via producer profile page',
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'IPI number request submitted. PAEAM will review your application.' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Failed to request IPI number' });
    }
  };

  const triggerFileInput = (docType: DocType) => {
    setUploadingDoc(docType);
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDoc) {
      handleDocumentUpload(uploadingDoc, file);
    }
    e.target.value = '';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-600/50 focus:border-gold-600 transition-all';
  const labelClass = 'block text-sm font-medium text-neutral-300 mb-1.5';
  const sectionClass = 'bg-neutral-900 border border-neutral-800 rounded-2xl p-6';
  const sectionTitleClass = 'text-lg font-semibold text-white mb-4 flex items-center gap-2';

  const hasProfile = !!profile;

  const membership = hasProfile ? getMembershipBadge(profile.membership_status) : null;

  // ── Create Profile Mode ──
  if (!hasProfile) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center mx-auto mb-4">
            <User size={36} className="text-neutral-950" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Producer Profile</h1>
          <p className="text-neutral-400 mt-1">Register with PAEAM to manage your catalog and royalties</p>
        </div>

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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Information */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <User size={20} className="text-gold-400" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Legal Name *</label>
                <input type="text" required value={form.full_legal_name}
                  onChange={(e) => setForm({ ...form, full_legal_name: e.target.value })}
                  className={inputClass} placeholder="John Banda" />
              </div>
              <div>
                <label className={labelClass}>Stage Name *</label>
                <input type="text" required value={form.stage_name}
                  onChange={(e) => setForm({ ...form, stage_name: e.target.value })}
                  className={inputClass} placeholder="DJ Malawi Beats" />
              </div>
              <div>
                <label className={labelClass}>National ID *</label>
                <input type="text" required value={form.national_id}
                  onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                  className={inputClass} placeholder="MW-XXXXXXXX" />
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input type="tel" required value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  className={inputClass} placeholder="+265 XXX XXX XXX" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <Phone size={20} className="text-gold-400" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass} placeholder="producer@example.com" />
              </div>
              <div>
                <label className={labelClass}>Studio Address</label>
                <input type="text" value={form.studio_address}
                  onChange={(e) => setForm({ ...form, studio_address: e.target.value })}
                  className={inputClass} placeholder="Blantyre, Malawi" />
              </div>
            </div>
          </div>

          {/* Financial & Association */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <Building2 size={20} className="text-gold-400" />
              Financial and Association
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tax ID</label>
                <input type="text" value={form.tax_id}
                  onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                  className={inputClass} placeholder="TPIN-XXXXX" />
              </div>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input type="text" value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className={inputClass} placeholder="National Bank of Malawi" />
              </div>
              <div>
                <label className={labelClass}>Bank Account Details</label>
                <input type="password" value={form.bank_details_encrypted}
                  onChange={(e) => setForm({ ...form, bank_details_encrypted: e.target.value })}
                  className={inputClass} placeholder="Encrypted bank information" />
              </div>
              <div className="relative">
                <label className={labelClass}>
                  IPI Number
                  <button
                    type="button"
                    onClick={() => setShowIpiTooltip(!showIpiTooltip)}
                    className="ml-1.5 inline-flex items-center text-neutral-500 hover:text-gold-400"
                  >
                    <Info size={14} />
                  </button>
                </label>
                <Tooltip
                  text="The Interested Party Number (IPI) is assigned by COSOMA (Copyright Society of Malawi) to identify you as a rights holder for royalty collection. This is optional at registration and can be requested later."
                  visible={showIpiTooltip}
                  onClose={() => setShowIpiTooltip(false)}
                />
                <input type="text" value={form.ipi_number}
                  onChange={(e) => setForm({ ...form, ipi_number: e.target.value })}
                  className={inputClass} placeholder="IPI-XXXXXXXXXX (optional)" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Creating...' : 'Create Producer Profile'}
          </button>
        </form>
      </div>
    );
  }

  // ── View / Edit Profile Mode ──
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onFileChange}
      />

      {/* Profile Header Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-3xl font-bold text-neutral-950 shadow-lg shadow-gold-500/20">
              {profile.stage_name ? profile.stage_name.charAt(0).toUpperCase() : <User size={36} />}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neutral-700 border-2 border-neutral-900 flex items-center justify-center hover:bg-neutral-600 transition-colors">
              <Camera size={12} className="text-neutral-300" />
            </button>
          </div>

          {/* Name & Badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{profile.stage_name}</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{profile.full_legal_name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <VerificationBadge status={profile.association_verification_status} />
              {membership && (
                <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${membership.color} border-current/20`}>
                  {membership.label}
                </span>
              )}
            </div>
          </div>

          {/* Edit Button */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-300 hover:text-white hover:border-gold-600 transition-all"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </div>

        {/* IPI Number Row */}
        <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Hash size={16} className="text-gold-400" />
            <span className="text-neutral-400">IPI Number:</span>
            {profile.ipi_number ? (
              <span className="text-white font-mono font-medium">{profile.ipi_number}</span>
            ) : (
              <span className="text-neutral-500 italic">Not assigned</span>
            )}
          </div>
          {!profile.ipi_number && (
            <button
              onClick={handleRequestIPI}
              className="text-xs font-medium px-3 py-1.5 bg-gold-600/10 border border-gold-600/20 text-gold-400 rounded-lg hover:bg-gold-600/20 transition-all"
            >
              Request IPI
            </button>
          )}
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-gold-500/10 border border-gold-500/20 text-gold-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-50 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Information */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <User size={20} className="text-gold-400" />
            Personal Information
            {editing && <span className="text-xs text-gold-400 font-normal ml-auto">Editing</span>}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Legal Name</label>
              {editing ? (
                <input type="text" required value={form.full_legal_name}
                  onChange={(e) => setForm({ ...form, full_legal_name: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white">{profile.full_legal_name || '---'}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Stage Name</label>
              {editing ? (
                <input type="text" required value={form.stage_name}
                  onChange={(e) => setForm({ ...form, stage_name: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white">{profile.stage_name || '---'}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>National ID</label>
              {editing ? (
                <input type="text" value={form.national_id}
                  onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white font-mono">{profile.national_id || '---'}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              {editing ? (
                <input type="tel" required value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white flex items-center gap-2">
                  <Phone size={14} className="text-neutral-500" />
                  {profile.phone_number || '---'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <Mail size={20} className="text-gold-400" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              {editing ? (
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white flex items-center gap-2">
                  <Mail size={14} className="text-neutral-500" />
                  {profile.email || '---'}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Studio Address</label>
              {editing ? (
                <input type="text" value={form.studio_address}
                  onChange={(e) => setForm({ ...form, studio_address: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white flex items-center gap-2">
                  <MapPin size={14} className="text-neutral-500" />
                  {profile.studio_address || '---'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Financial and Association */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <Building2 size={20} className="text-gold-400" />
            Financial and Association
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tax ID</label>
              {editing ? (
                <input type="text" value={form.tax_id}
                  onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white font-mono">{profile.tax_id || '---'}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Bank Name</label>
              {editing ? (
                <input type="text" value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white">{profile.bank_name || '---'}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Bank Account Details</label>
              {editing ? (
                <input type="password" value={form.bank_details_encrypted}
                  onChange={(e) => setForm({ ...form, bank_details_encrypted: e.target.value })}
                  className={inputClass} placeholder="Update bank details" />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-neutral-500 italic">Encrypted on file</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Association Membership Number</label>
              {editing ? (
                <input type="text" value={form.association_membership_number}
                  onChange={(e) => setForm({ ...form, association_membership_number: e.target.value })}
                  className={inputClass} />
              ) : (
                <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white font-mono">{profile.association_membership_number || '---'}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Membership Status</label>
              <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white">
                {membership ? <span className={membership.color.split(' ')[0]}>{membership.label}</span> : '---'}
              </p>
            </div>
            <div>
              <label className={labelClass}>Membership Expires</label>
              <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white">{formatDate(profile.membership_expires_at)}</p>
            </div>
          </div>
        </div>

        {/* Document Upload Section */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <Upload size={20} className="text-gold-400" />
            Document Uploads
          </h3>
          <p className="text-sm text-neutral-400 mb-4">
            Upload required documents for verification. Accepted formats: PDF, JPG, PNG.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['national_id', 'proof_of_address', 'membership_proof', 'tax_clearance'] as DocType[]).map((docType) => {
              const Icon = DOC_ICONS[docType];
              const existingDoc = uploadedDocs.find(d => d.type === docType);
              const isUploading = uploadingDoc === docType && uploading;

              return (
                <div key={docType} className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-gold-400" />
                      <span className="text-sm font-medium text-white">{DOC_LABELS[docType]}</span>
                    </div>
                    {existingDoc && (
                      <CheckCircle2 size={16} className="text-gold-400" />
                    )}
                  </div>
                  {existingDoc ? (
                    <div className="text-xs text-neutral-400 mb-2">
                      Uploaded: {formatDate(existingDoc.uploaded_at)}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 mb-2">No document uploaded</div>
                  )}
                  <button
                    type="button"
                    onClick={() => triggerFileInput(docType)}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-300 hover:text-white hover:border-gold-600 transition-all disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {isUploading ? 'Uploading...' : existingDoc ? 'Replace' : 'Upload'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Digital Signature Section */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <Fingerprint size={20} className="text-gold-400" />
            Digital Signature
          </h3>
          <p className="text-sm text-neutral-400 mb-4">
            Generate a unique digital signature hash from your profile data. This acts as a cryptographic fingerprint of your identity.
          </p>
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
            {signatureHash ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gold-400" />
                  <span className="text-sm font-medium text-white">Signature Generated</span>
                </div>
                <p className="text-xs font-mono text-neutral-400 break-all leading-relaxed bg-neutral-950 rounded-lg p-3 border border-neutral-700">
                  {signatureHash}
                </p>
                <p className="text-xs text-neutral-500">
                  Generated on {formatDate(profile.updated_at)} -- SHA-256 hash of profile data
                </p>
                <button
                  type="button"
                  onClick={handleGenerateSignature}
                  className="mt-2 flex items-center gap-2 px-4 py-2 text-xs font-medium bg-gold-600/10 border border-gold-600/20 text-gold-400 rounded-lg hover:bg-gold-600/20 transition-all"
                >
                  <Hash size={14} />
                  Regenerate Signature
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Fingerprint size={32} className="text-neutral-600 mx-auto mb-3" />
                <p className="text-sm text-neutral-400 mb-3">No digital signature on file</p>
                <button
                  type="button"
                  onClick={handleGenerateSignature}
                  className="flex items-center gap-2 mx-auto px-4 py-2 text-sm font-medium bg-gold-600/10 border border-gold-600/20 text-gold-400 rounded-lg hover:bg-gold-600/20 transition-all"
                >
                  <Hash size={16} />
                  Generate Signature
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Metadata */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <Clock size={20} className="text-gold-400" />
            Record Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Created</label>
              <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white text-sm">{formatDate(profile.created_at)}</p>
            </div>
            <div>
              <label className={labelClass}>Last Updated</label>
              <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white text-sm">{formatDate(profile.updated_at)}</p>
            </div>
            <div>
              <label className={labelClass}>Verified On</label>
              <p className="px-4 py-2.5 bg-neutral-800/50 rounded-xl text-white text-sm">{formatDate(profile.verified_at)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Edit Mode) */}
        {editing && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm({
                  full_legal_name: profile.full_legal_name ?? '',
                  stage_name: profile.stage_name ?? '',
                  national_id: profile.national_id ?? '',
                  phone_number: profile.phone_number ?? '',
                  email: profile.email ?? '',
                  studio_address: profile.studio_address ?? '',
                  tax_id: profile.tax_id ?? '',
                  bank_name: profile.bank_name ?? '',
                  bank_details_encrypted: profile.bank_details_encrypted ?? '',
                  ipi_number: profile.ipi_number ?? '',
                  association_membership_number: profile.association_membership_number ?? '',
                });
                setMessage(null);
              }}
              className="px-6 py-3 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl hover:text-white hover:border-neutral-600 transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
