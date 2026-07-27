import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-karhub-navy"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded-lg border border-gray-300 px-3 py-2 text-sm text-karhub-navy focus:border-karhub-orange focus:outline-none focus:ring-2 focus:ring-karhub-orange/20 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
