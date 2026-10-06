"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "@/components/icons";
import { launchPlane, shake } from "@/lib/fx";

type Errors = { email?: string; message?: string };
type Status = "idle" | "sending" | "sent" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, message: string): Errors {
  const e: Errors = {};
  if (!email.trim()) e.email = "Add your email so I can reply.";
  else if (!EMAIL_RE.test(email.trim())) e.email = "That email doesn't look quite right.";
  if (message.trim().length < 10) e.message = "A few more words, please (10+ characters).";
  return e;
}

export function ContactForm({ fallbackEmail }: { fallbackEmail: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const next = validate(email, message);
    setErrors(next);
    if (next.email || next.message) {
      const field = form.querySelector<HTMLElement>(next.email ? "#cf-email" : "#cf-message");
      field?.focus();
      if (field) shake(field);
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message, company: data.get("company") }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      const submit = form.querySelector('[type="submit"]');
      if (submit) launchPlane(submit);
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  const field =
    "mt-2 block w-full rounded-sm border border-line-strong/70 bg-paper px-3.5 py-3 text-base text-ink placeholder:text-ink-2/70 transition-[border-color,box-shadow] duration-(--dur-fast) focus:border-ink focus:outline-none focus-visible:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_30%,transparent)] aria-invalid:border-[#d93a3a]";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5" aria-describedby="cf-status">
      <div>
        <label htmlFor="cf-email" className="label text-ink-2">
          Your email
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          className={field}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "cf-email-error" : undefined}
          onChange={() => errors.email && setErrors((e) => ({ ...e, email: undefined }))}
        />
        {errors.email && (
          <p id="cf-email-error" className="mt-1.5 text-sm text-[#b42323] dark:text-[#ff8a8a]">
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="cf-message" className="label text-ink-2">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          placeholder="Hi Sharath, we're hiring for…"
          className={`${field} min-h-32 resize-y`}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "cf-message-error" : undefined}
          onChange={() => errors.message && setErrors((e) => ({ ...e, message: undefined }))}
        />
        {errors.message && (
          <p id="cf-message-error" className="mt-1.5 text-sm text-[#b42323] dark:text-[#ff8a8a]">
            {errors.message}
          </p>
        )}
      </div>
      {/* Honeypot: invisible to people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="cf-company">Company</label>
        <input id="cf-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button type="submit" className="btn btn-ink" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}
          <ArrowRight data-arrow="right" />
        </button>
        <p id="cf-status" role="status" aria-live="polite" className="text-sm text-ink-2">
          {status === "sent" && "Sent. I'll get back to you soon."}
          {status === "error" && (
            <>
              That didn&apos;t go through. Email me directly at{" "}
              <a className="link text-ink" href={`mailto:${fallbackEmail}`}>
                {fallbackEmail}
              </a>
              .
            </>
          )}
        </p>
      </div>
    </form>
  );
}
