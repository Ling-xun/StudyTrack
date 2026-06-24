import { buildAiMessages, type AiPromptMessage } from "@/lib/ai-prompt";

export const AI_MODES = ["summary", "review", "knowledge", "weakness", "plan"] as const;
export type AiMode = (typeof AI_MODES)[number];

export type AiScope =
  | { type: "current"; checkInId: string }
  | { type: "category"; categoryId: string }
  | { type: "recent_days"; days: number }
  | { type: "date_range"; startDate: string; endDate: string }
  | { type: "all" };

export type AiChatPayload = {
  message: string;
  scope: AiScope;
  mode: AiMode;
  conversationId?: string;
  saveSummary: boolean;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export function validateAiChatPayload(value: unknown): { data: AiChatPayload } | { message: string } {
  if (!isObject(value)) return { message: "请求参数格式不正确" };

  const allowedKeys = ["message", "scope", "mode", "conversationId", "saveSummary"];
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    return { message: "请求包含不支持的参数" };
  }

  const message = typeof value.message === "string" ? value.message.trim() : "";
  if (!message) return { message: "请输入想让 AI 帮你分析的问题" };
  if (message.length > 1_000) return { message: "问题不能超过 1000 个字符" };
  if (typeof value.mode !== "string" || !AI_MODES.includes(value.mode as AiMode)) {
    return { message: "不支持的分析类型" };
  }
  if (!isObject(value.scope) || typeof value.scope.type !== "string") {
    return { message: "请选择有效的学习记录范围" };
  }

  const conversationId = typeof value.conversationId === "string" ? value.conversationId.trim() : undefined;
  if (conversationId && conversationId.length > 100) return { message: "对话标识不正确" };
  if (value.saveSummary !== undefined && typeof value.saveSummary !== "boolean") {
    return { message: "保存总结选项格式不正确" };
  }

  const scope = value.scope;
  let parsedScope: AiScope;
  switch (scope.type) {
    case "current":
      if (typeof scope.checkInId !== "string" || !scope.checkInId.trim()) return { message: "请选择一条学习记录" };
      parsedScope = { type: "current", checkInId: scope.checkInId.trim() };
      break;
    case "category":
      if (typeof scope.categoryId !== "string" || !scope.categoryId.trim()) return { message: "请选择一个学习分类" };
      parsedScope = { type: "category", categoryId: scope.categoryId.trim() };
      break;
    case "recent_days": {
      const days = Number(scope.days);
      if (!Number.isInteger(days) || days < 1 || days > 365) return { message: "最近天数需要在 1—365 之间" };
      parsedScope = { type: "recent_days", days };
      break;
    }
    case "date_range":
      if (!isValidDate(scope.startDate) || !isValidDate(scope.endDate)) return { message: "请选择有效的开始和结束日期" };
      if (scope.startDate > scope.endDate) return { message: "开始日期不能晚于结束日期" };
      parsedScope = { type: "date_range", startDate: scope.startDate, endDate: scope.endDate };
      break;
    case "all":
      parsedScope = { type: "all" };
      break;
    default:
      return { message: "不支持的学习记录范围" };
  }

  return {
    data: {
      message,
      scope: parsedScope,
      mode: value.mode as AiMode,
      conversationId: conversationId || undefined,
      saveSummary: value.saveSummary !== false,
    },
  };
}

function chatCompletionsUrl(baseUrl: string) {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

export function isAiConfigured() {
  return Boolean(process.env.AI_API_KEY?.trim() && process.env.AI_BASE_URL?.trim() && process.env.AI_MODEL?.trim());
}

function isReasoningEnabled() {
  return process.env.AI_REASONING_ENABLED?.trim().toLowerCase() === "true";
}

export function getAiModel() {
  return process.env.AI_MODEL?.trim() || null;
}

export async function requestAiCompletion(
  payload: AiChatPayload,
  studyContext: string,
  historyMessages: AiPromptMessage[] = [],
) {
  const apiKey = process.env.AI_API_KEY?.trim();
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const model = process.env.AI_MODEL?.trim();
  if (!apiKey || !baseUrl || !model) throw new Error("AI_NOT_CONFIGURED");
  const reasoningEnabled = isReasoningEnabled();

  const response = await fetch(chatCompletionsUrl(baseUrl), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      ...(reasoningEnabled
        ? { thinking: { type: "enabled" }, reasoning_effort: "high", max_tokens: 4_096 }
        : { temperature: 0.45, max_tokens: 1_200 }),
      messages: buildAiMessages(payload, studyContext, historyMessages),
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const data = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
    | null;
  if (!response.ok) throw new Error(data?.error?.message || `AI 请求失败（${response.status}）`);

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI_EMPTY_RESPONSE");
  return { content, model };
}
