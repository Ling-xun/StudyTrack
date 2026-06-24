import { NextResponse } from "next/server";
import { buildStudyContext, isAiConfigured, requestAiCompletion, validateAiChatPayload } from "@/lib/ai";

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

    const reply = await requestAiCompletion(result.data, context);
    return NextResponse.json({ reply });
  } catch (cause) {
    if (cause instanceof SyntaxError) return error("请求内容不是有效的 JSON");
    if (cause instanceof Error && cause.message === "AI_NOT_CONFIGURED") {
      return error("AI 助手尚未配置，请联系管理员设置服务参数", 503);
    }
    if (cause instanceof Error && cause.name === "TimeoutError") {
      return error("AI 响应超时，请稍后再试", 504);
    }

    console.error("AI chat failed", cause instanceof Error ? cause.message : cause);
    return error("AI 暂时没有回应，请稍后再试", 502);
  }
}
