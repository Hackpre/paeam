import { useState, useEffect } from 'react';
import { Disc3, Plus, Lock, FileText, Music, File, CheckCircle2, AlertTriangle, Trash2, Upload, DollarSign, Users, Calendar, Clock } from 'lucide-react';

// Genre options
const GENRES = [
  'Afrobeat', 'Gospel', 'World', 'Dancehall', 'Reggae', 
  'Hip-Hop', 'Pop', 'R&B', 'Soul', 'Jazz', 'Rock', 
  'Traditional', 'Amapiano', 'Kwaito', 'Bongo Flava'
];

interface SplitSheet {
  producer: string;
  producerPercent: number;
  artist: string;
  artistPercent: number;
  songwriter: string;
  songwriterPercent: number;
  publisher: string;
  publisherPercent: number;
}

interface CatalogEntry {
  id: string;
  title: string;
  artist: string;
  genre: string;
  isrc: string;
  bpm: number;
  key: string;
  duration: string;
  ownership: 'owned' | 'licensed' | 'shared';
  createdDate: string;
  releaseDate: string;
  songwriters: string[];
  publishingDetails: string;
  splitSheet: SplitSheet;
  attachedFiles: string[];
  isLocked: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

export default function Catalog() {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntry, setNewEntry] = useState<any>({
    title: '',
    artist: '',
    genre: 'Afrobeat',
    isrc: '',
    bpm: 120,
    key: 'C',
    duration: '',
    ownership: 'owned',
    songwriters: '',
    publishingDetails: '',
    splitSheet: {
      producer: '',
      producerPercent: 0,
      artist: '',
      artistPercent: 0,
      songwriter: '',
      songwriterPercent: 0,
      publisher: '',
      publisherPercent: 0,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('paeam_catalog');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('paeam_catalog', JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('catalogUpdated', { detail: entries.length }));
  }, [entries]);

  const handleCreateEntry = () => {
    if (!newEntry.title) return;
    
    const entry: CatalogEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      artist: newEntry.artist || 'Austin Precious Phiri',
      genre: newEntry.genre,
      isrc: newEntry.isrc || `PAEAM-${Date.now()}`,
      bpm: newEntry.bpm,
      key: newEntry.key,
      duration: newEntry.duration,
      ownership: newEntry.ownership,
      createdDate: new Date().toLocaleDateString(),
      releaseDate: new Date().toLocaleDateString(),
      songwriters: newEntry.songwriters.split(',').map((s: string) => s.trim()),
      publishingDetails: newEntry.publishingDetails,
      splitSheet: newEntry.splitSheet,
      attachedFiles: [],
      isLocked: false,
      approvalStatus: 'pending',
    };
    
    setEntries([entry, ...entries]);
    setShowCreateForm(false);
    setNewEntry({
      title: '',
      artist: '',
      genre: 'Afrobeat',
      isrc: '',
      bpm: 120,
      key: 'C',
      duration: '',
      ownership: 'owned',
      songwriters: '',
      publishingDetails: '',
      splitSheet: {
        producer: '',
        producerPercent: 0,
        artist: '',
        artistPercent: 0,
        songwriter: '',
        songwriterPercent: 0,
        publisher: '',
        publisherPercent: 0,
      },
    });
    
    alert('Catalog entry created successfully!');
  };

  const initiateLock = (entry: CatalogEntry) => {
    const updated = entries.map(e => 
      e.id === entry.id ? { ...e, isLocked: true, approvalStatus: 'approved' } : e
    );
    setEntries(updated);
    
    const lockRequests = JSON.parse(localStorage.getItem('paeam_lock_requests') || '[]');
    lockRequests.unshift({
      id: Date.now().toString(),
      type: 'catalog',
      title: entry.title,
      producerApproved: true,
      artistApproved: false,
      associationApproved: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata: {
        genre: entry.genre,
        bpm: entry.bpm,
        key: entry.key,
        duration: entry.duration,
        splitSheet: entry.splitSheet,
      },
    });
    localStorage.setItem('paeam_lock_requests', JSON.stringify(lockRequests));
    
    alert('Three-Way Lock initiated! Waiting for Artist and Association approval.');
  };

  const calculateTotalSplit = () => {
    const total = newEntry.splitSheet.producerPercent + 
                  newEntry.splitSheet.artistPercent + 
                  newEntry.splitSheet.songwriterPercent + 
                  newEntry.splitSheet.publisherPercent;
    return total === 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Disc3 size={28} className="text-gold-400" />
              <h1 className="text-2xl font-bold text-white">Music Catalog</h1>
            </div>
            <p className="text-neutral-400 text-sm">Register your songs with complete metadata, split sheets, and publishing details</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl transition-colors"
          >
            <Plus size={18} /> New Song
          </button>
        </div>
      </div>

      {/* Create New Entry Form */}
      {showCreateForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Register New Song</h3>
          
          {/* Basic Information */}
          <div className="border-b border-neutral-800 pb-4 mb-4">
            <h4 className="text-lg font-semibold text-gold-400 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <select
                value={newEntry.genre}
                onChange={(e) => setNewEntry({ ...newEntry, genre: e.target.value })}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              >
                {GENRES.map(genre => <option key={genre} value={genre}>{genre}</option>)}
              </select>
              <input
                type="text"
                placeholder="ISRC Code"
                value={newEntry.isrc}
                onChange={(e) => setNewEntry({ ...newEntry, isrc: e.target.value })}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
              <input
                type="number"
                placeholder="BPM"
                value={newEntry.bpm}
                onChange={(e) => setNewEntry({ ...newEntry, bpm: parseInt(e.target.value) })}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
              <select
                value={newEntry.key}
                onChange={(e) => setNewEntry({ ...newEntry, key: e.target.value })}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => <option key={key}>{key}</option>)}
              </select>
              <input
                type="text"
                placeholder="Duration (e.g., 3:45)"
                value={newEntry.duration}
                onChange={(e) => setNewEntry({ ...newEntry, duration: e.target.value })}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
              <select
                value={newEntry.ownership}
                onChange={(e) => setNewEntry({ ...newEntry, ownership: e.target.value })}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              >
                <option value="owned">Owned 100%</option>
                <option value="licensed">Licensed</option>
                <option value="shared">Shared Ownership</option>
              </select>
            </div>
          </div>

