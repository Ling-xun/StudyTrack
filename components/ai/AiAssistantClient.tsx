"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/ToastProvider";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { AiHistorySidebar } from "@/components/ai/AiHistorySidebar";
import { AiSettingsPanel, type AiSettings } from "@/components/ai/AiSettingsPanel";
import type { AiConversationDetail, AiConversationListItem, AiMessageItem, AiSummaryDetail, AiSummaryListItem, PaginatedResult } from "@/components/ai/types";
import { PageHeader } from "@/components/layout/PageHeader";
import type { AiScope } from "@/lib/ai";
import { requestJson, useCategories, useCheckIns } from "@/lib/queries";

function dateOffset(days: number) { const date = new Date(); date.setDate(date.getDate() + days); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 10); }

const initialSettings = (): AiSettings => ({ scopeType: "recent_days", checkInId: "", categoryId: "", days: "7", startDate: dateOffset(-6), endDate: dateOffset(0), mode: "review", saveSummary: true });

export function AiAssistantClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const categoriesQuery = useCategories();
  const checkInsQuery = useCheckIns({ limit: 50 });
  const conversationsQuery = useQuery({ queryKey: ["ai", "conversations"], queryFn: () => requestJson<PaginatedResult<AiConversationListItem>>("/api/ai/conversations?pageSize=30") });
  const summariesQuery = useQuery({ queryKey: ["ai", "summaries"], queryFn: () => requestJson<PaginatedResult<AiSummaryListItem>>("/api/ai/summaries?pageSize=30") });

  const [settings, setSettings] = useState<AiSettings>(initialSettings);
  const [historyTab, setHistoryTab] = useState<"conversations" | "summaries">("conversations");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState("新对话");
  const [messages, setMessages] = useState<AiMessageItem[]>([]);
  const [summary, setSummary] = useState<AiSummaryDetail | null>(null);
  const [input, setInput] = useState("请根据这些记录，帮我看看最近的学习状态和最值得改进的一点。");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "conversation" | "summary"; id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  function makeScope(): AiScope | null {
    switch (settings.scopeType) {
      case "current": return settings.checkInId ? { type: "current", checkInId: settings.checkInId } : null;
      case "category": return settings.categoryId ? { type: "category", categoryId: settings.categoryId } : null;
      case "recent_days": return { type: "recent_days", days: Number(settings.days) };
      case "date_range": return { type: "date_range", startDate: settings.startDate, endDate: settings.endDate };
      case "all": return { type: "all" };
    }
  }

  function hydrateSettings(scopeType: string | null, scopeValue: string | null, mode: string | null) {
    let value: Record<string, unknown> = {};
    try { value = scopeValue ? JSON.parse(scopeValue) as Record<string, unknown> : {}; } catch { value = {}; }
    const validScope = ["current", "category", "recent_days", "date_range", "all"].includes(scopeType || "") ? scopeType as AiSettings["scopeType"] : "recent_days";
    const validMode = ["summary", "review", "knowledge", "weakness", "plan"].includes(mode || "") ? mode as AiSettings["mode"] : "review";
    setSettings((current) => ({ ...current, scopeType: validScope, mode: validMode, checkInId: typeof value.checkInId === "string" ? value.checkInId : current.checkInId, categoryId: typeof value.categoryId === "string" ? value.categoryId : current.categoryId, days: typeof value.days === "number" ? String(value.days) : current.days, startDate: typeof value.startDate === "string" ? value.startDate : current.startDate, endDate: typeof value.endDate === "string" ? value.endDate : current.endDate }));
  }

  function newConversation() { setConversationId(null); setConversationTitle("新对话"); setMessages([]); setSummary(null); setError(""); setInput("请根据这些记录，帮我看看最近的学习状态和最值得改进的一点。"); }

  async function openConversation(id: string) {
    setDetailLoading(true); setError(""); setSummary(null);
    try { const detail = await requestJson<AiConversationDetail>(`/api/ai/conversations/${id}`); setConversationId(detail.id); setConversationTitle(detail.title); setMessages(detail.messages); hydrateSettings(detail.scopeType, detail.scopeValue, detail.mode); }
    catch (cause) { toast(cause instanceof Error ? cause.message : "打开对话失败", "error"); }
    finally { setDetailLoading(false); }
  }

  async function openSummary(id: string) {
    setDetailLoading(true); setError("");
    try { const detail = await requestJson<AiSummaryDetail>(`/api/ai/summaries/${id}`); setSummary(detail); setConversationId(null); hydrateSettings(detail.scopeType, detail.scopeValue, detail.mode); }
    catch (cause) { toast(cause instanceof Error ? cause.message : "打开总结失败", "error"); }
    finally { setDetailLoading(false); }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const scope = makeScope();
    if (!scope) { setError(settings.scopeType === "current" ? "请先选择一条学习记录" : "请先选择一个分类"); return; }
    const userText = input.trim(); const optimistic: AiMessageItem = { id: `local-${Date.now()}`, role: "user", content: userText, createdAt: new Date().toISOString() };
    setMessages((items) => [...items, optimistic]); setInput(""); setLoading(true); setError(""); setSummary(null);
    try {
      const result = await requestJson<{ conversationId: string; conversationTitle: string; assistantMessage: AiMessageItem; summaryId: string | null }>("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userText, scope, mode: settings.mode, conversationId: conversationId || undefined, saveSummary: settings.saveSummary }) });
      setConversationId(result.conversationId); setConversationTitle(result.conversationTitle); setMessages((items) => [...items, result.assistantMessage]);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] }), queryClient.invalidateQueries({ queryKey: ["ai", "summaries"] })]);
      if (result.summaryId) toast("回复已保存到总结历史");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "AI 暂时没有回应，请稍后再试"); }
    finally { setLoading(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return; setDeleting(true);
    try { await requestJson(`/api/ai/${deleteTarget.type === "conversation" ? "conversations" : "summaries"}/${deleteTarget.id}`, { method: "DELETE" }); await queryClient.invalidateQueries({ queryKey: ["ai", deleteTarget.type === "conversation" ? "conversations" : "summaries"] }); if (deleteTarget.type === "conversation" && conversationId === deleteTarget.id) newConversation(); if (deleteTarget.type === "summary" && summary?.id === deleteTarget.id) newConversation(); toast(deleteTarget.type === "conversation" ? "对话已删除" : "总结已删除"); setDeleteTarget(null); }
    catch (cause) { toast(cause instanceof Error ? cause.message : "删除失败", "error"); }
    finally { setDeleting(false); }
  }

  function reviewSummary() { if (!summary) return; const content = summary.content.slice(0, 500); setSummary(null); setConversationId(null); setConversationTitle(`复盘：${summary.title}`); setMessages([]); setInput(`请基于这份历史总结继续帮我复盘，指出现在最值得验证或改进的一点：\n\n${content}`); }

  async function copySummary() {
    if (!summary) return;
    try { await navigator.clipboard.writeText(summary.content); toast("总结已复制"); }
    catch { toast("复制失败，请手动选择内容复制", "error"); }
  }

  return <>
    <PageHeader title="AI 学习助手" description="围绕真实学习记录持续对话，并随时回看过去的总结与复盘。" />
    <div className="grid items-start gap-5 xl:grid-cols-[17rem_minmax(0,1fr)_18rem]">
      <AiHistorySidebar tab={historyTab} onTabChange={setHistoryTab} conversations={conversationsQuery.data?.items ?? []} summaries={summariesQuery.data?.items ?? []} conversationTotal={conversationsQuery.data?.total ?? 0} summaryTotal={summariesQuery.data?.total ?? 0} activeConversationId={conversationId} activeSummaryId={summary?.id ?? null} loading={conversationsQuery.isLoading || summariesQuery.isLoading} error={conversationsQuery.isError || summariesQuery.isError} onNew={newConversation} onOpenConversation={openConversation} onOpenSummary={openSummary} onDeleteConversation={(id, title) => setDeleteTarget({ type: "conversation", id, title })} onDeleteSummary={(id, title) => setDeleteTarget({ type: "summary", id, title })} />
      <AiChatPanel title={conversationTitle} messages={messages} summary={summary} input={input} loading={loading} detailLoading={detailLoading} error={error} onInputChange={setInput} onSend={handleSend} onNew={newConversation} onCopySummary={copySummary} onReviewSummary={reviewSummary} onDeleteSummary={() => summary && setDeleteTarget({ type: "summary", id: summary.id, title: summary.title })} />
      <AiSettingsPanel settings={settings} categories={categoriesQuery.data ?? []} checkIns={checkInsQuery.data?.items ?? []} onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))} />
    </div>
    <ConfirmDialog open={Boolean(deleteTarget)} title={`删除${deleteTarget?.type === "conversation" ? "对话" : "总结"}`} description={`确定删除“${deleteTarget?.title ?? ""}”吗？此操作不会影响原始学习记录。`} confirmLabel="确认删除" isPending={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
  </>;
}
