import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary:
    "shadow-[0_12px_24px_rgba(15,118,110,0.22)] hover:-translate-y-0.5",
  secondary:
    "border border-slate-200 bg-white/90 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white",
  ghost: "hover:bg-white/70",
  danger: "shadow-sm shadow-red-200 hover:bg-red-700",
};

const variantStyles: Record<keyof typeof variants, CSSProperties> = {
  primary: {
    backgroundColor: "#0f766e",
    color: "#ffffff",
  },
  secondary: {
    color: "#334155",
  },
  ghost: {
    color: "#475569",
  },
  danger: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
  },
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", style, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} style={{ ...variantStyles[variant], ...style }} {...props} />;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function ButtonLink({ className, variant = "primary", href, style, ...props }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], className)}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  );
}
