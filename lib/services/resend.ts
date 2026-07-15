import { env } from "../env";

interface EmailTemplateOptions {
  title: string;
  bodyHtml: string;
  supportEmail?: string;
}

export function getBaseTemplate({
  title,
  bodyHtml,
  supportEmail = "support@targetlms.com",
}: EmailTemplateOptions): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .wrapper { width: 100%; background-color: #f8fafc; padding: 24px 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background-color: #4f46e5; padding: 32px; text-align: center; color: #ffffff; }
          .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
          .content { padding: 40px 32px; }
          .footer { background-color: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .button { display: inline-flex; align-items: center; justify-content: center; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 8px; margin-top: 16px; }
          a { color: #4f46e5; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1 class="logo">🎓 Target LMS</h1>
              <div style="margin-top: 8px; opacity: 0.85; font-size: 14px;">Coaching & Academy Platform</div>
            </div>
            <div class="content">
              <h2 style="font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 16px; color: #0f172a;">${title}</h2>
              ${bodyHtml}
            </div>
            <div class="footer">
              <p>This is an automated security notification from Target LMS.</p>
              <p style="margin-top: 8px;">If you have any questions, reach out to our team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
              <p style="margin-top: 16px; font-size: 10px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Target LMS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getOtpEmailHtml(otp: string, expiryMinutes = 10): string {
  const title = "Reset Your Password";
  const bodyHtml = `
    <p style="font-size: 15px; line-height: 1.5; color: #334155;">We received a request to reset your account password on Target LMS.</p>
    <p style="font-size: 15px; line-height: 1.5; color: #334155;">Please enter the 6-digit security code below to proceed with the password reset process:</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #4f46e5; font-family: monospace; display: block; width: 100%;">${otp}</span>
    </div>
    <p style="color: #ef4444; font-weight: 700; font-size: 13px; margin: 16px 0;">⚠️ This security verification code will expire in ${expiryMinutes} minutes.</p>
    <p style="font-size: 13px; color: #64748b; margin-top: 16px; line-height: 1.5;">If you did not request this change, please ignore this email or alert support if you suspect unauthorized access.</p>
  `;
  return getBaseTemplate({ title, bodyHtml });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey || apiKey === "re_123456789_mock_key_for_testing") {
    console.log("=================== MOCK EMAIL SENT ===================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body Sample:\n`, html.substring(0, 500) + "\n...[truncated]");
    console.log("=======================================================");
    return { success: true, id: "mock_id" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Target LMS <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  const responseData = await response.json();
  if (!response.ok) {
    console.error("Resend API Failure response:", responseData);
    throw new Error(responseData.message || "Failed to send email via Resend");
  }

  return responseData;
}
