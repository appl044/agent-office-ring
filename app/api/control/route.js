import { cookies } from "next/headers";
import { verify } from "../../../lib/session";
import { cursorConfigured, inspectCloud, sendToCloud } from "../../../lib/cursorCloud";

function denied() {
  return Response.json({ error: "Sign in required." }, { status: 401 });
}

export async function GET(request) {
  if (!verify(cookies().get("ring_session")?.value)) return denied();
  const agentId = new URL(request.url).searchParams.get("agent_id") || "";
  if (!agentId) return Response.json({ configured: cursorConfigured() });
  try {
    return Response.json(await inspectCloud(agentId));
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 502 });
  }
}

export async function POST(request) {
  if (!verify(cookies().get("ring_session")?.value)) return denied();
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  if (!["talk", "message", "assign"].includes(action)) {
    return Response.json({ error: "Unknown action." }, { status: 400 });
  }
  try {
    const result = await sendToCloud({
      action,
      agentId: String(body.agent_id || ""),
      displayName: String(body.display_name || "Agent"),
      text: String(body.text || ""),
      neighborhood: String(body.neighborhood || ""),
      typicalTask: String(body.typical_task || ""),
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 502 });
  }
}
