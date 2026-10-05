import type { ReactNode } from "react";

type Props = {
  n: number;
  title: string;
  children: ReactNode;
  /** Desktop placement relative to the annotated element. */
  place?: "top-right" | "bottom-right" | "top-left" | "bottom-left" | "right" | "above" | "below";
};

/** A review-mode annotation. Hidden (display: none) until review mode is on. */
export function Note({ n, title, children, place = "top-right" }: Props) {
  return (
    <aside className="note" data-place={place} aria-label={`Review note ${n}: ${title}`}>
      <span className="note-pin" aria-hidden>
        {n}
      </span>
      <p className="label mb-1 opacity-80">{title}</p>
      <p className="text-sm leading-snug">{children}</p>
    </aside>
  );
}
