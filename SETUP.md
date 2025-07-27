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

### Alternative Email Services

If you prefer not to use Resend, you can easily modify the API route (`src/app/api/contact/route.ts`) to use:

- **EmailJS** (client-side solution)
- **Sendgrid**
- **AWS SES** 
- **Mailgun**
- **Cloudflare Email Workers** 