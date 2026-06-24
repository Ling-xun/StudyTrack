import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/common/ToastProvider";
import { AppShell } from "@/components/layout/AppShell";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyTrack",
  description: "个人学习打卡 App",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
