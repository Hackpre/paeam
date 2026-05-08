import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Contract, ContractTemplate, RoyaltySplit, CatalogEntry } from '../lib/types';
import { generateContentHash, formatDate } from '../lib/utils';
import {
  FileText,
  Plus,
  X,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Percent,
  Globe,
  Clock,
  PenTool,
  ChevronDown,
  ChevronUp,
  Shield,
  UserPlus,
  Trash2,
  Copy,
  RefreshCw,
} from 'lucide-react';

const CONTRACT_TYPES = ['exclusive', 'non-exclusive', 'work-for-hire', 'licensing', 'distribution'] as const;
const TERRITORIES = ['Worldwide', 'Africa', 'SADC', 'Malawi', 'Custom'] as const;
const RECIPIENT_ROLES = ['producer', 'artist', 'songwriter', 'publisher', 'other'] as const;
const RENEWAL_OPTIONS = ['none', 'auto', 'manual'] as const;

interface RoyaltyRecipient {
  name: string;
  role: typeof RECIPIENT_ROLES[number];
  percentage: number;
}

const emptyRecipient = (): RoyaltyRecipient => ({ name: '', role: 'producer', percentage: 0 });

const initialForm = {
  catalog_entry_id: '',
  contract_type: 'exclusive' as Contract['contract_type'],
  royalty_percentage: 0,
  mechanical_rights_pct: 0,
  performance_rights_pct: 0,
  publishing_split_pct: 0,
  sync_rights_pct: 0,
  agreement_duration_months: 12,
  territory: 'Malawi',
  custom_territory: '',
  payment_schedule: '',
  renewal_option: 'none' as Contract['renewal_option'],
  template_id: '',
};

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<(Contract & { song_title: string })[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [royaltySplits, setRoyaltySplits] = useState<Record<string, RoyaltySplit[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({ ...initialForm });
  const [recipients, setRecipients] = useState<RoyaltyRecipient[]>([emptyRecipient()]);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    const { data: prof } = await supabase
      .from('producer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (prof) {
      const { data: catData } = await supabase
        .from('catalog_entries')
        .select('*')
        .eq('producer_id', prof.id)
        .order('created_at', { ascending: false });
      setCatalog(catData ?? []);

      const { data: tmplData } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setTemplates(tmplData ?? []);

      if (catData && catData.length > 0) {
        const { data: conData } = await supabase
          .from('contracts')
          .select('*')
          .in('catalog_entry_id', catData.map((c: CatalogEntry) => c.id))
          .order('created_at', { ascending: false });

        const enriched = (conData ?? []).map((c: Contract) => {
          const cat = catData.find((e: CatalogEntry) => e.id === c.catalog_entry_id);
          return { ...c, song_title: cat?.song_title ?? 'Unknown' };
        });
        setContracts(enriched);

        const splitsMap: Record<string, RoyaltySplit[]> = {};
        for (const c of enriched) {
          const { data: splits } = await supabase
            .from('royalty_splits')
            .select('*')
            .eq('contract_id', c.id)
            .order('created_at', { ascending: true });
          if (splits && splits.length > 0) {
            splitsMap[c.id] = splits;
          }
        }
        setRoyaltySplits(splitsMap);
      }
    }
    setLoading(false);
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setForm((prev) => ({ ...prev, template_id: '' }));
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const content = template.template_content;
    setForm((prev) => ({
      ...prev,
      template_id: templateId,
      contract_type: (content.contract_type as Contract['contract_type']) || prev.contract_type,
      royalty_percentage: (content.royalty_percentage as number) ?? prev.royalty_percentage,
      mechanical_rights_pct: (content.mechanical_rights_pct as number) ?? prev.mechanical_rights_pct,
      performance_rights_pct: (content.performance_rights_pct as number) ?? prev.performance_rights_pct,
      publishing_split_pct: (content.publishing_split_pct as number) ?? prev.publishing_split_pct,
      sync_rights_pct: (content.sync_rights_pct as number) ?? prev.sync_rights_pct,
      agreement_duration_months: (content.agreement_duration_months as number) ?? prev.agreement_duration_months,
      territory: (content.territory as string) ?? prev.territory,
      payment_schedule: (content.payment_schedule as string) ?? prev.payment_schedule,
      renewal_option: (content.renewal_option as Contract['renewal_option']) ?? prev.renewal_option,
    }));

    if (content.recipients && Array.isArray(content.recipients)) {
      setRecipients(
        (content.recipients as RoyaltyRecipient[]).map((r) => ({
          name: r.name || '',
          role: r.role || 'producer',
          percentage: r.percentage || 0,
        }))
      );
    }
  };

  const totalRoyaltyPct =
    form.royalty_percentage +
    form.mechanical_rights_pct +
    form.performance_rights_pct +
    form.publishing_split_pct +
    form.sync_rights_pct;

  const totalRecipientPct = recipients.reduce((sum, r) => sum + r.percentage, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (totalRoyaltyPct !== 100) {
      setMessage({ type: 'error', text: `Royalty splits must total 100%. Currently: ${totalRoyaltyPct}%` });
      setSaving(false);
      return;
    }

    if (recipients.length > 0 && totalRecipientPct !== 100) {
      setMessage({ type: 'error', text: `Recipient percentages must total 100%. Currently: ${totalRecipientPct}%` });
      setSaving(false);
      return;
    }

    try {
      const territoryValue = form.territory === 'Custom' ? form.custom_territory : form.territory;
      const contentData = JSON.stringify({ ...form, territory: territoryValue, recipients });
      const hash = await generateContentHash(contentData);

      const { data: contractData, error } = await supabase
        .from('contracts')
        .insert({
          catalog_entry_id: form.catalog_entry_id,
          contract_type: form.contract_type,
          royalty_percentage: form.royalty_percentage,
          mechanical_rights_pct: form.mechanical_rights_pct,
          performance_rights_pct: form.performance_rights_pct,
          publishing_split_pct: form.publishing_split_pct,
          sync_rights_pct: form.sync_rights_pct,
          agreement_duration_months: form.agreement_duration_months,
          territory: territoryValue,
          payment_schedule: form.payment_schedule,
          renewal_option: form.renewal_option,
          template_id: form.template_id || null,
          content_hash: hash,
        })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_id: user?.id || '',
        action: 'create',
        record_type: 'contract',
        record_id: contractData?.id || '',
        new_data: { contract_type: form.contract_type, territory: territoryValue, royalty_percentage: form.royalty_percentage },
      });

      if (contractData && recipients.length > 0) {
        const splitInserts = recipients
          .filter((r) => r.name.trim() !== '')
          .map((r) => ({
            contract_id: contractData.id,
            recipient_name: r.name,
            recipient_role: r.role,
            percentage: r.percentage,
          }));

        if (splitInserts.length > 0) {
          const { error: splitError } = await supabase.from('royalty_splits').insert(splitInserts);
          if (splitError) throw splitError;
        }
      }

      setMessage({ type: 'success', text: 'Contract created successfully' });
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setForm({ ...initialForm });
    setRecipients([emptyRecipient()]);
    setSelectedTemplateId('');
  };

  const handleInitiateLock = async (contractId: string) => {
    try {
      await supabase.from('lock_approvals').insert({
        record_type: 'contract',
        record_id: contractId,
        producer_approved: true,
        producer_approved_at: new Date().toISOString(),
        producer_approval_hash: await generateContentHash(contractId + 'producer'),
      });
      setMessage({ type: 'success', text: 'Lock request initiated for contract. Awaiting artist and association approval.' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, emptyRecipient()]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: keyof RoyaltyRecipient, value: string | number) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const approvalBadge = (status: Contract['approval_status'], rejectionReason?: string) => {
    switch (status) {
      case 'locked':
        return (
          <span className="flex items-center gap-1 text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-1 rounded-full">
            <Lock size={12} /> Locked - Immutable
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full" title={rejectionReason}>
            <XCircle size={12} /> Rejected by Admin
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
            <Clock size={12} /> Pending Admin Approval
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600 transition-all';
  const selectClass = 'w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600';
  const smallInputClass = 'w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600 transition-all';
  const smallSelectClass = 'w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600';

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.type === 'success'
            ? 'bg-gold-500/10 border border-gold-500/20 text-gold-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Contracts & Royalties</h2>
          <p className="text-sm text-neutral-400">{contracts.length} contracts registered</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-medium rounded-xl transition-colors"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'New Contract'}
        </button>
      </div>

      {/* New Contract Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <PenTool size={20} className="text-gold-400" />
            New Contract
          </h3>

          {/* Contract Templates */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Contract Templates</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(selectedTemplateId === tmpl.id ? '' : tmpl.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-gold-500/10 border-gold-600 ring-1 ring-gold-500/30'
                        : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Copy size={14} className={selectedTemplateId === tmpl.id ? 'text-gold-400' : 'text-neutral-500'} />
                      <p className="text-sm font-medium text-white truncate">{tmpl.name}</p>
                    </div>
                    <p className="text-xs text-neutral-500 capitalize">{tmpl.contract_type.replace('-', ' ')}</p>
                    {tmpl.description && (
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{tmpl.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Catalog Entry & Contract Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Catalog Entry *</label>
              <select
                required
                value={form.catalog_entry_id}
                onChange={(e) => setForm({ ...form, catalog_entry_id: e.target.value })}
                className={selectClass}
              >
                <option value="">Select a song</option>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>{c.song_title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Contract Type *</label>
              <select
                value={form.contract_type}
                onChange={(e) => setForm({ ...form, contract_type: e.target.value as Contract['contract_type'] })}
                className={selectClass}
              >
                {CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Royalty Splits */}
          <div className="bg-neutral-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Percent size={16} className="text-gold-400" />
              Royalty Splits (%)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { key: 'royalty_percentage', label: 'Royalty %' },
                { key: 'mechanical_rights_pct', label: 'Mechanical %' },
                { key: 'performance_rights_pct', label: 'Performance %' },
                { key: 'publishing_split_pct', label: 'Publishing %' },
                { key: 'sync_rights_pct', label: 'Sync %' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-neutral-400 mb-1">{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(form as unknown as Record<string, number>)[key] || ''}
                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                    className={smallInputClass}
                  />
                </div>
              ))}
            </div>
            <div className={`mt-2 text-xs font-medium ${totalRoyaltyPct === 100 ? 'text-green-400' : 'text-red-400'}`}>
              Total: {totalRoyaltyPct}%{totalRoyaltyPct !== 100 && ' (must equal 100%)'}
            </div>
          </div>

          {/* Royalty Split Recipients */}
          <div className="bg-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserPlus size={16} className="text-gold-400" />
                Royalty Split Recipients
              </h4>
              <button
                type="button"
                onClick={addRecipient}
                className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors"
              >
                <Plus size={14} /> Add Recipient
              </button>
            </div>

            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-neutral-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={recipient.name}
                      onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      placeholder="Recipient name"
                      className={smallInputClass}
                    />
                  </div>
                  <div className="w-36">
                    <label className="block text-xs text-neutral-400 mb-1">Role</label>
                    <select
                      value={recipient.role}
                      onChange={(e) => updateRecipient(index, 'role', e.target.value)}
                      className={smallSelectClass}
                    >
                      {RECIPIENT_ROLES.map((r) => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-neutral-400 mb-1">%</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={recipient.percentage || ''}
                      onChange={(e) => updateRecipient(index, 'percentage', parseFloat(e.target.value) || 0)}
                      className={smallInputClass}
                    />
                  </div>
                  {recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecipient(index)}
                      className="p-2 text-neutral-500 hover:text-red-400 transition-colors mb-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {recipients.length > 0 && (
              <div className={`mt-2 text-xs font-medium ${totalRecipientPct === 100 ? 'text-green-400' : 'text-red-400'}`}>
                Recipient Total: {totalRecipientPct}%{totalRecipientPct !== 100 && ' (must equal 100%)'}
              </div>
            )}
          </div>

          {/* Duration, Territory, Payment, Renewal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Agreement Duration (months)</label>
              <input
                type="number"
                min="1"
                value={form.agreement_duration_months || ''}
                onChange={(e) => setForm({ ...form, agreement_duration_months: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Territory</label>
              <select
                value={form.territory}
                onChange={(e) => setForm({ ...form, territory: e.target.value })}
                className={selectClass}
              >
                {TERRITORIES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {form.territory === 'Custom' && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Custom Territory</label>
                <input
                  type="text"
                  value={form.custom_territory}
                  onChange={(e) => setForm({ ...form, custom_territory: e.target.value })}
                  placeholder="Specify territory scope"
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Payment Schedule</label>
              <input
                type="text"
                value={form.payment_schedule}
                onChange={(e) => setForm({ ...form, payment_schedule: e.target.value })}
                placeholder="Monthly, Quarterly, etc."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Renewal Option</label>
              <select
                value={form.renewal_option}
                onChange={(e) => setForm({ ...form, renewal_option: e.target.value as Contract['renewal_option'] })}
                className={selectClass}
              >
                {RENEWAL_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? 'Creating Contract...' : 'Create Contract'}
          </button>
        </form>
      )}

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-semibold text-white mb-2">No contracts yet</h3>
          <p className="text-neutral-400">Create a contract for one of your catalog entries.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              {/* Card Header */}
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}
                className="w-full flex items-center gap-4 p-5 hover:bg-neutral-800/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-700/20 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{contract.song_title}</p>
                  <p className="text-sm text-neutral-400 capitalize">{contract.contract_type.replace(/-/g, ' ')} Agreement</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {approvalBadge(contract.approval_status, contract.rejection_reason)}
                  {contract.is_locked && contract.approval_status !== 'locked' && (
                    <span className="flex items-center gap-1 text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-full">
                      <Lock size={12} /> Locked
                    </span>
                  )}
                  {!contract.is_locked && contract.approval_status !== 'locked' && (
                    <span className="flex items-center gap-1 text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-full">
                      <Clock size={12} /> Unlocked
                    </span>
                  )}
                  {expandedId === contract.id ? (
                    <ChevronUp size={18} className="text-neutral-400" />
                  ) : (
                    <ChevronDown size={18} className="text-neutral-400" />
                  )}
                </div>
              </button>

              {/* Collapsed Summary */}
              {expandedId !== contract.id && (
                <div className="px-5 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">Royalty</p>
                      <p className="text-sm font-semibold text-gold-400">{contract.royalty_percentage}%</p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">Territory</p>
                      <p className="text-sm font-semibold text-white">{contract.territory}</p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">Duration</p>
                      <p className="text-sm font-semibold text-white">{contract.agreement_duration_months} mo</p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">Renewal</p>
                      <p className="text-sm font-semibold text-white capitalize">{contract.renewal_option}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {expandedId === contract.id && (
                <div className="border-t border-neutral-800 p-5 space-y-4">
                  {/* Royalty Breakdown */}
                  <div>
                    <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Royalty Breakdown</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Royalty</p>
                        <p className="text-sm font-semibold text-gold-400">{contract.royalty_percentage}%</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Mechanical</p>
                        <p className="text-sm font-semibold text-gold-400">{contract.mechanical_rights_pct}%</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Performance</p>
                        <p className="text-sm font-semibold text-gold-400">{contract.performance_rights_pct}%</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Publishing</p>
                        <p className="text-sm font-semibold text-gold-400">{contract.publishing_split_pct}%</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Sync</p>
                        <p className="text-sm font-semibold text-gold-400">{contract.sync_rights_pct}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Royalty Split Recipients */}
                  {royaltySplits[contract.id] && royaltySplits[contract.id].length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Split Recipients</h5>
                      <div className="space-y-2">
                        {royaltySplits[contract.id].map((split) => (
                          <div key={split.id} className="flex items-center justify-between bg-neutral-800 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center">
                                <UserPlus size={14} className="text-gold-400" />
                              </div>
                              <div>
                                <p className="text-sm text-white">{split.recipient_name}</p>
                                <p className="text-xs text-neutral-500 capitalize">{split.recipient_role}</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-gold-400">{split.percentage}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contract Details */}
                  <div>
                    <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Contract Details</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Territory</p>
                        <p className="text-sm text-white flex items-center gap-1">
                          <Globe size={12} className="text-neutral-500" /> {contract.territory}
                        </p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Duration</p>
                        <p className="text-sm text-white flex items-center gap-1">
                          <Clock size={12} className="text-neutral-500" /> {contract.agreement_duration_months} months
                        </p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Payment</p>
                        <p className="text-sm text-white">{contract.payment_schedule || '---'}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Renewal</p>
                        <p className="text-sm text-white capitalize flex items-center gap-1">
                          <RefreshCw size={12} className="text-neutral-500" /> {contract.renewal_option}
                        </p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Version</p>
                        <p className="text-sm text-white">v{contract.version}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Created</p>
                        <p className="text-sm text-white">{formatDate(contract.created_at)}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3 col-span-2">
                        <p className="text-xs text-neutral-500 mb-1">Content Hash</p>
                        <p className="text-xs text-neutral-300 font-mono truncate">{contract.content_hash || '---'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div>
                    <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Approval Status</h5>
                    <div className="flex items-center gap-3">
                      {approvalBadge(contract.approval_status, contract.rejection_reason)}
                      {contract.approved_at && (
                        <span className="text-xs text-neutral-500">
                          {formatDate(contract.approved_at)}
                        </span>
                      )}
                    </div>
                    {contract.rejection_reason && (
                      <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                        <p className="text-xs text-red-400 font-medium mb-1">Rejection Reason</p>
                        <p className="text-sm text-neutral-300">{contract.rejection_reason}</p>
                      </div>
                    )}
                    {contract.approval_status === 'approved' && contract.admin_approved_at && (
                      <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-green-400 font-medium">Admin Approved</p>
                          <p className="text-xs text-neutral-400">{formatDate(contract.admin_approved_at)}</p>
                        </div>
                      </div>
                    )}
                    {contract.approval_status === 'locked' && (
                      <div className="mt-2 bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 flex items-center gap-3">
                        <Lock size={16} className="text-gold-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gold-400 font-medium">Record Locked - Immutable</p>
                          <p className="text-xs text-neutral-400">This contract has been sealed by the Three-Way Lock and cannot be modified.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lock Button */}
                  {!contract.is_locked && (
                    <button
                      type="button"
                      onClick={() => handleInitiateLock(contract.id)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 text-sm font-medium rounded-xl transition-colors"
                    >
                      <Shield size={16} />
                      Initiate Three-Way Lock
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
