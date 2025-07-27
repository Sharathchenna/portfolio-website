<div align="center">
</div>

# Sharath Chenna - Portfolio 

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
