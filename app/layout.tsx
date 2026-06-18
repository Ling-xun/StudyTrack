import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/common/ToastProvider";
import { AppShell } from "@/components/layout/AppShell";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyTrack",
  description: "个人学习打卡 App",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
