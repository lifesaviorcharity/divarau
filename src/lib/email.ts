import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"Divar AU" <${user || "noreply@divar.au"}>`;

  // If SMTP is not configured in .env, fallback gracefully to mock/log mode
  if (!host || !user || !pass) {
    console.warn(`[Email Service Warning] SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured in .env. Skipping real SMTP email sending to ${to}.`);
    console.log(`[Email Mock Log] To: ${to} | Subject: ${subject} | Content: ${text || html}`);
    return { success: true, mock: true, message: "SMTP environment variables not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for port 465, false for other ports (587, 25)
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert issues on custom SMTP servers
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Sent Success] Message ID: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email Send Error] Failed to send email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}
