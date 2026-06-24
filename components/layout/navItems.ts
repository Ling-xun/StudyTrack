import { BarChart3, BookOpenCheck, FolderKanban, LayoutDashboard, Sparkles } from "lucide-react";

export const navItems = [
  {
    href: "/",
    label: "首页",
    icon: LayoutDashboard,
  },
  {
    href: "/checkins",
    label: "记录",
    icon: BookOpenCheck,
  },
  {
    href: "/categories",
    label: "分类",
    icon: FolderKanban,
  },
  {
    href: "/statistics",
    label: "统计",
    icon: BarChart3,
  },
  {
    href: "/ai",
    label: "AI 助手",
    icon: Sparkles,
  },
];
