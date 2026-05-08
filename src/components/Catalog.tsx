import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { CatalogEntry, CatalogFile } from '../lib/types';
import type { FileType, OwnershipStatus, ApprovalStatus } from '../lib/types';
import { generateContentHash, formatDate, formatDuration, truncateHash } from '../lib/utils';
import {
  Disc3,
  Plus,
  X,
  Lock,
  Unlock,
  Music,
  FileAudio,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Hash,
  Layers,
} from 'lucide-react';

const GENRES = [
  'Afrobeat', 'Hip-Hop', 'R&B', 'Dancehall', 'Gospel',
  'Traditional', 'Pop', 'Jazz', 'Reggae', 'Amapiano', 'Other',
];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OWNERSHIP_OPTIONS: OwnershipStatus[] = ['owned', 'co-owned', 'licensed', 'work-for-hire'];
const FILE_TYPES: FileType[] = [
  'master_wav', 'master_mp3', 'instrumental', 'contract_pdf',
  'split_sheet_pdf', 'session_file', 'artwork', 'copyright_certificate', 'other',
];

const FILE_TYPE_LABELS: Record<FileType, string> = {
  master_wav: 'Master WAV',
  master_mp3: 'Master MP3',
  instrumental: 'Instrumental',
  contract_pdf: 'Contract PDF',
  split_sheet_pdf: 'Split Sheet PDF',
  session_file: 'Session File',
  artwork: 'Artwork',
  copyright_certificate: 'Copyright Cert',
  other: 'Other',
};

function ApprovalBadge({ status, rejectionReason }: { status: ApprovalStatus; rejectionReason?: string }) {
  switch (status) {
    case 'locked':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2.5 py-1 rounded-full">
          <Lock size={12} /> Locked - Immutable
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
          <CheckCircle2 size={12} /> Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full" title={rejectionReason}>
          <XCircle size={12} /> Rejected by Admin
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
          <Clock size={12} /> Pending Admin Approval
        </span>
      );
  }
}

