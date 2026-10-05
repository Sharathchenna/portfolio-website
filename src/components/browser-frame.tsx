type Props = { src: string; width: number; height: number; alt: string; url: string };

/** Pre-sized AVIF/WebP screenshot in minimal browser chrome. */
export function BrowserFrame({ src, width, height, alt, url }: Props) {
  return (
    <figure className="browser w-full overflow-hidden rounded-md bg-paper shadow-(--shadow-float) ring-1 ring-line">
      <div className="flex h-8 items-center gap-3 border-b border-line px-3" aria-hidden>
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
        </div>
        <div className="label mx-auto truncate rounded-full bg-paper-2 px-3 py-0.5 text-ink-2 normal-case">{url}</div>
        <div className="w-[42px]" />
      </div>
      <picture>
        <source type="image/avif" srcSet={`${src}-720.avif 720w, ${src}-1440.avif 1440w`} sizes="(min-width: 1024px) 50vw, 92vw" />
        <img
          src={`${src}-1440.webp`}
          srcSet={`${src}-720.webp 720w, ${src}-1440.webp 1440w`}
          sizes="(min-width: 1024px) 50vw, 92vw"
          width={width}
          height={height}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />
      </picture>
    </figure>
  );
}
