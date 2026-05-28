import { Resend } from 'resend'

let _resend: Resend | undefined

export function getResend(): Resend {
  _resend ??= new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

export function registrationConfirmationEmail({
  athleteName,
  athleteEmail,
  raceName,
  raceDate,
  raceLocation,
  raceDistance,
  sportEmoji,
  wave,
  shirtSize,
  expectedFinishTime,
  price,
}: {
  athleteName: string
  athleteEmail: string
  raceName: string
  raceDate: Date
  raceLocation: string
  raceDistance: number
  sportEmoji: string
  wave: string | null
  shirtSize: string | null
  expectedFinishTime: string | null
  price: number
}) {
  const formattedDate = raceDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = raceDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const detailRows = [
    ['Date', `${formattedDate} at ${formattedTime}`],
    ['Location', raceLocation],
    ['Distance', `${raceDistance} km`],
    ...(wave ? [['Wave', wave]] : []),
    ...(shirtSize ? [['Shirt size', shirtSize]] : []),
    ...(expectedFinishTime ? [['Expected finish', expectedFinishTime]] : []),
    ['Entry fee', price === 0 ? 'Free' : `$${price.toFixed(2)}`],
  ] as [string, string][]

  const rows = detailRows
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-size:14px;width:40%">${label}</td>
        <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500">${value}</td>
      </tr>`)
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:560px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:32px 40px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#fff">BibHub</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px">
            <p style="margin:0 0 4px;font-size:28px">🎉</p>
            <h1 style="margin:8px 0 4px;font-size:22px;font-weight:700;color:#111827">You're registered!</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280">Hi ${athleteName}, your spot is confirmed.</p>

            <!-- Race name -->
            <div style="background:#f3f4f6;border-radius:12px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af">Race</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#111827">${sportEmoji} ${raceName}</p>
            </div>

            <!-- Details table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f3f4f6">
              ${rows}
            </table>

            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6">
              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center">
                This confirmation was sent to ${athleteEmail}.<br>
                Managed by <strong>BibHub</strong>.
              </p>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return {
    from: 'BibHub <onboarding@resend.dev>',
    to: athleteEmail,
    subject: `Registration confirmed: ${raceName}`,
    html,
  }
}