export default function Catalog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [files, setFiles] = useState<Record<string, CatalogFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [form, setForm] = useState({
    song_title: '',
    isrc_code: '',
    producer_name: '',
    artist_names: '',
    songwriters: '',
    beat_ownership_status: 'owned' as OwnershipStatus,
    date_created: '',
    date_released: '',
    genre: '',
    duration_seconds: 0,
    bpm: 0,
    musical_key: '',
    publishing_details: '',
    producer_pct: 0,
    artist_pct: 0,
    songwriter_pct: 0,
    publisher_pct: 0,
    sync_pct: 0,
  });

  const splitTotal = form.producer_pct + form.artist_pct + form.songwriter_pct + form.publisher_pct + form.sync_pct;
  const splitValid = splitTotal === 100;

  useEffect(() => {
    loadEntries();
  }, [user]);

  async function loadEntries() {
    if (!user) return;
    setLoading(true);

    const { data: prof } = await supabase
      .from('producer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (prof) {
      const { data } = await supabase
        .from('catalog_entries')
        .select('*')
        .eq('producer_id', prof.id)
        .order('created_at', { ascending: false });
      setEntries(data ?? []);

      const fileMap: Record<string, CatalogFile[]> = {};
      for (const entry of data ?? []) {
        const { data: f } = await supabase
          .from('catalog_files')
          .select('*')
          .eq('catalog_entry_id', entry.id);
        if (f) fileMap[entry.id] = f;
      }
      setFiles(fileMap);
    }

    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!splitValid) {
      setMessage({ type: 'error', text: 'Split percentages must total 100%.' });
      return;
    }
    setSaving(true);
    setMessage(null);

    try {
      const { data: prof } = await supabase
        .from('producer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!prof) throw new Error('Producer profile not found');

      const contentData = JSON.stringify({
        song_title: form.song_title,
        isrc_code: form.isrc_code,
        producer_name: form.producer_name,
        artist_names: form.artist_names,
        songwriters: form.songwriters,
        beat_ownership_status: form.beat_ownership_status,
        genre: form.genre,
        duration_seconds: form.duration_seconds,
        bpm: form.bpm,
        musical_key: form.musical_key,
      });
      const hash = await generateContentHash(contentData);

      const { error } = await supabase.from('catalog_entries').insert({
        producer_id: prof.id,
        song_title: form.song_title,
        isrc_code: form.isrc_code || null,
        producer_name: form.producer_name,
        artist_names: form.artist_names.split(',').map((s) => s.trim()).filter(Boolean),
        songwriters: form.songwriters.split(',').map((s) => s.trim()).filter(Boolean),
        beat_ownership_status: form.beat_ownership_status,
        date_created: form.date_created || null,
        date_released: form.date_released || null,
        genre: form.genre || null,
        duration_seconds: form.duration_seconds,
        bpm: form.bpm || null,
        musical_key: form.musical_key || null,
        publishing_details: form.publishing_details || null,
        sync_rights_pct: form.sync_pct,
        content_hash: hash,
        version: 1,
      });

      if (error) throw error;

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'create',
        record_type: 'catalog_entry',
        record_id: form.song_title,
        new_data: { song_title: form.song_title, artist_names: form.artist_names, genre: form.genre },
      });

      setMessage({ type: 'success', text: 'Catalog entry created successfully.' });
      setShowForm(false);
      setForm({
        song_title: '', isrc_code: '', producer_name: '', artist_names: '', songwriters: '',
        beat_ownership_status: 'owned', date_created: '', date_released: '', genre: '',
        duration_seconds: 0, bpm: 0, musical_key: '', publishing_details: '',
        producer_pct: 0, artist_pct: 0, songwriter_pct: 0, publisher_pct: 0, sync_pct: 0,
      });
      loadEntries();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
    setSaving(false);
  };

  const handleFileUpload = async (entryId: string, fileType: FileType, file: File) => {
    const uploadKey = `${entryId}-${fileType}`;
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));
    setMessage(null);

    try {
      const fileName = `${entryId}/${fileType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('catalog-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('catalog-files')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('catalog_files').insert({
        catalog_entry_id: entryId,
        file_type: fileType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size_bytes: file.size,
      });

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: `File uploaded: ${file.name}` });
      loadEntries();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
    setUploading((prev) => ({ ...prev, [uploadKey]: false }));
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    setMessage(null);
    try {
      const path = fileUrl.split('/catalog-files/')[1];
      if (path) {
        await supabase.storage.from('catalog-files').remove([path]);
      }
      await supabase.from('catalog_files').delete().eq('id', fileId);
      setMessage({ type: 'success', text: 'File removed.' });
      loadEntries();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
  };

  const handleInitiateLock = async (entryId: string) => {
    setMessage(null);
    try {
      const hash = await generateContentHash(entryId + 'producer-' + Date.now());
      await supabase.from('lock_approvals').insert({
        record_type: 'catalog_entry',
        record_id: entryId,
        producer_approved: true,
        producer_approved_at: new Date().toISOString(),
        producer_approval_hash: hash,
      });
      setMessage({ type: 'success', text: 'Three-way lock initiated. Awaiting artist and association approval.' });
      loadEntries();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/50 transition-all';
  const selectClass =
    'w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/50 transition-all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Banner */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-gold-500/10 border border-gold-600/30 text-gold-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Music Catalog</h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} registered
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-semibold rounded-xl transition-colors"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'New Entry'}
        </button>
      </div>

      {/* New Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Music size={20} className="text-gold-400" />
            New Catalog Entry
          </h3>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Song Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.song_title}
                onChange={(e) => setForm({ ...form, song_title: e.target.value })}
                className={inputClass}
                placeholder="Enter song title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">ISRC Code</label>
              <input
                type="text"
                value={form.isrc_code}
                onChange={(e) => setForm({ ...form, isrc_code: e.target.value })}
                className={inputClass}
                placeholder="MW-XXX-XX-XXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Producer Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.producer_name}
                onChange={(e) => setForm({ ...form, producer_name: e.target.value })}
                className={inputClass}
                placeholder="Producer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Artist Names <span className="text-neutral-500 text-xs">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={form.artist_names}
                onChange={(e) => setForm({ ...form, artist_names: e.target.value })}
                className={inputClass}
                placeholder="Artist 1, Artist 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Songwriters <span className="text-neutral-500 text-xs">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={form.songwriters}
                onChange={(e) => setForm({ ...form, songwriters: e.target.value })}
                className={inputClass}
                placeholder="Writer 1, Writer 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Beat Ownership</label>
              <select
                value={form.beat_ownership_status}
                onChange={(e) =>
                  setForm({ ...form, beat_ownership_status: e.target.value as OwnershipStatus })
                }
                className={selectClass}
              >
                {OWNERSHIP_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o.replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates and Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Date Created</label>
              <input
                type="date"
                value={form.date_created}
                onChange={(e) => setForm({ ...form, date_created: e.target.value })}
                className={selectClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Date Released</label>
              <input
                type="date"
                value={form.date_released}
                onChange={(e) => setForm({ ...form, date_released: e.target.value })}
                className={selectClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Genre</label>
              <select
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className={selectClass}
              >
                <option value="">Select genre</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Music Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Duration <span className="text-neutral-500 text-xs">(seconds)</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.duration_seconds || ''}
                onChange={(e) =>
                  setForm({ ...form, duration_seconds: parseInt(e.target.value) || 0 })
                }
                className={inputClass}
                placeholder="240"
              />
              {form.duration_seconds > 0 && (
                <p className="text-xs text-neutral-500 mt-1">
                  {formatDuration(form.duration_seconds)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">BPM</label>
              <input
                type="number"
                min={0}
                value={form.bpm || ''}
                onChange={(e) => setForm({ ...form, bpm: parseInt(e.target.value) || 0 })}
                className={inputClass}
                placeholder="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Musical Key</label>
              <select
                value={form.musical_key}
                onChange={(e) => setForm({ ...form, musical_key: e.target.value })}
                className={selectClass}
              >
                <option value="">Select key</option>
                {KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Publishing Details */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Publishing Details
            </label>
            <textarea
              value={form.publishing_details}
              onChange={(e) => setForm({ ...form, publishing_details: e.target.value })}
              rows={3}
              className={inputClass}
              placeholder="Publishing information, rights holders, distribution notes..."
            />
          </div>

          {/* Split Sheet */}
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gold-400 flex items-center gap-2">
              <Layers size={16} />
              Split Sheet
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Producer %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.producer_pct || ''}
                  onChange={(e) =>
                    setForm({ ...form, producer_pct: parseInt(e.target.value) || 0 })
                  }
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Artist %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.artist_pct || ''}
                  onChange={(e) =>
                    setForm({ ...form, artist_pct: parseInt(e.target.value) || 0 })
                  }
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Songwriter %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.songwriter_pct || ''}
                  onChange={(e) =>
                    setForm({ ...form, songwriter_pct: parseInt(e.target.value) || 0 })
                  }
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Publisher %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.publisher_pct || ''}
                  onChange={(e) =>
                    setForm({ ...form, publisher_pct: parseInt(e.target.value) || 0 })
                  }
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Sync %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.sync_pct || ''}
                  onChange={(e) =>
                    setForm({ ...form, sync_pct: parseInt(e.target.value) || 0 })
                  }
                  className={inputClass}
                  placeholder="0"
                />
              </div>
            </div>
            <div
              className={`text-xs font-medium ${
                splitValid ? 'text-green-400' : 'text-red-400'
              }`}
            >
              Total: {splitTotal}% {splitValid ? '' : '(must equal 100%)'}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || !splitValid}
            className="w-full py-3 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Add to Catalog'}
          </button>
        </form>
      )}

      {/* Catalog List */}
      {entries.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <Disc3 size={48} className="mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-semibold text-white mb-2">No catalog entries yet</h3>
          <p className="text-neutral-400">
            Click "New Entry" to register your first song or project.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const entryFiles = files[entry.id] ?? [];
            const isExpanded = expandedId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-neutral-800/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-700/20 flex items-center justify-center flex-shrink-0">
                    <Music size={20} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{entry.song_title}</p>
                    <p className="text-sm text-neutral-400 truncate">
                      {entry.artist_names.join(', ') || 'No artist'}
                      {entry.genre && (
                        <span className="text-gold-600"> -- {entry.genre}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ApprovalBadge status={entry.approval_status} rejectionReason={entry.rejection_reason} />
                    {entry.is_locked && entry.approval_status !== 'locked' && (
                      <span className="flex items-center gap-1 text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-1 rounded-full">
                        <Lock size={12} /> Locked
                      </span>
                    )}
                    {!entry.is_locked && entry.approval_status !== 'locked' && (
                      <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                        <Unlock size={12} /> Unlocked
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-neutral-400" />
                    ) : (
                      <ChevronDown size={18} className="text-neutral-400" />
                    )}
                  </div>
                </button>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="border-t border-neutral-800 p-5 space-y-5">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">ISRC</p>
                        <p className="text-sm text-white font-mono">{entry.isrc_code || '---'}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Ownership</p>
                        <p className="text-sm text-white capitalize">
                          {entry.beat_ownership_status.replace(/-/g, ' ')}
                        </p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Created</p>
                        <p className="text-sm text-white">{formatDate(entry.date_created)}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Released</p>
                        <p className="text-sm text-white">{formatDate(entry.date_released)}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Duration</p>
                        <p className="text-sm text-white">{formatDuration(entry.duration_seconds)}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">BPM</p>
                        <p className="text-sm text-white">{entry.bpm || '---'}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Key</p>
                        <p className="text-sm text-white">{entry.musical_key || '---'}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Genre</p>
                        <p className="text-sm text-white">{entry.genre || '---'}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Producer</p>
                        <p className="text-sm text-white truncate">{entry.producer_name}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Sync Rights</p>
                        <p className="text-sm text-white">{entry.sync_rights_pct}%</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                          <Layers size={10} /> Version
                        </p>
                        <p className="text-sm text-white">v{entry.version}</p>
                      </div>
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                          <Hash size={10} /> Content Hash
                        </p>
                        <p className="text-xs text-neutral-300 font-mono truncate">
                          {truncateHash(entry.content_hash)}
                        </p>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {entry.approval_status === 'rejected' && entry.rejection_reason && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                        <p className="text-xs text-red-400 font-medium mb-1">Rejection Reason</p>
                        <p className="text-sm text-neutral-300">{entry.rejection_reason}</p>
                      </div>
                    )}

                    {/* Publishing Details */}
                    {entry.publishing_details && (
                      <div className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Publishing Details</p>
                        <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                          {entry.publishing_details}
                        </p>
                      </div>
                    )}

                    {/* Songwriter Tags */}
                    {entry.songwriters.length > 0 && (
                      <div>
                        <p className="text-xs text-neutral-500 mb-2">Songwriters</p>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.songwriters.map((writer, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gold-500/10 border border-gold-600/20 text-gold-400 px-2.5 py-1 rounded-full"
                            >
                              {writer}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached Files */}
                    <div>
                      <p className="text-xs text-neutral-500 mb-2">
                        Attached Files ({entryFiles.length})
                      </p>
                      {entryFiles.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {entryFiles.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-3 bg-neutral-800 rounded-xl p-2.5"
                            >
                              <FileAudio size={16} className="text-gold-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{f.file_name}</p>
                                <p className="text-xs text-neutral-500">
                                  {FILE_TYPE_LABELS[f.file_type] || f.file_type.replace(/_/g, ' ')}
                                  {f.file_size_bytes
                                    ? ` -- ${(f.file_size_bytes / 1024).toFixed(0)} KB`
                                    : ''}
                                </p>
                              </div>
                              {!entry.is_locked && (
                                <button
                                  onClick={() => handleDeleteFile(f.id, f.file_url)}
                                  className="text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File Upload Buttons */}
                      {!entry.is_locked && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {FILE_TYPES.map((ft) => {
                            const uploadKey = `${entry.id}-${ft}`;
                            const isUploading = uploading[uploadKey];
                            return (
                              <label
                                key={ft}
                                className={`flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl cursor-pointer transition-colors text-xs text-neutral-400 hover:text-gold-400 ${
                                  isUploading ? 'opacity-50 pointer-events-none' : ''
                                }`}
                              >
                                <Upload size={12} />
                                <span className="truncate">
                                  {isUploading ? 'Uploading...' : FILE_TYPE_LABELS[ft]}
                                </span>
                                <input
                                  ref={(el) => {
                                    fileInputRefs.current[uploadKey] = el;
                                  }}
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(entry.id, ft, file);
                                    if (e.target) e.target.value = '';
                                  }}
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Admin Approval Info */}
                    {entry.approval_status === 'approved' && entry.approved_at && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-green-400 font-medium">Admin Approved</p>
                          <p className="text-xs text-neutral-400">{formatDate(entry.approved_at)}</p>
                        </div>
                      </div>
                    )}
                    {entry.approval_status === 'locked' && (
                      <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 flex items-center gap-3">
                        <Lock size={16} className="text-gold-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gold-400 font-medium">Record Locked - Immutable</p>
                          <p className="text-xs text-neutral-400">This record has been sealed by the Three-Way Lock and cannot be modified.</p>
                        </div>
                      </div>
                    )}

                    {/* Lock Button */}
                    {!entry.is_locked && (
                      <div className="pt-2 border-t border-neutral-800">
                        <button
                          onClick={() => handleInitiateLock(entry.id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 text-sm font-semibold rounded-xl transition-colors"
                        >
                          <Shield size={16} />
                          Initiate Three-Way Lock
                        </button>
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
