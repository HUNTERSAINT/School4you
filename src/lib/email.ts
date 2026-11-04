type Message = { to: string; subject: string; html: string; text: string };

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Sends mail through Resend's HTTP API (no package needed). Without RESEND_API_KEY nothing is sent,
 * and the caller is told so. Links are never written to the logs.
 */
export async function sendEmail(message: Message): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY is not set, so no email was sent to ${message.to}: ${message.subject}`);
    return { sent: false };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || "School4you <onboarding@resend.dev>", to: [message.to], subject: message.subject, html: message.html, text: message.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("[email] Resend rejected the message", response.status, await response.text().catch(() => ""));
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] Resend request failed", error);
    return { sent: false };
  }
}
