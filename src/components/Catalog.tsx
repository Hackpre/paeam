import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { CatalogEntry, CatalogFile } from '../lib/types';
import { generateContentHash, formatDate } from '../lib/utils';
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
} from 'lucide-react';

const GENRES = ['Afrobeat', 'Hip-Hop', 'R&B', 'Dancehall', 'Gospel', 'Traditional', 'Pop', 'Jazz', 'Reggae', 'Amapiano', 'Other'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OWNERSHIP = ['owned', 'co-owned', 'licensed', 'work-for-hire'] as const;
const FILE_TYPES = ['master_wav', 'master_mp3', 'instrumental', 'contract_pdf', 'split_sheet_pdf', 'session_file', 'artwork', 'copyright_certificate', 'other'] as const;

export default function Catalog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [files, setFiles] = useState<Record<string, CatalogFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    song_title: '',
    isrc_code: '',
    producer_name: '',
    artist_names: '',
    songwriters: '',
    beat_ownership_status: 'owned' as CatalogEntry['beat_ownership_status'],
    date_created: '',
    date_released: '',
    genre: '',
    duration_seconds: 0,
    bpm: 0,
    musical_key: '',
    publishing_details: '',
  });

  useEffect(() => {
    loadEntries();
  }, [user]);

  async function loadEntries() {
    if (!user) return;
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

      for (const entry of data ?? []) {
        const { data: f } = await supabase
          .from('catalog_files')
          .select('*')
          .eq('catalog_entry_id', entry.id);
        if (f) setFiles((prev) => ({ ...prev, [entry.id]: f }));
      }
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      const { data: prof } = await supabase
        .from('producer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!prof) throw new Error('Producer profile not found');

      const contentData = JSON.stringify(form);
      const hash = await generateContentHash(contentData);

      const { error } = await supabase.from('catalog_entries').insert({
        producer_id: prof.id,
        ...form,
        artist_names: form.artist_names.split(',').map((s) => s.trim()).filter(Boolean),
        songwriters: form.songwriters.split(',').map((s) => s.trim()).filter(Boolean),
        content_hash: hash,
      });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Catalog entry created' });
      setShowForm(false);
      setForm({
        song_title: '', isrc_code: '', producer_name: '', artist_names: '', songwriters: '',
        beat_ownership_status: 'owned', date_created: '', date_released: '', genre: '',
        duration_seconds: 0, bpm: 0, musical_key: '', publishing_details: '',
      });
      loadEntries();
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    }
    setSaving(false);
  };

  const handleFileUpload = async (entryId: string, fileType: CatalogFile['file_type'], file: File) => {
    const fileName = `${entryId}/${fileType}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('catalog-files')
      .upload(fileName, file);

    if (uploadError) {
      setMessage({ type: 'error', text: uploadError.message });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('catalog-files')
      .getPublicUrl(fileName);

    await supabase.from('catalog_files').insert({
      catalog_entry_id: entryId,
      file_type: fileType,
      file_name: file.name,
      file_url: publicUrl,
      file_size_bytes: file.size,
    });

    loadEntries();
  };

  const handleDeleteFile = async (fileId: string, _fileUrl: string) => {
    await supabase.from('catalog_files').delete().eq('id', fileId);
    loadEntries();
  };

  const handleInitiateLock = async (entryId: string) => {
    await supabase.from('lock_approvals').insert({
      record_type: 'catalog_entry',
      record_id: entryId,
      producer_approved: true,
      producer_approved_at: new Date().toISOString(),
      producer_approval_hash: await generateContentHash(entryId + 'producer'),
    });
    setMessage({ type: 'success', text: 'Lock request initiated. Awaiting artist and association approval.' });
    loadEntries();
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
          <h2 className="text-xl font-bold text-white">Music Catalog</h2>
          <p className="text-sm text-neutral-400">{entries.length} entries registered</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold-600 hover:bg-gold-500 text-neutral-950 font-medium rounded-xl transition-colors"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'New Entry'}
        </button>
      </div>

      {/* New Entry Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Music size={20} className="text-gold-400" />
            New Catalog Entry
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Song Title *</label>
              <input type="text" required value={form.song_title}
                onChange={(e) => setForm({ ...form, song_title: e.target.value })}
                className={inputClass} placeholder="Song title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">ISRC Code</label>
              <input type="text" value={form.isrc_code}
                onChange={(e) => setForm({ ...form, isrc_code: e.target.value })}
                className={inputClass} placeholder="MW-XXX-XX-XXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Producer Name *</label>
              <input type="text" required value={form.producer_name}
                onChange={(e) => setForm({ ...form, producer_name: e.target.value })}
                className={inputClass} placeholder="Producer name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Artist Names (comma-separated)</label>
              <input type="text" value={form.artist_names}
                onChange={(e) => setForm({ ...form, artist_names: e.target.value })}
                className={inputClass} placeholder="Artist 1, Artist 2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Songwriters (comma-separated)</label>
              <input type="text" value={form.songwriters}
                onChange={(e) => setForm({ ...form, songwriters: e.target.value })}
                className={inputClass} placeholder="Writer 1, Writer 2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Beat Ownership</label>
              <select value={form.beat_ownership_status}
                onChange={(e) => setForm({ ...form, beat_ownership_status: e.target.value as CatalogEntry['beat_ownership_status'] })}
                className={selectClass}>
                {OWNERSHIP.map((o) => <option key={o} value={o}>{o.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Date Created</label>
              <input type="date" value={form.date_created}
                onChange={(e) => setForm({ ...form, date_created: e.target.value })}
                className={selectClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Date Released</label>
              <input type="date" value={form.date_released}
                onChange={(e) => setForm({ ...form, date_released: e.target.value })}
                className={selectClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Genre</label>
              <select value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className={selectClass}>
                <option value="">Select genre</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Duration (seconds)</label>
              <input type="number" value={form.duration_seconds || ''}
                onChange={(e) => setForm({ ...form, duration_seconds: parseInt(e.target.value) || 0 })}
                className={inputClass} placeholder="240" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">BPM</label>
              <input type="number" value={form.bpm || ''}
                onChange={(e) => setForm({ ...form, bpm: parseInt(e.target.value) || 0 })}
                className={inputClass} placeholder="120" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Musical Key</label>
              <select value={form.musical_key}
                onChange={(e) => setForm({ ...form, musical_key: e.target.value })}
                className={selectClass}>
                <option value="">Select key</option>
                {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Publishing Details</label>
            <textarea value={form.publishing_details}
              onChange={(e) => setForm({ ...form, publishing_details: e.target.value })}
              rows={2}
              className={inputClass}
              placeholder="Publishing information..." />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-neutral-950 font-medium rounded-xl transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Add to Catalog'}
          </button>
        </form>
      )}

      {/* Catalog List */}
      {entries.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <Disc3 size={48} className="mx-auto mb-4 text-neutral-600" />
          <h3 className="text-lg font-semibold text-white mb-2">No catalog entries yet</h3>
          <p className="text-neutral-400">Click "New Entry" to register your first song or project.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-neutral-800/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-700/20 flex items-center justify-center">
                  <Music size={20} className="text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{entry.song_title}</p>
                  <p className="text-sm text-neutral-400 truncate">
                    {entry.artist_names.join(', ') || 'No artist'} {entry.genre && ` - ${entry.genre}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {entry.is_locked ? (
                    <span className="flex items-center gap-1 text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-full">
                      <Lock size={12} /> Locked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                      <Unlock size={12} /> Unlocked
                    </span>
                  )}
                  {expandedId === entry.id ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
                </div>
              </button>

              {expandedId === entry.id && (
                <div className="border-t border-neutral-800 p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">ISRC</p>
                      <p className="text-sm text-white">{entry.isrc_code || '---'}</p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">Ownership</p>
                      <p className="text-sm text-white capitalize">{entry.beat_ownership_status.replace('-', ' ')}</p>
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
                      <p className="text-xs text-neutral-500 mb-1">BPM</p>
                      <p className="text-sm text-white">{entry.bpm || '---'}</p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">Key</p>
                      <p className="text-sm text-white">{entry.musical_key || '---'}</p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">Version</p>
                      <p className="text-sm text-white">v{entry.version}</p>
                    </div>
                    <div className="bg-neutral-800 rounded-xl p-3">
                      <p className="text-xs text-neutral-500 mb-1">Content Hash</p>
                      <p className="text-xs text-neutral-300 font-mono truncate">{entry.content_hash ? entry.content_hash.substring(0, 12) + '...' : '---'}</p>
                    </div>
                  </div>

                  {entry.songwriters.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Songwriters</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.songwriters.map((w, i) => (
                          <span key={i} className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">{w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">Attached Files</p>
                    <div className="space-y-2">
                      {(files[entry.id] ?? []).map((f) => (
                        <div key={f.id} className="flex items-center gap-3 bg-neutral-800 rounded-xl p-2.5">
                          <FileAudio size={16} className="text-blue-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{f.file_name}</p>
                            <p className="text-xs text-neutral-500">{f.file_type.replace('_', ' ')}</p>
                          </div>
                          {!entry.is_locked && (
                            <button onClick={() => handleDeleteFile(f.id, f.file_url)}
                              className="text-neutral-500 hover:text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {!entry.is_locked && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {FILE_TYPES.map((ft) => (
                          <label key={ft}
                            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl cursor-pointer transition-colors text-xs text-neutral-400 hover:text-white">
                            <Upload size={12} />
                            <span className="truncate">{ft.replace('_', ' ')}</span>
                            <input type="file" className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(entry.id, ft, file);
                              }} />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lock button */}
                  {!entry.is_locked && (
                    <button
                      onClick={() => handleInitiateLock(entry.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <Lock size={16} />
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
