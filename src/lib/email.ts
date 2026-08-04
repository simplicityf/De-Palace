import nodemailer from "nodemailer";

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendEmailWithAttachment(options: {
  to: string[];
  subject: string;
  text: string;
  attachment: { filename: string; content: Buffer };
}) {
  const transport = getTransport();

  if (!transport) {
    console.warn(
      "GMAIL_USER / GMAIL_APP_PASSWORD not configured — skipping email send.",
    );
    return { sent: false as const };
  }

  await transport.sendMail({
    from: `"DePalace" <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    attachments: [options.attachment],
  });

  return { sent: true as const };
}
