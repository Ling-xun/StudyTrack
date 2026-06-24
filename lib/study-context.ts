import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { AiScope } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

const MAX_CONTENT_LENGTH = 5_000;
const MAX_CONTEXT_LENGTH = 60_000;

export type StudyContextResult = {
  text: string;
  sourceCount: number;
  sourceHash: string;
  scopeValue: string | null;
  scopeLabel: string;
};

function endOfDate(value: string) {
  return new Date(`${value}T23:59:59.999`);
}

function scopeWhere(scope: AiScope): Prisma.CheckInWhereInput {
  switch (scope.type) {
    case "current":
      return { id: scope.checkInId };
    case "category":
      return { categoryId: scope.categoryId };
    case "recent_days": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - scope.days + 1);
      return { studyDate: { gte: start } };
    }
    case "date_range":
      return { studyDate: { gte: new Date(`${scope.startDate}T00:00:00`), lte: endOfDate(scope.endDate) } };
    case "all":
      return {};
  }
}

function recordLimit(scope: AiScope) {
  if (scope.type === "current") return 1;
  if (scope.type === "category") return 50;
  return 100;
}

function trimContent(content: string) {
  const compact = content.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return compact.length > MAX_CONTENT_LENGTH ? `${compact.slice(0, MAX_CONTENT_LENGTH)}…（内容已截断）` : compact;
}

export async function buildStudyContext(scope: AiScope): Promise<StudyContextResult | null> {
  const where = scopeWhere(scope);
  const [records, total] = await Promise.all([
    prisma.checkIn.findMany({
      where,
      take: recordLimit(scope),
      orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        content: true,
        studyDate: true,
        duration: true,
        mood: true,
        updatedAt: true,
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.checkIn.count({ where }),
  ]);
  if (records.length === 0) return null;

  const first = records[0];
  let scopeValue: Record<string, unknown> | null = null;
  let scopeLabel = "全部学习记录";
  switch (scope.type) {
    case "current":
      scopeValue = { checkInId: scope.checkInId, checkInTitle: first.title };
      scopeLabel = "当前记录";
      break;
    case "category":
      scopeValue = { categoryId: scope.categoryId, categoryName: first.category.name };
      scopeLabel = first.category.name;
      break;
    case "recent_days":
      scopeValue = { days: scope.days };
      scopeLabel = `最近 ${scope.days} 天`;
      break;
    case "date_range":
      scopeValue = { startDate: scope.startDate, endDate: scope.endDate };
      scopeLabel = `${scope.startDate} 至 ${scope.endDate}`;
      break;
    case "all":
      scopeValue = null;
      break;
  }

  const totalMinutes = records.reduce((sum, record) => sum + record.duration, 0);
  const categoryCounts = new Map<string, number>();
  records.forEach((record) => categoryCounts.set(record.category.name, (categoryCounts.get(record.category.name) ?? 0) + 1));
  const categories = [...categoryCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([name, count]) => `${name} ${count} 条`)
    .join("、");
  const header = [
    `符合范围的记录：${total} 条；本次选取最近 ${records.length} 条`,
    `选取记录学习时长合计：${totalMinutes} 分钟`,
    `分类分布：${categories}`,
  ].join("\n");

  let usedLength = header.length;
  const included = [] as typeof records;
  const sections: string[] = [];
  for (const [index, record] of records.entries()) {
    const section = [
      `### 记录 ${index + 1}`,
      `日期：${record.studyDate.toISOString().slice(0, 10)}｜分类：${record.category.name}｜时长：${record.duration} 分钟｜状态：${record.mood || "未填写"}`,
      `标题：${record.title.slice(0, 100)}`,
      `内容：${trimContent(record.content)}`,
    ].join("\n");
    if (usedLength + section.length > MAX_CONTEXT_LENGTH) break;
    included.push(record);
    sections.push(section);
    usedLength += section.length;
  }

  const sourceHash = createHash("sha256")
    .update(included.map((record) => `${record.id}:${record.updatedAt.toISOString()}`).join("|"))
    .digest("hex");

  return {
    text: `${header}\n\n${sections.join("\n\n")}`,
    sourceCount: included.length,
    sourceHash,
    scopeValue: scopeValue ? JSON.stringify(scopeValue) : null,
    scopeLabel,
  };
}
