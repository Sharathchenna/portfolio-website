# Portfolio Contact Form Setup

## Email Service Configuration

This portfolio includes a contact form that uses [Resend](https://resend.com) for email delivery when deployed to Cloudflare Pages.

### Setting up Resend

1. **Create a Resend account** at [resend.com](https://resend.com)
2. **Add your domain** in the Resend dashboard (or use their test domain for development)
3. **Get your API key** from the [API Keys section](https://resend.com/api-keys)

### Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here

# Email Configuration
TO_EMAIL=sharathchenna87@gmail.com
FROM_EMAIL=portfolio@yourdomain.com
```

### For Cloudflare Pages Deployment

When deploying to Cloudflare Pages, add these environment variables in your Cloudflare dashboard:

1. Go to your Cloudflare Pages project
2. Navigate to Settings → Environment variables
3. Add the same variables as above

### Domain Setup (Production)

For production use, you'll need to:

1. **Add your domain to Resend** in the domains section
2. **Add DNS records** as instructed by Resend
3. **Update FROM_EMAIL** to use your verified domain (e.g., `contact@yourdomain.com`)

### Development Mode

The contact form will work without Resend configuration in development mode - form submissions will be logged to the console instead of sending emails.

In production, a missing `RESEND_API_KEY` makes the endpoint return `503`; the form then shows the visitor your email address instead of pretending the message was sent. `FROM_EMAIL` must be an address on a domain you've verified in Resend (defaults to `portfolio@sharathchenna.com`).

### Alternative Email Services

The route calls Resend's REST API with `fetch` (no SDK). If you prefer another provider, change the request in `src/app/api/contact/route.ts`, for example to:

- **EmailJS** (client-side solution)
- **Sendgrid**
- **AWS SES** 
- **Mailgun**
- **Cloudflare Email Workers** 