          {/* Songwriters & Publishing */}
          <div className="border-b border-neutral-800 pb-4 mb-4">
            <h4 className="text-lg font-semibold text-gold-400 mb-3">Songwriters & Publishing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Songwriters (comma separated)"
                value={newEntry.songwriters}
                onChange={(e) => setNewEntry({ ...newEntry, songwriters: e.target.value })}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Publishing Details (e.g., BMI, ASCAP)"
                value={newEntry.publishingDetails}
                onChange={(e) => setNewEntry({ ...newEntry, publishingDetails: e.target.value })}
                className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
            </div>
          </div>

          {/* Split Sheet */}
          <div className="border-b border-neutral-800 pb-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-gold-400">Split Sheet (Royalty %)</h4>
              {!calculateTotalSplit() && (
                <span className="text-xs text-red-400">Total must equal 100%</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Producer</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newEntry.splitSheet.producer}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    splitSheet: { ...newEntry.splitSheet, producer: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Producer %</label>
                <input
                  type="number"
                  value={newEntry.splitSheet.producerPercent}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    splitSheet: { ...newEntry.splitSheet, producerPercent: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Artist</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newEntry.splitSheet.artist}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    splitSheet: { ...newEntry.splitSheet, artist: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Artist %</label>
                <input
                  type="number"
                  value={newEntry.splitSheet.artistPercent}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    splitSheet: { ...newEntry.splitSheet, artistPercent: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Songwriter</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newEntry.splitSheet.songwriter}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    splitSheet: { ...newEntry.splitSheet, songwriter: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Songwriter %</label>
                <input
                  type="number"
                  value={newEntry.splitSheet.songwriterPercent}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    splitSheet: { ...newEntry.splitSheet, songwriterPercent: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Publisher</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newEntry.splitSheet.publisher}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    splitSheet: { ...newEntry.splitSheet, publisher: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Publisher %</label>
                <input
                  type="number"
                  value={newEntry.splitSheet.publisherPercent}
                  onChange={(e) => setNewEntry({
                    ...newEntry,
                    splitSheet: { ...newEntry.splitSheet, publisherPercent: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleCreateEntry} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl">Create Entry</button>
            <button onClick={() => setShowCreateForm(false)} className="px-6 py-2 bg-neutral-800 text-white rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {/* Catalog Entries List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-neutral-800">
          <p className="text-neutral-400 text-sm">{entries.length} songs registered</p>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <Disc3 size={48} className="mx-auto mb-3 opacity-50" />
            <p>No catalog entries yet</p>
            <p className="text-sm">Click "New Song" to register your first track</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {entries.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-neutral-800/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{entry.title}</h3>
                      <span className="px-2 py-0.5 bg-neutral-800 rounded text-xs text-gold-400">{entry.genre}</span>
                    </div>
                    <p className="text-neutral-400">{entry.artist}</p>
                    <div className="flex gap-4 mt-2 text-sm text-neutral-500">
                      <span className="flex items-center gap-1"><Clock size={12} /> {entry.duration || '3:45'}</span>
                      <span className="flex items-center gap-1">🎵 {entry.bpm} BPM</span>
                      <span className="flex items-center gap-1">🎹 Key: {entry.key}</span>
                    </div>
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
                  </div>
                </div>

                {/* Split Sheet Summary */}
                {entry.splitSheet && (
                  <div className="bg-neutral-800/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gold-400 mb-2">Royalty Split</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {entry.splitSheet.producerPercent > 0 && <span><span className="text-neutral-500">Producer:</span> <span className="text-white">{entry.splitSheet.producerPercent}%</span></span>}
                      {entry.splitSheet.artistPercent > 0 && <span><span className="text-neutral-500">Artist:</span> <span className="text-white">{entry.splitSheet.artistPercent}%</span></span>}
                      {entry.splitSheet.songwriterPercent > 0 && <span><span className="text-neutral-500">Songwriter:</span> <span className="text-white">{entry.splitSheet.songwriterPercent}%</span></span>}
                      {entry.splitSheet.publisherPercent > 0 && <span><span className="text-neutral-500">Publisher:</span> <span className="text-white">{entry.splitSheet.publisherPercent}%</span></span>}
                    </div>
                  </div>
                )}

                {/* Songwriters & Publishing */}
                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  <div>
                    <span className="text-neutral-500">Songwriters:</span>
                    <span className="text-white ml-2">{entry.songwriters.join(', ')}</span>
                  </div>
                  {entry.publishingDetails && (
                    <div>
                      <span className="text-neutral-500">Publishing:</span>
                      <span className="text-white ml-2">{entry.publishingDetails}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-neutral-500">ISRC:</span>
                    <span className="text-white ml-2">{entry.isrc}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {!entry.isLocked && (
                  <div className="flex gap-3 pt-3 border-t border-neutral-800">
                    <button
                      onClick={() => initiateLock(entry)}
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