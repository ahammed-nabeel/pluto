import nodemailer from "nodemailer";

interface SendVerificationEmailParams {
  to: string;
  code: string;
}

export async function sendVerificationEmail({ to, code }: SendVerificationEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM_EMAIL || "noreply@pluto.com";

  if (!host || !user || !pass) {
    console.warn("SMTP credentials not configured. Email not sent.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-top: 0;">Pluto Account Verification</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.5;">
        Thank you for signing up for Pluto. Please use the verification code below to complete your registration.
      </p>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 6px; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px;">${code}</span>
      </div>
      <p style="color: #475569; font-size: 14px;">
        This code will expire in 15 minutes. If you did not request this, please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        &copy; ${new Date().getFullYear()} Pluto. All rights reserved.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Pluto" <${from}>`,
      to,
      subject: "Your Pluto Verification Code",
      text: `Your Pluto verification code is: ${code}`,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}
