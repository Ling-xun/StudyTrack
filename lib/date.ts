import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

export function formatDate(date: Date | string) {
  return dayjs(date).format("YYYY-MM-DD");
}

export function dateInputValue(date = new Date()) {
  return dayjs(date).format("YYYY-MM-DD");
}

export function isToday(date: Date | string) {
  return dayjs(date).isSame(dayjs(), "day");
}

export function isThisWeek(date: Date | string) {
  return dayjs(date).isSame(dayjs(), "isoWeek");
}
