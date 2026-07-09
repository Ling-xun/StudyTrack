import type { Category, CheckIn } from "@prisma/client";

export type CategorySummary = Pick<Category, "id" | "name" | "color" | "icon">;

export type CategoryListItem = CategorySummary & {
  checkInCount: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type CheckInWithCategory = CheckIn & {
  category: CategorySummary;
};

export type CheckInListItem = {
  id: string;
  title: string;
  studyDate: Date | string;
  duration: number;
  mood: string | null;
  categoryId: string;
  isDraft: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  category: CategorySummary;
};

export type PaginatedCheckIns = {
  items: CheckInListItem[];
  total: number;
  limit: number;
  offset: number;
  nextOffset: number | null;
};
