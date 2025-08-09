import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";

interface Props {
  title: string;
  href?: string;
  description: string;
  dates: string;
  tags: readonly string[];
  link?: string;
  image?: string;
  video?: string;
  mediaAspectRatio?: string;
  links?: readonly {
    icon: React.ReactNode;
    type: string;
    href: string;
  }[];
  className?: string;
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  tags,
  link,
  image,
  video,
  mediaAspectRatio,
  links,
  className,
}: Props) {
  const isClickable = href && href !== "#";
  
  const getAspectRatioClass = () => {
    if (mediaAspectRatio === "9:16") return "aspect-[9/16]";
    if (mediaAspectRatio === "16:9") return "aspect-video";
    if (mediaAspectRatio === "1:1") return "aspect-square";
    if (mediaAspectRatio === "4:3") return "aspect-[4/3]";
    if (mediaAspectRatio === "3:2") return "aspect-[3/2]";
    if (mediaAspectRatio === "5:4") return "aspect-[5/4]";
    
    // Smart defaults based on content type
    if (video && !mediaAspectRatio) {
      // Mobile app videos are typically portrait
      return "aspect-[9/16]";
    }
    if (image && !mediaAspectRatio) {
      // Web app screenshots are typically landscape but not as wide as 16:9
      return "aspect-[4/3]";
    }
    
    return "aspect-video"; // fallback
  };

  const MediaContent = () => (
    <>
      {video && (
        <video
          src={video}
          autoPlay
          loop
          muted
          playsInline
          className={`pointer-events-none mx-auto w-full ${getAspectRatioClass()} object-cover`} // needed because random black line at bottom of video
        />
      )}
      {image && (
        <Image
          src={image}
          alt={title}
          width={1200}
          height={675}
          className={`w-full ${getAspectRatioClass()} object-cover`}
          quality={90}
          priority={true}
        />
      )}
    </>
  );

  return (
    <Card
      className={
        "flex flex-col overflow-hidden border hover:shadow-lg transition-all duration-300 ease-out"
      }
    >
      {isClickable ? (
        <Link
          href={href}
          className={cn("block cursor-pointer", className)}
        >
          <MediaContent />
        </Link>
      ) : (
        <div className={cn("block", className)}>
          <MediaContent />
        </div>
      )}
      <CardHeader className="px-2">
        <div className="space-y-1">
          <CardTitle className="mt-1 text-base">{title}</CardTitle>
          {/* <time className="font-sans text-xs">{dates}</time> */}
          <div className="hidden font-sans text-xs underline print:visible">
            {link?.replace("https://", "").replace("www.", "").replace("/", "")}
          </div>
          <Markdown className="prose max-w-full text-pretty font-sans text-xs text-muted-foreground dark:prose-invert">
            {description}
          </Markdown>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col px-2">
        {tags && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags?.map((tag) => (
              <Badge
                className="px-1 py-0 text-[10px]"
                variant="secondary"
                key={tag}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-2 pb-2">
        {links && links.length > 0 && (
          <div className="flex flex-row flex-wrap items-start gap-1">
            {links?.map((link, idx) => (
              <Link href={link?.href} key={idx} target="_blank">
                <Badge key={idx} className="flex gap-2 px-2 py-1 text-[10px]">
                  {link.icon}
                  {link.type}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
