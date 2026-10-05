"use client";

import { useEffect, useRef, useState } from "react";

type Props = { poster: string; webm: string; mp4: string; width: number; height: number; label: string };

/**
 * Lazy, polite autoplay: nothing downloads until the phone is near the
 * viewport, it plays only while visible, never autoplays with reduced motion,
 * and always has a pause control (WCAG 2.2.2).
 */
export function PhoneVideo({ poster, webm, mp4, width, height, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) userPaused.current = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPaused.current) {
          video.preload = "auto";
          video.play().catch(() => {});
        } else if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  return (
    <div className="phone relative">
      <div className="phone-screen">
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="none"
          poster={`${poster}.webp`}
          width={width}
          height={height}
          aria-label={label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="block h-full w-full object-cover"
        >
          <source src={webm} type='video/webm; codecs="av01.0.05M.08"' />
          <source src={mp4} type="video/mp4" />
        </video>
      </div>
      <button
        type="button"
        onClick={toggle}
        className="label absolute -right-3 bottom-8 flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1.5 text-paper shadow-(--shadow-raise) transition-transform duration-(--dur-base) ease-(--ease-spring) active:scale-95"
        aria-label={playing ? "Pause demo video" : "Play demo video"}
      >
        <span aria-hidden className={`inline-block size-1.5 rounded-full ${playing ? "bg-[#ff4d4d]" : "bg-paper"}`} />
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}
