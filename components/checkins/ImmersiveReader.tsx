"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MouseEvent, MutableRefObject, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlignLeft,
  BookOpen,
  Code2,
  Edit3,
  Eye,
  Maximize2,
  Moon,
  PanelLeft,
  Save,
  Sun,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReaderTheme = "paper" | "light" | "dark";
type FontSize = "comfortable" | "large" | "focus";
type ReaderVariant = "section" | "compact";

type ContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "code";
      code: string;
      language: string;
    };

const themeClasses: Record<ReaderTheme, { shell: string; text: string; muted: string; toolbar: string; code: string; editor: string }> = {
  paper: {
    shell: "bg-[#f8f1e3] text-[#2b2118]",
    text: "text-[#2b2118]",
    muted: "text-[#725f4a]",
    toolbar: "border-[#d9c8aa] bg-[#f8f1e3]/95",
    code: "border-[#d9c8aa] bg-[#201a14] text-[#f8f1e3]",
    editor: "border-[#d9c8aa] bg-[#fff8ec] text-[#2b2118]",
  },
  light: {
    shell: "bg-white text-slate-950",
    text: "text-slate-800",
    muted: "text-slate-500",
    toolbar: "border-slate-200 bg-white/95",
    code: "border-slate-800 bg-slate-950 text-slate-100",
    editor: "border-slate-200 bg-white text-slate-950",
  },
  dark: {
    shell: "bg-slate-950 text-slate-50",
    text: "text-slate-100",
    muted: "text-slate-400",
    toolbar: "border-slate-800 bg-slate-950/95",
    code: "border-slate-700 bg-slate-900 text-slate-100",
    editor: "border-slate-700 bg-slate-900 text-slate-100",
  },
};

const fontClasses: Record<FontSize, string> = {
  comfortable: "text-[1.05rem] leading-[1.95]",
  large: "text-[1.18rem] leading-[2.05]",
  focus: "text-[1.32rem] leading-[2.12]",
};

const fontLabels: Record<FontSize, string> = {
  comfortable: "舒适",
  large: "大字",
  focus: "专注",
};

