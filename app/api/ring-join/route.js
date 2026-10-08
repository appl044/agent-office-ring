import { acceptOpenAiJoin } from "../../../lib/queue";

const attempts = new Map();
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function limited(request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const history = (attempts.get(ip) || []).filter((time) => now - time < 15 * 60 * 1000);
  if (history.length >= 40) return true;
  history.push(now);
  attempts.set(ip, history);
  return false;
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request) {
  const url = new URL(request.url);
  return enroll(request, {
    agent_id: url.searchParams.get("agent_id") || "",
    display_name: url.searchParams.get("display_name") || "",
    typical_task: url.searchParams.get("typical_task") || "",
    statement: url.searchParams.get("statement") || "",
    primary_category: url.searchParams.get("primary_category") || "",
    secondary_category: url.searchParams.get("secondary_category") || "",
    channel: url.searchParams.get("channel") || "",
    thread: url.searchParams.get("thread") || "",
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  return enroll(request, body);
}

async function enroll(request, fields) {
  if (limited(request)) return json({ ok: false, error: "Too many join attempts. Wait 15 minutes." }, 429);
  try {
    return json(await acceptOpenAiJoin(fields));
  } catch (error) {
    return json({ ok: false, error: error.message }, error.status || 502);
  }
}
