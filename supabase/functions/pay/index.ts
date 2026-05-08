import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
      const { payment_type, amount, return_url } = body;

      const paychanguKey = Deno.env.get('PAYCHANGU_SECRET_KEY');
      if (!paychanguKey) throw new Error('PayChangu not configured');

      const reference = `PAEAM-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

      const { data: profile } = await supabase
        .from('producer_profiles')
        .select('id, full_legal_name, email, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();

      const paymentAmount = amount || (payment_type === 'membership' ? 15000 : payment_type === 'late_renewal' ? 18750 : payment_type === 'contract_registration' ? 5000 : 15000);

      const payResponse = await fetch(`${PAYCHANGU_API}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paychanguKey}`,
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'MWK',
          email: profile?.email || user.email,
          phone: profile?.phone_number || '',
          full_name: profile?.full_legal_name || user.email,
          description: `PAEAM ${payment_type === 'membership' ? 'Annual Membership' : payment_type === 'late_renewal' ? 'Late Renewal' : payment_type === 'contract_registration' ? 'Contract Registration' : 'Payment'}`,
          reference,
          callback_url: `${new URL(req.url).origin}/functions/v1/pay`,
          return_url: return_url || `${new URL(req.url).origin}/dashboard`,
        }),
      });

      const payData = await payResponse.json();

      if (payData.status === 'success') {
        await supabase.from('payments').insert({
          user_id: user.id,
          producer_id: profile?.id,
          amount: paymentAmount,
          currency: 'MWK',
          payment_type: payment_type || 'membership',
          status: 'pending',
          paychangu_tx_id: payData.tx_ref || '',
          paychangu_reference: reference,
          description: `PAEAM ${payment_type || 'membership'} payment`,
        });

        return new Response(JSON.stringify({ status: 'success', payment_url: payData.payment_url, reference }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error(payData.message || 'Payment initiation failed');
      }
    }

    if (req.method === 'POST' && action === 'webhook') {
      const { event, data } = body;

      if (event === 'payment.completed' || event === 'charge.completed') {
        const reference = data?.reference || data?.tx_ref;
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('paychangu_reference', reference)
          .maybeSingle();

        if (payment) {
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              paychangu_tx_id: data?.transaction_id || payment.paychangu_tx_id,
              payment_method: data?.payment_method || '',
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
            new_data: { amount: payment.amount, type: payment.payment_type, reference },
          });
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
