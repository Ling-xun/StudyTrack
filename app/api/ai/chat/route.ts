import { NextResponse } from "next/server";
import { getAiModel, isAiConfigured, requestAiCompletion, validateAiChatPayload } from "@/lib/ai";
import {
  createConversation,
  getConversationForChat,
  saveAiResult,
  saveUserMessage,
} from "@/lib/ai-history";
import { buildStudyContext } from "@/lib/study-context";

function error(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  try {
    const result = validateAiChatPayload(await request.json());
    if ("message" in result) return error(result.message);
    if (!isAiConfigured()) return error("AI 助手尚未配置，请联系管理员设置服务参数", 503);

    const context = await buildStudyContext(result.data.scope);
    if (!context) return error("所选范围内还没有学习记录，请换一个范围再试", 404);

    const model = getAiModel();
    if (!model) return error("AI 助手尚未配置，请联系管理员设置服务参数", 503);

    let conversationId = result.data.conversationId;
    let conversationTitle = "AI 学习助手对话";
    let historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (conversationId) {
      const existingConversation = await getConversationForChat(conversationId);
      if (!existingConversation) return error("这段历史对话不存在或已被删除", 404);
      conversationTitle = existingConversation.title;
      historyMessages = existingConversation.messages.filter(
        (message): message is { role: "user" | "assistant"; content: string } =>
          message.role === "user" || message.role === "assistant",
      );
    } else {
      const conversation = await createConversation(result.data.scope, context, result.data.mode, model);
      conversationId = conversation.id;
      conversationTitle = conversation.title;
    }

    await saveUserMessage(conversationId, result.data.message);
    const completion = await requestAiCompletion(result.data, context.text, historyMessages);
    const saved = await saveAiResult({
      conversationId,
      content: completion.content,
      payload: result.data,
      context,
      model: completion.model,
    });

    return NextResponse.json({
      conversationId,
      conversationTitle,
      assistantMessage: saved.assistantMessage,
      summaryId: saved.summaryId,
    });
  } catch (cause) {
    if (cause instanceof SyntaxError) return error("请求内容不是有效的 JSON");
    if (cause instanceof Error && cause.message === "AI_NOT_CONFIGURED") {
      return error("AI 助手尚未配置，请联系管理员设置服务参数", 503);
    }
    if (cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError")) {
      return error("AI 响应超时，请稍后再试", 504);
    }
    console.error("AI chat failed", cause instanceof Error ? cause.message : "unknown error");
    return error("AI 暂时没有回应，请稍后再试", 502);
  }
}
