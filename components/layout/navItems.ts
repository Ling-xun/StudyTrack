import { BookOpenCheck, FolderKanban, LayoutDashboard } from "lucide-react";

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
];
