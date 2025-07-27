import { Dock, DockIcon } from "@/components/magicui/dock";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto mb-4 flex origin-bottom h-full max-h-14">
      {/* Enhanced backdrop with glass effect */}
      <div className="fixed bottom-0 inset-x-0 h-20 w-full bg-gradient-to-t from-background/80 via-background/40 to-transparent backdrop-blur-xl [-webkit-mask-image:linear-gradient(to_top,black_20%,transparent)] dark:from-background/60 dark:via-background/30"></div>
      
      {/* iOS-inspired glass dock */}
      <Dock className="z-50 pointer-events-auto relative mx-auto flex min-h-full h-full items-center px-1 
        bg-white/10 dark:bg-black/20 
        backdrop-blur-2xl backdrop-saturate-150
        border border-white/20 dark:border-white/10
        shadow-2xl shadow-black/10 dark:shadow-black/20
        [box-shadow:0_8px_32px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] 
        dark:[box-shadow:0_8px_32px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]
        before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none
        after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-t after:from-black/5 after:to-transparent after:pointer-events-none
        supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/10">
        {DATA.navbar.map((item) => (
          <DockIcon key={item.href}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "size-12 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 rounded-xl backdrop-blur-sm"
                  )}
                >
                  <item.icon className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
        ))}
        <Separator orientation="vertical" className="h-full bg-white/20 dark:bg-white/10" />
        {Object.entries(DATA.contact.social)
          .filter(([_, social]) => social.navbar)
          .map(([name, social]) => (
            <DockIcon key={name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={social.url}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 rounded-xl backdrop-blur-sm"
                    )}
                  >
                    <social.icon className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{name}</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          ))}
        <Separator orientation="vertical" className="h-full py-2 bg-white/20 dark:bg-white/10" />
        <DockIcon>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 rounded-xl backdrop-blur-sm">
                <ModeToggle />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Theme</p>
            </TooltipContent>
          </Tooltip>
        </DockIcon>
      </Dock>
    </div>
  );
}
