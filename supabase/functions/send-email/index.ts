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

    const body = await req.json();
    const { to, subject, template_type, data } = body;

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('Email service not configured');

    const templates: Record<string, { subject: string; html: string }> = {
      welcome: {
        subject: 'Welcome to PAEAM - Verify Your Email',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border:1px solid #262626;border-radius:16px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#d4a017;font-size:28px;margin:0;">PAEAM</h1>
              <p style="color:#737373;font-size:14px;margin-top:4px;">Producers & Audio Engineering Association of Malawi</p>
            </div>
            <h2 style="color:#fff;font-size:22px;">Welcome, ${data?.name || 'Producer'}!</h2>
            <p style="color:#a3a3a3;line-height:1.6;">Your registration is almost complete. Please verify your email to activate your account.</p>
            ${data?.otp ? `<div style="background:#1a1a1a;border:1px solid #d4a017;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <p style="color:#737373;font-size:12px;margin:0 0 8px;">Your verification code (expires in 15 minutes):</p>
              <p style="color:#d4a017;font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;">${data.otp}</p>
            </div>` : ''}
            ${data?.link ? `<div style="text-align:center;margin:24px 0;">
              <a href="${data.link}" style="background:#d4a017;color:#000;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Verify Email</a>
            </div>` : ''}
            <p style="color:#525252;font-size:12px;margin-top:32px;border-top:1px solid #262626;padding-top:16px;">If you did not create an account, please ignore this email.</p>
          </div>`,
      },
      login_otp: {
        subject: 'PAEAM Login Verification Code',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border:1px solid #262626;border-radius:16px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#d4a017;font-size:28px;margin:0;">PAEAM</h1>
            </div>
            <h2 style="color:#fff;">Login Verification</h2>
            <p style="color:#a3a3a3;">Use this code to complete your login (expires in 10 minutes):</p>
            <div style="background:#1a1a1a;border:1px solid #d4a017;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <p style="color:#d4a017;font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;">${data?.otp}</p>
            </div>
            ${data?.device ? `<p style="color:#525252;font-size:12px;">Device: ${data.device}</p>` : ''}
            ${data?.ip ? `<p style="color:#525252;font-size:12px;">IP: ${data.ip}</p>` : ''}
            <p style="color:#525252;font-size:12px;margin-top:24px;">If this wasn't you, please secure your account immediately.</p>
          </div>`,
      },
      payment_confirmation: {
        subject: 'PAEAM Payment Confirmed',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border:1px solid #262626;border-radius:16px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#d4a017;font-size:28px;margin:0;">PAEAM</h1>
            </div>
            <h2 style="color:#fff;">Payment Confirmed</h2>
            <p style="color:#a3a3a3;">Your payment has been processed successfully.</p>
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin:24px 0;">
              <p style="color:#d4a017;font-size:24px;font-weight:bold;margin:0;">MWK ${data?.amount || '0'}</p>
              <p style="color:#737373;font-size:14px;margin-top:4px;">${data?.type || 'Membership'} Payment</p>
              <p style="color:#525252;font-size:12px;margin-top:8px;">Reference: ${data?.reference || ''}</p>
            </div>
            <p style="color:#a3a3a3;">Your membership is now active. Thank you for your support!</p>
          </div>`,
      },
      payment_reminder: {
        subject: 'PAEAM Membership Renewal Reminder',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border:1px solid #262626;border-radius:16px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#d4a017;font-size:28px;margin:0;">PAEAM</h1>
            </div>
            <h2 style="color:#fff;">Membership Renewal</h2>
            <p style="color:#a3a3a3;">Your PAEAM membership ${data?.days ? `expires in ${data.days} days` : 'has expired'}.</p>
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin:24px 0;">
              <p style="color:#d4a017;font-size:20px;font-weight:bold;margin:0;">MWK ${data?.amount || '15,000'}</p>
              <p style="color:#737373;font-size:14px;margin-top:4px;">Annual Membership Fee</p>
              ${data?.overdue ? '<p style="color:#ef4444;font-size:14px;margin-top:8px;">Late fee of MWK 18,750 applies after 30 days</p>' : ''}
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="${data?.pay_url || '#'}" style="background:#d4a017;color:#000;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Renew Now</a>
            </div>
          </div>`,
      },
      lock_notification: {
        subject: 'PAEAM Lock Request - Action Required',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border:1px solid #262626;border-radius:16px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#d4a017;font-size:28px;margin:0;">PAEAM</h1>
            </div>
            <h2 style="color:#fff;">Three-Way Lock Request</h2>
            <p style="color:#a3a3a3;">${data?.initiator || 'A producer'} has initiated a lock on a ${data?.record_type || 'record'}.</p>
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin:24px 0;">
              <p style="color:#fff;font-weight:600;margin:0;">${data?.title || 'Record'}</p>
              <p style="color:#737373;font-size:14px;margin-top:4px;">Your approval is required to complete the three-way lock.</p>
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="${data?.approve_url || '#'}" style="background:#d4a017;color:#000;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Review & Approve</a>
            </div>
            <p style="color:#525252;font-size:12px;">Once all three parties approve, the record becomes immutable.</p>
          </div>`,
      },
      lock_completed: {
        subject: 'PAEAM Record Locked - Immutable',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border:1px solid #262626;border-radius:16px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#d4a017;font-size:28px;margin:0;">PAEAM</h1>
            </div>
            <h2 style="color:#22c55e;">Record Successfully Locked</h2>
            <p style="color:#a3a3a3;">The three-way lock has been completed. This record is now immutable.</p>
            <div style="background:#1a1a1a;border:1px solid #22c55e;border-radius:12px;padding:20px;margin:24px 0;">
              <p style="color:#fff;font-weight:600;margin:0;">${data?.title || 'Record'}</p>
              <p style="color:#737373;font-size:12px;margin-top:8px;font-family:monospace;">Hash: ${data?.hash || ''}</p>
            </div>
            <p style="color:#525252;font-size:12px;">This record can no longer be modified. Any changes require a new version.</p>
          </div>`,
      },
    };

    const emailSubject = subject || templates[template_type]?.subject || 'PAEAM Notification';
    const emailHtml = templates[template_type]?.html || `<div style="font-family:system-ui;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;"><h2 style="color:#fff;">${subject || 'Notification'}</h2><p style="color:#a3a3a3;">${data?.message || ''}</p></div>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PAEAM <noreply@paeam.mw>',
        to: [to || user.email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: template_type || 'info',
      title: emailSubject,
      message: emailSubject,
      channel: 'email',
      status: 'sent',
      reference_type: data?.record_type || '',
      reference_id: data?.record_id || '',
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, email_id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
