const sendEmail = async (to, subject, html) => {
  if (process.env.NODE_ENV === "production") {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html,
    });
  } else {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"RAM Shortage" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  }
};

const sendOtp = async (email, otp) => {
  await sendEmail(
    email,
    "Your OTP code",
    `
    <div style="font-family: Georgia, 'Times New Roman', serif; background-color: #f4f1ec; padding: 40px 20px;">
      <table align="center" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5decf;">
        <tr>
          <td style="background-color: #1a1a1a; padding: 28px 32px;">
            <p style="margin: 0; color: #d4af37; font-size: 13px; letter-spacing: 3px; text-transform: uppercase;">RAM Shortage</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 32px;">
            <p style="margin: 0 0 8px; font-size: 20px; color: #1a1a1a;">Verification code</p>
            <p style="margin: 0 0 32px; font-size: 14px; color: #6b6b6b; line-height: 1.6;">
              Use the code below to verify your email address. It expires in 5 minutes.
            </p>
            <div style="text-align: center; padding: 24px; background-color: #f9f7f2; border: 1px solid #e5decf; border-radius: 6px; margin-bottom: 24px;">
              <span style="font-size: 36px; letter-spacing: 12px; font-weight: bold; color: #1a1a1a;">${otp}</span>
            </div>
            <p style="margin: 0; font-size: 13px; color: #9a9a9a; line-height: 1.6;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 32px; background-color: #f9f7f2; border-top: 1px solid #e5decf;">
            <p style="margin: 0; font-size: 12px; color: #9a9a9a; text-align: center;">
              &copy; ${new Date().getFullYear()} RAM Shortage. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
    `,
  );
};

const sendSuccess = async (email) => {
  await sendEmail(
    email,
    "Verification successful",
    `
    <div style="font-family: Georgia, 'Times New Roman', serif; background-color: #f4f1ec; padding: 40px 20px;">
      <table align="center" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5decf;">
        <tr>
          <td style="background-color: #1a1a1a; padding: 28px 32px;">
            <p style="margin: 0; color: #d4af37; font-size: 13px; letter-spacing: 3px; text-transform: uppercase;">RAM Shortage</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 32px; text-align: center;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background-color: #f9f7f2; border: 2px solid #d4af37; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px; color: #d4af37;">&#10003;</span>
            </div>
            <p style="margin: 0 0 8px; font-size: 20px; color: #1a1a1a;">You're verified</p>
            <p style="margin: 0; font-size: 14px; color: #6b6b6b; line-height: 1.6;">
              Your email has been successfully verified. You're all set to continue.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 32px; background-color: #f9f7f2; border-top: 1px solid #e5decf;">
            <p style="margin: 0; font-size: 12px; color: #9a9a9a; text-align: center;">
              &copy; ${new Date().getFullYear()} RAM Shortage. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
    `,
  );
};

module.exports = { sendOtp, sendSuccess };
