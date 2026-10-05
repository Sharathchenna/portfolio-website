"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DATA } from "@/data/resume";

export function SiteNav() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-7 text-sm md:flex">
      {DATA.navbar.map((item) => {
        const current = item.href === "/blog" ? pathname.startsWith("/blog") : false;
        return (
          <li key={item.href}>
            <Link href={item.href} className="link-draw text-ink-2 transition-colors duration-(--dur-fast) hover:text-ink aria-[current=page]:text-ink" aria-current={current ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
