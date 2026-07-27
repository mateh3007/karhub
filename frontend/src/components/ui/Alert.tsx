import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "error" | "success";
}

const variants = {
  error: "bg-red-50 text-red-700 border-red-200",
  success: "bg-green-50 text-green-700 border-green-200",
};

export function Alert({ children, variant = "error" }: Props) {
  return (
    <div
      role="alert"
      className={`rounded-lg border px-3 py-2 text-sm ${variants[variant]}`}
    >
      {children}
    </div>
  );
}
