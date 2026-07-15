export function getSharedLayout(title: string, bodyContent: string): string {
  const currentYear = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 0; }
          .wrapper { width: 100%; background-color: #0b0f19; padding: 40px 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }
          .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 36px 32px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #ffffff; text-decoration: none; }
          .content { padding: 40px 32px; color: #e2e8f0; line-height: 1.6; }
          .highlight-box { background-color: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
          .footer { background-color: #0b0f19; padding: 28px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #1f2937; }
          .button { display: inline-flex; align-items: center; justify-content: center; background-color: #6366f1; color: #ffffff !important; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 8px; margin-top: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2); }
          a { color: #818cf8; text-decoration: underline; }
          h2 { color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">🎓 Target LMS</div>
              <div style="margin-top: 8px; opacity: 0.9; font-size: 14px; color: #e0e7ff;">Enterprise Academy Platform</div>
            </div>
            <div class="content">
              ${bodyContent}
            </div>
            <div class="footer">
              <p>This is an automated notification from Target LMS. Please do not reply directly to this email.</p>
              <p style="margin-top: 8px;">Need assistance? Contact our systems operations at <a href="mailto:support@targetlms.com">support@targetlms.com</a>.</p>
              <p style="margin-top: 20px; font-size: 10px; color: #64748b;">&copy; ${currentYear} Target LMS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getAccessRequestSubmittedEmail(
  ownerName: string,
  instituteName: string,
  requestNumber: string
): string {
  const title = "Access Request Received";
  const bodyContent = `
    <h2>Hello ${ownerName},</h2>
    <p>Thank you for submitting an Access Request to onboarding your organization <strong>${instituteName}</strong> with Target LMS.</p>
    <p>We have successfully logged your submission under the tracking reference number below:</p>
    <div class="highlight-box">
      <span style="font-size: 22px; font-weight: 800; color: #818cf8; letter-spacing: 1px; font-family: monospace;">${requestNumber}</span>
    </div>
    <p>Our Super Admin review team is currently verifying the credentials and details provided. We will keep you updated as your request moves through our approval pipeline.</p>
    <p>If you have any questions in the meantime, please reach out to our team at support@targetlms.com.</p>
  `;
  return getSharedLayout(title, bodyContent);
}

export function getAccessRequestUnderReviewEmail(
  ownerName: string,
  requestNumber: string
): string {
  const title = "Access Request Under Review";
  const bodyContent = `
    <h2>Hello ${ownerName},</h2>
    <p>Your access request (Reference: <strong>${requestNumber}</strong>) has been picked up by a Super Admin and is now <strong>UNDER REVIEW</strong>.</p>
    <p>Our administrators are validating your registration details and trial parameters. We may contact you if any further details are required.</p>
    <p>No action is required from your end at this time.</p>
  `;
  return getSharedLayout(title, bodyContent);
}

export function getAccessRequestApprovedEmail(
  ownerName: string,
  requestNumber: string
): string {
  const title = "Access Request Approved";
  const bodyContent = `
    <h2>Congratulations ${ownerName}!</h2>
    <p>We are pleased to inform you that your access request (Reference: <strong>${requestNumber}</strong>) has been <strong>APPROVED</strong> by the Super Admin.</p>
    <p>Our systems are now provisioning your dedicated LMS environment, database space, and temporary credentials.</p>
    <p>You will receive a separate email shortly with your administrative login credentials and tenant access URL.</p>
  `;
  return getSharedLayout(title, bodyContent);
}

export function getAccessRequestRejectedEmail(
  ownerName: string,
  requestNumber: string,
  reason: string,
  notes?: string
): string {
  const title = "Access Request Update";
  const bodyContent = `
    <h2>Hello ${ownerName},</h2>
    <p>Thank you for your interest in Target LMS. We have completed the review of your Access Request (Reference: <strong>${requestNumber}</strong>).</p>
    <p>Regrettably, your request has been declined due to the following reason:</p>
    <div class="highlight-box" style="text-align: left; background-color: #271c1c; border-color: #4b1a1a;">
      <p style="margin: 0; font-weight: 700; color: #fca5a5;">Reason: ${reason}</p>
      ${notes ? `<p style="margin-top: 8px; margin-bottom: 0; color: #fecaca; font-size: 13px;">Notes: ${notes}</p>` : ""}
    </div>
    <p>If you believe this was an error or would like to submit additional information, please contact our support team at support@targetlms.com.</p>
  `;
  return getSharedLayout(title, bodyContent);
}

export function getInstituteWelcomeEmail(
  ownerName: string,
  instituteName: string,
  subPlan: string
): string {
  const title = "Welcome to Target LMS!";
  const bodyContent = `
    <h2>Welcome to the Platform, ${ownerName}!</h2>
    <p>Your dedicated learning environment for <strong>${instituteName}</strong> has been successfully provisioned!</p>
    <p>We have activated your enterprise subscription under the following tier:</p>
    <div class="highlight-box">
      <span style="font-size: 20px; font-weight: 800; color: #34d399; text-transform: uppercase;">${subPlan} Plan</span>
    </div>
    <p>You are now ready to set up courses, register students, and configure your academy details.</p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3000/login" class="button">Access Admin Portal</a>
    </div>
  `;
  return getSharedLayout(title, bodyContent);
}

export function getTemporaryPasswordEmail(
  ownerName: string,
  email: string,
  temporaryPassword: string
): string {
  const title = "Your Admin Credentials";
  const bodyContent = `
    <h2>Hello ${ownerName},</h2>
    <p>Your administrator account on Target LMS has been configured. Please use the temporary credentials below for your first login:</p>
    <div class="highlight-box">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;">Login Username / Email:</p>
      <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #ffffff;">${email}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #94a3b8;">Temporary Password:</p>
      <p style="margin: 0; font-size: 22px; font-weight: 800; color: #6366f1; letter-spacing: 1px; font-family: monospace;">${temporaryPassword}</p>
    </div>
    <p style="color: #fb7185; font-size: 13px; font-weight: 700; margin: 16px 0;">⚠️ Security Notice: You will be required to change this password immediately upon your first login for security reasons.</p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3000/login" class="button">Log In and Change Password</a>
    </div>
  `;
  return getSharedLayout(title, bodyContent);
}

export function getSubscriptionActivatedEmail(
  ownerName: string,
  instituteName: string,
  planName: string,
  durationDays: number
): string {
  const title = "Subscription Activated";
  const bodyContent = `
    <h2>Subscription Provisioned</h2>
    <p>Hello ${ownerName},</p>
    <p>An enterprise subscription has been successfully assigned and activated for <strong>${instituteName}</strong>.</p>
    <div class="highlight-box">
      <p style="margin: 0; font-size: 18px; font-weight: 800; color: #818cf8; text-transform: uppercase;">${planName} Tier</p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8;">Active Duration: ${durationDays} Days</p>
    </div>
    <p>Your subscription details and quota usage are viewable directly from the Settings panel of your admin dashboard.</p>
  `;
  return getSharedLayout(title, bodyContent);
}
