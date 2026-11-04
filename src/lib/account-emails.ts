import { escapeHtml, sendEmail } from "@/lib/email";
import { createToken, HOUR_MS } from "@/lib/tokens";

const baseUrl = () => (process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

function layout(name: string, intro: string, buttonLabel: string, link: string, outro: string) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1e293b">
<h2 style="color:#176ba8">School4you</h2><p>Hello ${escapeHtml(name)},</p><p>${intro}</p>
<p><a href="${link}" style="background:#176ba8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${buttonLabel}</a></p>
<p style="font-size:12px;color:#64748b">If the button does not work, copy this link into your browser:<br>${link}</p>
<p style="font-size:12px;color:#64748b">${outro}</p></div>`;
  const text = `Hello ${name},\n\n${intro}\n\n${link}\n\n${outro}`;
  return { html, text };
}

export async function sendVerificationEmail(userId: string, email: string, name: string) {
  try {
    const token = await createToken(userId, "VERIFY_EMAIL", 48 * HOUR_MS);
    const link = `${baseUrl()}/verify-email?token=${token}`;
    const body = layout(name, "Please confirm your email address to finish setting up your School4you account.", "Verify my email", link, "This link expires in 48 hours. If you did not create this account, ignore this email.");
    return await sendEmail({ to: email, subject: "Verify your School4you email", ...body });
  } catch (error) {
    console.error("[email] verification email failed", error);
    return { sent: false };
  }
}

export async function sendPasswordResetEmail(userId: string, email: string, name: string) {
  try {
    const token = await createToken(userId, "RESET_PASSWORD", HOUR_MS);
    const link = `${baseUrl()}/reset-password?token=${token}`;
    const body = layout(name, "We received a request to reset your School4you password. This link works once and expires in 1 hour.", "Choose a new password", link, "If you did not ask for this, ignore this email. Your password will not change.");
    return await sendEmail({ to: email, subject: "Reset your School4you password", ...body });
  } catch (error) {
    console.error("[email] reset email failed", error);
    return { sent: false };
  }
}
