import { NextRequest, NextResponse } from "next/server";

// Configure the route to use Edge Runtime for Cloudflare Pages compatibility
export const runtime = 'edge';

interface ContactFormData {
  email: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();
    const { email, message } = body;

    // Validate the request body
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // If Resend is configured, use it; otherwise, log the message
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

              await resend.emails.send({
          from: process.env.FROM_EMAIL || "portfolio@yourdomain.com",
          to: process.env.TO_EMAIL || "sharathchenna87@gmail.com",
          subject: `Portfolio Contact Form Message`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                New Contact Form Submission
              </h2>
              
              <div style="margin: 20px 0;">
                <p><strong>Email:</strong> ${email}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <h3 style="color: #555;">Message:</h3>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
                <p>This message was sent from your portfolio contact form.</p>
                <p>Reply directly to this email to respond to the sender.</p>
              </div>
            </div>
          `,
          replyTo: email,
        });
    } else {
      // Log the message for development/testing when Resend is not configured
              console.log("Contact form submission (Resend not configured):", {
          email,
          message,
          timestamp: new Date().toISOString(),
        });
    }

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
} 