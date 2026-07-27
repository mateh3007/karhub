import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-karhub-orange hover:bg-karhub-orange-dark text-white focus-visible:outline-karhub-orange",
  secondary:
    "bg-karhub-navy hover:bg-karhub-navy-light text-white focus-visible:outline-karhub-navy",
  danger:
    "bg-red-600 hover:bg-red-700 text-white focus-visible:outline-red-600",
  ghost:
    "bg-transparent hover:bg-gray-100 text-karhub-navy focus-visible:outline-karhub-navy",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
