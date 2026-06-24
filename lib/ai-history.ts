import type { AiMode, AiScope } from "@/lib/ai";
import type { StudyContextResult } from "@/lib/study-context";
import { prisma } from "@/lib/prisma";

const modeLabels: Record<AiMode, string> = {
  summary: "学习总结",
  review: "详细复盘",
  knowledge: "知识点提炼",
  weakness: "薄弱点分析",
  plan: "下一步学习计划",
};

export function generateAiTitle(scopeLabel: string, mode: AiMode) {
  const title = `${scopeLabel}${modeLabels[mode]}`.trim();
  return title.length > 80 ? `${title.slice(0, 79)}…` : title || "AI 学习助手对话";
}

export async function createConversation(scope: AiScope, context: StudyContextResult, mode: AiMode, model: string | null) {
  return prisma.aiConversation.create({
    data: {
      title: generateAiTitle(context.scopeLabel, mode),
      scopeType: scope.type,
      scopeValue: context.scopeValue,
      mode,
      model,
    },
  });
}

export async function getConversationForChat(id: string) {
  const conversation = await prisma.aiConversation.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      messages: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { role: true, content: true },
      },
    },
  });
  if (!conversation) return null;
  return { ...conversation, messages: conversation.messages.reverse() };
}

export function saveUserMessage(conversationId: string, content: string) {
  return prisma.aiMessage.create({ data: { conversationId, role: "user", content } });
}

export async function saveAiResult({
  conversationId,
  content,
  payload,
  context,
  model,
}: {
  conversationId: string;
  content: string;
  payload: { scope: AiScope; mode: AiMode; saveSummary: boolean };
  context: StudyContextResult;
  model: string;
}) {
  return prisma.$transaction(async (transaction) => {
    const assistantMessage = await transaction.aiMessage.create({
      data: { conversationId, role: "assistant", content },
    });
    await transaction.aiConversation.update({
      where: { id: conversationId },
      data: {
        scopeType: payload.scope.type,
        scopeValue: context.scopeValue,
        mode: payload.mode,
        model,
        updatedAt: new Date(),
      },
    });

    const summary = payload.saveSummary
      ? await transaction.aiSummary.create({
          data: {
            title: generateAiTitle(context.scopeLabel, payload.mode),
            content,
            scopeType: payload.scope.type,
            scopeValue: context.scopeValue,
            mode: payload.mode,
            sourceCount: context.sourceCount,
            sourceHash: context.sourceHash,
            model,
          },
          select: { id: true },
        })
      : null;

    return { assistantMessage, summaryId: summary?.id ?? null };
  });
}

export async function listSummaries({
  mode,
  scopeType,
  page,
  pageSize,
}: {
  mode?: string;
  scopeType?: string;
  page: number;
  pageSize: number;
}) {
  const where = { ...(mode ? { mode } : {}), ...(scopeType ? { scopeType } : {}) };
  const [items, total] = await Promise.all([
    prisma.aiSummary.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        scopeType: true,
        scopeValue: true,
        mode: true,
        sourceCount: true,
        model: true,
        createdAt: true,
      },
    }),
    prisma.aiSummary.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export function getSummary(id: string) {
  return prisma.aiSummary.findUnique({ where: { id } });
}

export function deleteSummary(id: string) {
  return prisma.aiSummary.delete({ where: { id } });
}

export async function listConversations(page: number, pageSize: number) {
  const [items, total] = await Promise.all([
    prisma.aiConversation.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        scopeType: true,
        scopeValue: true,
        mode: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    }),
    prisma.aiConversation.count(),
  ]);
  return {
    items: items.map(({ _count, ...conversation }) => ({ ...conversation, messageCount: _count.messages })),
    total,
    page,
    pageSize,
  };
}

export function getConversation(id: string) {
  return prisma.aiConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export function deleteConversation(id: string) {
  return prisma.aiConversation.delete({ where: { id } });
}
