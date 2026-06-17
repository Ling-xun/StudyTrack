import type { Category, CheckIn } from "@prisma/client";

export type CategorySummary = Pick<Category, "id" | "name" | "color" | "icon">;

export type CheckInWithCategory = CheckIn & {
  category: CategorySummary;
};
