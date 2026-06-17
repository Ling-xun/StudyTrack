import { NextResponse } from "next/server";
import { createSessionToken, getAppPassword, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth";

type LoginPayload = {
  password?: string;
};

export async function POST(request: Request) {
  const appPassword = getAppPassword();

  if (!appPassword) {
    return NextResponse.json({ message: "还没有配置登录密码" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as LoginPayload | null;

  if (body?.password !== appPassword) {
    return NextResponse.json({ message: "密码不正确" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const token = await createSessionToken();

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
