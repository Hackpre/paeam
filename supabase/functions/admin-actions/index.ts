import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    // Verify admin role
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['super_admin', 'paeam_admin'])
      .maybeSingle();

    if (!adminRole) throw new Error('Only admins can perform this action.');

    const body = await req.json();
    const { action } = body;

    // --- VERIFY PRODUCER ---
    if (action === 'verify_producer') {
      const { producer_id } = body;
      if (!producer_id) throw new Error('producer_id is required.');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('producer_profiles')
        .update({
          association_verification_status: 'verified',
          verified_at: now,
          verified_by: user.id,
        })
        .eq('id', producer_id);

      if (error) throw new Error(error.message);

      const { data: producer } = await supabase
        .from('producer_profiles')
        .select('user_id, email, full_legal_name')
        .eq('id', producer_id)
        .maybeSingle();

      if (producer) {
        await supabase.from('notifications').insert({
          user_id: producer.user_id,
          type: 'producer_verified',
          title: 'Producer Verification Approved',
          message: `Your producer profile has been verified by PAEAM. You now have full access to all features.`,
          channel: 'email',
          status: 'queued',
          reference_type: 'producer_profile',
          reference_id: producer_id,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'producer_verified',
          record_type: 'producer_profile',
          record_id: producer_id,
          new_data: { verified_by: user.id, verified_at: now },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'Producer verified.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- REJECT PRODUCER ---
    if (action === 'reject_producer') {
      const { producer_id, reason } = body;
      if (!producer_id) throw new Error('producer_id is required.');

      const { error } = await supabase
        .from('producer_profiles')
        .update({ association_verification_status: 'rejected' })
        .eq('id', producer_id);

      if (error) throw new Error(error.message);

      const { data: producer } = await supabase
        .from('producer_profiles')
        .select('user_id, email')
        .eq('id', producer_id)
        .maybeSingle();

      if (producer) {
        await supabase.from('notifications').insert({
          user_id: producer.user_id,
          type: 'producer_rejected',
          title: 'Producer Verification Rejected',
          message: `Your producer profile verification was not approved. Reason: ${reason || 'Documentation could not be verified.'}`,
          channel: 'email',
          status: 'queued',
          reference_type: 'producer_profile',
          reference_id: producer_id,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'producer_rejected',
          record_type: 'producer_profile',
          record_id: producer_id,
          new_data: { reason: reason || 'Not specified' },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'Producer rejected.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- APPROVE SONG ---
    if (action === 'approve_song') {
      const { song_id } = body;
      if (!song_id) throw new Error('song_id is required.');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('catalog_entries')
        .update({
          approval_status: 'approved',
          admin_approved_at: now,
          admin_approved_by: user.id,
          approved_at: now,
          approved_by: user.id,
        })
        .eq('id', song_id);

      if (error) throw new Error(error.message);

      const { data: song } = await supabase
        .from('catalog_entries')
        .select('song_title, producer_id, producer_profiles(user_id)')
        .eq('id', song_id)
        .maybeSingle();

      if (song) {
        const producerUserId = (song.producer_profiles as any)?.user_id;
        if (producerUserId) {
          await supabase.from('notifications').insert({
            user_id: producerUserId,
            type: 'song_approved',
            title: 'Your song has been approved by PAEAM',
            message: `Your song "${song.song_title}" has been approved. You can now initiate a Three-Way Lock to protect it.`,
            channel: 'email',
            status: 'queued',
            reference_type: 'catalog_entry',
            reference_id: song_id,
          });
        }

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'song_approved',
          record_type: 'catalog_entry',
          record_id: song_id,
          new_data: { song_title: song.song_title, approved_at: now },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'Song approved.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- REJECT SONG ---
    if (action === 'reject_song') {
      const { song_id, reason } = body;
      if (!song_id) throw new Error('song_id is required.');
      if (!reason) throw new Error('Rejection reason is required.');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('catalog_entries')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          rejection_date: now,
        })
        .eq('id', song_id);

      if (error) throw new Error(error.message);

      const { data: song } = await supabase
        .from('catalog_entries')
        .select('song_title, producer_id, producer_profiles(user_id)')
        .eq('id', song_id)
        .maybeSingle();

      if (song) {
        const producerUserId = (song.producer_profiles as any)?.user_id;
        if (producerUserId) {
          await supabase.from('notifications').insert({
            user_id: producerUserId,
            type: 'song_rejected',
            title: 'Your song requires revision',
            message: `Your song "${song.song_title}" was rejected. Reason: ${reason}. Please revise and resubmit.`,
            channel: 'email',
            status: 'queued',
            reference_type: 'catalog_entry',
            reference_id: song_id,
          });
        }

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'song_rejected',
          record_type: 'catalog_entry',
          record_id: song_id,
          new_data: { song_title: song.song_title, reason },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'Song rejected.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- APPROVE CONTRACT ---
    if (action === 'approve_contract') {
      const { contract_id } = body;
      if (!contract_id) throw new Error('contract_id is required.');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('contracts')
        .update({
          approval_status: 'approved',
          admin_approved_at: now,
          admin_approved_by: user.id,
          approved_at: now,
          approved_by: user.id,
        })
        .eq('id', contract_id);

      if (error) throw new Error(error.message);

      const { data: contract } = await supabase
        .from('contracts')
        .select('contract_type, catalog_entry_id, catalog_entries(song_title, producer_id, producer_profiles(user_id))')
        .eq('id', contract_id)
        .maybeSingle();

      if (contract) {
        const producerUserId = (contract.catalog_entries as any)?.producer_profiles?.user_id;
        if (producerUserId) {
          await supabase.from('notifications').insert({
            user_id: producerUserId,
            type: 'contract_approved',
            title: 'Contract Approved by PAEAM',
            message: `Your ${contract.contract_type.replace(/_/g, ' ')} contract has been approved. You can now initiate a Three-Way Lock.`,
            channel: 'email',
            status: 'queued',
            reference_type: 'contract',
            reference_id: contract_id,
          });
        }

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'contract_approved',
          record_type: 'contract',
          record_id: contract_id,
          new_data: { contract_type: contract.contract_type, approved_at: now },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'Contract approved.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- REJECT CONTRACT ---
    if (action === 'reject_contract') {
      const { contract_id, reason } = body;
      if (!contract_id) throw new Error('contract_id is required.');
      if (!reason) throw new Error('Rejection reason is required.');

      const now = new Date().toISOString();
      const { error } = await supabase
        .from('contracts')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          rejection_date: now,
        })
        .eq('id', contract_id);

      if (error) throw new Error(error.message);

      const { data: contract } = await supabase
        .from('contracts')
        .select('contract_type, catalog_entries(producer_id, producer_profiles(user_id))')
        .eq('id', contract_id)
        .maybeSingle();

      if (contract) {
        const producerUserId = (contract.catalog_entries as any)?.producer_profiles?.user_id;
        if (producerUserId) {
          await supabase.from('notifications').insert({
            user_id: producerUserId,
            type: 'contract_rejected',
            title: 'Contract Requires Revision',
            message: `Your ${contract.contract_type.replace(/_/g, ' ')} contract was not approved. Reason: ${reason}`,
            channel: 'email',
            status: 'queued',
            reference_type: 'contract',
            reference_id: contract_id,
          });
        }

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'contract_rejected',
          record_type: 'contract',
          record_id: contract_id,
          new_data: { contract_type: contract.contract_type, reason },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'Contract rejected.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- FINALIZE THREE-WAY LOCK ---
    if (action === 'finalize_lock') {
      const { lock_id } = body;
      if (!lock_id) throw new Error('lock_id is required.');

      const { data: lockApproval } = await supabase
        .from('lock_approvals')
        .select('*')
        .eq('id', lock_id)
        .maybeSingle();

      if (!lockApproval) throw new Error('Lock approval record not found.');
      if (!lockApproval.producer_approved) throw new Error('Cannot finalize lock: Producer has not approved yet.');
      if (!lockApproval.artist_approved) throw new Error('Cannot finalize lock: Artist has not approved yet.');
      if (lockApproval.association_approved) throw new Error('This lock has already been finalized.');

      const now = new Date().toISOString();

      const { error: lockError } = await supabase
        .from('lock_approvals')
        .update({
          association_approved: true,
          association_approved_at: now,
          association_approval_hash: `sha256-assoc-${Date.now()}`,
          association_id: user.id,
          is_fully_locked: true,
          locked_at: now,
          lock_completed_at: now,
        })
        .eq('id', lock_id);

      if (lockError) throw new Error(lockError.message);

      if (lockApproval.record_type === 'catalog_entry') {
        const { data: entry } = await supabase
          .from('catalog_entries')
          .select('id, song_title, artist_names, genre, isrc_code, producer_name')
          .eq('id', lockApproval.record_id)
          .maybeSingle();

        if (entry) {
          const contentData = JSON.stringify({
            song_title: entry.song_title,
            artist_names: entry.artist_names,
            genre: entry.genre,
            isrc_code: entry.isrc_code,
            producer_name: entry.producer_name,
            locked_at: now,
          });
          const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentData));
          const contentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

          await supabase
            .from('catalog_entries')
            .update({
              is_locked: true,
              content_hash: contentHash,
              approval_status: 'fully_locked',
            })
            .eq('id', lockApproval.record_id);

          // Notify producer
          const { data: producerProfile } = await supabase
            .from('catalog_entries')
            .select('producer_id, producer_profiles(user_id, full_legal_name)')
            .eq('id', lockApproval.record_id)
            .maybeSingle();

          if (producerProfile) {
            const producerUserId = (producerProfile.producer_profiles as any)?.user_id;
            if (producerUserId) {
              await supabase.from('notifications').insert({
                user_id: producerUserId,
                type: 'lock_finalized',
                title: 'Record locked by PAEAM',
                message: `The record "${entry.song_title}" has been fully locked and is now immutable. Content hash: ${contentHash.substring(0, 16)}...`,
                channel: 'email',
                status: 'queued',
                reference_type: 'lock_approval',
                reference_id: lock_id,
              });
            }
          }

          // Notify artist if artist_id exists
          if (lockApproval.artist_id) {
            await supabase.from('notifications').insert({
              user_id: lockApproval.artist_id,
              type: 'lock_finalized',
              title: 'Record locked by PAEAM',
              message: `The record "${entry.song_title}" has been fully locked and is now immutable.`,
              channel: 'email',
              status: 'queued',
              reference_type: 'lock_approval',
              reference_id: lock_id,
            });
          }
        }
      } else if (lockApproval.record_type === 'contract') {
        const { data: contract } = await supabase
          .from('contracts')
          .select('id, contract_type, catalog_entries(song_title, producer_id, producer_profiles(user_id))')
          .eq('id', lockApproval.record_id)
          .maybeSingle();

        if (contract) {
          const contentData = JSON.stringify({
            contract_type: contract.contract_type,
            locked_at: now,
          });
          const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentData));
          const contentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

          await supabase
            .from('contracts')
            .update({
              is_locked: true,
              content_hash: contentHash,
              approval_status: 'fully_locked',
            })
            .eq('id', lockApproval.record_id);

          const producerUserId = (contract.catalog_entries as any)?.producer_profiles?.user_id;
          if (producerUserId) {
            await supabase.from('notifications').insert({
              user_id: producerUserId,
              type: 'lock_finalized',
              title: 'Contract Locked and Immutable',
              message: `Your ${contract.contract_type.replace(/_/g, ' ')} contract has been sealed by PAEAM and is now legally protected.`,
              channel: 'email',
              status: 'queued',
              reference_type: 'lock_approval',
              reference_id: lock_id,
            });
          }

          if (lockApproval.artist_id) {
            await supabase.from('notifications').insert({
              user_id: lockApproval.artist_id,
              type: 'lock_finalized',
              title: 'Record locked by PAEAM',
              message: `The contract for "${(contract.catalog_entries as any)?.song_title || 'Unknown'}" has been fully locked and is now immutable.`,
              channel: 'email',
              status: 'queued',
              reference_type: 'lock_approval',
              reference_id: lock_id,
            });
          }
        }
      }

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'lock_finalized',
        record_type: lockApproval.record_type,
        record_id: lockApproval.record_id,
        new_data: {
          lock_id,
          finalized_by: user.id,
          finalized_at: now,
          producer_approved: true,
          artist_approved: true,
          association_approved: true,
        },
      });

      return new Response(JSON.stringify({ status: 'success', message: 'Three-Way Lock finalized. Record is now immutable.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- ASSIGN IPI NUMBER ---
    if (action === 'assign_ipi') {
      const { ipi_request_id, ipi_number } = body;
      if (!ipi_request_id) throw new Error('ipi_request_id is required.');
      if (!ipi_number) throw new Error('ipi_number is required.');

      const now = new Date().toISOString();

      // Update the ipi_requests table
      const { error: reqError } = await supabase
        .from('ipi_requests')
        .update({
          status: 'approved',
          assigned_ipi: ipi_number,
          admin_approved_at: now,
          admin_approved_by: user.id,
        })
        .eq('id', ipi_request_id);

      if (reqError) throw new Error(reqError.message);

      // Get the request to find producer
      const { data: ipiReq } = await supabase
        .from('ipi_requests')
        .select('producer_id, requested_by')
        .eq('id', ipi_request_id)
        .maybeSingle();

      if (ipiReq) {
        // Update producer profile with IPI number
        await supabase
          .from('producer_profiles')
          .update({ ipi_number: ipi_number })
          .eq('id', ipiReq.producer_id);

        // Also update ipi_applications if exists
        await supabase
          .from('ipi_applications')
          .update({
            status: 'assigned',
            ipi_number: ipi_number,
            reviewed_by: user.id,
            reviewed_at: now,
          })
          .eq('producer_id', ipiReq.producer_id)
          .eq('status', 'pending');

        // Notify producer
        await supabase.from('notifications').insert({
          user_id: ipiReq.requested_by,
          type: 'ipi_assigned',
          title: 'Your IPI number has been assigned',
          message: `Your IPI number ${ipi_number} has been assigned by Cosoma via PAEAM.`,
          channel: 'email',
          status: 'queued',
          reference_type: 'ipi_request',
          reference_id: ipi_request_id,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'ipi_assigned',
          record_type: 'ipi_request',
          record_id: ipi_request_id,
          new_data: { ipi_number, assigned_at: now },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'IPI number assigned.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- REJECT IPI REQUEST ---
    if (action === 'reject_ipi') {
      const { ipi_request_id, reason } = body;
      if (!ipi_request_id) throw new Error('ipi_request_id is required.');

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('ipi_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason || 'Not specified',
          admin_approved_by: user.id,
        })
        .eq('id', ipi_request_id);

      if (error) throw new Error(error.message);

      const { data: ipiReq } = await supabase
        .from('ipi_requests')
        .select('requested_by')
        .eq('id', ipi_request_id)
        .maybeSingle();

      if (ipiReq) {
        await supabase.from('notifications').insert({
          user_id: ipiReq.requested_by,
          type: 'ipi_rejected',
          title: 'IPI Number Request Rejected',
          message: `Your IPI number request was not approved. Reason: ${reason || 'Not specified'}`,
          channel: 'email',
          status: 'queued',
          reference_type: 'ipi_request',
          reference_id: ipi_request_id,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'ipi_rejected',
          record_type: 'ipi_request',
          record_id: ipi_request_id,
          new_data: { reason: reason || 'Not specified' },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: 'IPI request rejected.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- REVIEW DISPUTE ---
    if (action === 'review_dispute') {
      const { dispute_id, new_status, resolution } = body;
      if (!dispute_id) throw new Error('dispute_id is required.');
      if (!new_status) throw new Error('new_status is required.');

      const validStatuses = ['under_review', 'mediation', 'arbitration', 'resolved', 'dismissed'];
      if (!validStatuses.includes(new_status)) throw new Error('Invalid dispute status.');

      const now = new Date().toISOString();
      const updates: Record<string, unknown> = { status: new_status };
      if (resolution) updates.resolution = resolution;
      if (new_status === 'resolved' || new_status === 'dismissed') {
        updates.resolved_by = user.id;
        updates.resolved_at = now;
      }

      const { error } = await supabase
        .from('disputes')
        .update(updates)
        .eq('id', dispute_id);

      if (error) throw new Error(error.message);

      const { data: dispute } = await supabase
        .from('disputes')
        .select('filed_by, dispute_type')
        .eq('id', dispute_id)
        .maybeSingle();

      if (dispute) {
        await supabase.from('notifications').insert({
          user_id: dispute.filed_by,
          type: 'dispute_updated',
          title: `Dispute ${new_status.replace(/_/g, ' ')}`,
          message: `Your ${dispute.dispute_type} dispute has been updated to: ${new_status.replace(/_/g, ' ')}.${resolution ? ` Resolution: ${resolution}` : ''}`,
          channel: 'email',
          status: 'queued',
          reference_type: 'dispute',
          reference_id: dispute_id,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'dispute_reviewed',
          record_type: 'dispute',
          record_id: dispute_id,
          new_data: { status: new_status, resolution },
        });
      }

      return new Response(JSON.stringify({ status: 'success', message: `Dispute updated to ${new_status}.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- ARTIST APPROVE LOCK ---
    if (action === 'artist_approve_lock') {
      const { lock_id } = body;
      if (!lock_id) throw new Error('lock_id is required.');

      const { data: lockApproval } = await supabase
        .from('lock_approvals')
        .select('*')
        .eq('id', lock_id)
        .maybeSingle();

      if (!lockApproval) throw new Error('Lock approval record not found.');
      if (!lockApproval.producer_approved) throw new Error('Producer has not initiated this lock yet.');
      if (lockApproval.artist_approved) throw new Error('Artist has already approved this lock.');

      const now = new Date().toISOString();
      const hash = `sha256-artist-${lock_id}-${Date.now()}`;

      const { error } = await supabase
        .from('lock_approvals')
        .update({
          artist_approved: true,
          artist_approved_at: now,
          artist_approval_hash: hash,
          artist_id: user.id,
        })
        .eq('id', lock_id);

      if (error) throw new Error(error.message);

      // Update the record's approval_status to pending_association_approval
      const tableName = lockApproval.record_type === 'catalog_entry' ? 'catalog_entries' : 'contracts';
      await supabase
        .from(tableName)
        .update({ approval_status: 'pending_association_approval' })
        .eq('id', lockApproval.record_id);

      // Notify producer
      const { data: record } = await supabase
        .from(tableName)
        .select('song_title, producer_id, producer_profiles(user_id)')
        .eq('id', lockApproval.record_id)
        .maybeSingle();

      if (record) {
        const producerUserId = (record.producer_profiles as any)?.user_id;
        if (producerUserId) {
          await supabase.from('notifications').insert({
            user_id: producerUserId,
            type: 'artist_approved_lock',
            title: 'Artist approved your lock request',
            message: `The artist has approved the lock on "${record.song_title || 'your record'}". Waiting for PAEAM Association to finalize.`,
            channel: 'email',
            status: 'queued',
            reference_type: 'lock_approval',
            reference_id: lock_id,
          });
        }
      }

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'artist_approved_lock',
        record_type: lockApproval.record_type,
        record_id: lockApproval.record_id,
        new_data: { lock_id, artist_approved: true, approved_at: now },
      });

      return new Response(JSON.stringify({ status: 'success', message: 'Artist approval recorded. Waiting for PAEAM Association to finalize.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- GET PENDING COUNTS ---
    if (action === 'pending_counts') {
      const { count: pendingProducers } = await supabase
        .from('producer_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('association_verification_status', 'pending');

      const { count: pendingSongs } = await supabase
        .from('catalog_entries')
        .select('*', { count: 'exact', head: true })
        .in('approval_status', ['pending', 'pending_admin_approval']);

      const { count: pendingContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .in('approval_status', ['pending', 'pending_admin_approval']);

      const { count: pendingLocks } = await supabase
        .from('lock_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('producer_approved', true)
        .eq('artist_approved', true)
        .eq('association_approved', false);

      const { count: pendingBankTransfers } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'bank_transfer_pending');

      const { count: pendingIpiRequests } = await supabase
        .from('ipi_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingDisputes } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['filed', 'pending_admin_review']);

      return new Response(JSON.stringify({
        pendingProducers: pendingProducers || 0,
        pendingSongs: pendingSongs || 0,
        pendingContracts: pendingContracts || 0,
        pendingLocks: pendingLocks || 0,
        pendingBankTransfers: pendingBankTransfers || 0,
        pendingIpiRequests: pendingIpiRequests || 0,
        pendingDisputes: pendingDisputes || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
