const axios = require("axios");

// Base HTML Layout Wrapper (Zinc-950 Dark Theme)
const getEmailTemplate = (content) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 500px; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 24px; text-align: center; border-bottom: 1px solid #27272a;">
                  <h1 style="color: #f4f4f5; margin: 0; font-size: 20px; font-weight: 600;">Ramy</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 24px; color: #a1a1aa; font-size: 15px; line-height: 1.6;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 24px; background-color: #09090b; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #27272a;">
                  &copy; ${new Date().getFullYear()} Ramy. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const sendEmail = async (to, subject, html) => {
  await axios.post(
    process.env.BREVO_API_URL,
    {
      sender: {
        name: "Ramy",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );
};

const sendOtp = async (email, otp) => {
  const content = `
    <h2 style="margin-top: 0; color: #f4f4f5; font-size: 20px; font-weight: 600;">Verify your email</h2>
    <p style="margin-bottom: 24px; color: #a1a1aa;">
      Please use the verification code below sent to <span style="color: #a1a1aa; font-weight: 500;">${email}</span>:
    </p>
    
    <div style="background-color: #3f3f46; border: 1px solid #71717a; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #f4f4f5; font-family: monospace;">${otp}</span>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="#" style="background-color: #f4f4f5; color: #18181b; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">Verify</a>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="top" style="padding-right: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </td>
        <td valign="middle" style="font-size: 13px; color: #a1a1aa;">
          This code will expire in 5 minutes.
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
      Didn't receive code? <a href="#" style="color: #a1a1aa; text-decoration: underline;">Resend code</a>
    </p>
  `;

  await sendEmail(email, "Your OTP Code", getEmailTemplate(content));
};

const sendSuccess = async (email) => {
  const content = `
    <div style="text-align: center; padding: 8px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px auto;">
        <tr>
          <td align="center" valign="middle" style="width: 56px; height: 56px; background-color: rgba(74, 222, 128, 0.1); border-radius: 50%;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </td>
        </tr>
      </table>

      <h2 style="margin: 0 0 8px 0; color: #f4f4f5; font-size: 20px;">Verification Successful!</h2>
      <p style="margin: 0; color: #4ade80; font-weight: 500;">
        Your email address has been successfully verified.
      </p>
    </div>
  `;

  await sendEmail(email, "Verification Successful", getEmailTemplate(content));
};

const sendResetLink = async (email, resetLink) => {
  const content = `
    <h2 style="margin-top: 0; color: #f4f4f5; font-size: 20px; font-weight: 600;">Reset your password</h2>
    <p style="margin-bottom: 24px; color: #a1a1aa;">
      We received a request to reset the password for <span style="color: #a1a1aa; font-weight: 500;">${email}</span>. Click the button below to choose a new one.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${resetLink}" style="background-color: #f4f4f5; color: #18181b; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">Reset Password</a>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="top" style="padding-right: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </td>
        <td valign="middle" style="font-size: 13px; color: #a1a1aa;">
          This link will expire in 30 minutes.
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
      Didn't request this? You can safely ignore this email.
    </p>
  `;

  await sendEmail(email, "Reset your password", getEmailTemplate(content));
};

module.exports = { sendOtp, sendSuccess, sendResetLink };
