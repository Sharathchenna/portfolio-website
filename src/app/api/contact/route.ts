import { NextRequest, NextResponse } from "next/server";

// Edge runtime: required by @cloudflare/next-on-pages.
export const runtime = "edge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: NextRequest) {
  let body: { email?: unknown; message?: unknown; company?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot filled in: pretend success so bots don't retry.
  if (typeof body.company === "string" && body.company.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json({ error: "Message must be 10–5000 characters" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log("Contact form (Resend not configured):", { email, message });
      return NextResponse.json({ ok: true });
    }
    // Never report success for a message that went nowhere.
    console.error("Contact form: RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "portfolio@sharathchenna.com",
      to: process.env.TO_EMAIL || "sharathchenna87@gmail.com",
      reply_to: email,
      subject: `Portfolio message from ${email}`,
      text: `${message}\n\n— Sent from sharathchenna.com by ${email}`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:600px">
<p style="color:#58544c;font-size:13px">From <strong>${escapeHtml(email)}</strong> via sharathchenna.com</p>
<div style="white-space:pre-wrap;font-size:15px;line-height:1.6">${escapeHtml(message)}</div>
<p style="color:#58544c;font-size:12px">Reply directly to this email to respond.</p></div>`,
    }),
  });

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
