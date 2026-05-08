import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Dispute, DisputeEvidence, CatalogEntry, Contract } from '../lib/types';
import { formatDate, formatDateTime } from '../lib/utils';
import {
  Scale,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  Gavel,
  Ban,
 ArrowRight,
  Paperclip,
} from 'lucide-react';

const RECORD_TYPES = ['catalog_entry', 'contract', 'royalty'] as const;
const DISPUTE_TYPES = ['ownership', 'royalty', 'copyright', 'contract_breach', 'other'] as const;

const STATUS_FLOW: Dispute['status'][] = [
  'filed',
  'under_review',
  'mediation',
  'arbitration',
  'resolved',
];

function getStatusConfig(status: Dispute['status']) {
  switch (status) {
    case 'filed':
      return { label: 'Filed', color: 'text-yellow-400 bg-yellow-500/10', icon: Clock };
    case 'under_review':
      return { label: 'Under Review', color: 'text-gold-400 bg-gold-500/10', icon: Eye };
    case 'mediation':
      return { label: 'Mediation', color: 'text-blue-400 bg-blue-500/10', icon: MessageSquare };
    case 'arbitration':
      return { label: 'Arbitration', color: 'text-orange-400 bg-orange-500/10', icon: Gavel };
    case 'resolved':
      return { label: 'Resolved', color: 'text-green-400 bg-green-500/10', icon: CheckCircle2 };
    case 'dismissed':
      return { label: 'Dismissed', color: 'text-red-400 bg-red-500/10', icon: Ban };
    default:
      return { label: 'Unknown', color: 'text-neutral-400 bg-neutral-500/10', icon: AlertTriangle };
  }
}

function formatRecordType(type: string): string {
  switch (type) {
    case 'catalog_entry': return 'Catalog Entry';
    case 'contract': return 'Contract';
    case 'royalty': return 'Royalty';
    default: return type;
  }
}

