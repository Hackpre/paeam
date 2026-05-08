import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYCHANGU_SECRET_KEY = 'SEC-TEST-1wYSeLGT0nMlYVKwx4tjtV29AYfn6aHl';
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

    if (req.method === 'POST' && action === 'initiate') {
      const { payment_type, amount, return_url, payment_method, phone_number } = body;

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
          return_url: return_url || `${new URL(req.url).origin}/dashboard`,
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
          payment_method: payment_method || '',
          description: `PAEAM ${payment_type || 'membership'} payment`,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'payment_initiated',
          record_type: 'payment',
          record_id: reference,
          new_data: { amount: paymentAmount, type: payment_type, reference, method: payment_method },
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
              payment_method: data?.payment_method || data?.channel || '',
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
