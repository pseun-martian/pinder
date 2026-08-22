import Image from "next/image";

/**
 * Pinder wordmark. The source PNG is a solid black mark on a transparent
 * background, so it's inverted to white via CSS in dark mode (see the
 * `.pinder-logo` rule in globals.css) to stay visible against the paper/ink
 * flip the rest of the design system does under prefers-color-scheme.
 */
export function Logo({ height = 20, className = "" }: { height?: number; className?: string }) {
  // Source asset is 1532x296.
  const width = Math.round((height * 1532) / 296);
  return (
    <Image
      src="/pinder-logo.png"
      alt="Pinder"
      width={width}
      height={height}
      priority
      className={`pinder-logo ${className}`}
    />
  );
}
