"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Sparkles } from "lucide-react";
import { navItems } from "@/components/layout/navItems";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen border-r border-white/80 bg-white/80 px-5 py-6 shadow-[12px_0_45px_rgba(15,23,42,0.05)] backdrop-blur-xl lg:block">
      <Link href="/" className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-lg shadow-[0_14px_26px_rgba(15,118,110,0.2)]"
          style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
        >
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-lg font-bold text-slate-950">StudyTrack</span>
          <span className="text-sm text-slate-500">个人学习打卡</span>
        </span>
      </Link>

      <nav className="mt-9 space-y-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-950",
                active && "shadow-[0_10px_24px_rgba(15,118,110,0.16)]",
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
              <Icon
                className="h-5 w-5 text-slate-400 transition group-hover:text-teal-600"
                style={active ? { color: "#ccfbf1" } : undefined}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute inset-x-5 bottom-6 rounded-lg border border-teal-100 bg-teal-50/80 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-teal-900">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          V1 学习空间
        </div>
        <p className="mt-2 text-xs leading-5 text-teal-800/75">分类、打卡和首页概览已经连成闭环。</p>
      </div>
    </aside>
  );
}
