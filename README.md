<div align="center">
<img alt="Sharath Chenna Portfolio" src="https://github.com/sharathchenna/portfolio/assets/16860528/57ffca81-3f0a-4425-b31d-094f61725455" width="90%">
</div>

# Sharath Chenna - Portfolio [![Deploy with Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/sharathchenna/portfolio)

A modern, responsive portfolio website built with Next.js, featuring an integrated contact form and beautiful animations. Built with [shadcn/ui](https://ui.shadcn.com/), [magic ui](https://magicui.design/), and deployed on Cloudflare Pages.

## ✨ Features

- **📝 Contact Form** - Integrated email contact form with Resend
- **⚡ Fast Setup** - Configure everything in a [single config file](./src/data/resume.tsx)
- **🎨 Modern Design** - Built with Next.js 14, React, TypeScript, Shadcn/UI, TailwindCSS
- **✨ Beautiful Animations** - Framer Motion and Magic UI components
- **📱 Responsive** - Optimized for all devices
- **📚 Blog Ready** - Includes blog functionality with MDX
- **🚀 Edge Optimized** - Deployed on Cloudflare Pages for global performance

## 🚀 Getting Started Locally

1. **Clone this repository:**
   ```bash
   git clone https://github.com/sharathchenna/portfolio
   cd portfolio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure your portfolio:**
   - Edit the [resume config file](./src/data/resume.tsx) with your information
   - Add your projects, work experience, and personal details

4. **Set up the contact form (optional):**
   - Create a `.env.local` file in the project root
   - Add your Resend configuration:
     ```env
     RESEND_API_KEY=your_resend_api_key_here
     TO_EMAIL=your-email@gmail.com
     FROM_EMAIL=portfolio@yourdomain.com
     ```
   - See [SETUP.md](./SETUP.md) for detailed email configuration

5. **Start the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** to view your portfolio

## 📧 Contact Form Setup

The portfolio includes a fully functional contact form powered by [Resend](https://resend.com). 

### Quick Setup:
1. Create a free account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add environment variables (see step 4 above)
4. The form will automatically start sending emails!

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## 🌐 Deployment

### Cloudflare Pages (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial portfolio setup"
   git push origin main
   ```

2. **Connect to Cloudflare Pages:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Connect your GitHub repository
   - Use these build settings:
     - **Build command:** `npm run build`
     - **Build output directory:** `out`
     - **Root directory:** `/`

3. **Add environment variables:**
   - In Cloudflare Pages dashboard → Settings → Environment variables
   - Add your `RESEND_API_KEY`, `TO_EMAIL`, and `FROM_EMAIL`

4. **Deploy!** Your portfolio will be live on your Cloudflare Pages URL

### Alternative Deployments
- **Vercel:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsharathchenna%2Fportfolio)
- **Netlify:** Import from GitHub
- **AWS Amplify:** Connect your repository

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** TailwindCSS + Shadcn/UI
- **Animations:** Framer Motion + Magic UI
- **Email:** Resend API
- **Deployment:** Cloudflare Pages
- **Package Manager:** pnpm

## 📁 Project Structure

```
portfolio/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── blog/              # Blog pages
│   │   ├── api/contact/       # Contact form API
│   │   └── page.tsx           # Main portfolio page
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn/UI components
│   │   ├── magicui/          # Magic UI components
│   │   └── contact-form.tsx  # Contact form
│   ├── data/
│   │   └── resume.tsx        # Portfolio configuration
│   └── lib/                  # Utilities
├── content/                   # Blog posts (MDX)
├── public/                   # Static assets
└── SETUP.md                  # Email setup guide
```

## 🎨 Customization

1. **Personal Information:** Edit `src/data/resume.tsx`
2. **Styling:** Modify TailwindCSS classes or add custom CSS
3. **Components:** Add new components in `src/components/`
4. **Blog Posts:** Add MDX files to `content/`
5. **Images:** Add assets to `public/`

## 📄 License

Licensed under the [MIT license](https://github.com/sharathchenna/portfolio/blob/main/LICENSE).

---

Built with ❤️ by [Sharath Chenna](https://github.com/sharathchenna)
