import { useState, useEffect } from 'react';
import { Disc3, Plus, Lock, FileText, Music, File, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

interface CatalogEntry {
  id: string;
  title: string;
  artist: string;
  genre: string;
  isrc: string;
  ownership: string;
  createdDate: string;
  releaseDate: string;
  songwriters: string[];
  attachedFiles: string[];
  hasInstrumental: boolean;
  hasSessionFile: boolean;
  isLocked: boolean;
}

export default function Catalog() {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    artist: '',
    genre: '',
    isrc: '',
    songwriters: '',
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('paeam_catalog');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('paeam_catalog', JSON.stringify(entries));
    // Dispatch event for Dashboard to update
    window.dispatchEvent(new CustomEvent('catalogUpdated', { detail: entries.length }));
  }, [entries]);

  const handleCreateEntry = () => {
    if (!newEntry.title) return;
    
    const entry: CatalogEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      artist: newEntry.artist || 'Austin Precious Phiri',
      genre: newEntry.genre || 'Afrobeat',
      isrc: newEntry.isrc || new Date().toLocaleDateString(),
      ownership: 'Owned',
      createdDate: new Date().toLocaleDateString(),
      releaseDate: new Date().toLocaleDateString(),
      songwriters: newEntry.songwriters.split(',').map(s => s.trim()),
      attachedFiles: ['master.wav', 'contract.pdf', 'artwork', 'split_sheet.pdf', 'copyright_certificate.pdf'],
      hasInstrumental: true,
      hasSessionFile: true,
      isLocked: false,
    };
    
    const updated = [entry, ...entries];
    setEntries(updated);
    setShowCreateForm(false);
    setNewEntry({ title: '', artist: '', genre: '', isrc: '', songwriters: '' });
    
    // Also update global catalog count
    localStorage.setItem('paeam_catalog_count', updated.length.toString());
  };

  const initiateLock = (id: string) => {
    const updated = entries.map(e => 
      e.id === id ? { ...e, isLocked: true } : e
    );
    setEntries(updated);
    
    // Create lock approval request
    const existingLocks = JSON.parse(localStorage.getItem('paeam_lock_requests') || '[]');
    const newLock = {
      id: Date.now().toString(),
      type: 'catalog',
      title: e.title,
      producerApproved: true,
      artistApproved: false,
      associationApproved: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('paeam_lock_requests', JSON.stringify([newLock, ...existingLocks]));
    
    // Log to audit trail
    const audit = JSON.parse(localStorage.getItem('paeam_audit') || '[]');
    audit.unshift({
      id: Date.now().toString(),
      action: 'lock',
      entityType: 'catalog',
      entityTitle: entry.title,
      user: JSON.parse(localStorage.getItem('paeam_user') || '{}').stageName || 'Producer',
      timestamp: new Date().toLocaleString(),
      details: `Initiated Three-Way Lock for catalog entry: ${entry.title}`,
    });
    localStorage.setItem('paeam_audit', JSON.stringify(audit));
    
    alert('Three-Way Lock initiated! Waiting for Artist and Association approval.');
  };

  const deleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this catalog entry?')) {
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Disc3 size={28} className="text-gold-400" />
              <h1 className="text-2xl font-bold text-white">Catalog</h1>
            </div>
            <p className="text-neutral-400 text-sm">Manage your music catalog with complete metadata</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl transition-colors"
          >
            <Plus size={18} /> New Entry
          </button>
        </div>
      </div>

      {/* Create New Entry Form */}
      {showCreateForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create Catalog Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Song Title *"
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <input
              type="text"
              placeholder="Artist Name"
              value={newEntry.artist}
              onChange={(e) => setNewEntry({ ...newEntry, artist: e.target.value })}
              className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
            />
            <input
              type="text"
              placeholder="Genre"
              value={newEntry.genre}
              onChange={(e) => setNewEntry({ ...newEntry, genre: e.target.value })}
              className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
            />
            <input
              type="text"
              placeholder="ISRC Code"
              value={newEntry.isrc}
              onChange={(e) => setNewEntry({ ...newEntry, isrc: e.target.value })}
              className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
            />
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Songwriters (comma separated)"
                value={newEntry.songwriters}
                onChange={(e) => setNewEntry({ ...newEntry, songwriters: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleCreateEntry} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl">Create Entry</button>
            <button onClick={() => setShowCreateForm(false)} className="px-6 py-2 bg-neutral-800 text-white rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {/* Catalog Entries */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-neutral-800">
          <p className="text-neutral-400 text-sm">{entries.length} entries registered</p>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <Disc3 size={48} className="mx-auto mb-3 opacity-50" />
            <p>No catalog entries yet</p>
            <p className="text-sm">Click "New Entry" to add your first song</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {entries.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-neutral-800/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{entry.title}</h3>
                    <p className="text-neutral-400">{entry.artist} - {entry.genre}</p>
                  </div>
                  <div className="flex gap-2">
                    {entry.isLocked ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-gold-500/10 rounded-full">
                        <Lock size={14} className="text-gold-400" />
                        <span className="text-xs text-gold-400 font-medium">Locked</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full">
                        <AlertTriangle size={14} className="text-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">Unlocked</span>
                      </div>
                    )}
                    <button onClick={() => deleteEntry(entry.id)} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-neutral-500 text-xs">ISRC</p>
                    <p className="text-white">{entry.isrc}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-xs">Ownership</p>
                    <p className="text-white">{entry.ownership}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-xs">Created</p>
                    <p className="text-white">{entry.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500 text-xs">Released</p>
                    <p className="text-white">{entry.releaseDate}</p>
                  </div>
                </div>

                {/* Songwriters */}
                <div className="mb-4">
                  <p className="text-neutral-500 text-xs mb-1">Songwriters</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.songwriters.map((writer, idx) => (
                      <span key={idx} className="px-2 py-1 bg-neutral-800 rounded-lg text-white text-sm">{writer}</span>
                    ))}
                  </div>
                </div>

                {/* Attached Files */}
                <div className="mb-4">
                  <p className="text-neutral-500 text-xs mb-2">Attached Files</p>
                  <div className="flex flex-wrap gap-3">
                    {entry.attachedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-sm">
                        {file.includes('.wav') || file.includes('.mp3') ? <Music size={14} className="text-gold-400" /> :
                         file.includes('.pdf') ? <FileText size={14} className="text-blue-400" /> :
                         <File size={14} className="text-neutral-500" />}
                        <span className="text-neutral-400">{file}</span>
                      </div>
                    ))}
                    {entry.hasInstrumental && (
                      <div className="flex items-center gap-1 text-sm">
                        <Music size={14} className="text-gold-400" />
                        <span className="text-neutral-400">instrumental</span>
                      </div>
                    )}
                    {entry.hasSessionFile && (
                      <div className="flex items-center gap-1 text-sm">
                        <File size={14} className="text-neutral-500" />
                        <span className="text-neutral-400">session file</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {!entry.isLocked && (
                  <div className="flex gap-3 pt-3 border-t border-neutral-800">
                    <button
                      onClick={() => initiateLock(entry.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black font-medium rounded-lg transition-colors text-sm"
                    >
                      <Lock size={14} /> Initiate Three-Way Lock
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-neutral-500 text-xs pt-4 border-t border-neutral-800">
        <p>Producers & Audio Engineering Association of Malawi — Official Digital Registry</p>
        <p className="mt-1">Secure Rights Management | Immutable Record Keeping | Three-Way Lock Protection</p>
        <p className="mt-2">© 2026 PAEAM. All rights reserved. Built for the music producers of Malawi.</p>
      </div>
    </div>
  );
}