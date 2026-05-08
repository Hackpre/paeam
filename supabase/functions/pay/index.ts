import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYCHANGU_SECRET_KEY = 'SEC-TEST-ztuaEwTvvkIATtwmyYE3zsuk3HxjSm7a';
const PAYCHANGU_PUBLIC_KEY = 'PUB-TEST-svlkFM7w0cRITzXHSiRWiAxmmMPGEbgU';
const PAYCHANGU_API = 'https://api.paychangu.com';

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

    const body = await req.json();
    const { action } = body;

    // --- INITIATE MOBILE MONEY PAYMENT ---
    if (req.method === 'POST' && action === 'initiate') {
      const { payment_type, amount, return_url, payment_method, phone_number } = body;

      if (!payment_method || !['airtel_money', 'tnm_mpamba'].includes(payment_method)) {
        throw new Error('Invalid payment method. Use airtel_money or tnm_mpamba for mobile money.');
      }

      const reference = `PAEAM-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

      const { data: profile } = await supabase
        .from('producer_profiles')
        .select('id, full_legal_name, email, phone_number, membership_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const paymentAmount = amount || (
        payment_type === 'membership' ? 15000 :
        payment_type === 'late_renewal' ? 18750 :
        payment_type === 'contract_registration' ? 5000 : 15000
      );

      const payerPhone = phone_number || profile?.phone_number || '';
      const payerEmail = profile?.email || user.email || '';
      const payerName = profile?.full_legal_name || user.email || '';

      if (!payerPhone) {
        throw new Error('Phone number is required for mobile money payment.');
      }

      const payResponse = await fetch(`${PAYCHANGU_API}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'MWK',
          email: payerEmail,
          phone: payerPhone,
          full_name: payerName,
          description: `PAEAM ${payment_type === 'membership' ? 'Annual Membership' : payment_type === 'late_renewal' ? 'Late Renewal' : payment_type === 'contract_registration' ? 'Contract Registration' : 'Payment'}`,
          reference,
          callback_url: `${new URL(req.url).origin}/functions/v1/pay`,
          return_url: return_url || `${new URL(req.url).origin}`,
          meta: {
            payment_type: payment_type || 'membership',
            user_id: user.id,
            producer_id: profile?.id || '',
          },
        }),
      });

      const payData = await payResponse.json();

      if (payData.status === 'success' && payData.data?.checkout_url) {
        await supabase.from('payments').insert({
          user_id: user.id,
          producer_id: profile?.id || null,
          amount: paymentAmount,
          currency: 'MWK',
          payment_type: payment_type || 'membership',
          status: 'pending',
          paychangu_tx_id: payData.data?.tx_ref || payData.tx_ref || '',
          paychangu_reference: reference,
          payment_method: payment_method,
          description: `PAEAM ${payment_type || 'membership'} payment via ${payment_method === 'airtel_money' ? 'Airtel Money' : 'TNM Mpamba'}`,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'payment_initiated',
          record_type: 'payment',
          record_id: reference,
          new_data: { amount: paymentAmount, type: payment_type, reference, method: payment_method, phone: payerPhone },
        });

        return new Response(JSON.stringify({
          status: 'success',
          payment_url: payData.data.checkout_url,
          reference,
          tx_ref: payData.data?.tx_ref || '',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const errMsg = payData.message || payData.error || 'Payment initiation failed';
        throw new Error(errMsg);
      }
    }

    // --- SUBMIT BANK TRANSFER PROOF ---
    if (req.method === 'POST' && action === 'bank_transfer') {
      const { payment_type, amount, proof_url } = body;

      if (!proof_url) {
        throw new Error('Proof of payment URL is required for bank transfer.');
      }

      const { data: profile } = await supabase
        .from('producer_profiles')
        .select('id, full_legal_name, email, membership_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const paymentAmount = amount || (
        payment_type === 'membership' ? 15000 :
        payment_type === 'late_renewal' ? 18750 :
        payment_type === 'contract_registration' ? 5000 : 15000
      );

      const reference = `PAEAM-BANK-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

      const { data: payment, error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          producer_id: profile?.id || null,
          amount: paymentAmount,
          currency: 'MWK',
          payment_type: payment_type || 'membership',
          status: 'bank_transfer_pending',
          paychangu_reference: reference,
          payment_method: 'national_bank',
          proof_of_payment_url: proof_url,
          description: `PAEAM ${payment_type || 'membership'} payment via National Bank transfer`,
        })
        .select()
        .maybeSingle();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update membership status to bank_transfer_pending
      if (profile && (payment_type === 'membership' || payment_type === 'late_renewal')) {
        await supabase
          .from('producer_profiles')
          .update({ membership_status: 'bank_transfer_pending' })
          .eq('id', profile.id);
      }

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'bank_transfer_submitted',
        record_type: 'payment',
        record_id: reference,
        new_data: { amount: paymentAmount, type: payment_type, reference, proof_url },
      });

      return new Response(JSON.stringify({
        status: 'success',
        message: 'Bank transfer proof submitted. Your account will be activated within 24 hours after admin verification.',
        reference,
        payment_id: payment?.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- ADMIN: CONFIRM/REJECT BANK TRANSFER ---
    if (req.method === 'POST' && action === 'confirm_bank_transfer') {
      const { payment_id, decision, admin_notes } = body;

      if (!payment_id || !['approved', 'rejected'].includes(decision)) {
        throw new Error('payment_id and decision (approved/rejected) are required.');
      }

      // Verify admin role
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'paeam_admin'])
        .maybeSingle();

      if (!adminRole) {
        throw new Error('Only admins can confirm bank transfers.');
      }

      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('id', payment_id)
        .maybeSingle();

      if (!payment) {
        throw new Error('Payment not found.');
      }

      if (payment.status !== 'bank_transfer_pending') {
        throw new Error('Payment is not pending bank transfer verification.');
      }

      if (decision === 'approved') {
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            completed_at: now,
            reviewed_by: user.id,
            reviewed_at: now,
            admin_notes: admin_notes || 'Approved by admin',
          })
          .eq('id', payment_id);

        if (updateError) throw new Error(updateError.message);

        // Activate membership
        if (payment.payment_type === 'membership' || payment.payment_type === 'late_renewal') {
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          await supabase
            .from('producer_profiles')
            .update({
              membership_status: 'active',
              membership_expires_at: expiresAt.toISOString(),
            })
            .eq('user_id', payment.user_id);
        }

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'bank_transfer_approved',
          record_type: 'payment',
          record_id: payment_id,
          new_data: { amount: payment.amount, reference: payment.paychangu_reference, admin_notes },
        });

        // Send notification to user
        await supabase.from('notifications').insert({
          user_id: payment.user_id,
          type: 'payment_confirmation',
          title: 'Payment Confirmed',
          message: `Your bank transfer payment of ${payment.amount} MWK has been verified and approved. Your membership is now active.`,
          channel: 'email',
          status: 'queued',
          reference_type: 'payment',
          reference_id: payment_id,
        });

        return new Response(JSON.stringify({
          status: 'success',
          message: 'Bank transfer approved. Membership activated.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Rejected
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            reviewed_by: user.id,
            reviewed_at: now,
            admin_notes: admin_notes || 'Rejected by admin',
          })
          .eq('id', payment_id);

        if (updateError) throw new Error(updateError.message);

        // Revert membership status
        if (payment.producer_id) {
          await supabase
            .from('producer_profiles')
            .update({ membership_status: 'trial' })
            .eq('id', payment.producer_id);
        }

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'bank_transfer_rejected',
          record_type: 'payment',
          record_id: payment_id,
          new_data: { amount: payment.amount, reference: payment.paychangu_reference, admin_notes },
        });

        // Send notification to user
        await supabase.from('notifications').insert({
          user_id: payment.user_id,
          type: 'payment_rejected',
          title: 'Payment Rejected',
          message: `Your bank transfer payment of ${payment.amount} MWK was not verified. Reason: ${admin_notes || 'Proof of payment could not be confirmed.'}`,
          channel: 'email',
          status: 'queued',
          reference_type: 'payment',
          reference_id: payment_id,
        });

        return new Response(JSON.stringify({
          status: 'success',
          message: 'Bank transfer rejected.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // --- WEBHOOK (PayChangu callback) ---
    if (req.method === 'POST' && action === 'webhook') {
      const { event, data } = body;

      if (event === 'payment.completed' || event === 'charge.completed' || data?.status === 'successful') {
        const reference = data?.reference || data?.tx_ref || data?.meta?.reference;
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('paychangu_reference', reference)
          .maybeSingle();

        if (payment && payment.status !== 'completed') {
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              paychangu_tx_id: data?.transaction_id || data?.flw_ref || payment.paychangu_tx_id,
              payment_method: data?.payment_method || data?.channel || payment.payment_method,
              completed_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

          if (payment.payment_type === 'membership' || payment.payment_type === 'late_renewal') {
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);

            await supabase
              .from('producer_profiles')
              .update({
                membership_status: 'active',
                membership_expires_at: expiresAt.toISOString(),
              })
              .eq('user_id', payment.user_id);
          }

          await supabase.from('audit_logs').insert({
            actor_id: payment.user_id,
            action: 'payment_completed',
            record_type: 'payment',
            record_id: payment.id,
            new_data: { amount: payment.amount, type: payment.payment_type, reference, method: payment.payment_method },
          });
        }
      }

      if (event === 'payment.failed' || data?.status === 'failed') {
        const reference = data?.reference || data?.tx_ref;
        if (reference) {
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('paychangu_reference', reference)
            .neq('status', 'completed');
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- GET PAYMENT HISTORY ---
    if (req.method === 'GET') {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ payments: payments || [] }), {
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
