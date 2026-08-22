import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const fieldClass =
  "w-full border border-line bg-paper text-ink px-3 py-2 text-sm " +
  "focus:outline-none focus-visible:border-focus placeholder:text-ink/40";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`${fieldClass} ${className}`} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea ref={ref} className={`${fieldClass} resize-y ${className}`} {...props} />
));
Textarea.displayName = "Textarea";
