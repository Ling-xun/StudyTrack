"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/navItems";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-white/80 bg-white/95 px-2 py-2 shadow-[0_-16px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold text-slate-500 transition",
              active && "shadow-sm",
            )}
            style={
              active
                ? {
                    backgroundColor: "#0f766e",
                    color: "#ffffff",
                  }
                : undefined
            }
          >
            <Icon className="h-5 w-5" style={active ? { color: "#ccfbf1" } : undefined} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
