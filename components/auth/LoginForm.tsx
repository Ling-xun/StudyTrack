"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch("/api/login", {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json().catch(() => null)) as { message?: string } | null;

    setSubmitting(false);

    if (!response.ok) {
      setError(result?.message ?? "登录失败，请稍后再试");
      return;
    }

    router.replace(getSafeNextPath(searchParams.get("next")));
    router.refresh();
  }

  return (
    <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">访问密码</span>
        <input
          autoComplete="current-password"
          autoFocus
          className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="输入你的私人密码"
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}

      <Button className="w-full" disabled={submitting || !password.trim()} type="submit">
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        {submitting ? "正在进入..." : "进入 StudyTrack"}
      </Button>
    </form>
  );
}
