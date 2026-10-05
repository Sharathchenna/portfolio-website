"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "@/components/icons";

/** The email itself is the button: one click copies it, with a visible and announced confirmation. */
export function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Clipboard blocked (e.g. insecure context): fall back to the mail app.
      window.location.href = `mailto:${email}`;
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className={`@container ${className}`}>
      <button type="button" onClick={copy} className="copy-email group block w-full text-left" data-copied={copied || undefined}>
        <span className="sr-only">Copy email address: </span>
        <span className="headline block whitespace-nowrap text-[clamp(1.1rem,7.1cqi,3.75rem)] leading-[1] tracking-[-0.035em]">
          {email}
        </span>
        <span className="label mt-4 flex h-[1.45em] items-start overflow-hidden" aria-hidden>
          <span className="copy-email-roll flex flex-col">
            <span className="flex h-[1.45em] items-center gap-2">
              <Copy width={13} height={13} /> Click to copy
            </span>
            <span className="flex h-[1.45em] items-center gap-2">
              <Check width={13} height={13} /> Copied to clipboard
            </span>
          </span>
        </span>
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {copied ? "Email address copied to clipboard" : ""}
      </p>
    </div>
  );
}
