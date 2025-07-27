import { Icons } from "@/components/icons";
import { HomeIcon, NotebookIcon } from "lucide-react";

export const DATA = {
  name: "Sharath Chenna",
  initials: "DV",
  url: "https://dillion.io",
  location: "San Francisco, CA",
  locationLink: "https://www.google.com/maps/place/sanfrancisco",
  description:
    "A developer building cool solutions with open source technologies.",
  summary:
    "I'm Sharath Chenna, a third-year engineering student at BITS Pilani – Hyderabad Campus in India. I'm passionate about technology and software development, with experience in backend and frontend development, DevOps, and mobile app development using frameworks like Flutter and React Native. Some projects I've built include [MacroBalance](https://apps.apple.com/in/app/macrobalance-calorie-tracker/id6743542972), an AI-powered calorie tracking app, and [Animator.chat](https://animator.chat), a platform for creating animated AI videos.",
  avatarUrl: "/me.png",
  skills: [
    "React",
    "Next.js",
    "Typescript",
    "Node.js",
    "Python",
    "Flutter",
    "Postgres",
    "Docker",
    "Kubernetes",
    "C++",
  ],
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/blog", icon: NotebookIcon, label: "Blog" },
  ],
  contact: {
    email: "sharathchenna87@gmail.com",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://dub.sh/sharath-git",
        icon: Icons.github,

        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://dub.sh/sharath-linkedin",
        icon: Icons.linkedin,

        navbar: true,
      },
      X: {
        name: "X",
        url: "https://dub.sh/sharath-twitter",
        icon: Icons.x,

        navbar: true,
      },
      email: {
        name: "Send Email",
        url: "#",
        icon: Icons.email,

        navbar: false,
      },
    },
  },

  work: [
    {
      company: "Swecha Telangana",
      href: "https://swecha.org/",
      badges: [],
      location: "Remote",
      title: "Software Developer Intern",
      logoUrl: "/swecha.png",
      start: "May 2024",
      end: "July 2024",
      description: "During my two-month internship at Swecha Telangana, I contributed to impactful open-source projects. I developed a Single Sign-On (SSO) system to enhance user experience and improve security across digital platforms. I also helped create the Swecha Telugu Corpus App to organize Telugu language data for training large language models. This experience enhanced my skills in Python, Flutter, and GitHub while providing insights into collaborative software development focused on social good.",
    },
  ],
  education: [
    {
      school: "BITS Pilani – Hyderabad Campus",
      href: "https://bits-pilani.ac.in",
      degree: "Masters in Mathematics and Bachelors in Chemical Engineering",
      logoUrl: "/bits.png",
      start: "2023",
      end: "2027",
    },
  ],
  projects: [
    {
      title: "MacroBalance",
      href: "https://macrobalance.app",
      dates: "Jan 2024 - Feb 2024",
      active: true,
      description:
        "MacroBalance is a revenue-generating calorie tracking app with 250+ active users that allows you to track your calories and macros. It uses the Gemini API to generate calorie and macro estimates based on your food intake.",
      technologies: [
        "Flutter",
        "Next.js",
        "Typescript",
        "PostgreSQL",
        "Prisma",
        "TailwindCSS",
        "Stripe",
        "Shadcn UI",
        "Magic UI",
      ],
      links: [
        {
          type: "Website",
          href: "https://macrobalance.app",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "App Store",
          href: "https://apps.apple.com/in/app/macrobalance-calorie-tracker/id6743542972",
          icon: <Icons.globe className="size-3" />,
        },
      ],
      image: "https://photos.sharathchenna.com/Final%20Image.psd.png",
      video:
        "",
    },
    {
      title: "Animator.chat",
      href: "https://animator.chat",
      dates: "May 2025 - Present",
      active: true,
      description:
        "Animator.chat is a platform for creating animated videos using AI. It allows you to create animated videos using AI and share them with your friends and family.",
      technologies: [
        "Next.js",
        "Typescript",
        "TailwindCSS",
        "OpenAI",
        "Supabase",
        "Docker",
        "GCP",
        "Gemini",
      ],
      links: [
        {
          type: "Website",
          href: "https://animator.chat",
          icon: <Icons.globe className="size-3" />,
        },
      ],
      image: "https://photos.sharathchenna.com/6885d9f5c70bb67a733388b4.jpg",
      video: "",
    },
          {
        title: "MoneyChat(Ongoing)",
        href: "#", // Will be updated when the project is live
        dates: "May 2025 - Present",
        active: true,
        description:
          "AI budgeting app that texts you about your spending like a financially savvy friend. Instead of logging into another dashboard, your money texts you. The AI automatically categorizes transactions, tracks spending patterns, and gives insights through natural conversation - like texting with a friend who knows your spending habits and proactively suggests adjustments before you overspend.",
      technologies: [
        "SwiftUI",
        "OpenAI",
        "Gemini",
        "Supabase",
        "Postgres",
      ],
      links: [
      
      ],
      image: "https://photos.sharathchenna.com/Your%20paragraph%20text%20(1).png",
      video: "",
    },
  ],

} as const;