function formatDisputeType(type: string): string {
  switch (type) {
    case 'contract_breach': return 'Contract Breach';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

const initialForm = {
  record_type: 'catalog_entry' as Dispute['record_type'],
  record_id: '',
  dispute_type: 'ownership' as Dispute['dispute_type'],
  description: '',
};

export default function Disputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [evidence, setEvidence] = useState<Record<string, DisputeEvidence[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ ...initialForm });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setContracts(conData ?? []);
      }

      const { data: disputeData } = await supabase
        .from('disputes')
        .select('*')
        .eq('filed_by', user.id)
        .order('created_at', { ascending: false });
      setDisputes(disputeData ?? []);

      if (disputeData && disputeData.length > 0) {
        const evidenceMap: Record<string, DisputeEvidence[]> = {};
        for (const d of disputeData) {
          const { data: evData } = await supabase
            .from('dispute_evidence')
            .select('*')
            .eq('dispute_id', d.id)
            .order('created_at', { ascending: true });
          if (evData && evData.length > 0) {
            evidenceMap[d.id] = evData;
          }
        }
        setEvidence(evidenceMap);
      }
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!form.record_id) {
      setMessage({ type: 'error', text: 'Please select a record to dispute.' });
      setSaving(false);
      return;
    }

    try {
      const { data: disputeData, error } = await supabase
        .from('disputes')
        .insert({
          filed_by: user!.id,
          record_type: form.record_type,
          record_id: form.record_id,
          dispute_type: form.dispute_type,
          description: form.description,
          status: 'filed',
          resolution: '',
        })
        .select()
        .single();

      if (error) throw error;

      if (disputeData && evidenceFiles.length > 0) {
        setUploadingEvidence(true);
        for (const file of evidenceFiles) {
          const filePath = `${disputeData.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('dispute-evidence')
            .upload(filePath, file);

          if (uploadError) {
            setMessage({ type: 'error', text: `Failed to upload ${file.name}: ${uploadError.message}` });
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('dispute-evidence')
            .getPublicUrl(filePath);

          await supabase.from('dispute_evidence').insert({
            dispute_id: disputeData.id,
            uploaded_by: user!.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            description: '',
          });
        }
        setUploadingEvidence(false);
      }

      setMessage({ type: 'success', text: 'Dispute filed successfully.' });
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
    setEvidenceFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidenceFiles([...evidenceFiles, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeEvidenceFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const handleDownloadEvidence = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('dispute-evidence')
        .download(fileUrl.split('/dispute-evidence/')[1]);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to download ${fileName}.` });
    }
  };

  const recordOptions = (() => {
    switch (form.record_type) {
      case 'catalog_entry':
        return catalog.map((c) => ({ id: c.id, label: c.song_title }));
      case 'contract':
        return contracts.map((c) => ({
          id: c.id,
          label: `${c.contract_type.replace(/-/g, ' ')} - ${catalog.find((cat) => cat.id === c.catalog_entry_id)?.song_title ?? 'Unknown'}`,
        }));
      case 'royalty':
        return contracts.map((c) => ({
          id: c.id,
          label: `Royalty: ${catalog.find((cat) => cat.id === c.catalog_entry_id)?.song_title ?? 'Unknown'}`,
        }));
      default:
        return [];
    }
  })();

  const StatusBadge = ({ status }: { status: Dispute['status'] }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const StatusTimeline = ({ status }: { status: Dispute['status'] }) => {
    const isDismissed = status === 'dismissed';
    const flowSteps = isDismissed
      ? ['filed', 'under_review', 'dismissed'] as Dispute['status'][]
      : STATUS_FLOW;

    const currentIndex = flowSteps.indexOf(status);

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {flowSteps.map((step, idx) => {
          const stepConfig = getStatusConfig(step);
          const isActive = idx === currentIndex;
          const isPast = idx < currentIndex;
          return (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? stepConfig.color + ' ring-1 ring-current/20'
                    : isPast
                    ? 'text-green-500 bg-green-500/10'
                    : 'text-neutral-600 bg-neutral-800'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <stepConfig.icon size={12} />
                )}
                {stepConfig.label}
              </div>
              {idx < flowSteps.length - 1 && (
                <ArrowRight
                  size={14}
                  className={
                    isPast
                      ? 'text-green-500'
                      : 'text-neutral-700'
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    );
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
          <h2 className="text-xl font-bold text-white">Dispute Resolution</h2>
          <p className="text-sm text-neutral-400">{disputes.length} disputes filed</p>
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
          {showForm ? 'Cancel' : 'File Dispute'}
        </button>
      </div>

      {/* File Dispute Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Scale size={20} className="text-gold-400" />
            File a Dispute
          </h3>

          {/* Record Type & Record ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Record Type *</label>
              <select
                required
                value={form.record_type}
                onChange={(e) => {
                  setForm({ ...form, record_type: e.target.value as Dispute['record_type'], record_id: '' });
                }}
                className={selectClass}
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>{formatRecordType(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Record *</label>
              <select
                required
                value={form.record_id}
                onChange={(e) => setForm({ ...form, record_id: e.target.value })}
                className={selectClass}
              >
                <option value="">Select a record</option>
                {recordOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dispute Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Dispute Type *</label>
            <select
              required
              value={form.dispute_type}
              onChange={(e) => setForm({ ...form, dispute_type: e.target.value as Dispute['dispute_type'] })}
              className={selectClass}
            >
              {DISPUTE_TYPES.map((t) => (
                <option key={t} value={t}>{formatDisputeType(t)}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the dispute in detail..."
              className={inputClass + ' resize-y'}
            />
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Evidence Files</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer hover:border-gold-600 hover:bg-gold-500/5 transition-all"
            >
              <Upload size={24} className="text-neutral-500" />
              <p className="text-sm text-neutral-400">Click to upload evidence files</p>
              <p className="text-xs text-neutral-600">Supports documents, images, and audio files</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            {evidenceFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {evidenceFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-neutral-800 rounded-xl p-3"
                  >
                    <Paperclip size={14} className="text-gold-400 flex-shrink-0" />
                    <span className="text-sm text-white truncate flex-1">{file.name}</span>
                    <span className="text-xs text-neutral-500 flex-shrink-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEvidenceFile(idx)}
                      className="text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || uploadingEvidence}
            className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {uploadingEvidence
              ? 'Uploading Evidence...'
              : saving
              ? 'Filing Dispute...'
              : 'File Dispute'}
          </button>
        </form>
      )}

      {/* My Disputes List */}
      {disputes.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <Scale size={48} className="mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-semibold text-white mb-2">No disputes filed</h3>
          <p className="text-neutral-400">File a dispute if you have an issue with a record, contract, or royalty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => {
            const isExpanded = expandedId === dispute.id;
            const disputeEvidence = evidence[dispute.id] ?? [];

            return (
              <div key={dispute.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                {/* Card Header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-neutral-800/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-700/20 flex items-center justify-center flex-shrink-0">
                    <Scale size={20} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">
                      {formatDisputeType(dispute.dispute_type)} Dispute
                    </p>
                    <p className="text-sm text-neutral-400">
                      {formatRecordType(dispute.record_type)} -- Filed {formatDate(dispute.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={dispute.status} />
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-neutral-400" />
                    ) : (
                      <ChevronDown size={18} className="text-neutral-400" />
                    )}
                  </div>
                </button>

                {/* Collapsed Summary */}
                {!isExpanded && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-neutral-300 line-clamp-2">
                      {dispute.description}
                    </p>
                    {disputeEvidence.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
                        <Paperclip size={12} />
                        {disputeEvidence.length} evidence file{disputeEvidence.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-neutral-800 p-5 space-y-5">
                    {/* Full Description */}
                    <div>
                      <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Description</h5>
                      <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed bg-neutral-800 rounded-xl p-4">
                        {dispute.description}
                      </p>
                    </div>

                    {/* Dispute Details */}
                    <div>
                      <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Details</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-neutral-800 rounded-xl p-3">
                          <p className="text-xs text-neutral-500 mb-1">Dispute Type</p>
                          <p className="text-sm font-semibold text-gold-400">{formatDisputeType(dispute.dispute_type)}</p>
                        </div>
                        <div className="bg-neutral-800 rounded-xl p-3">
                          <p className="text-xs text-neutral-500 mb-1">Record Type</p>
                          <p className="text-sm font-semibold text-white">{formatRecordType(dispute.record_type)}</p>
                        </div>
                        <div className="bg-neutral-800 rounded-xl p-3">
                          <p className="text-xs text-neutral-500 mb-1">Filed On</p>
                          <p className="text-sm font-semibold text-white">{formatDateTime(dispute.created_at)}</p>
                        </div>
                        <div className="bg-neutral-800 rounded-xl p-3">
                          <p className="text-xs text-neutral-500 mb-1">Last Updated</p>
                          <p className="text-sm font-semibold text-white">{formatDateTime(dispute.updated_at)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div>
                      <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Status</h5>
                      <StatusTimeline status={dispute.status} />
                    </div>

                    {/* Evidence List */}
                    <div>
                      <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                        Evidence
                        {disputeEvidence.length > 0 && (
                          <span className="ml-2 text-gold-400">({disputeEvidence.length})</span>
                        )}
                      </h5>
                      {disputeEvidence.length === 0 ? (
                        <p className="text-sm text-neutral-500 bg-neutral-800 rounded-xl p-4 text-center">
                          No evidence files attached to this dispute.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {disputeEvidence.map((ev) => (
                            <div
                              key={ev.id}
                              className="flex items-center gap-3 bg-neutral-800 rounded-xl p-3"
                            >
                              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                                <FileText size={16} className="text-gold-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{ev.file_name}</p>
                                <p className="text-xs text-neutral-500">
                                  Uploaded {formatDateTime(ev.created_at)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDownloadEvidence(ev.file_url, ev.file_name)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 rounded-lg transition-colors flex-shrink-0"
                              >
                                <Download size={12} />
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resolution */}
                    {(dispute.status === 'resolved' || dispute.status === 'dismissed') && dispute.resolution && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Resolution</h5>
                        <div className={`rounded-xl p-4 border ${
                          dispute.status === 'resolved'
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }`}>
                          <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                            dispute.status === 'resolved' ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {dispute.resolution}
                          </p>
                          {dispute.resolved_at && (
                            <p className="text-xs text-neutral-500 mt-3">
                              Resolved on {formatDateTime(dispute.resolved_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
