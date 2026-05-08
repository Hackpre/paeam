import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { LockApproval } from '../lib/types';
import { generateContentHash, formatDateTime, truncateHash } from '../lib/utils';
import {
  Lock,
  CheckCircle2,
  Clock,
  Shield,
  User,
  Music,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

function StepIndicator({ label, icon, approved, approvedAt, isLast }: {
  label: string;
  icon: React.ReactNode;
  approved: boolean;
  approvedAt: string | null;
  isLast: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
          approved
            ? 'bg-green-500/20 border-green-500 text-green-400'
            : 'bg-neutral-800 border-neutral-700 text-neutral-500'
        }`}>
          {approved ? <CheckCircle2 size={18} /> : icon}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-8 mt-1 ${approved ? 'bg-green-500/40' : 'bg-neutral-700'}`} />
        )}
      </div>
      <div className="pt-1.5">
        <p className={`text-sm font-medium ${approved ? 'text-green-400' : 'text-neutral-400'}`}>
          {label}
        </p>
        {approved && approvedAt && (
          <p className="text-xs text-neutral-500 mt-0.5">{formatDateTime(approvedAt)}</p>
        )}
        {!approved && (
          <p className="text-xs text-neutral-500 mt-0.5">Waiting...</p>
        )}
      </div>
    </div>
  );
}