const codeKeywordPattern =
  /\b(const|let|var|function|return|if|else|for|while|class|import|from|export|async|await|try|catch|new|type|interface|public|private|static|void|int|float|double|string|boolean|def|print|in|and|or|not|null|undefined|true|false)\b|("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`)|(\/\/.*|#.*)|(\b\d+(?:\.\d+)?\b)/g;

function parseContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const fencePattern = /```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  function pushTextBlocks(text: string) {
    text
      .split(/(?:\r?\n){2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .forEach((textBlock) => blocks.push({ type: "paragraph", text: textBlock }));
  }

  while ((match = fencePattern.exec(content)) !== null) {
    pushTextBlocks(content.slice(lastIndex, match.index));
    blocks.push({
      type: "code",
      language: match[1]?.trim() || "code",
      code: match[2]?.replace(/\s+$/, "") ?? "",
    });
    lastIndex = match.index + match[0].length;
  }

  pushTextBlocks(content.slice(lastIndex));

  return blocks;
}

function estimateReadingMinutes(content: string) {
  const compactLength = content.replace(/\s/g, "").length;
  return Math.max(1, Math.ceil(compactLength / 450));
}

function blockTitle(block: ContentBlock, index: number) {
  const text = block.type === "code" ? `${block.language} 代码` : block.text.replace(/\s+/g, " ").trim();
  return text.length > 26 ? `${text.slice(0, 26)}...` : text || `第 ${index + 1} 段`;
}

function renderHighlightedLine(line: string, lineIndex: number) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  line.replace(codeKeywordPattern, (match, keyword, stringLiteral, comment, number, offset) => {
    if (offset > lastIndex) {
      nodes.push(line.slice(lastIndex, offset));
    }

    const className = keyword
      ? "text-sky-300"
      : stringLiteral
        ? "text-emerald-300"
        : comment
          ? "text-slate-500"
          : number
            ? "text-amber-300"
            : "";

    nodes.push(
      <span key={`${lineIndex}-${offset}`} className={className}>
        {match}
      </span>,
    );
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : " ";
}

function CodeBlock({ block, theme }: { block: Extract<ContentBlock, { type: "code" }>; theme: ReaderTheme }) {
  const lines = block.code.split(/\r?\n/);

  return (
    <figure className={cn("overflow-hidden rounded-lg border text-sm leading-6 shadow-sm", themeClasses[theme].code)}>
      <figcaption className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-normal text-slate-300">
        <Code2 className="h-4 w-4" aria-hidden="true" />
        {block.language}
      </figcaption>
      <pre className="overflow-x-auto p-4">
        <code>
          {lines.map((line, index) => (
            <span key={index} className="block min-h-6">
              <span className="mr-4 inline-block w-8 select-none text-right text-slate-500">{index + 1}</span>
              {renderHighlightedLine(line, index)}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

function MarkdownBlock({ content, theme }: { content: string; theme: ReaderTheme }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h2 className="mb-4 mt-9 text-2xl font-bold leading-tight first:mt-0 sm:text-3xl">{children}</h2>,
        h2: ({ children }) => <h3 className="mb-3 mt-8 text-xl font-bold leading-tight first:mt-0 sm:text-2xl">{children}</h3>,
        h3: ({ children }) => <h4 className="mb-3 mt-7 text-lg font-bold leading-tight first:mt-0 sm:text-xl">{children}</h4>,
        h4: ({ children }) => <h5 className="mb-2 mt-6 font-bold leading-tight first:mt-0">{children}</h5>,
        h5: ({ children }) => <h6 className="mb-2 mt-5 font-bold leading-tight first:mt-0">{children}</h6>,
        h6: ({ children }) => <h6 className="mb-2 mt-5 text-sm font-bold uppercase tracking-wide first:mt-0">{children}</h6>,
        p: ({ children }) => <p className="my-4 first:mt-0 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        del: ({ children }) => <del className="opacity-65">{children}</del>,
        ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-7 marker:text-teal-600">{children}</ul>,
        ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-7 marker:font-bold marker:text-teal-600">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-5 border-l-4 border-teal-600 bg-current/[0.045] px-5 py-2 italic">{children}</blockquote>
        ),
        hr: () => <hr className="my-9 border-0 border-t border-current/25" />,
        a: ({ href, children }) => (
          <a className="font-semibold text-teal-700 underline decoration-teal-500/40 underline-offset-4 hover:decoration-teal-600 dark:text-teal-300" href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        img: ({ src, alt }) => <img className="my-6 max-h-[70dvh] max-w-full rounded-lg object-contain shadow-sm" src={src} alt={alt ?? ""} loading="lazy" />,
        table: ({ children }) => <table className="my-6 block w-full overflow-x-auto border-collapse text-left text-[0.92em]">{children}</table>,
        thead: ({ children }) => <thead className="border-b-2 border-current/30 bg-current/[0.045]">{children}</thead>,
        tr: ({ children }) => <tr className="border-b border-current/15">{children}</tr>,
        th: ({ children }) => <th className="whitespace-nowrap px-4 py-2 font-bold">{children}</th>,
        td: ({ children }) => <td className="px-4 py-2 align-top">{children}</td>,
        input: (props) => <input {...props} className="mr-2 accent-teal-600" disabled />,
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children }) => {
          const language = /language-([\w+-]+)/.exec(className ?? "")?.[1];
          const code = String(children).replace(/\n$/, "");

          if (language) {
            return <CodeBlock block={{ type: "code", language, code }} theme={theme} />;
          }

          return <code className="rounded bg-current/10 px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function ReaderContent({
  blocks,
  theme,
  fontSize,
  blockRefs,
}: {
  blocks: ContentBlock[];
  theme: ReaderTheme;
  fontSize: FontSize;
  blockRefs?: MutableRefObject<Array<HTMLElement | null>>;
}) {
  return (
    <div className={cn("mt-8 space-y-7 [overflow-wrap:anywhere] [word-break:break-word]", fontClasses[fontSize], themeClasses[theme].text)}>
      {blocks.map((block, index) =>
        block.type === "code" ? (
          <div
            key={`code-${index}`}
            ref={(node) => {
              if (blockRefs) {
                blockRefs.current[index] = node;
              }
            }}
            className="scroll-mt-8"
          >
            <CodeBlock block={block} theme={theme} />
          </div>
        ) : (
          <div
            key={`paragraph-${index}`}
            ref={(node) => {
              if (blockRefs) {
                blockRefs.current[index] = node;
              }
            }}
            className="scroll-mt-8"
          >
            <MarkdownBlock content={block.text} theme={theme} />
          </div>
        ),
      )}
    </div>
  );
}

function ReaderToolbar({
  theme,
  fontSize,
  showOutline,
  progressBarRef,
  progressTextRef,
  controlsHidden,
  canEdit,
  isEditing,
  isSaving,
  onThemeChange,
  onFontSizeChange,
  onOutlineToggle,
  onEditToggle,
  onSave,
  onClose,
}: {
  theme: ReaderTheme;
  fontSize: FontSize;
  showOutline: boolean;
  progressBarRef: MutableRefObject<HTMLDivElement | null>;
  progressTextRef: MutableRefObject<HTMLSpanElement | null>;
  controlsHidden: boolean;
  canEdit: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onThemeChange: (theme: ReaderTheme) => void;
  onFontSizeChange: (fontSize: FontSize) => void;
  onOutlineToggle: () => void;
  onEditToggle: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const themeMeta: Array<{ value: ReaderTheme; icon: typeof Sun; label: string; swatch: string }> = [
    { value: "paper", icon: BookOpen, label: "纸张", swatch: "#f8f1e3" },
    { value: "light", icon: Sun, label: "明亮", swatch: "#ffffff" },
    { value: "dark", icon: Moon, label: "夜间", swatch: "#020617" },
  ];

  return (
    <div
      className={cn(
        "absolute inset-x-0 top-0 z-20 overflow-hidden border-b px-4 shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition-[max-height,opacity,padding,transform,border-color] duration-200 ease-out",
        themeClasses[theme].toolbar,
        controlsHidden ? "max-h-0 -translate-y-3 border-transparent py-0 opacity-0 pointer-events-none" : "max-h-56 translate-y-0 py-3 opacity-100",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-current/10 p-1">
          {themeMeta.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-pressed={theme === item.value}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition",
                  theme === item.value ? "bg-teal-700 text-white" : "hover:bg-current/10",
                )}
                onClick={() => onThemeChange(item.value)}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current/20" style={{ backgroundColor: item.swatch }}>
                  <Icon className={cn("h-3.5 w-3.5", item.value === "dark" ? "text-white" : "text-slate-700")} aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-current/10 p-1">
          <Type className="mx-2 h-4 w-4 opacity-70" aria-hidden="true" />
          {(Object.keys(fontLabels) as FontSize[]).map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={fontSize === size}
              className={cn(
                "h-9 rounded-md px-3 text-sm font-semibold transition",
                fontSize === size ? "bg-teal-700 text-white" : "hover:bg-current/10",
              )}
              onClick={() => onFontSizeChange(size)}
            >
              {fontLabels[size]}
            </button>
          ))}
        </div>

        <button
          type="button"
          title="段落"
          aria-label="段落"
          aria-pressed={showOutline}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border border-current/10 transition hover:bg-current/10",
            showOutline ? "bg-teal-700 text-white" : "",
          )}
          onClick={onOutlineToggle}
        >
          <PanelLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {canEdit ? (
          <div className="flex items-center gap-1 rounded-lg border border-current/10 p-1">
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition hover:bg-current/10",
                isEditing ? "" : "bg-teal-700 text-white hover:bg-teal-700",
              )}
              onClick={onEditToggle}
            >
              {isEditing ? <Eye className="h-4 w-4" aria-hidden="true" /> : <Edit3 className="h-4 w-4" aria-hidden="true" />}
              {isEditing ? "预览" : "编辑"}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
              disabled={isSaving}
              onClick={onSave}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {isSaving ? "保存中" : "保存"}
            </button>
          </div>
        ) : null}

        <div className="ml-auto flex min-w-[8rem] items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-current/10">
            <div ref={progressBarRef} className="h-full rounded-full bg-teal-600" style={{ width: "0%" }} />
          </div>
          <span ref={progressTextRef} className="w-10 text-right text-xs font-bold tabular-nums opacity-70">
            0%
          </span>
        </div>

        <button
          type="button"
          title="关闭"
          aria-label="关闭"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-current/10 transition hover:bg-current/10"
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function ImmersiveReader({
  title,
  content,
  categoryName,
  categoryColor,
  editable = false,
  variant = "section",
  triggerLabel = "沉浸阅读",
  showTrigger = true,
  openOnMount = false,
  onRequestClose,
  onContentChange,
  onSaveContent,
}: {
  title: string;
  content: string;
  categoryName: string;
  categoryColor: string;
  editable?: boolean;
  variant?: ReaderVariant;
  triggerLabel?: string;
  showTrigger?: boolean;
  openOnMount?: boolean;
  onRequestClose?: () => void;
  onContentChange?: (content: string) => void;
  onSaveContent?: (content: string) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ReaderTheme>("paper");
  const [fontSize, setFontSize] = useState<FontSize>("comfortable");
  const [showOutline, setShowOutline] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [draftContent, setDraftContent] = useState(content);
  const [controlsHidden, setControlsHidden] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressTextRef = useRef<HTMLSpanElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const progressValueRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const controlsHiddenRef = useRef(true);
  const blockRefs = useRef<Array<HTMLElement | null>>([]);
  const blocks = useMemo(() => parseContent(draftContent), [draftContent]);
  const readingMinutes = useMemo(() => estimateReadingMinutes(draftContent), [draftContent]);
  const paragraphCount = blocks.filter((block) => block.type === "paragraph").length;
  const codeCount = blocks.filter((block) => block.type === "code").length;

  useEffect(() => {
    if (openOnMount) {
      setOpen(true);
    }
  }, [openOnMount]);

  useEffect(() => {
    if (!open || !isEditing) {
      setDraftContent(content);
    }
  }, [content, isEditing, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      updateProgress(0);
      lastScrollTopRef.current = 0;
      setControlsVisibility(true);
      setSaveError("");
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  function updateProgress(progress: number) {
    progressValueRef.current = progress;

    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progress}%`;
    }

    if (progressTextRef.current) {
      progressTextRef.current.textContent = `${progress}%`;
    }
  }

  function setControlsVisibility(hidden: boolean) {
    if (controlsHiddenRef.current === hidden) {
      return;
    }

    controlsHiddenRef.current = hidden;
    setControlsHidden(hidden);
  }

  function handleScroll() {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    if (scrollFrameRef.current !== null) {
      return;
    }

    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;

      const maxScroll = container.scrollHeight - container.clientHeight;
      const nextProgress = maxScroll <= 0 ? 100 : Math.min(100, Math.round((container.scrollTop / maxScroll) * 100));
      const nextScrollTop = container.scrollTop;
      if (!controlsHiddenRef.current) {
        setControlsVisibility(true);
      }
      lastScrollTopRef.current = Math.max(0, nextScrollTop);

      if (nextProgress !== progressValueRef.current) {
        updateProgress(nextProgress);
      }
    });
  }

  function jumpToBlock(index: number) {
    blockRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeReader() {
    setOpen(false);
    setIsEditing(false);
    onRequestClose?.();
  }

  function revealControlsFromContent(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;

    if (target?.closest("button, a, input, select, [role='button']")) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const tapY = event.clientY - bounds.top;
    const middleStart = bounds.height * 0.22;
    const middleEnd = bounds.height * 0.78;

    if (tapY >= middleStart && tapY <= middleEnd) {
      setControlsVisibility(false);
    }
  }

  async function saveDraft() {
    const nextContent = draftContent.trim();

    if (!nextContent) {
      setSaveError("学习内容不能为空");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      onContentChange?.(nextContent);
      await onSaveContent?.(nextContent);
      setDraftContent(nextContent);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存失败，请稍后再试");
    } finally {
      setIsSaving(false);
    }
  }

  const readerDialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-50 p-0" role="dialog" aria-modal="true" aria-label="沉浸阅读">
            <div className={cn("relative flex h-dvh flex-col overflow-hidden", themeClasses[theme].shell)}>
              <ReaderToolbar
                theme={theme}
                fontSize={fontSize}
                showOutline={showOutline}
                progressBarRef={progressBarRef}
                progressTextRef={progressTextRef}
                controlsHidden={controlsHidden}
                canEdit={editable}
                isEditing={isEditing}
                isSaving={isSaving}
                onThemeChange={setTheme}
                onFontSizeChange={setFontSize}
                onOutlineToggle={() => setShowOutline((value) => !value)}
                onEditToggle={() => setIsEditing((value) => !value)}
                onSave={saveDraft}
                onClose={closeReader}
              />

              <div className={cn("grid min-h-0 flex-1", !isEditing && showOutline ? "lg:grid-cols-[minmax(0,18rem)_1fr]" : "")}>
                {!isEditing && showOutline ? (
                  <aside className="hidden min-h-0 border-r border-current/10 px-4 py-5 lg:block">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-normal opacity-60">段落</p>
                      <AlignLeft className="h-4 w-4 opacity-60" aria-hidden="true" />
                    </div>
                    <div className="mt-4 max-h-[calc(100dvh-8rem)] space-y-2 overflow-y-auto pr-1">
                      {blocks.map((block, index) => (
                        <button
                          key={`outline-${index}`}
                          type="button"
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm leading-5 opacity-80 transition hover:bg-current/10 hover:opacity-100"
                          onClick={() => jumpToBlock(index)}
                        >
                          <span className="mr-2 font-bold text-teal-600">{index + 1}</span>
                          {blockTitle(block, index)}
                        </button>
                      ))}
                    </div>
                  </aside>
                ) : null}

                <main
                  ref={scrollRef}
                  className="min-h-0 overflow-y-auto px-4 py-7 sm:px-8 lg:px-12"
                  style={{ contain: "layout paint", overscrollBehavior: "contain" }}
                  onScroll={handleScroll}
                  onClick={revealControlsFromContent}
                >
                  <article className={cn("mx-auto pb-20", isEditing ? "max-w-5xl" : "max-w-3xl")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex max-w-full min-w-0 items-center rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: categoryColor }}>
                        <span className="min-w-0 truncate">{categoryName}</span>
                      </span>
                      <span className={cn("text-sm font-semibold", themeClasses[theme].muted)}>约 {readingMinutes} 分钟</span>
                      {codeCount > 0 ? <span className={cn("text-sm font-semibold", themeClasses[theme].muted)}>代码块 {codeCount}</span> : null}
                    </div>

                    <h1 className="mt-5 text-3xl font-bold leading-tight tracking-normal sm:text-4xl">{title || "未命名学习记录"}</h1>

                    {saveError ? <p className="mt-5 rounded-lg bg-red-600/10 px-3 py-2 text-sm font-bold text-red-600">{saveError}</p> : null}

                    {isEditing ? (
                      <div className="mt-8">
                        <label className="block min-w-0">
                          <span className={cn("text-sm font-bold", themeClasses[theme].muted)}>编辑学习内容</span>
                          <textarea
                            className={cn(
                              "mt-3 h-[68dvh] min-h-96 w-full resize-none rounded-lg border p-5 text-base leading-7 shadow-sm outline-none transition focus:ring-4 focus:ring-teal-600/15",
                              themeClasses[theme].editor,
                            )}
                            maxLength={50000}
                            value={draftContent}
                            onScroll={() => setControlsVisibility(true)}
                            onChange={(event) => {
                              setDraftContent(event.target.value);
                              onContentChange?.(event.target.value);
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <ReaderContent blocks={blocks} theme={theme} fontSize={fontSize} blockRefs={blockRefs} />
                    )}
                  </article>
                </main>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const trigger = showTrigger ? (
    <Button type="button" className="h-10 px-3" onClick={() => setOpen(true)}>
      <Maximize2 className="h-4 w-4" aria-hidden="true" />
      {triggerLabel}
    </Button>
  ) : null;

  if (!showTrigger) {
    return <>{readerDialog}</>;
  }

  if (variant === "compact") {
    return (
      <>
        <div className="flex flex-col gap-3 rounded-lg border border-teal-100 bg-teal-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-teal-800">
            {paragraphCount} 段 · 约 {readingMinutes} 分钟{codeCount > 0 ? ` · 代码块 ${codeCount}` : ""}
          </p>
          {trigger}
        </div>
        {readerDialog}
      </>
    );
  }

  return (
    <>
      <section className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-teal-700">完整学习内容</h2>
            <p className="mt-1 text-sm text-slate-500">
              {paragraphCount} 段 · 约 {readingMinutes} 分钟{codeCount > 0 ? ` · 代码块 ${codeCount}` : ""}
            </p>
          </div>
          {trigger}
        </div>

        <ReaderContent blocks={blocks} theme="light" fontSize="comfortable" />
      </section>

      {readerDialog}
    </>
  );
}
