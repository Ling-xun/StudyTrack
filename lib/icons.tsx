import {
  BookOpen,
  Brain,
  Code,
  Cpu,
  Languages,
  Network,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  BookOpen,
  Brain,
  Code,
  Cpu,
  Languages,
  Network,
  Sparkles,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = icons[name ?? ""] ?? BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}

export const iconOptions = Object.keys(icons);
