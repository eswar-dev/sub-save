/**
 * Sends a 6-digit OTP email via SendGrid REST API.
 * No SDK — pure fetch. Requires SENDGRID_API_KEY + SENDGRID_FROM_EMAIL env vars.
 */
export async function sendOTPEmail(to: string, code: string): Promise<void> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL, name: 'SubSmart' },
      subject: 'Your SubSmart code',
      content: [
        {
          type: 'text/plain',
          value: `Your SubSmart verification code: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
        },
        {
          type: 'text/html',
          value: `
            <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px 20px">
              <div style="font-size:22px;font-weight:900;color:#0F4C81;margin-bottom:8px">SubSmart</div>
              <div style="font-size:16px;color:#1e293b;margin-bottom:24px">Your verification code</div>
              <div style="font-size:42px;font-weight:900;letter-spacing:0.25em;color:#0F4C81;background:#dbeafe;padding:20px;border-radius:16px;text-align:center">${code}</div>
              <div style="font-size:13px;color:#475569;margin-top:20px">Expires in 10 minutes. If you didn't request this, ignore this email.</div>
            </div>
          `,
        },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`SendGrid error ${res.status}: ${body}`)
  }
}
