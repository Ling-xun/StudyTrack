import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyTrack",
  description: "个人学习打卡 App",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen lg:grid lg:grid-cols-[18rem_1fr]">
          <AppSidebar />
          <main className="pb-24 lg:pb-0">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
