import { useState } from 'react';
import { FileText, Plus, Lock, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

interface Contract {
  id: string;
  songTitle: string;
  contractType: 'exclusive' | 'non-exclusive';
  territory: string;
  royaltyPercent: number;
  mechanicalPercent: number;
  performancePercent: number;
  publishingPercent: number;
  durationMonths: number;
  paymentSchedule: string;
  status: 'active' | 'locked' | 'pending';
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: '1',
      songTitle: 'Yes You Reign',
      contractType: 'non-exclusive',
      territory: 'Malawi',
      royaltyPercent: 60,
      mechanicalPercent: 20,
      performancePercent: 10,
      publishingPercent: 10,
      durationMonths: 12,
      paymentSchedule: 'Quarterly',
      status: 'active',
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContract, setNewContract] = useState({
    catalogEntry: '',
    contractType: 'non-exclusive',
    territory: 'Malawi',
    royaltyPercent: 50,
    mechanicalPercent: 20,
    performancePercent: 15,
    publishingPercent: 15,
    durationMonths: 12,
    paymentSchedule: 'Monthly',
  });

  const handleCreateContract = () => {
    if (!newContract.catalogEntry) return;
    
    const contract: Contract = {
      id: Date.now().toString(),
      songTitle: newContract.catalogEntry,
      contractType: newContract.contractType as 'exclusive' | 'non-exclusive',
      territory: newContract.territory,
      royaltyPercent: newContract.royaltyPercent,
      mechanicalPercent: newContract.mechanicalPercent,
      performancePercent: newContract.performancePercent,
      publishingPercent: newContract.publishingPercent,
      durationMonths: newContract.durationMonths,
      paymentSchedule: newContract.paymentSchedule,
      status: 'active',
    };
    
    setContracts([contract, ...contracts]);
    setShowCreateForm(false);
  };

  const initiateLock = (id: string) => {
    setContracts(contracts.map(c => 
      c.id === id ? { ...c, status: 'locked' } : c
    ));
    alert('Three-Way Lock initiated! Artist and Association approval required.');
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
            <p className="text-neutral-400 text-sm">Manage royalty agreements and contract terms</p>
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">New Contract</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-300 mb-1">Catalog Entry *</label>
              <select
                value={newContract.catalogEntry}
                onChange={(e) => setNewContract({ ...newContract, catalogEntry: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="">Select a song</option>
                <option value="Yes You Reign">Yes You Reign</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Contract Type *</label>
              <select
                value={newContract.contractType}
                onChange={(e) => setNewContract({ ...newContract, contractType: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              >
                <option value="exclusive">Exclusive</option>
                <option value="non-exclusive">Non-Exclusive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Territory</label>
              <input
                type="text"
                value={newContract.territory}
                onChange={(e) => setNewContract({ ...newContract, territory: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Duration (months)</label>
              <input
                type="number"
                value={newContract.durationMonths}
                onChange={(e) => setNewContract({ ...newContract, durationMonths: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Payment Schedule</label>
              <select
                value={newContract.paymentSchedule}
                onChange={(e) => setNewContract({ ...newContract, paymentSchedule: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Bi-Annually">Bi-Annually</option>
                <option value="Annually">Annually</option>
              </select>
            </div>
          </div>

          {/* Royalty Splits */}
          <div className="mt-6">
            <h4 className="text-md font-semibold text-white mb-3">% Royalty Splits (%)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Royalty %</label>
                <input
                  type="number"
                  value={newContract.royaltyPercent}
                  onChange={(e) => setNewContract({ ...newContract, royaltyPercent: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Mechanical %</label>
                <input
                  type="number"
                  value={newContract.mechanicalPercent}
                  onChange={(e) => setNewContract({ ...newContract, mechanicalPercent: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Performance %</label>
                <input
                  type="number"
                  value={newContract.performancePercent}
                  onChange={(e) => setNewContract({ ...newContract, performancePercent: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Publishing %</label>
                <input
                  type="number"
                  value={newContract.publishingPercent}
                  onChange={(e) => setNewContract({ ...newContract, publishingPercent: parseInt(e.target.value) })}
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
                  {contract.status === 'locked' ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-gold-500/10 rounded-full">
                      <Lock size={14} className="text-gold-400" />
                      <span className="text-xs text-gold-400 font-medium">Locked</span>
                    </div>
                  ) : contract.status === 'active' ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full">
                      <AlertTriangle size={14} className="text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">Pending</span>
                    </div>
                  )}
                </div>

                {/* Royalty Splits */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-neutral-800 rounded-lg p-3 text-center">
                    <p className="text-neutral-500 text-xs">Royalty</p>
                    <p className="text-white font-bold">{contract.royaltyPercent}%</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-3 text-center">
                    <p className="text-neutral-500 text-xs">Mechanical</p>
                    <p className="text-white font-bold">{contract.mechanicalPercent}%</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-3 text-center">
                    <p className="text-neutral-500 text-xs">Performance</p>
                    <p className="text-white font-bold">{contract.performancePercent}%</p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-3 text-center">
                    <p className="text-neutral-500 text-xs">Publishing</p>
                    <p className="text-white font-bold">{contract.publishingPercent}%</p>
                  </div>
                </div>

                {/* Contract Details */}
                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  <span className="text-neutral-400">📍 Territory: <span className="text-white">{contract.territory}</span></span>
                  <span className="text-neutral-400">⏱️ Duration: <span className="text-white">{contract.durationMonths} months</span></span>
                  <span className="text-neutral-400">📅 Payment: <span className="text-white">{contract.paymentSchedule}</span></span>
                </div>

                {/* Action Button */}
                {contract.status !== 'locked' && (
                  <button
                    onClick={() => initiateLock(contract.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black font-medium rounded-lg transition-colors text-sm"
                  >
                    <Lock size={14} /> Initiate Three-Way Lock
                  </button>
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