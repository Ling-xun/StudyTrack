"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookMarked, CheckCircle2, Cloud, FolderPlus, LoaderCircle, Save } from "lucide-react";
import { ImmersiveReader } from "@/components/checkins/ImmersiveReader";
import { useToast } from "@/components/common/ToastProvider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { dateInputValue, formatDate } from "@/lib/date";
import { invalidateCheckInData, queryKeys, requestJson } from "@/lib/queries";
import type { CategorySummary, CheckInWithCategory } from "@/lib/types";

const AUTO_SAVE_DELAY = 1500;
const LOCAL_DRAFT_VERSION = 1;
const NEW_DRAFT_KEY = "studytrack:checkin-draft:new";

const moods = ["", "轻松", "一般", "困难", "状态不错", "有点吃力"];

type InitialCheckIn = {
  id: string;
  title: string;
  content: string;
  studyDate: Date | string;
  duration: number;
  mood: string | null;
  categoryId: string;
  updatedAt?: Date | string;
  isDraft?: boolean;
};

type FormFields = {
  title: string;
  categoryId: string;
  studyDate: string;
  duration: string;
  mood: string;
  content: string;
};

type LocalDraft = {
  version: number;
  mode: "create" | "edit";
  checkInId?: string;
  data: FormFields;
  updatedAt: string;
  serverUpdatedAt?: string;
  synced?: boolean;
};

type RecoveryPrompt = {
  source: "local" | "server";
  title: string;
  description: string;
  fields: FormFields;
  checkInId?: string;
  serverUpdatedAt?: string;
};

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; savedAt: string }
  | { status: "failed" };

function fieldsFromCheckIn(checkIn: InitialCheckIn): FormFields {
  return {
    title: checkIn.title ?? "",
    categoryId: checkIn.categoryId ?? "",
    studyDate: formatDate(checkIn.studyDate),
    duration: checkIn.duration ? String(checkIn.duration) : "",
    mood: checkIn.mood ?? "",
    content: checkIn.content ?? "",
  };
}

function emptyFields(categories: CategorySummary[]): FormFields {
  return {
    title: "",
    categoryId: categories[0]?.id ?? "",
    studyDate: dateInputValue(),
    duration: "",
    mood: "",
    content: "",
  };
}

function draftKey(mode: "create" | "edit", id?: string) {
  return mode === "edit" && id ? `studytrack:checkin-draft:${id}` : NEW_DRAFT_KEY;
}

function formSignature(fields: FormFields) {
  return JSON.stringify(fields);
}

