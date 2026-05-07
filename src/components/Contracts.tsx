import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { CatalogEntry, Contract } from '../lib/types';
import { generateContentHash } from '../lib/utils';
import {
  FileText,
  Plus,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Globe,
  Clock,
  PenTool,
} from 'lucide-react';

const CONTRACT_TYPES = ['exclusive', 'non-exclusive', 'work-for-hire'] as const;

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<(Contract & { song_title: string })[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    catalog_entry_id: '',
    contract_type: 'exclusive' as Contract['contract_type'],
    royalty_percentage: 0,
    mechanical_rights_pct: 0,
    performance_rights_pct: 0,
    publishing_split_pct: 0,
    agreement_duration_months: 12,
    territory: 'Malawi',
    payment_schedule: '',
  });

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
      }
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const contentData = JSON.stringify(form);
      const hash = await generateContentHash(contentData);

      const { error } = await supabase.from('contracts').insert({
        ...form,
        content_hash: hash,
      });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Contract created successfully' });
      setShowForm(false);
      setForm({
        catalog_entry_id: '', contract_type: 'exclusive', royalty_percentage: 0,
        mechanical_rights_pct: 0, performance_rights_pct: 0, publishing_split_pct: 0,
        agreement_duration_months: 12, territory: 'Malawi', payment_schedule: '',
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
    setSaving(false);
  };

  const handleInitiateLock = async (contractId: string) => {
    await supabase.from('lock_approvals').insert({
      record_type: 'contract',
      record_id: contractId,
      producer_approved: true,
      producer_approved_at: new Date().toISOString(),
      producer_approval_hash: await generateContentHash(contractId + 'producer'),
    });
    setMessage({ type: 'success', text: 'Lock request initiated for contract. Awaiting artist and association approval.' });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all';
  const selectClass = 'w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500';

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
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Contracts & Royalties</h2>
          <p className="text-sm text-neutral-400">{contracts.length} contracts registered</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-medium rounded-xl transition-colors"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'New Contract'}
        </button>
      </div>

      {/* New Contract Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <PenTool size={20} className="text-gold-400" />
            New Contract
          </h3>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Catalog Entry *</label>
            <select required value={form.catalog_entry_id}
              onChange={(e) => setForm({ ...form, catalog_entry_id: e.target.value })}
              className={selectClass}>
              <option value="">Select a song</option>
              {catalog.map((c) => <option key={c.id} value={c.id}>{c.song_title}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Contract Type *</label>
              <select value={form.contract_type}
                onChange={(e) => setForm({ ...form, contract_type: e.target.value as Contract['contract_type'] })}
                className={selectClass}>
                {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Duration (months)</label>
              <input type="number" value={form.agreement_duration_months}
                onChange={(e) => setForm({ ...form, agreement_duration_months: parseInt(e.target.value) || 0 })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Territory</label>
              <input type="text" value={form.territory}
                onChange={(e) => setForm({ ...form, territory: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Payment Schedule</label>
              <input type="text" value={form.payment_schedule}
                onChange={(e) => setForm({ ...form, payment_schedule: e.target.value })}
                className={inputClass} placeholder="Monthly, Quarterly, etc." />
            </div>
          </div>

          {/* Royalty Splits */}
          <div className="bg-neutral-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Percent size={16} className="text-amber-400" />
              Royalty Splits (%)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'royalty_percentage', label: 'Royalty %' },
                { key: 'mechanical_rights_pct', label: 'Mechanical %' },
                { key: 'performance_rights_pct', label: 'Performance %' },
                { key: 'publishing_split_pct', label: 'Publishing %' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-neutral-400 mb-1">{label}</label>
                  <input type="number" step="0.01" min="0" max="100"
                    value={(form as unknown as Record<string, number>)[key] || ''}
                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500" />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-medium rounded-xl transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Contract'}
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
            <div key={contract.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-white">{contract.song_title}</h4>
                  <p className="text-sm text-neutral-400 capitalize">{contract.contract_type.replace('-', ' ')} Agreement</p>
                </div>
                {contract.is_locked ? (
                  <span className="flex items-center gap-1 text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-full">
                    <Lock size={12} /> Locked
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                    <Clock size={12} /> Unlocked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-neutral-800 rounded-xl p-3">
                  <p className="text-xs text-neutral-500 mb-1">Royalty</p>
                  <p className="text-sm font-semibold text-gold-400">{contract.royalty_percentage}%</p>
                </div>
                <div className="bg-neutral-800 rounded-xl p-3">
                  <p className="text-xs text-neutral-500 mb-1">Mechanical</p>
                  <p className="text-sm font-semibold text-blue-400">{contract.mechanical_rights_pct}%</p>
                </div>
                <div className="bg-neutral-800 rounded-xl p-3">
                  <p className="text-xs text-neutral-500 mb-1">Performance</p>
                  <p className="text-sm font-semibold text-amber-400">{contract.performance_rights_pct}%</p>
                </div>
                <div className="bg-neutral-800 rounded-xl p-3">
                  <p className="text-xs text-neutral-500 mb-1">Publishing</p>
                  <p className="text-sm font-semibold text-rose-400">{contract.publishing_split_pct}%</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><Globe size={12} /> {contract.territory}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {contract.agreement_duration_months} months</span>
                <span>v{contract.version}</span>
              </div>

              {!contract.is_locked && (
                <button
                  onClick={() => handleInitiateLock(contract.id)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Lock size={16} />
                  Initiate Three-Way Lock
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
