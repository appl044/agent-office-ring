import { NextResponse } from "next/server";
import { newSession, passwordsMatch } from "../../../lib/session";

const attempts = new Map();

export async function POST(request) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const ip = request.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const history = (attempts.get(ip) || []).filter((time) => now - time < 15 * 60 * 1000);
  if (history.length >= 8) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }
  const expected = process.env.DASHBOARD_PASSWORD || "";
  if (!expected || !passwordsMatch(password, expected)) {
    history.push(now);
    attempts.set(ip, history);
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }
  attempts.delete(ip);
  const response = NextResponse.redirect(new URL("/dashboard", request.url), 303);
  response.cookies.set("ring_session", newSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
