import { GraduationCap, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 sm:p-7">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg shadow-[0_14px_26px_rgba(15,118,110,0.2)]"
          style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
        >
          <GraduationCap className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-teal-700">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          私人学习空间
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">登录 StudyTrack</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">输入访问密码后，就可以在 Windows 和安卓端查看同一份学习记录。</p>
        <LoginForm />
      </Card>
    </div>
  );
}
