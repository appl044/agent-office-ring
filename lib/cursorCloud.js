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

function promptFor({ action, text, displayName, agentId, neighborhood, typicalTask, openPullRequest }) {
  const guard = action === "assign"
    ? (openPullRequest
      ? "Do the assignment on a new branch and open a pull request. Do not push to main."
      : "Do the assignment on a new branch. Do not push to main. Do not open a pull request.")
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
  const branches = Array.isArray(run?.git?.branches)
    ? run.git.branches
      .map((branch) => ({ branch: branch.branch || "", prUrl: branch.prUrl || "" }))
      .filter((branch) => branch.branch || branch.prUrl)
    : [];
  return {
    id: run.id,
    status: run.status,
    createdAt: run.createdAt || "",
    durationMs: run.durationMs || 0,
    result: String(run.result || "").slice(0, 1200),
    branches,
  };
}

let keyCache = { at: 0, name: "" };

export async function connectedKeyName() {
  if (!cursorConfigured()) return "";
  if (keyCache.name && Date.now() - keyCache.at < 5 * 60 * 1000) return keyCache.name;
  const me = await cursor("/me").catch(() => null);
  keyCache = { at: Date.now(), name: me?.apiKeyName || "" };
  return keyCache.name;
}

export async function inspectCloud(agentId) {
  if (!cursorConfigured()) return { configured: false, keyName: "", agent: null, runs: [], artifacts: [], usage: null };
  const agent = await findRingAgent(agentId);
  if (!agent) {
    return { configured: true, keyName: await connectedKeyName(), agent: null, runs: [], artifacts: [], usage: null };
  }
  const [runs, usage] = await Promise.all([
    cursor(`/agents/${agent.id}/runs?limit=8`).catch(() => ({ items: [] })),
    cursor(`/agents/${agent.id}/usage`).catch(() => null),
  ]);
  const items = (runs.items || []).map(publicRun);
  if (agent.latestRunId) {
    const full = await cursor(`/agents/${agent.id}/runs/${agent.latestRunId}`).catch(() => null);
    if (full?.id) {
      const detailed = publicRun(full);
      const index = items.findIndex((item) => item.id === detailed.id);
      if (index >= 0) items[index] = detailed;
      else items.unshift(detailed);
    }
  }
  const artifacts = await cursor(`/agents/${agent.id}/artifacts`).catch(() => ({ items: [] }));
  const totals = usage?.totalUsage || null;
  return {
    configured: true,
    keyName: await connectedKeyName(),
    agent: publicAgent(agent),
    runs: items,
    artifacts: (artifacts.items || [])
      .filter((item) => typeof item.path === "string" && item.path.startsWith("artifacts/") && !item.path.includes(".."))
      .map((item) => ({ path: item.path, sizeBytes: item.sizeBytes || 0 })),
    usage: totals
      ? {
          totalTokens: totals.totalTokens ?? 0,
          inputTokens: totals.inputTokens ?? 0,
          outputTokens: totals.outputTokens ?? 0,
          runs: Array.isArray(usage.runs) ? usage.runs.length : items.length,
        }
      : null,
  };
}

export async function artifactLink(agentId, path) {
  if (!path.startsWith("artifacts/") || path.includes("..")) {
    const error = new Error("That file path is not an artifact.");
    error.status = 400;
    throw error;
  }
  const agent = await findRingAgent(agentId);
  if (!agent) {
    const error = new Error("No cloud agent for this person yet.");
    error.status = 404;
    throw error;
  }
  const query = new URLSearchParams({ path });
  const download = await cursor(`/agents/${agent.id}/artifacts/download?${query}`);
  return { url: download.url, expiresAt: download.expiresAt || "" };
}

export async function cancelCloud(agentId) {
  const agent = await findRingAgent(agentId);
  if (!agent?.latestRunId) {
    const error = new Error("There is no run to stop.");
    error.status = 404;
    throw error;
  }
  await cursor(`/agents/${agent.id}/runs/${agent.latestRunId}/cancel`, { method: "POST" });
  return { ok: true };
}

export async function sendToCloud({ action, agentId, displayName, text, neighborhood, typicalTask, openPullRequest }) {
  const trimmed = String(text || "").trim().slice(0, 4000);
  if (!trimmed) {
    const error = new Error("Write a message first.");
    error.status = 400;
    throw error;
  }
  const mode = action === "assign" ? "agent" : "plan";
  const openPr = action === "assign" && openPullRequest === true;
  const prompt = promptFor({ action, text: trimmed, displayName, agentId, neighborhood, typicalTask, openPullRequest: openPr });
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
      autoCreatePR: openPr,
      workOnCurrentBranch: false,
    }),
  });
  return { created: true, agent: publicAgent(created.agent), run: publicRun(created.run || {}) };
}
