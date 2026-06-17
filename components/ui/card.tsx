import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
