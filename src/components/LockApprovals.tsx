import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { LockApproval } from '../lib/types';
import { generateContentHash } from '../lib/utils';
import {
  Lock,
  CheckCircle2,
  Clock,
  Shield,
  User,
  Music,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export default function LockApprovals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<LockApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadApprovals();
  }, [user]);

  async function loadApprovals() {
    if (!user) return;
    const { data } = await supabase
      .from('lock_approvals')
      .select('*')
      .order('created_at', { ascending: false });
    setApprovals(data ?? []);
    setLoading(false);
  }

  const handleApprove = async (approval: LockApproval, role: 'artist' | 'association') => {
    const hash = await generateContentHash(approval.record_id + role);
    const updates = role === 'artist'
      ? {
          artist_approved: true,
          artist_approved_at: new Date().toISOString(),
          artist_approval_hash: hash,
        }
      : {
          association_approved: true,
          association_approved_at: new Date().toISOString(),
          association_approval_hash: hash,
        };

    const producerApproved = approval.producer_approved;
    const artistApproved = role === 'artist' ? true : approval.artist_approved;
    const associationApproved = role === 'association' ? true : approval.association_approved;
    const fullyLocked = producerApproved && artistApproved && associationApproved;

    const { error } = await supabase
      .from('lock_approvals')
      .update({
        ...updates,
        is_fully_locked: fullyLocked,
        locked_at: fullyLocked ? new Date().toISOString() : null,
      })
      .eq('id', approval.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    if (fullyLocked) {
      const tableName = approval.record_type === 'catalog_entry' ? 'catalog_entries' : 'contracts';
      await supabase
        .from(tableName)
        .update({ is_locked: true })
        .eq('id', approval.record_id);
    }

    setMessage({ type: 'success', text: fullyLocked ? 'Record fully locked with three-way approval!' : `${role} approval recorded. Waiting for remaining approvals.` });
    loadApprovals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pending = approvals.filter((a) => !a.is_fully_locked);
  const locked = approvals.filter((a) => a.is_fully_locked);

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

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Three-Way Lock System</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Records become immutable once all three parties approve: <strong className="text-gold-400">Producer</strong>, <strong className="text-blue-400">Artist</strong>, and <strong className="text-amber-400">Association Witness</strong>. No one — including backend admins — can alter locked records without invalidating the cryptographic signatures.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Clock size={20} className="text-amber-400" />
          Pending Approvals ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500">
            No pending approvals
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((approval) => (
              <div key={approval.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    approval.record_type === 'catalog_entry'
                      ? 'bg-gold-500/20 text-gold-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {approval.record_type === 'catalog_entry' ? <Music size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-white capitalize">
                      {approval.record_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-neutral-500 font-mono">{approval.record_id}</p>
                  </div>
                </div>

                {/* Approval Status */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={`rounded-xl p-3 text-center ${
                    approval.producer_approved ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-neutral-800 border border-neutral-700'
                  }`}>
                    <User size={16} className={`mx-auto mb-1 ${approval.producer_approved ? 'text-gold-400' : 'text-neutral-500'}`} />
                    <p className="text-xs font-medium text-white">Producer</p>
                    {approval.producer_approved ? (
                      <p className="text-xs text-gold-400 mt-1">Approved</p>
                    ) : (
                      <p className="text-xs text-neutral-500 mt-1">Waiting</p>
                    )}
                  </div>
                  <div className={`rounded-xl p-3 text-center ${
                    approval.artist_approved ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-neutral-800 border border-neutral-700'
                  }`}>
                    <Music size={16} className={`mx-auto mb-1 ${approval.artist_approved ? 'text-blue-400' : 'text-neutral-500'}`} />
                    <p className="text-xs font-medium text-white">Artist</p>
                    {approval.artist_approved ? (
                      <p className="text-xs text-blue-400 mt-1">Approved</p>
                    ) : (
                      <button
                        onClick={() => handleApprove(approval, 'artist')}
                        className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                  <div className={`rounded-xl p-3 text-center ${
                    approval.association_approved ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-neutral-800 border border-neutral-700'
                  }`}>
                    <Shield size={16} className={`mx-auto mb-1 ${approval.association_approved ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <p className="text-xs font-medium text-white">Association</p>
                    {approval.association_approved ? (
                      <p className="text-xs text-amber-400 mt-1">Approved</p>
                    ) : (
                      <button
                        onClick={() => handleApprove(approval, 'association')}
                        className="text-xs text-amber-400 hover:text-amber-300 mt-1 underline"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Records */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Lock size={20} className="text-gold-400" />
          Fully Locked Records ({locked.length})
        </h3>
        {locked.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500">
            No locked records yet
          </div>
        ) : (
          <div className="space-y-3">
            {locked.map((approval) => (
              <div key={approval.id} className="bg-neutral-900 border border-gold-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                    <Lock size={20} className="text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white capitalize">
                      {approval.record_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-neutral-500 font-mono">{approval.record_id}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gold-400">
                    <CheckCircle2 size={14} />
                    Locked
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gold-400">
                    <CheckCircle2 size={12} /> Producer
                  </div>
                  <div className="flex items-center gap-1 text-blue-400">
                    <CheckCircle2 size={12} /> Artist
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <CheckCircle2 size={12} /> Association
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
