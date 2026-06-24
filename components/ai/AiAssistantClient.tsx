"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Bot, LoaderCircle, RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { requestJson, useCategories, useCheckIns } from "@/lib/queries";
import type { AiMode, AiScope } from "@/lib/ai";

type ScopeType = AiScope["type"];

const scopeOptions: Array<{ value: ScopeType; label: string; hint: string }> = [
  { value: "current", label: "某条记录", hint: "只分析一条具体的学习记录" },
  { value: "category", label: "某个分类", hint: "聚焦同一学习方向的记录" },
  { value: "recent_days", label: "最近 N 天", hint: "看看近期的节奏和进展" },
  { value: "date_range", label: "自定义日期", hint: "分析一段指定时间" },
  { value: "all", label: "全部记录", hint: "最多读取最近 60 条记录" },
];

const modeOptions: Array<{ value: AiMode; label: string; hint: string }> = [
  { value: "summary", label: "简短总结", hint: "快速概括学了什么" },
  { value: "review", label: "详细复盘", hint: "分析进展、方法与改进点" },
  { value: "knowledge", label: "知识点提炼", hint: "整理核心概念和主题" },
  { value: "weakness", label: "薄弱点分析", hint: "找到卡点和练习方向" },
  { value: "plan", label: "下一步计划", hint: "生成轻量、可执行的安排" },
];

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function AiAssistantClient() {
  const categoriesQuery = useCategories();
  const checkInsQuery = useCheckIns({ limit: 50 });
  const categories = categoriesQuery.data ?? [];
  const checkIns = checkInsQuery.data?.items ?? [];

  const [scopeType, setScopeType] = useState<ScopeType>("recent_days");
  const [checkInId, setCheckInId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [days, setDays] = useState("7");
  const [startDate, setStartDate] = useState(() => dateOffset(-6));
  const [endDate, setEndDate] = useState(() => dateOffset(0));
  const [mode, setMode] = useState<AiMode>("review");
  const [message, setMessage] = useState("请根据这些记录，帮我看看最近的学习状态和最值得改进的一点。");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedScopeHint = useMemo(
    () => scopeOptions.find((option) => option.value === scopeType)?.hint,
    [scopeType],
  );

  function makeScope(): AiScope | null {
    switch (scopeType) {
      case "current":
        return checkInId ? { type: "current", checkInId } : null;
      case "category":
        return categoryId ? { type: "category", categoryId } : null;
      case "recent_days":
        return { type: "recent_days", days: Number(days) };
      case "date_range":
        return { type: "date_range", startDate, endDate };
      case "all":
        return { type: "all" };
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const scope = makeScope();

    if (!scope) {
      setError(scopeType === "current" ? "请先选择一条学习记录" : "请先选择一个分类");
      return;
    }

    setLoading(true);
    setError("");
    setReply("");

    try {
      const result = await requestJson<{ reply: string }>("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), scope, mode }),
      });
      setReply(result.reply);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI 暂时没有回应，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="AI 学习助手"
        description="选择一段学习记录，让 AI 帮你总结、复盘，或把下一步想清楚。"
      />

      <form onSubmit={handleSubmit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold text-slate-950">这次想分析什么</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">记录只会由服务端按所选范围读取，不会把密钥交给浏览器。</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="ai-scope">学习记录范围</Label>
              <Select id="ai-scope" value={scopeType} onChange={(event) => setScopeType(event.target.value as ScopeType)}>
                {scopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
              <p className="text-xs leading-5 text-slate-500">{selectedScopeHint}</p>
            </div>

            {scopeType === "current" ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="ai-checkin">学习记录</Label>
                <Select id="ai-checkin" value={checkInId} onChange={(event) => setCheckInId(event.target.value)}>
                  <option value="">请选择记录</option>
                  {checkIns.map((checkIn) => (
                    <option key={checkIn.id} value={checkIn.id}>
                      {String(checkIn.studyDate).slice(0, 10)} · {checkIn.title}
                    </option>
                  ))}
                </Select>
                {checkInsQuery.isLoading ? <p className="text-xs text-slate-500">正在加载记录…</p> : null}
              </div>
            ) : null}

            {scopeType === "category" ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="ai-category">学习分类</Label>
                <Select id="ai-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                  <option value="">请选择分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}（{category.checkInCount} 条）</option>
                  ))}
                </Select>
              </div>
            ) : null}

            {scopeType === "recent_days" ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="ai-days">最近天数</Label>
                <Input id="ai-days" type="number" min={1} max={365} required value={days} onChange={(event) => setDays(event.target.value)} />
              </div>
            ) : null}

            {scopeType === "date_range" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ai-start-date">开始日期</Label>
                  <Input id="ai-start-date" type="date" required value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-end-date">结束日期</Label>
                  <Input id="ai-end-date" type="date" required value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} />
                </div>
              </div>
            ) : null}
          </Card>

          <Card>
            <Label htmlFor="ai-mode">分析类型</Label>
            <Select id="ai-mode" className="mt-2" value={mode} onChange={(event) => setMode(event.target.value as AiMode)}>
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label} — {option.hint}</option>
              ))}
            </Select>

            <div className="mt-4 space-y-2">
              <Label htmlFor="ai-message">补充你的要求</Label>
              <Textarea
                id="ai-message"
                className="min-h-32"
                maxLength={1000}
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="例如：重点看看我是不是学得太散，并给一个明天能完成的小目标。"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>可以告诉 AI 你尤其关心什么</span>
                <span>{message.length}/1000</span>
              </div>
            </div>

            <Button type="submit" className="mt-5 w-full" disabled={loading || !message.trim()}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {loading ? "正在整理和分析…" : "开始分析"}
            </Button>
          </Card>
        </div>

        <Card className="min-h-[30rem] overflow-hidden p-0 xl:sticky xl:top-8">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-950">本次回复</h2>
                <p className="text-xs text-slate-500">不保存完整对话历史</p>
              </div>
            </div>
            {reply || error ? (
              <button type="button" onClick={() => { setReply(""); setError(""); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                清空
              </button>
            ) : null}
          </div>

          <div className="p-5 sm:p-6" aria-live="polite">
            {loading ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-teal-600" aria-hidden="true" />
                <p className="mt-4 font-semibold text-slate-800">正在读你的学习记录</p>
                <p className="mt-1 text-sm text-slate-500">记录较多时可能需要一点时间。</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">{error}</div>
            ) : reply ? (
              <div className="ai-reply max-w-none text-sm leading-7 text-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <Sparkles className="h-7 w-7" aria-hidden="true" />
                </span>
                <p className="mt-4 font-semibold text-slate-800">选好范围后，开始一次复盘</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">AI 只会看到这次选择的记录摘要。第一版每次显示一条新回复。</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  API 密钥仅保存在服务端
                </div>
              </div>
            )}
          </div>
        </Card>
      </form>
    </>
  );
}
