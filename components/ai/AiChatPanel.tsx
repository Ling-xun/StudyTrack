"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { Bot, Copy, LoaderCircle, MessageSquareText, RotateCcw, Send, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import type { AiMessageItem, AiSummaryDetail } from "@/components/ai/types";

export function AiChatPanel({ title, messages, summary, input, loading, detailLoading, error, onInputChange, onSend, onNew, onCopySummary, onReviewSummary, onDeleteSummary }: {
  title: string;
  messages: AiMessageItem[];
  summary: AiSummaryDetail | null;
  input: string;
  loading: boolean;
  detailLoading: boolean;
  error: string;
  onInputChange: (value: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onCopySummary: () => void;
  onReviewSummary: () => void;
  onDeleteSummary: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  return (
    <Card className="order-1 flex min-h-[38rem] flex-col overflow-hidden p-0 xl:order-2 xl:min-h-[calc(100dvh-12rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white"><Bot className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-950">{summary?.title || title}</h2><p className="text-xs text-slate-500">{summary ? "历史总结" : "对话会自动保存，可以继续追问"}</p></div>
        </div>
        <button type="button" onClick={onNew} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"><RotateCcw className="h-3.5 w-3.5" />新对话</button>
      </div>

      {detailLoading ? <div className="flex flex-1 items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-teal-600" /></div> : summary ? (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onCopySummary}><Copy className="h-4 w-4" />复制内容</Button>
            <Button type="button" variant="secondary" onClick={onReviewSummary}><MessageSquareText className="h-4 w-4" />根据总结继续复盘</Button>
            <Button type="button" variant="ghost" className="text-red-600" onClick={onDeleteSummary}><Trash2 className="h-4 w-4" />删除</Button>
          </div>
          <div className="mb-5 flex flex-wrap gap-2 text-xs text-slate-500"><span className="rounded-full bg-slate-100 px-3 py-1">{summary.sourceCount} 条来源</span><span className="rounded-full bg-slate-100 px-3 py-1">{summary.model || "AI"}</span><span className="rounded-full bg-slate-100 px-3 py-1">{new Date(summary.createdAt).toLocaleString("zh-CN")}</span></div>
          <div className="ai-reply text-sm leading-7 text-slate-700"><ReactMarkdown remarkPlugins={[remarkGfm]}>{summary.content}</ReactMarkdown></div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {messages.length === 0 && !loading ? <div className="flex min-h-72 flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Sparkles className="h-7 w-7" /></span><p className="mt-4 font-semibold text-slate-800">开始一次有记录可循的复盘</p><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">选择范围和模式后发送问题。回复会保存在当前对话中。</p></div> : null}
            {messages.map((item) => item.role === "user" ? <div key={item.id} className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-teal-700 px-4 py-3 text-sm leading-6 text-white whitespace-pre-wrap">{item.content}</div> : <div key={item.id} className="max-w-[94%] rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-4 py-3"><div className="ai-reply text-sm leading-7 text-slate-700"><ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown></div></div>)}
            {loading ? <div className="flex items-center gap-3 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin text-teal-600" /><span>AI 正在整理你的学习记录并深度思考…</span></div> : null}
            {error ? <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={onSend} className="border-t border-slate-100 p-4 sm:p-5">
            <Textarea value={input} onChange={(event) => onInputChange(event.target.value)} maxLength={1000} required className="min-h-24" placeholder="例如：我最需要优先补哪一块？为什么？" />
            <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-400">{input.length}/1000</span><Button type="submit" disabled={loading || !input.trim()}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{loading ? "分析中…" : "发送"}</Button></div>
          </form>
        </>
      )}
    </Card>
  );
}
