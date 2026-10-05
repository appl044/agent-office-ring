import { NextResponse } from "next/server";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set("ring_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