export default function LockApprovals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<LockApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadApprovals();
  }, [user]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function loadApprovals() {
    if (!user) return;
    const { data } = await supabase
      .from('lock_approvals')
      .select('*')
      .order('created_at', { ascending: false });
    setApprovals(data ?? []);
    setLoading(false);
  }

  const handleApprove = async (approval: LockApproval, role: 'producer' | 'artist' | 'association') => {
    setApproving(`${approval.id}-${role}`);
    try {
      // Use edge function for artist and association approvals
      if (role === 'artist') {
        const { data: { session } } = await supabase.auth.getSession();
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: 'artist_approve_lock', lock_id: approval.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Action failed.');
      } else if (role === 'association') {
        const { data: { session } } = await supabase.auth.getSession();
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: 'finalize_lock', lock_id: approval.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Action failed.');
      } else {
        // Producer approval - direct update
        const hash = await generateContentHash(approval.record_id + role + Date.now());
        const { error } = await supabase
          .from('lock_approvals')
          .update({
            producer_approved: true,
            producer_approved_at: new Date().toISOString(),
            producer_approval_hash: hash,
            lock_initiated_at: new Date().toISOString(),
          })
          .eq('id', approval.id);

        if (error) throw new Error(error.message);

        // Update record status to pending_artist_approval
        const tableName = approval.record_type === 'catalog_entry' ? 'catalog_entries' : 'contracts';
        await supabase.from(tableName).update({ approval_status: 'pending_artist_approval' }).eq('id', approval.record_id);

        await supabase.from('audit_logs').insert({
          actor_id: user?.id || '',
          action: 'lock_approved',
          record_type: approval.record_type,
          record_id: approval.record_id,
          new_data: { role, approved: true },
        });
      }

      setMessage({
        type: 'success',
        text: role === 'association'
          ? 'Three-Way Lock finalized. Record is now immutable.'
          : `${role.charAt(0).toUpperCase() + role.slice(1)} approval recorded. Waiting for remaining approvals.`,
      });
      loadApprovals();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setApproving(null);
    }
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

  function getWorkflowStatus(approval: LockApproval) {
    if (approval.producer_approved && approval.artist_approved && !approval.association_approved) {
      return { label: 'Pending Association Finalization', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    }
    if (approval.producer_approved && !approval.artist_approved) {
      return { label: 'Pending Artist Approval', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    }
    if (!approval.producer_approved) {
      return { label: 'Pending Producer Initiation', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    }
    return { label: 'In Progress', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-gold-500/10 border border-gold-500/20 text-gold-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-gold-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Three-Way Lock System</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Records become immutable once all three parties approve:{' '}
              <strong className="text-gold-400">Producer</strong>,{' '}
              <strong className="text-gold-400">Artist</strong>, and{' '}
              <strong className="text-gold-400">Association Witness</strong>. The Association (PAEAM Admin) is the final
              approver who seals the lock. No one -- including backend admins -- can alter locked records
              without invalidating the cryptographic signatures.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Clock size={20} className="text-gold-400" />
          Pending Approvals ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500">
            No pending approvals
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((approval) => {
              const workflowStatus = getWorkflowStatus(approval);
              return (
                <div
                  key={approval.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center text-gold-400">
                      {approval.record_type === 'catalog_entry' ? (
                        <Music size={20} />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white capitalize">
                        {approval.record_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-neutral-500 font-mono">
                        {approval.record_id}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${workflowStatus.color}`}>
                      {workflowStatus.label}
                    </span>
                  </div>

                  {/* Three-Way Lock Workflow Steps */}
                  <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Three-Way Lock Workflow</p>
                    <div className="space-y-0">
                      <StepIndicator
                        label="Step 1: Producer Initiated"
                        icon={<User size={18} />}
                        approved={approval.producer_approved}
                        approvedAt={approval.producer_approved_at}
                        isLast={false}
                      />
                      <StepIndicator
                        label="Step 2: Artist Approved"
                        icon={<Music size={18} />}
                        approved={approval.artist_approved}
                        approvedAt={approval.artist_approved_at}
                        isLast={false}
                      />
                      <StepIndicator
                        label="Step 3: Association Witness (Final)"
                        icon={<Shield size={18} />}
                        approved={approval.association_approved}
                        approvedAt={approval.association_approved_at}
                        isLast={true}
                      />
                    </div>
                  </div>

                  {/* Approval Actions */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Producer Card */}
                    <div
                      className={`rounded-xl p-3 text-center ${
                        approval.producer_approved
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-neutral-800 border border-neutral-700'
                      }`}
                    >
                      <User
                        size={16}
                        className={`mx-auto mb-1 ${
                          approval.producer_approved ? 'text-green-400' : 'text-neutral-500'
                        }`}
                      />
                      <p className="text-xs font-medium text-white">Producer</p>
                      {approval.producer_approved ? (
                        <p className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 size={10} /> Approved
                        </p>
                      ) : (
                        <button
                          onClick={() => handleApprove(approval, 'producer')}
                          disabled={approving === `${approval.id}-producer`}
                          className="mt-1 text-xs bg-gold-600 text-neutral-950 px-2 py-0.5 rounded hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approving === `${approval.id}-producer` ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                    </div>

                    {/* Artist Card */}
                    <div
                      className={`rounded-xl p-3 text-center ${
                        approval.artist_approved
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-neutral-800 border border-neutral-700'
                      }`}
                    >
                      <Music
                        size={16}
                        className={`mx-auto mb-1 ${
                          approval.artist_approved ? 'text-green-400' : 'text-neutral-500'
                        }`}
                      />
                      <p className="text-xs font-medium text-white">Artist</p>
                      {approval.artist_approved ? (
                        <p className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 size={10} /> Approved
                        </p>
                      ) : (
                        <button
                          onClick={() => handleApprove(approval, 'artist')}
                          disabled={approving === `${approval.id}-artist`}
                          className="mt-1 text-xs bg-gold-600 text-neutral-950 px-2 py-0.5 rounded hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approving === `${approval.id}-artist` ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                    </div>

                    {/* Association Card */}
                    <div
                      className={`rounded-xl p-3 text-center ${
                        approval.association_approved
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-neutral-800 border border-neutral-700'
                      }`}
                    >
                      <Shield
                        size={16}
                        className={`mx-auto mb-1 ${
                          approval.association_approved ? 'text-green-400' : 'text-neutral-500'
                        }`}
                      />
                      <p className="text-xs font-medium text-white">Association</p>
                      {approval.association_approved ? (
                        <p className="text-xs text-green-400 mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 size={10} /> Approved
                        </p>
                      ) : (
                        <button
                          onClick={() => handleApprove(approval, 'association')}
                          disabled={approving === `${approval.id}-association`}
                          className="mt-1 text-xs bg-gold-600 text-neutral-950 px-2 py-0.5 rounded hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approving === `${approval.id}-association` ? 'Approving...' : 'Seal Lock'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pending Association Finalization Notice */}
                  {approval.producer_approved && approval.artist_approved && !approval.association_approved && (
                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
                      <Shield size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-blue-400 font-medium">Awaiting Association Finalization</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Producer and Artist have both approved. The PAEAM Association Witness must now seal the lock to make this record immutable.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fully Locked Records */}
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
              <div
                key={approval.id}
                className="bg-neutral-900 border border-gold-500/20 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                    <Lock size={20} className="text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white capitalize">
                      {approval.record_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-neutral-500 font-mono">
                      {approval.record_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2.5 py-1 rounded-full">
                    <Lock size={12} /> Fully Locked
                  </div>
                </div>

                {/* Three checkmarks with workflow */}
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                    <CheckCircle2 size={10} /> Producer
                  </div>
                  <ArrowRight size={12} className="text-neutral-600" />
                  <div className="flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                    <CheckCircle2 size={10} /> Artist
                  </div>
                  <ArrowRight size={12} className="text-neutral-600" />
                  <div className="flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                    <CheckCircle2 size={10} /> Association
                  </div>
                </div>

                {/* Lock timestamp and content hash */}
                <div className="mt-3 pt-3 border-t border-neutral-800 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-neutral-500">Locked at</p>
                    <p className="text-neutral-300 font-mono">
                      {formatDateTime(approval.locked_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Content hash</p>
                    <p className="text-neutral-300 font-mono">
                      {truncateHash(
                        approval.producer_approval_hash ||
                          approval.artist_approval_hash ||
                          approval.association_approval_hash
                      )}
                    </p>
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
