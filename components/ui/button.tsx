import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "destructive-confirm";
type BtnSize = "default" | "sm" | "icon";

const BASE =
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:bg-white",
  secondary: "bg-surface-2 text-fg border border-line hover:bg-white/10",
  ghost: "text-fg-muted hover:text-fg hover:bg-white/5",
  destructive: "text-danger hover:text-danger hover:bg-danger/10",
  "destructive-confirm": "bg-danger text-white hover:bg-danger/90",
};

const SIZES: Record<BtnSize, string> = {
  default: "h-9 px-4",
  sm: "h-8 px-3 text-xs",
  icon: "size-9 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: BtnSize;
}

export function Button({
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
