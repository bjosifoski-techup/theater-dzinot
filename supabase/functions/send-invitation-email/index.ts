import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface InvitationRequest {
  email: string;
  role: string;
  token: string;
  inviterName: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const { email, role, token, inviterName }: InvitationRequest = await req.json();

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    const invitationUrl = `${appUrl}?invitation=${token}`;
    
    const emailData = {
      sender: {
        name: 'Theater Box',
        email: 'teatar@techup.me',
      },
      to: [
        {
          email: email,
          name: email,
        },
      ],
      subject: role === 'admin' ? 'Invitation to Join as Administrator' : 'Invitation to Join as Sales Person',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎭 Theater Box</h1>
              <p>You've been invited to join our team!</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${inviterName}</strong> has invited you to join Theater Box as a <strong>${role === 'admin' ? 'Administrator' : 'Sales Person'}</strong>.</p>
              <p>As a ${role === 'admin' ? 'administrator' : 'sales person'}, you will have access to:</p>
              <ul>
                ${role === 'admin' ? `
                  <li>Complete system management</li>
                  <li>Play and venue management</li>
                  <li>User account management</li>
                  <li>Sales reports and analytics</li>
                ` : `
                  <li>Box office ticket sales</li>
                  <li>Customer check-in</li>
                  <li>View performance schedules</li>
                  <li>Process bookings and payments</li>
                `}
              </ul>
              <p>Click the button below to accept your invitation and set up your account:</p>
              <p style="text-align: center;">
                <a href="${invitationUrl}" class="button">Accept Invitation</a>
              </p>
              <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>Theater Box - Professional Theater Management System</p>
              <p>© 2024 Theater Box. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo API error: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});