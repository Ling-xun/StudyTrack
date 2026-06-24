"use client";

import { History, MessageSquareText, Plus, ScrollText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AiConversationListItem, AiSummaryListItem } from "@/components/ai/types";

function shortDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function AiHistorySidebar({
  tab,
  onTabChange,
  conversations,
  summaries,
  conversationTotal,
  summaryTotal,
  activeConversationId,
  activeSummaryId,
  loading,
  error,
  onNew,
  onOpenConversation,
  onOpenSummary,
  onDeleteConversation,
  onDeleteSummary,
}: {
  tab: "conversations" | "summaries";
  onTabChange: (tab: "conversations" | "summaries") => void;
  conversations: AiConversationListItem[];
  summaries: AiSummaryListItem[];
  conversationTotal: number;
  summaryTotal: number;
  activeConversationId: string | null;
  activeSummaryId: string | null;
  loading: boolean;
  error: boolean;
  onNew: () => void;
  onOpenConversation: (id: string) => void;
  onOpenSummary: (id: string) => void;
  onDeleteConversation: (id: string, title: string) => void;
  onDeleteSummary: (id: string, title: string) => void;
}) {
  return (
    <Card className="order-3 p-0 xl:order-1 xl:sticky xl:top-8">
      <div className="border-b border-slate-100 p-4">
        <Button type="button" className="w-full" onClick={onNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          新建对话
        </Button>
        <div className="mt-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onTabChange("conversations")}
            className={cn("rounded-md px-2 py-2 text-xs font-bold text-slate-500", tab === "conversations" && "bg-white text-slate-900 shadow-sm")}
          >
            对话 {conversationTotal}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("summaries")}
            className={cn("rounded-md px-2 py-2 text-xs font-bold text-slate-500", tab === "summaries" && "bg-white text-slate-900 shadow-sm")}
          >
            总结 {summaryTotal}
          </button>
        </div>
      </div>

      <div className="max-h-[28rem] space-y-1 overflow-y-auto p-2 xl:max-h-[calc(100dvh-18rem)]">
        {loading ? (
          <p className="p-4 text-center text-sm text-slate-500">正在加载历史…</p>
        ) : error ? (
          <p className="p-4 text-center text-sm leading-6 text-red-600">历史记录暂时无法加载，请稍后刷新。</p>
        ) : tab === "conversations" ? (
          conversations.length ? conversations.map((item) => (
            <div key={item.id} className={cn("group flex items-start gap-1 rounded-lg", activeConversationId === item.id && "bg-teal-50") }>
              <button type="button" className="min-w-0 flex-1 px-3 py-3 text-left" onClick={() => onOpenConversation(item.id)}>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <MessageSquareText className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  <span className="truncate">{item.title}</span>
                </span>
                <span className="mt-1 block text-xs text-slate-400">{item.messageCount} 条消息 · {shortDate(item.updatedAt)}</span>
              </button>
              <button type="button" aria-label={`删除对话：${item.title}`} className="mt-2 rounded-md p-2 text-slate-300 hover:bg-red-50 hover:text-red-600" onClick={() => onDeleteConversation(item.id, item.title)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )) : <EmptyHistory icon={<History className="h-6 w-6" />} text="还没有历史对话" />
        ) : summaries.length ? summaries.map((item) => (
          <div key={item.id} className={cn("group flex items-start gap-1 rounded-lg", activeSummaryId === item.id && "bg-amber-50") }>
            <button type="button" className="min-w-0 flex-1 px-3 py-3 text-left" onClick={() => onOpenSummary(item.id)}>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ScrollText className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                <span className="truncate">{item.title}</span>
              </span>
              <span className="mt-1 block text-xs text-slate-400">{item.sourceCount} 条来源 · {shortDate(item.createdAt)}</span>
            </button>
            <button type="button" aria-label={`删除总结：${item.title}`} className="mt-2 rounded-md p-2 text-slate-300 hover:bg-red-50 hover:text-red-600" onClick={() => onDeleteSummary(item.id, item.title)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )) : <EmptyHistory icon={<ScrollText className="h-6 w-6" />} text="还没有总结记录" />}
      </div>
    </Card>
  );
}

function EmptyHistory({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex flex-col items-center px-4 py-10 text-center text-slate-400">{icon}<p className="mt-2 text-sm">{text}</p></div>;
}