function parseLocalDraft(key: string): LocalDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as LocalDraft;

    if (parsed.version !== LOCAL_DRAFT_VERSION || !parsed.data || !parsed.updatedAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isNewer(left?: string, right?: Date | string | null) {
  if (!left || !right) {
    return Boolean(left);
  }

  return new Date(left).getTime() > new Date(right).getTime();
}

function formatSaveTime(value: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function hasDraftContent(fields: FormFields) {
  return Boolean(fields.title.trim() || fields.content.trim() || fields.duration.trim() || fields.mood.trim());
}

export function CheckInForm({
  categories,
  initialData,
  mode = "create",
}: {
  categories: CategorySummary[];
  initialData?: InitialCheckIn;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = mode === "edit";
  const localKey = draftKey(mode, initialData?.id);
  const initialFields = useMemo(() => (initialData ? fieldsFromCheckIn(initialData) : emptyFields(categories)), [categories, initialData]);
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [serverDraftId, setServerDraftId] = useState(initialData?.isDraft ? initialData.id : "");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [recoveryPrompt, setRecoveryPrompt] = useState<RecoveryPrompt | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fieldsRef = useRef(fields);
  const serverDraftIdRef = useRef(serverDraftId);
  const hydratedRef = useRef(false);
  const mountedRef = useRef(false);
  const saveNowRef = useRef<(options?: { keepalive?: boolean; silent?: boolean }) => Promise<void>>(async () => undefined);
  const lastServerSignatureRef = useRef(formSignature(initialFields));
  const activeSaveRef = useRef(0);
  const selectedCategory = categories.find((category) => category.id === fields.categoryId) ?? categories[0];

  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  useEffect(() => {
    serverDraftIdRef.current = serverDraftId;
  }, [serverDraftId]);

  const writeLocalDraft = useCallback(
    (nextFields: FormFields, options: { checkInId?: string; updatedAt?: string; serverUpdatedAt?: string; synced?: boolean } = {}) => {
      if (typeof window === "undefined") {
        return;
      }

      const checkInId = options.checkInId ?? serverDraftIdRef.current ?? (isEdit ? initialData?.id : undefined);
      const draft: LocalDraft = {
        version: LOCAL_DRAFT_VERSION,
        mode,
        checkInId,
        data: nextFields,
        updatedAt: options.updatedAt ?? new Date().toISOString(),
        serverUpdatedAt: options.serverUpdatedAt,
        synced: options.synced ?? false,
      };

      window.localStorage.setItem(localKey, JSON.stringify(draft));
    },
    [initialData?.id, isEdit, localKey, mode],
  );

  const clearLocalDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(localKey);
    }
  }, [localKey]);

  const applyFields = useCallback(
    (nextFields: FormFields, options: { checkInId?: string; serverUpdatedAt?: string; markServerSaved?: boolean } = {}) => {
      fieldsRef.current = nextFields;
      setFields(nextFields);

      if (options.checkInId) {
        setServerDraftId(options.checkInId);
      }

      if (options.markServerSaved) {
        lastServerSignatureRef.current = formSignature(nextFields);
        if (options.serverUpdatedAt) {
          setSaveState({ status: "saved", savedAt: formatSaveTime(options.serverUpdatedAt) });
          writeLocalDraft(nextFields, {
            checkInId: options.checkInId,
            updatedAt: options.serverUpdatedAt,
            serverUpdatedAt: options.serverUpdatedAt,
            synced: true,
          });
        }
      }
    },
    [writeLocalDraft],
  );

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function hydrateDrafts() {
      const localDraft = parseLocalDraft(localKey);
      let serverDraft: CheckInWithCategory | null = null;

      if (!isEdit) {
        try {
          const preferredId = localDraft?.checkInId;
          serverDraft = preferredId
            ? await requestJson<CheckInWithCategory>(`/api/checkins/${preferredId}`)
            : await requestJson<CheckInWithCategory | null>("/api/checkins/drafts");

          if (serverDraft && !serverDraft.isDraft) {
            serverDraft = null;
          }
        } catch {
          serverDraft = null;
        }
      }

      if (cancelled) {
        return;
      }

      if (serverDraft?.id) {
        setServerDraftId(serverDraft.id);
      }

      const serverUpdatedAt = serverDraft?.updatedAt ?? initialData?.updatedAt;
      const serverFields = serverDraft ? fieldsFromCheckIn(serverDraft) : initialFields;

      if (localDraft?.data && hasDraftContent(localDraft.data)) {
        const localIsNewerThanServer = isNewer(localDraft.updatedAt, serverUpdatedAt);
        const localIsUnsynced = localDraft.synced !== true || localDraft.serverUpdatedAt !== String(serverUpdatedAt ?? "");

        if (!serverUpdatedAt || (localIsNewerThanServer && localIsUnsynced)) {
          setRecoveryPrompt({
            source: "local",
            title: "发现本地草稿",
            description: "本地草稿比服务器内容更新，可以恢复后继续编辑。",
            fields: localDraft.data,
            checkInId: localDraft.checkInId ?? serverDraft?.id,
            serverUpdatedAt: serverUpdatedAt ? String(serverUpdatedAt) : undefined,
          });
        } else if (serverDraft && !isEdit) {
          applyFields(serverFields, {
            checkInId: serverDraft.id,
            serverUpdatedAt: String(serverDraft.updatedAt),
            markServerSaved: true,
          });
        }
      } else if (serverDraft && !isEdit && hasDraftContent(serverFields)) {
        setRecoveryPrompt({
          source: "server",
          title: "发现服务端草稿",
          description: "这份草稿可能来自另一台设备，恢复后可以继续编辑。",
          fields: serverFields,
          checkInId: serverDraft.id,
          serverUpdatedAt: String(serverDraft.updatedAt),
        });
      }

      hydratedRef.current = true;
      setDraftHydrated(true);
    }

    void hydrateDrafts();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [applyFields, initialData?.updatedAt, initialFields, isEdit, localKey]);

  const saveNow = useCallback(
    async (options: { keepalive?: boolean; silent?: boolean } = {}) => {
      if (!hydratedRef.current || categories.length === 0) {
        return;
      }

      const currentFields = fieldsRef.current;
      const signature = formSignature(currentFields);

      if (signature === lastServerSignatureRef.current) {
        return;
      }

      writeLocalDraft(currentFields);

      if (!currentFields.categoryId || !currentFields.studyDate) {
        if (!options.silent && mountedRef.current) {
          setSaveState({ status: "failed" });
        }
        return;
      }

      const requestId = activeSaveRef.current + 1;
      activeSaveRef.current = requestId;

      if (!options.silent && mountedRef.current) {
        setSaveState({ status: "saving" });
      }

      try {
        const draftId = serverDraftIdRef.current;
        const url = isEdit ? `/api/checkins/${initialData?.id}` : draftId ? `/api/checkins/${draftId}` : "/api/checkins";
        const checkIn = await requestJson<CheckInWithCategory>(url, {
          method: isEdit || draftId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEdit ? currentFields : { ...currentFields, isDraft: true }),
          keepalive: options.keepalive,
        });

        if (!isEdit && checkIn.id !== draftId) {
          serverDraftIdRef.current = checkIn.id;
          if (mountedRef.current) {
            setServerDraftId(checkIn.id);
          }
        }

        lastServerSignatureRef.current = signature;
        writeLocalDraft(currentFields, {
          checkInId: checkIn.id,
          updatedAt: String(checkIn.updatedAt),
          serverUpdatedAt: String(checkIn.updatedAt),
          synced: true,
        });

        queryClient.setQueryData(queryKeys.checkIn(checkIn.id), checkIn);
        if (isEdit) {
          invalidateCheckInData(queryClient, checkIn.id);
        }

        if (activeSaveRef.current === requestId && !options.silent && mountedRef.current) {
          setSaveState({ status: "saved", savedAt: formatSaveTime(checkIn.updatedAt) });
        }
      } catch {
        writeLocalDraft(currentFields);
        if (!options.silent && mountedRef.current) {
          setSaveState({ status: "failed" });
        }
      }
    },
    [categories.length, initialData?.id, isEdit, queryClient, writeLocalDraft],
  );

  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);

  useEffect(() => {
    if (!draftHydrated || recoveryPrompt) {
      return;
    }

    writeLocalDraft(fields);

    if (formSignature(fields) === lastServerSignatureRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveNowRef.current();
    }, AUTO_SAVE_DELAY);

    return () => window.clearTimeout(timer);
  }, [draftHydrated, fields, recoveryPrompt, writeLocalDraft]);

  useEffect(() => {
    function flushDraft() {
      writeLocalDraft(fieldsRef.current);
      void saveNowRef.current({ keepalive: true, silent: true });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushDraft();
      }
    }

    window.addEventListener("pagehide", flushDraft);
    window.addEventListener("beforeunload", flushDraft);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      flushDraft();
      window.removeEventListener("pagehide", flushDraft);
      window.removeEventListener("beforeunload", flushDraft);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [writeLocalDraft]);

  if (categories.length === 0) {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <FolderPlus className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-4 text-lg font-bold text-slate-950">还没有分类</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          先创建一个学习分类，再回来记录今天的学习内容。
        </p>
        <ButtonLink href="/categories" className="mt-5">
          新建分类
        </ButtonLink>
      </Card>
    );
  }

  function updateField<Key extends keyof FormFields>(key: Key, value: FormFields[Key]) {
    const hadRecoveryPrompt = Boolean(recoveryPrompt);
    const nextFields = { ...fieldsRef.current, [key]: value };
    fieldsRef.current = nextFields;
    setFields(nextFields);

    if (hadRecoveryPrompt) {
      setRecoveryPrompt(null);
    }

    if (hydratedRef.current) {
      writeLocalDraft(nextFields);

      if (formSignature(nextFields) !== lastServerSignatureRef.current) {
        setSaveState({ status: "saving" });
      }
    }
  }

  function payloadWithContent(nextContent = fields.content) {
    return {
      ...fields,
      content: nextContent,
    };
  }

  async function saveReaderContent(nextContent: string) {
    const nextFields = { ...fieldsRef.current, content: nextContent };
    fieldsRef.current = nextFields;
    setFields(nextFields);
    await saveNowRef.current();
    toast("阅读内容已同步到表单");
  }

  function restorePromptDraft() {
    if (!recoveryPrompt) {
      return;
    }

    applyFields(recoveryPrompt.fields, {
      checkInId: recoveryPrompt.checkInId,
      serverUpdatedAt: recoveryPrompt.serverUpdatedAt,
      markServerSaved: recoveryPrompt.source === "server",
    });
    writeLocalDraft(recoveryPrompt.fields, {
      checkInId: recoveryPrompt.checkInId,
      serverUpdatedAt: recoveryPrompt.serverUpdatedAt,
      synced: recoveryPrompt.source === "server",
      updatedAt: recoveryPrompt.serverUpdatedAt,
    });
    setRecoveryPrompt(null);
  }

  function dismissPromptDraft() {
    setRecoveryPrompt(null);
    if (recoveryPrompt?.source === "local") {
      clearLocalDraft();
    }
  }

  function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const draftId = serverDraftIdRef.current;
        const url = isEdit ? `/api/checkins/${initialData?.id}` : draftId ? `/api/checkins/${draftId}` : "/api/checkins";
        const checkIn = await requestJson<CheckInWithCategory>(url, {
          method: isEdit || draftId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payloadWithContent(), isDraft: false }),
        });

        lastServerSignatureRef.current = formSignature(fieldsRef.current);
        queryClient.setQueryData(queryKeys.checkIn(checkIn.id), checkIn);
        invalidateCheckInData(queryClient, checkIn.id);
        clearLocalDraft();
        toast(isEdit ? "更新成功" : "已完成打卡");
        router.push("/checkins");
      } catch (err) {
        setError(err instanceof Error ? err.message : isEdit ? "更新学习记录失败" : "保存学习记录失败");
      }
    });
  }

  const saveStatus = (() => {
    if (saveState.status === "saving") {
      return {
        icon: <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />,
        text: "正在保存...",
        className: "text-slate-500",
      };
    }

    if (saveState.status === "saved") {
      return {
        icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
        text: `已自动保存 ${saveState.savedAt}`,
        className: "text-teal-700",
      };
    }

    if (saveState.status === "failed") {
      return {
        icon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
        text: "保存失败，已保存在本地草稿",
        className: "text-red-600",
      };
    }

    return {
      icon: <Cloud className="h-4 w-4" aria-hidden="true" />,
      text: "输入后会自动保存",
      className: "text-slate-500",
    };
  })();

  return (
    <Card className="max-w-3xl">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <BookMarked className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-950">{isEdit ? "编辑学习记录" : "记录一次学习"}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {isEdit ? "更新这次学习的内容和状态" : "把今天的学习节奏留在这里"}
          </p>
        </div>
      </div>

      <div
        className={`mb-5 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm font-semibold ${saveStatus.className}`}
        aria-live="polite"
      >
        {saveStatus.icon}
        <span>{saveStatus.text}</span>
      </div>

      {recoveryPrompt ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-amber-900">{recoveryPrompt.title}</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">{recoveryPrompt.description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" className="h-9 px-3" onClick={restorePromptDraft}>
                恢复草稿
              </Button>
              <Button type="button" variant="secondary" className="h-9 px-3" onClick={dismissPromptDraft}>
                暂不恢复
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">学习标题</Label>
            <Input
              id="title"
              name="title"
              placeholder="例如 C++ 多态复习"
              value={fields.title}
              maxLength={50}
              onChange={(event) => updateField("title", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">分类</Label>
            <Select id="categoryId" name="categoryId" required value={fields.categoryId} onChange={(event) => updateField("categoryId", event.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studyDate">学习日期</Label>
            <Input
              id="studyDate"
              name="studyDate"
              type="date"
              value={fields.studyDate}
              onChange={(event) => updateField("studyDate", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">学习时长（分钟）</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min={1}
              max={1440}
              step={1}
              placeholder="60"
              value={fields.duration}
              onChange={(event) => updateField("duration", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood">学习状态</Label>
            <Select id="mood" name="mood" value={fields.mood} onChange={(event) => updateField("mood", event.target.value)}>
              {moods.map((mood) => (
                <option key={mood || "empty"} value={mood}>
                  {mood || "不填写"}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <Label htmlFor="content">学习内容</Label>
              <div className={`flex items-center gap-1.5 text-sm font-semibold sm:hidden ${saveStatus.className}`}>
                {saveStatus.icon}
                <span>{saveStatus.text}</span>
              </div>
            </div>
            <Textarea
              id="content"
              name="content"
              placeholder="写下今天学习的知识点、练习内容或复习重点"
              value={fields.content}
              maxLength={50000}
              onChange={(event) => updateField("content", event.target.value)}
              required
            />
            <ImmersiveReader
              title={fields.title}
              content={fields.content}
              categoryName={selectedCategory?.name ?? "未分类"}
              categoryColor={selectedCategory?.color ?? "#0f766e"}
              editable
              variant="compact"
              triggerLabel="沉浸预览与编辑"
              onContentChange={(nextContent) => updateField("content", nextContent)}
              onSaveContent={saveReaderContent}
            />
          </div>
        </div>

        <FieldError message={error} />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <ButtonLink href="/checkins" variant="secondary">
            返回列表
          </ButtonLink>
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {isPending ? "保存中..." : isEdit ? "保存并退出" : "完成"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
