import dayjs from "dayjs";
import { formatDate, isThisWeek, isToday } from "@/lib/date";
import type { CheckInWithCategory } from "@/lib/types";

export type StudyStatistics = {
  totalDuration: number;
  todayMinutes: number;
  weekMinutes: number;
  checkedToday: boolean;
  totalCheckInDays: number;
  totalCheckInCount: number;
  averageDurationPerDay: number;
  topCategory: {
    id: string;
    name: string;
    duration: number;
    color: string;
  } | null;
  recentSevenDays: Array<{
    date: string;
    duration: number;
  }>;
  categoryDurations: Array<{
    categoryId: string;
    name: string;
    color: string;
    duration: number;
  }>;
  latestCheckIn: {
    id: string;
    title: string;
    studyDate: Date;
  } | null;
};

export function calculateStudyStatistics(checkIns: CheckInWithCategory[]): StudyStatistics {
  const todayMinutes = checkIns
    .filter((checkIn) => isToday(checkIn.studyDate))
    .reduce((sum, checkIn) => sum + checkIn.duration, 0);
  const weekMinutes = checkIns
    .filter((checkIn) => isThisWeek(checkIn.studyDate))
    .reduce((sum, checkIn) => sum + checkIn.duration, 0);
  const totalDuration = checkIns.reduce((sum, checkIn) => sum + checkIn.duration, 0);
  const totalCheckInDays = new Set(checkIns.map((checkIn) => formatDate(checkIn.studyDate))).size;
  const totalCheckInCount = checkIns.length;
  const averageDurationPerDay =
    totalCheckInDays === 0 ? 0 : Math.round(totalDuration / totalCheckInDays);

  const recentSevenDays = Array.from({ length: 7 }).map((_, index) => {
    const date = dayjs().subtract(6 - index, "day").format("YYYY-MM-DD");
    const duration = checkIns
      .filter((checkIn) => formatDate(checkIn.studyDate) === date)
      .reduce((sum, checkIn) => sum + checkIn.duration, 0);

    return { date, duration };
  });

  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      name: string;
      color: string;
      duration: number;
    }
  >();

  for (const checkIn of checkIns) {
    const existing = categoryMap.get(checkIn.category.id);

    if (existing) {
      existing.duration += checkIn.duration;
      continue;
    }

    categoryMap.set(checkIn.category.id, {
      categoryId: checkIn.category.id,
      name: checkIn.category.name,
      color: checkIn.category.color,
      duration: checkIn.duration,
    });
  }

  const categoryDurations = Array.from(categoryMap.values()).sort((a, b) => b.duration - a.duration);
  const topCategory = categoryDurations[0]
    ? {
        id: categoryDurations[0].categoryId,
        name: categoryDurations[0].name,
        duration: categoryDurations[0].duration,
        color: categoryDurations[0].color,
      }
    : null;

  const latestCheckIn = checkIns[0]
    ? {
        id: checkIns[0].id,
        title: checkIns[0].title,
        studyDate: checkIns[0].studyDate,
      }
    : null;

  return {
    totalDuration,
    todayMinutes,
    weekMinutes,
    checkedToday: todayMinutes > 0,
    totalCheckInDays,
    totalCheckInCount,
    averageDurationPerDay,
    topCategory,
    recentSevenDays,
    categoryDurations,
    latestCheckIn,
  };
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }

  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} 小时`;
}
