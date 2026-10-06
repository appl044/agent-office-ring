const API = "https://api.cursor.com/v1";
const REPO = "https://github.com/appl044/agent-office-ring";

export function cursorConfigured() {
  return Boolean(process.env.CURSOR_API_KEY);
}

async function cursor(path, options = {}) {
  const key = process.env.CURSOR_API_KEY;
  if (!key) {
    const error = new Error("CURSOR_API_KEY is not set");
    error.status = 503;
    throw error;
  }
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: text.slice(0, 300) };
  }
  if (!response.ok) {
    const error = new Error(body?.error?.message || body?.message || `Cursor returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function ringName(agentId) {
  return `ring:${String(agentId)}`.slice(0, 100);
}

async function findRingAgent(agentId) {
  const want = ringName(agentId);
  let pageCursor = "";
  for (let page = 0; page < 5; page += 1) {
    const query = new URLSearchParams({ limit: "100", includeArchived: "true" });
    if (pageCursor) query.set("cursor", pageCursor);
    const data = await cursor(`/agents?${query}`);
    const hit = (data.items || []).find((item) => item.name === want);
    if (hit) return hit;
    if (!data.nextCursor) return null;
    pageCursor = data.nextCursor;
  }
  return null;
}

function promptFor({ action, text, displayName, agentId, neighborhood, typicalTask }) {
  const guard = action === "assign"
    ? "Do the assignment on a new branch. Do not push to main. Do not open a pull request."
    : "Reply in text. Do not edit files. Do not open a pull request.";
  return [
    `You are ${displayName} (${agentId}) in ${neighborhood || "the ring"}.`,
    `Filed task: ${typicalTask || "none"}.`,
    `Operator ${action}: ${text}`,
    guard,
  ].join("\n");
}

function publicAgent(agent) {
  if (!agent) return null;
  return {
    id: agent.id,
    name: agent.name,
    status: agent.status,
    url: agent.url,
    latestRunId: agent.latestRunId || "",
    updatedAt: agent.updatedAt || "",
  };
}

function publicRun(run) {
  return {
    id: run.id,
    status: run.status,
    createdAt: run.createdAt || "",
    result: String(run.result || "").slice(0, 400),
  };
}

export async function inspectCloud(agentId) {
  if (!cursorConfigured()) return { configured: false, agent: null, runs: [], usage: null };
  const agent = await findRingAgent(agentId);
  if (!agent) return { configured: true, agent: null, runs: [], usage: null };
  const [runs, usage] = await Promise.all([
    cursor(`/agents/${agent.id}/runs?limit=8`).catch(() => ({ items: [] })),
    cursor(`/agents/${agent.id}/usage`).catch(() => null),
  ]);
  const totals = usage?.total || usage?.usage || null;
  return {
    configured: true,
    agent: publicAgent(agent),
    runs: (runs.items || []).map(publicRun),
    usage: totals
      ? {
          totalTokens: totals.totalTokens ?? 0,
          inputTokens: totals.inputTokens ?? 0,
          outputTokens: totals.outputTokens ?? 0,
          runs: Array.isArray(usage.runs) ? usage.runs.length : (runs.items || []).length,
        }
      : null,
  };
}

export async function sendToCloud({ action, agentId, displayName, text, neighborhood, typicalTask }) {
  const trimmed = String(text || "").trim().slice(0, 4000);
  if (!trimmed) {
    const error = new Error("Write a message first.");
    error.status = 400;
    throw error;
  }
  const mode = action === "assign" ? "agent" : "plan";
  const prompt = promptFor({ action, text: trimmed, displayName, agentId, neighborhood, typicalTask });
  let existing = await findRingAgent(agentId);
  if (existing?.status === "ARCHIVED") {
    await cursor(`/agents/${existing.id}/unarchive`, { method: "POST" });
    existing = await cursor(`/agents/${existing.id}`);
  }
  if (existing && existing.status === "ACTIVE") {
    const error = new Error("A run is already in progress. Wait for it to finish before sending again.");
    error.status = 409;
    throw error;
  }
  if (existing && existing.status === "IDLE") {
    const run = await cursor(`/agents/${existing.id}/runs`, {
      method: "POST",
      body: JSON.stringify({ prompt: { text: prompt }, mode }),
    });
    return { created: false, agent: publicAgent(existing), run: publicRun(run.run || run) };
  }
  const created = await cursor("/agents", {
    method: "POST",
    body: JSON.stringify({
      name: ringName(agentId),
      prompt: { text: prompt },
      mode,
      repos: [{ url: REPO, startingRef: "main" }],
      autoCreatePR: false,
      workOnCurrentBranch: false,
    }),
  });
  return { created: true, agent: publicAgent(created.agent), run: publicRun(created.run || {}) };
}
