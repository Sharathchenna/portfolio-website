// Single source of truth for the site, the /resume page and structured data.
// Everything a recruiter reads comes from here.

export type LinkKind = "website" | "appstore" | "github";

export type Project = {
  slug: string;
  title: string;
  href: string;
  dates: string;
  active: boolean;
  /** One-line pitch shown large on the homepage. */
  tagline: string;
  description: string;
  /** Proof points, rendered as stat chips. Keep them factual. */
  metrics: readonly string[];
  technologies: readonly string[];
  links: readonly { type: string; kind: LinkKind; href: string }[];
  media:
    | { kind: "phone-video"; poster: string; webm: string; mp4: string; width: number; height: number }
    | { kind: "browser-image"; src: string; width: number; height: number; url: string };
};

export const DATA = {
  name: "Sharath Chenna",
  initials: "SC",
  url: "https://sharathchenna.com",
  location: "Hyderabad, India",
  locationLink: "https://www.google.com/maps/place/hyderabad",
  role: "Software engineer",
  /** Shown in the hero status line. Edit when your availability changes. */
  availability: "Open to SWE roles · Graduating 2027",
  headline:
    "Full-stack & mobile engineer shipping AI products end to end — from an App Store calorie tracker with 250+ active users to an agent that reviews pull requests.",
  description:
    "Sharath Chenna is a full-stack and mobile engineer at BITS Pilani building AI products: MacroBalance (250+ active users), PRReviewBot and Animator.chat.",
  summary:
    "I'm Sharath Chenna, a fourth-year engineering student at BITS Pilani – Hyderabad Campus in India. I'm passionate about technology and software development, with experience in backend and frontend development, DevOps, and mobile app development using frameworks like Flutter and React Native. Some projects I've built include [MacroBalance](https://apps.apple.com/in/app/macrobalance-calorie-tracker/id6743542972), an AI-powered calorie tracking app, and [Animator.chat](https://animator.chat), a platform for creating animated AI videos.",
  resume: "/sharath-chenna-resume.pdf",
  /**
   * Domains that currently don't resolve (checked 2026-10-05: the first two are NXDOMAIN,
   * the Appwrite deployment returns 403 "Deployment blocked"). Links to
   * them render as plain text so visitors never hit a dead or squatted domain.
   * Remove a host from this list once it's back online.
   */
  offlineHosts: ["macrobalance.app", "animator.chat", "prreviewbot.appwrite.network"],
  skills: ["React", "Next.js", "Typescript", "Node.js", "Python", "Flutter", "Postgres", "Docker", "Kubernetes", "C++"],
  navbar: [
    { href: "/#work", label: "Work" },
    { href: "/#about", label: "About" },
    { href: "/blog", label: "Writing" },
  ],
  contact: {
    email: "sharathchenna87@gmail.com",
    social: {
      GitHub: { name: "GitHub", url: "https://dub.sh/sharath-git", canonical: "https://github.com/sharathchenna" },
      LinkedIn: { name: "LinkedIn", url: "https://dub.sh/sharath-linkedin" },
      X: { name: "X", url: "https://dub.sh/sharath-twitter" },
    },
  },

  work: [
    {
      company: "Swecha Telangana",
      href: "https://swecha.org/",
      badges: [],
      location: "Remote",
      title: "Software Developer Intern",
      logoUrl: "/logos/swecha.webp",
      start: "May 2024",
      end: "July 2024",
      description:
        "During my two-month internship at Swecha Telangana, I contributed to impactful open-source projects. I developed a Single Sign-On (SSO) system to enhance user experience and improve security across digital platforms. I also helped create the Swecha Telugu Corpus App to organize Telugu language data for training large language models. This experience enhanced my skills in Python, Flutter, and GitHub while providing insights into collaborative software development focused on social good.",
      highlights: [
        "Built a Single Sign-On (SSO) system used across Swecha's digital platforms.",
        "Helped create the Swecha Telugu Corpus App, organising Telugu language data for training LLMs.",
      ],
    },
  ],
  education: [
    {
      school: "BITS Pilani – Hyderabad Campus",
      href: "https://bits-pilani.ac.in",
      degree: "Masters in Mathematics and Bachelors in Chemical Engineering",
      logoUrl: "/logos/bits.webp",
      start: "2023",
      end: "2027",
    },
  ],
  projects: [
    {
      slug: "macrobalance",
      title: "MacroBalance",
      href: "https://macrobalance.app",
      dates: "Jan 2024 - Feb 2024",
      active: true,
      tagline: "Snap a meal. Get the macros.",
      description:
        "MacroBalance is a revenue-generating calorie tracking app with 250+ active users that allows you to track your calories and macros. It uses the Gemini API to generate calorie and macro estimates based on your food intake.",
      metrics: ["250+ active users", "Revenue-generating", "Live on the App Store"],
      technologies: ["Flutter", "Next.js", "Dart", "PostgreSQL", "Supabase", "Gemini"],
      links: [
        { type: "Website", kind: "website", href: "https://macrobalance.app" },
        { type: "App Store", kind: "appstore", href: "https://apps.apple.com/in/app/macrobalance-calorie-tracker/id6743542972" },
      ],
      media: {
        kind: "phone-video",
        poster: "/work/macrobalance-poster-248",
        webm: "/work/macrobalance.webm",
        mp4: "/work/macrobalance.mp4",
        width: 248,
        height: 544,
      },
    },
    {
      slug: "prreviewbot",
      title: "PRReviewBot",
      href: "https://prreviewbot.appwrite.network/",
      dates: "Dec 2025 - Present",
      active: true,
      tagline: "Code review, on autopilot.",
      description:
        "An AI-powered code review agent that automatically analyzes pull requests using Google's Gemini models. Specialized for Flutter/Dart code, it provides context-aware feedback, catches bugs, enforces best practices, and posts intelligent review comments directly to PRs. Deployed on Google Cloud Run with FastAPI backend.",
      metrics: ["Autonomous AI agent", "Inline PR comments", "Code on GitHub"],
      technologies: ["Python", "FastAPI", "Google ADK", "Gemini", "Next.js", "Docker", "GCP"],
      links: [
        { type: "Website", kind: "website", href: "https://prreviewbot.appwrite.network/" },
        { type: "GitHub", kind: "github", href: "https://github.com/sharathchenna/prreviewbot" },
      ],
      media: { kind: "browser-image", src: "/work/prreviewbot", width: 1646, height: 934, url: "prreviewbot.appwrite.network" },
    },
    {
      slug: "animator",
      title: "Animator.chat",
      href: "https://animator.chat",
      dates: "May 2025 - Present",
      active: true,
      tagline: "Describe it. Watch it move.",
      description:
        "Animator.chat is a platform for creating animated videos using AI. It allows you to create animated videos using AI and share them with your friends and family.",
      metrics: ["Text → animated video", "Multi-model AI pipeline"],
      technologies: ["Next.js", "Typescript", "TailwindCSS", "OpenAI", "Supabase", "Docker", "GCP", "Gemini"],
      links: [{ type: "Website", kind: "website", href: "https://animator.chat" }],
      media: { kind: "browser-image", src: "/work/animator", width: 1845, height: 1080, url: "animator.chat" },
    },
  ] satisfies Project[],
} as const;
