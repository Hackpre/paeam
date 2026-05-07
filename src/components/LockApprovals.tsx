import { useState } from 'react';
import { Lock, Users, Music, Shield, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface LockRequest {
  id: string;
  type: 'contract' | 'catalog';
  title: string;
  producerApproved: boolean;
  artistApproved: boolean;
  associationApproved: boolean;
  status: 'pending' | 'fully_locked';
  createdAt: string;
}

export default function LockApprovals() {
  const [pendingRequests, setPendingRequests] = useState<LockRequest[]>([
    {
      id: '1',
      type: 'contract',
      title: 'Yes You Reign Contract',
      producerApproved: true,
      artistApproved: false,
      associationApproved: false,
      status: 'pending',
      createdAt: '2026-05-07',
    },
  ]);

  const [lockedRecords, setLockedRecords] = useState<LockRequest[]>([
    {
      id: '2',
      type: 'contract',
      title: 'Contract @6e4f1f8-b25f-443f-b26b-77c63d4f6baa',
      producerApproved: true,
      artistApproved: true,
      associationApproved: true,
      status: 'fully_locked',
      createdAt: '2026-05-06',
    },
    {
      id: '3',
      type: 'contract',
      title: 'Contract @6e4f1f8-b25f-443f-b26b-77c63d4f6baa',
      producerApproved: true,
      artistApproved: true,
      associationApproved: true,
      status: 'fully_locked',
      createdAt: '2026-05-05',
    },
  ]);

  const approveAsArtist = (id: string) => {
    setPendingRequests(pendingRequests.map(req =>
      req.id === id ? { ...req, artistApproved: true } : req
    ));
  };

  const approveAsAssociation = (id: string) => {
    setPendingRequests(pendingRequests.map(req =>
      req.id === id ? { ...req, associationApproved: true } : req
    ));
    alert('Record fully locked! It is now immutable.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Lock size={28} className="text-gold-400" />
          <h1 className="text-2xl font-bold text-white">Lock Approvals</h1>
        </div>
        <p className="text-neutral-400 text-sm">Three-Way Lock System — Records become immutable once all three parties approve</p>
      </div>

      {/* Three-Way Lock Explanation */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Three-Way Lock System</h3>
          <p className="text-neutral-400 text-sm">Records become immutable once all three parties approve: <strong className="text-gold-400">Producer, Artist, and Association Witness</strong>. No one — including backend admins — can alter locked records without invalidating the cryptographic signatures.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-neutral-800 rounded-xl p-4">
            <Users size={24} className="text-gold-400 mx-auto mb-2" />
            <p className="text-white font-medium">Producer</p>
            <p className="text-neutral-500 text-xs">Initiates the lock</p>
          </div>
          <div className="bg-neutral-800 rounded-xl p-4">
            <Music size={24} className="text-blue-400 mx-auto mb-2" />
            <p className="text-white font-medium">Artist</p>
            <p className="text-neutral-500 text-xs">Confirms agreement</p>
          </div>
          <div className="bg-neutral-800 rounded-xl p-4">
            <Shield size={24} className="text-amber-400 mx-auto mb-2" />
            <p className="text-white font-medium">Association Witness</p>
            <p className="text-neutral-500 text-xs">Seals and finalizes</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            <h3 className="font-semibold text-white">Pending Approvals ({pendingRequests.length})</h3>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500 opacity-50" />
            <p>No pending approvals</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{request.title}</h4>
                    <p className="text-neutral-400 text-sm capitalize">{request.type} • Created {request.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.producerApproved && <CheckCircle2 size={16} className="text-green-500" />}
                    {request.artistApproved && <CheckCircle2 size={16} className="text-green-500" />}
                    {request.associationApproved && <CheckCircle2 size={16} className="text-green-500" />}
                  </div>
                </div>

                {/* Approval Status */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className={`rounded-lg p-3 text-center ${request.producerApproved ? 'bg-green-500/10 border border-green-500/20' : 'bg-neutral-800'}`}>
                    <p className="text-sm font-medium text-white">Producer</p>
                    <p className="text-xs mt-1">{request.producerApproved ? '✓ Approved' : 'Pending'}</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${request.artistApproved ? 'bg-green-500/10 border border-green-500/20' : 'bg-neutral-800'}`}>
                    <p className="text-sm font-medium text-white">Artist</p>
                    <p className="text-xs mt-1">{request.artistApproved ? '✓ Approved' : 'Pending'}</p>
                    {!request.artistApproved && (
                      <button onClick={() => approveAsArtist(request.id)} className="mt-2 text-xs text-gold-400 hover:text-gold-300">Approve</button>
                    )}
                  </div>
                  <div className={`rounded-lg p-3 text-center ${request.associationApproved ? 'bg-green-500/10 border border-green-500/20' : 'bg-neutral-800'}`}>
                    <p className="text-sm font-medium text-white">Association Witness</p>
                    <p className="text-xs mt-1">{request.associationApproved ? '✓ Approved' : 'Pending'}</p>
                    {request.artistApproved && !request.associationApproved && (
                      <button onClick={() => approveAsAssociation(request.id)} className="mt-2 text-xs text-gold-400 hover:text-gold-300">Finalize Lock</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fully Locked Records */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-gold-400" />
            <h3 className="font-semibold text-white">Fully Locked Records ({lockedRecords.length})</h3>
          </div>
        </div>

        {lockedRecords.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <Lock size={48} className="mx-auto mb-3 opacity-50" />
            <p>No locked records yet</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {lockedRecords.map((record) => (
              <div key={record.id} className="p-4 flex justify-between items-center hover:bg-neutral-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-gold-400" />
                  <div>
                    <p className="text-white font-medium">{record.title}</p>
                    <p className="text-neutral-500 text-xs capitalize">{record.type} • Locked {record.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-xs text-green-500">Producer</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-xs text-green-500">Artist</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="text-xs text-green-500">Association</span>
                </div>
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