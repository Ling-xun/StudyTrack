"use client";

import { useInfiniteQuery, useQuery, type QueryClient } from "@tanstack/react-query";
import type { StudyStatistics } from "@/lib/statistics";
import type { CategoryListItem, CategorySummary, CheckInWithCategory, PaginatedCheckIns } from "@/lib/types";

export const DEFAULT_CHECKIN_LIMIT = 20;

export type CheckInListParams = {
  keyword?: string;
  categoryId?: string;
  date?: string;
  limit?: number;
  offset?: number;
};

export const queryKeys = {
  categories: ["categories"] as const,
  statistics: ["statistics"] as const,
  checkInsRoot: ["checkins"] as const,
  checkIns: (params: CheckInListParams = {}) => ["checkins", normalizeCheckInParams(params)] as const,
  checkInsInfinite: (params: CheckInListParams = {}) => [
    "checkins",
    "infinite",
    { ...normalizeCheckInParams(params), offset: 0 },
  ] as const,
  checkIn: (id: string) => ["checkin", id] as const,
};

function normalizeCheckInParams(params: CheckInListParams = {}) {
  return {
    categoryId: params.categoryId?.trim() ?? "",
    date: params.date?.trim() ?? "",
    keyword: params.keyword?.trim() ?? "",
    limit: params.limit ?? DEFAULT_CHECKIN_LIMIT,
    offset: params.offset ?? 0,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (response.status === 401 && typeof window !== "undefined") {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    }

    throw new Error(payload?.message ?? "请求失败，请稍后再试");
  }

  return response.json() as Promise<T>;
}

function checkInsUrl(params: CheckInListParams = {}) {
  const normalized = normalizeCheckInParams(params);
  const searchParams = new URLSearchParams({
    limit: String(normalized.limit),
    offset: String(normalized.offset),
  });

  if (normalized.keyword) {
    searchParams.set("keyword", normalized.keyword);
  }

  if (normalized.categoryId) {
    searchParams.set("categoryId", normalized.categoryId);
  }

  if (normalized.date) {
    searchParams.set("date", normalized.date);
  }

  return `/api/checkins?${searchParams.toString()}`;
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => fetchJson<CategoryListItem[]>("/api/categories"),
  });
}

export function useCategoryOptions() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => fetchJson<CategoryListItem[]>("/api/categories"),
    select: (categories): CategorySummary[] =>
      categories.map(({ id, name, color, icon }) => ({ id, name, color, icon })),
  });
}

export function useStatistics() {
  return useQuery({
    queryKey: queryKeys.statistics,
    queryFn: () => fetchJson<StudyStatistics>("/api/statistics"),
  });
}

export function useCheckIns(params: CheckInListParams = {}) {
  return useQuery({
    queryKey: queryKeys.checkIns(params),
    queryFn: () => fetchJson<PaginatedCheckIns>(checkInsUrl(params)),
    placeholderData: (previousData) => previousData,
  });
}

export function useInfiniteCheckIns(params: CheckInListParams = {}) {
  const normalized = normalizeCheckInParams(params);

  return useInfiniteQuery({
    queryKey: queryKeys.checkInsInfinite(normalized),
    queryFn: ({ pageParam }) => fetchJson<PaginatedCheckIns>(checkInsUrl({ ...normalized, offset: pageParam })),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: normalized.offset,
    placeholderData: (previousData) => previousData,
  });
}

export function useCheckIn(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.checkIn(id),
    queryFn: () => fetchJson<CheckInWithCategory>(`/api/checkins/${id}`),
  });
}

export function invalidateCheckInData(queryClient: QueryClient, id?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.checkInsRoot });
  queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
  queryClient.invalidateQueries({ queryKey: queryKeys.categories });

  if (id) {
    queryClient.invalidateQueries({ queryKey: queryKeys.checkIn(id) });
  }
}

export function invalidateCategoryData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.categories });
  queryClient.invalidateQueries({ queryKey: queryKeys.checkInsRoot });
  queryClient.invalidateQueries({ queryKey: queryKeys.statistics });
}

export function prefetchRouteData(queryClient: QueryClient, href: string) {
  if (href === "/") {
    queryClient.prefetchQuery({
      queryKey: queryKeys.statistics,
      queryFn: () => fetchJson<StudyStatistics>("/api/statistics"),
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.checkIns({ limit: 5 }),
      queryFn: () => fetchJson<PaginatedCheckIns>(checkInsUrl({ limit: 5 })),
    });
    return;
  }

  if (href === "/checkins") {
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories,
      queryFn: () => fetchJson<CategoryListItem[]>("/api/categories"),
    });
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.checkInsInfinite({ limit: DEFAULT_CHECKIN_LIMIT }),
      queryFn: ({ pageParam }) => fetchJson<PaginatedCheckIns>(checkInsUrl({ limit: DEFAULT_CHECKIN_LIMIT, offset: Number(pageParam) })),
      getNextPageParam: (lastPage: PaginatedCheckIns) => lastPage.nextOffset,
      initialPageParam: 0,
    });
    return;
  }

  if (href === "/categories") {
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories,
      queryFn: () => fetchJson<CategoryListItem[]>("/api/categories"),
    });
    return;
  }

  if (href === "/statistics") {
    queryClient.prefetchQuery({
      queryKey: queryKeys.statistics,
      queryFn: () => fetchJson<StudyStatistics>("/api/statistics"),
    });
  }
}

export async function requestJson<T>(url: string, init?: RequestInit) {
  return fetchJson<T>(url, init);
}
