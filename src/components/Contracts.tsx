import { useState, useEffect } from 'react';
import { FileText, Plus, Lock, CheckCircle2, AlertTriangle, Users, DollarSign, Calendar, MapPin, Clock, TrendingUp } from 'lucide-react';

interface Contract {
  id: string;
  catalogEntryId: string;
  songTitle: string;
  contractType: 'exclusive' | 'non-exclusive' | 'work-for-hire';
  territory: string;
  durationMonths: number;
  startDate: string;
  endDate: string;
  paymentSchedule: 'monthly' | 'quarterly' | 'biannually' | 'annually' | 'one-time';
  royaltyPercent: number;
  mechanicalPercent: number;
  performancePercent: number;
  publishingPercent: number;
  synchronizationPercent: number;
  producerName: string;
  artistName: string;
  songwriterName: string;
  publisherName: string;
  status: 'draft' | 'active' | 'locked' | 'expired';
  isLocked: boolean;
  createdAt: string;
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContract, setNewContract] = useState<any>({
    catalogEntryId: '',
    songTitle: '',
    contractType: 'non-exclusive',
    territory: 'Malawi',
    durationMonths: 12,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    paymentSchedule: 'quarterly',
    royaltyPercent: 50,
    mechanicalPercent: 20,
    performancePercent: 15,
    publishingPercent: 10,
    synchronizationPercent: 5,
    producerName: '',
    artistName: '',
    songwriterName: '',
    publisherName: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('paeam_contracts');
    if (saved) {
      setContracts(JSON.parse(saved));
    }
    const savedCatalog = localStorage.getItem('paeam_catalog');
    if (savedCatalog) {
      setCatalogEntries(JSON.parse(savedCatalog));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('paeam_contracts', JSON.stringify(contracts));
    window.dispatchEvent(new CustomEvent('contractUpdated', { detail: contracts.length }));
  }, [contracts]);

  const handleCatalogSelect = (id: string) => {
    const selected = catalogEntries.find(c => c.id === id);
    if (selected) {
      setNewContract({
        ...newContract,
        catalogEntryId: selected.id,
        songTitle: selected.title,
        producerName: selected.splitSheet?.producer || '',
        artistName: selected.artist,
        songwriterName: selected.songwriters?.join(', ') || '',
      });
    }
  };

  const calculateTotal = () => {
    return newContract.royaltyPercent + newContract.mechanicalPercent + 
           newContract.performancePercent + newContract.publishingPercent + 
           newContract.synchronizationPercent;
  };

  const handleCreateContract = () => {
    if (!newContract.catalogEntryId) {
      alert('Please select a catalog entry');
      return;
    }
    
    const total = calculateTotal();
    if (total !== 100) {
      alert(`Total royalty split must equal 100%. Current total: ${total}%`);
      return;
    }
    
    const endDate = new Date(newContract.startDate);
    endDate.setMonth(endDate.getMonth() + newContract.durationMonths);
    
    const contract: Contract = {
      id: Date.now().toString(),
      catalogEntryId: newContract.catalogEntryId,
      songTitle: newContract.songTitle,
      contractType: newContract.contractType,
      territory: newContract.territory,
      durationMonths: newContract.durationMonths,
      startDate: newContract.startDate,
      endDate: endDate.toISOString().split('T')[0],
      paymentSchedule: newContract.paymentSchedule,
      royaltyPercent: newContract.royaltyPercent,
      mechanicalPercent: newContract.mechanicalPercent,
      performancePercent: newContract.performancePercent,
      publishingPercent: newContract.publishingPercent,
      synchronizationPercent: newContract.synchronizationPercent,
      producerName: newContract.producerName,
      artistName: newContract.artistName,
      songwriterName: newContract.songwriterName,
      publisherName: newContract.publisherName,
      status: 'active',
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    
    setContracts([contract, ...contracts]);
    setShowCreateForm(false);
    setNewContract({
      catalogEntryId: '',
      songTitle: '',
      contractType: 'non-exclusive',
      territory: 'Malawi',
      durationMonths: 12,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      paymentSchedule: 'quarterly',
      royaltyPercent: 50,
      mechanicalPercent: 20,
      performancePercent: 15,
      publishingPercent: 10,
      synchronizationPercent: 5,
      producerName: '',
      artistName: '',
      songwriterName: '',
      publisherName: '',
    });
    
    alert('Contract created successfully!');
  };

  const initiateLock = (contract: Contract) => {
    const updated = contracts.map(c => 
      c.id === contract.id ? { ...c, isLocked: true, status: 'locked' } : c
    );
    setContracts(updated);
    
    const lockRequests = JSON.parse(localStorage.getItem('paeam_lock_requests') || '[]');
    lockRequests.unshift({
      id: Date.now().toString(),
      type: 'contract',
      title: contract.songTitle,
      producerApproved: true,
      artistApproved: false,
      associationApproved: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata: {
        contractType: contract.contractType,
        territory: contract.territory,
        durationMonths: contract.durationMonths,
        splits: {
          royalty: contract.royaltyPercent,
          mechanical: contract.mechanicalPercent,
          performance: contract.performancePercent,
          publishing: contract.publishingPercent,
          synchronization: contract.synchronizationPercent,
        },
      },
    });
    localStorage.setItem('paeam_lock_requests', JSON.stringify(lockRequests));
    
    alert('Three-Way Lock initiated! Waiting for Artist and Association approval.');
  };

  const getStatusBadge = (contract: Contract) => {
    if (contract.isLocked) {
      return <span className="flex items-center gap-1 px-2 py-1 bg-gold-500/10 rounded-full text-xs text-gold-400"><Lock size={12} /> Locked</span>;
    }
    if (contract.status === 'active') {
      return <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full text-xs text-green-400"><CheckCircle2 size={12} /> Active</span>;
    }
    if (contract.status === 'expired') {
      return <span className="flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded-full text-xs text-red-400"><AlertTriangle size={12} /> Expired</span>;
    }
    return <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full text-xs text-amber-400"><Clock size={12} /> Draft</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText size={28} className="text-gold-400" />
              <h1 className="text-2xl font-bold text-white">Contracts & Royalties</h1>
            </div>
            <p className="text-neutral-400 text-sm">Manage royalty agreements, split sheets, and contract terms</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl transition-colors"
          >
            <Plus size={18} /> New Contract
          </button>
        </div>
      </div>

      {/* Create Contract Form */}
      {showCreateForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">Create New Contract</h3>
          
          {/* Catalog Selection */}
          <div className="border-b border-neutral-800 pb-4 mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">Select Catalog Entry *</label>
            <select
              value={newContract.catalogEntryId}
              onChange={(e) => handleCatalogSelect(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="">-- Select a song --</option>
              {catalogEntries.map(entry => (
                <option key={entry.id} value={entry.id}>{entry.title} - {entry.artist}</option>
              ))}
            </select>
          </div>

          {/* Contract Details */}
          <div className="border-b border-neutral-800 pb-4 mb-4">
            <h4 className="text-lg font-semibold text-gold-400 mb-3">Contract Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Contract Type</label>
                <select
                  value={newContract.contractType}
                  onChange={(e) => setNewContract({ ...newContract, contractType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                >
                  <option value="exclusive">Exclusive Agreement</option>
                  <option value="non-exclusive">Non-Exclusive Agreement</option>
                  <option value="work-for-hire">Work for Hire</option>
                </select>
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Territory</label>
                <input
                  type="text"
                  value={newContract.territory}
                  onChange={(e) => setNewContract({ ...newContract, territory: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Duration (months)</label>
                <input
                  type="number"
                  value={newContract.durationMonths}
                  onChange={(e) => setNewContract({ ...newContract, durationMonths: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Payment Schedule</label>
                <select
                  value={newContract.paymentSchedule}
                  onChange={(e) => setNewContract({ ...newContract, paymentSchedule: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="biannually">Bi-Annually</option>
                  <option value="annually">Annually</option>
                  <option value="one-time">One-Time Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Start Date</label>
                <input
                  type="date"
                  value={newContract.startDate}
                  onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>

          {/* Royalty Splits */}
          <div className="border-b border-neutral-800 pb-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-gold-400">Royalty Splits (%)</h4>
              {calculateTotal() !== 100 && (
                <span className="text-xs text-red-400">Total must equal 100% (Current: {calculateTotal()}%)</span>
              )}
              {calculateTotal() === 100 && (
                <span className="text-xs text-green-400">✓ Balanced</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Royalty %</label>
                <input
                  type="number"
                  value={newContract.royaltyPercent}
                  onChange={(e) => setNewContract({ ...newContract, royaltyPercent: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Mechanical %</label>
                <input
                  type="number"
                  value={newContract.mechanicalPercent}
                  onChange={(e) => setNewContract({ ...newContract, mechanicalPercent: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Performance %</label>
                <input
                  type="number"
                  value={newContract.performancePercent}
                  onChange={(e) => setNewContract({ ...newContract, performancePercent: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Publishing %</label>
                <input
                  type="number"
                  value={newContract.publishingPercent}
                  onChange={(e) => setNewContract({ ...newContract, publishingPercent: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Synchronization %</label>
                <input
                  type="number"
                  value={newContract.synchronizationPercent}
                  onChange={(e) => setNewContract({ ...newContract, synchronizationPercent: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="border-b border-neutral-800 pb-4 mb-4">
            <h4 className="text-lg font-semibold text-gold-400 mb-3">Contract Parties</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Producer</label>
                <input
                  type="text"
                  value={newContract.producerName}
                  onChange={(e) => setNewContract({ ...newContract, producerName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Artist</label>
                <input
                  type="text"
                  value={newContract.artistName}
                  onChange={(e) => setNewContract({ ...newContract, artistName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Songwriter</label>
                <input
                  type="text"
                  value={newContract.songwriterName}
                  onChange={(e) => setNewContract({ ...newContract, songwriterName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-sm mb-1">Publisher</label>
                <input
                  type="text"
                  value={newContract.publisherName}
                  onChange={(e) => setNewContract({ ...newContract, publisherName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleCreateContract} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-semibold rounded-xl">Create Contract</button>
            <button onClick={() => setShowCreateForm(false)} className="px-6 py-2 bg-neutral-800 text-white rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {/* Contracts List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-neutral-800">
          <p className="text-neutral-400 text-sm">{contracts.length} contracts registered</p>
        </div>

        {contracts.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>No contracts yet</p>
            <p className="text-sm">Create a contract for one of your catalog entries</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-6 hover:bg-neutral-800/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{contract.songTitle}</h3>
                    <p className="text-neutral-400 capitalize">{contract.contractType} Agreement</p>
                  </div>
                  {getStatusBadge(contract)}
                </div>

                {/* Contract Details */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-sm">
                  <div className="bg-neutral-800 rounded-lg p-2 text-center">
                    <MapPin size={14} className="text-gold-400 mx-auto mb-1" />
                    <p className="text-neutral-500 text-xs">Territory</p>
                    <p className="text-white text-xs">{contract.territory}</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-2 text-center">
                    <Calendar size={14} className="text-gold-400 mx-auto mb-1" />
                    <p className="text-neutral-500 text-xs">Duration</p>
                    <p className="text-white text-xs">{contract.durationMonths} months</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-2 text-center">
                    <TrendingUp size={14} className="text-gold-400 mx-auto mb-1" />
                    <p className="text-neutral-500 text-xs">Payment</p>
                    <p className="text-white text-xs capitalize">{contract.paymentSchedule}</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-2 text-center">
                    <Calendar size={14} className="text-gold-400 mx-auto mb-1" />
                    <p className="text-neutral-500 text-xs">Start Date</p>
                    <p className="text-white text-xs">{contract.startDate}</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-2 text-center">
                    <Calendar size={14} className="text-gold-400 mx-auto mb-1" />
                    <p className="text-neutral-500 text-xs">End Date</p>
                    <p className="text-white text-xs">{contract.endDate}</p>
                  </div>
                </div>

                {/* Royalty Splits */}
                <div className="bg-neutral-800/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gold-400 mb-2">Royalty Split</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {contract.royaltyPercent > 0 && <span><span className="text-neutral-500">Royalty:</span> <span className="text-white">{contract.royaltyPercent}%</span></span>}
                    {contract.mechanicalPercent > 0 && <span><span className="text-neutral-500">Mechanical:</span> <span className="text-white">{contract.mechanicalPercent}%</span></span>}
                    {contract.performancePercent > 0 && <span><span className="text-neutral-500">Performance:</span> <span className="text-white">{contract.performancePercent}%</span></span>}
                    {contract.publishingPercent > 0 && <span><span className="text-neutral-500">Publishing:</span> <span className="text-white">{contract.publishingPercent}%</span></span>}
                    {contract.synchronizationPercent > 0 && <span><span className="text-neutral-500">Sync:</span> <span className="text-white">{contract.synchronizationPercent}%</span></span>}
                  </div>
                </div>

                {/* Action Buttons */}
                {!contract.isLocked && (
                  <div className="flex gap-3 pt-3 border-t border-neutral-800">
                    <button
                      onClick={() => initiateLock(contract)}
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