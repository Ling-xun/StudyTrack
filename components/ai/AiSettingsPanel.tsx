"use client";

import { Settings2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import type { AiMode, AiScope } from "@/lib/ai";
import type { CategoryListItem, CheckInListItem } from "@/lib/types";

export type AiSettings = {
  scopeType: AiScope["type"];
  checkInId: string;
  categoryId: string;
  days: string;
  startDate: string;
  endDate: string;
  mode: AiMode;
  saveSummary: boolean;
};

export const modeOptions: Array<{ value: AiMode; label: string }> = [
  { value: "summary", label: "简短总结" },
  { value: "review", label: "详细复盘" },
  { value: "knowledge", label: "知识点提炼" },
  { value: "weakness", label: "薄弱点分析" },
  { value: "plan", label: "下一步计划" },
];

export function AiSettingsPanel({ settings, categories, checkIns, onChange }: {
  settings: AiSettings;
  categories: CategoryListItem[];
  checkIns: CheckInListItem[];
  onChange: (patch: Partial<AiSettings>) => void;
}) {
  return (
    <Card className="order-2 xl:order-3 xl:sticky xl:top-8">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-teal-600" aria-hidden="true" />
        <h2 className="font-bold text-slate-950">本次设置</h2>
      </div>
      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-scope">学习范围</Label>
          <Select id="ai-scope" value={settings.scopeType} onChange={(event) => onChange({ scopeType: event.target.value as AiScope["type"] })}>
            <option value="current">某条记录</option>
            <option value="category">某个分类</option>
            <option value="recent_days">最近 N 天</option>
            <option value="date_range">自定义日期</option>
            <option value="all">全部记录</option>
          </Select>
        </div>
        {settings.scopeType === "current" ? <div className="space-y-2">
          <Label htmlFor="ai-checkin">学习记录</Label>
          <Select id="ai-checkin" value={settings.checkInId} onChange={(event) => onChange({ checkInId: event.target.value })}>
            <option value="">请选择记录</option>
            {checkIns.map((item) => <option key={item.id} value={item.id}>{String(item.studyDate).slice(0, 10)} · {item.title}</option>)}
          </Select>
        </div> : null}
        {settings.scopeType === "category" ? <div className="space-y-2">
          <Label htmlFor="ai-category">学习分类</Label>
          <Select id="ai-category" value={settings.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })}>
            <option value="">请选择分类</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}（{item.checkInCount} 条）</option>)}
          </Select>
        </div> : null}
        {settings.scopeType === "recent_days" ? <div className="space-y-2">
          <Label htmlFor="ai-days">最近天数</Label>
          <Input id="ai-days" type="number" min={1} max={365} value={settings.days} onChange={(event) => onChange({ days: event.target.value })} />
        </div> : null}
        {settings.scopeType === "date_range" ? <div className="grid gap-3">
          <div className="space-y-2"><Label htmlFor="ai-start">开始日期</Label><Input id="ai-start" type="date" value={settings.startDate} max={settings.endDate} onChange={(event) => onChange({ startDate: event.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="ai-end">结束日期</Label><Input id="ai-end" type="date" value={settings.endDate} min={settings.startDate} onChange={(event) => onChange({ endDate: event.target.value })} /></div>
        </div> : null}
        <div className="space-y-2">
          <Label htmlFor="ai-mode">分析类型</Label>
          <Select id="ai-mode" value={settings.mode} onChange={(event) => onChange({ mode: event.target.value as AiMode })}>
            {modeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <input type="checkbox" checked={settings.saveSummary} onChange={(event) => onChange({ saveSummary: event.target.checked })} className="mt-1 h-4 w-4 accent-teal-700" />
          <span><span className="block text-sm font-semibold text-slate-800">保存为总结</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">回复会出现在总结历史中</span></span>
        </label>
      </div>
      <div className="mt-5 flex items-start gap-2 rounded-lg bg-teal-50 p-3 text-xs leading-5 text-teal-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        只读取所选范围，深度思考在服务端完成。
      </div>
    </Card>
  );
}
