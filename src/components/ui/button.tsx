import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:border-dashed";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-paper border border-ink hover:bg-paper hover:text-ink disabled:bg-paper disabled:text-ink",
  secondary:
    "bg-paper text-ink border border-line hover:bg-ink hover:text-paper hover:border-ink disabled:bg-paper disabled:text-ink",
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-ink hover:text-paper disabled:bg-transparent disabled:text-ink",
  danger:
    "bg-paper text-ink border border-line hover:bg-ink hover:text-paper hover:border-ink disabled:bg-paper disabled:text-ink",
};

const sizes: Record<Size, string> = {
  md: "text-sm px-3.5 py-2",
  sm: "text-xs px-2.5 py-1.5",
};

/** Same visual classes as <Button>, for non-<button> elements (e.g. <Link>). */
export function buttonClasses(variant: Variant = "secondary", size: Size = "md", className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className = "", variant = "secondary", size = "md", ...props }, ref) => (
  <button
    ref={ref}
    className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  />
));
Button.displayName = "Button";
