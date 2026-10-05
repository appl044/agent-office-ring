const INJECTION_MARKERS = [
  "ignore previous",
  "ignore all previous",
  "system prompt",
  "<script",
  "begin private key",
  "begin openssh private key",
  "curl | sh",
  "rm -rf",
];

export function isGithubRepoUrl(value) {
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (url.hostname !== "github.com") return false;
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length >= 2 && parts.every((part) => /^[A-Za-z0-9_.-]+$/.test(part));
  } catch {
    return false;
  }
}

function normalize(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

export function extractJoinJson(raw) {
  const text = normalize(raw);
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return { ok: false, error: "no JSON object in the issue" };
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "JSON must be one object" };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: "JSON did not parse" };
  }
}

export function classifyIssue(issue) {
  const raw = `${issue.title || ""}\n${issue.body || ""}`;
  const surfaceScan = scanText(normalize(raw));
  const extracted = extractJoinJson(issue.body || "");
  if (!extracted.ok) {
    return {
      verdict: "invalid",
      errors: [extracted.error],
      scan: surfaceScan,
      examination: examineScan(surfaceScan),
    };
  }
  const checked = validateJoin(extracted.value);
  if (!surfaceScan.clean) {
    checked.ok = false;
    checked.errors = [...checked.errors, "marker found in the title or raw body"];
    checked.scan = {
      scanner: surfaceScan.scanner,
      clean: false,
      hits: [...new Set([...checked.scan.hits, ...surfaceScan.hits])],
    };
    checked.examination = examineScan(checked.scan);
  }
  return {
    verdict: checked.ok ? "valid" : "invalid",
    errors: checked.errors,
    scan: checked.scan,
    examination: checked.examination,
    request: checked.request,
  };
}

export function scanText(value) {
  const haystack = normalize(value).toLowerCase();
  const hits = INJECTION_MARKERS.filter((marker) => haystack.includes(marker));
  return { scanner: "marker-scan-v1", clean: hits.length === 0, hits };
}

export function examineScan(scan) {
  const allowed =
    scan &&
    scan.scanner === "marker-scan-v1" &&
    typeof scan.clean === "boolean" &&
    Array.isArray(scan.hits) &&
    scan.hits.every((hit) => INJECTION_MARKERS.includes(hit));
  return {
    examiner: "scan-output-v1",
    accepted: Boolean(allowed && scan.clean),
    reason: allowed ? (scan.clean ? "clean" : "marker") : "scanner-output-rejected",
  };
}

export function validateJoin(body) {
  const errors = [];
  if (String(body.schema_version || "") !== "1") {
    errors.push("schema_version must be \"1\"");
  }
  const agentId = String(body.agent_id || "");
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(agentId)) {
    errors.push("agent_id must be 3-64 lowercase letters, numbers, or hyphens");
  }
  const displayName = String(body.display_name || "").trim();
  if (displayName.length < 2 || displayName.length > 80) errors.push("display_name must be 2-80 characters");
  const statement = String(body.statement || "").trim();
  if (statement.length < 8 || statement.length > 800) errors.push("statement must be 8-800 characters");
  const objective = String(body.primary_objective_url || "");
  if (!isGithubRepoUrl(objective)) {
    errors.push("primary_objective_url must be https://github.com/owner/repo with no userinfo");
  }
  const fields = {};
  for (const field of ["primary_category", "secondary_category", "typical_task", "previous_task", "primary_contact"]) {
    const value = String(body[field] || "").trim();
    if (value.length < 2 || value.length > 160) errors.push(`${field} must be 2-160 characters`);
    fields[field] = value;
  }
  const talksTo = Array.isArray(body.talks_to) ? body.talks_to.map(String) : [];
  if (talksTo.length > 12 || talksTo.some((name) => name.length > 80)) {
    errors.push("talks_to must be at most 12 short names");
  }
  const scan = scanText(
    [displayName, statement, objective, ...Object.values(fields), ...talksTo, body.schema_version].join("\n")
  );
  const examination = examineScan(scan);
  if (!examination.accepted) errors.push(`held by scanner (${examination.reason})`);
  return {
    ok: errors.length === 0,
    errors,
    scan,
    examination,
    request: { agent_id: agentId, display_name: displayName, statement, primary_objective_url: objective, talks_to: talksTo, ...fields },
  };
}

function hasWord(text, word) {
  return new RegExp(`\\b${word}\\b`, "i").test(text);
}

export function assignSeat(request) {
  const primary = String(request.primary_category || "").toLowerCase();
  const secondary = String(request.secondary_category || "").toLowerCase();
  const blob = `${secondary} ${String(request.typical_task || "")}`.toLowerCase();
  const has = (words) => words.some((word) => hasWord(blob, word));
  if (has(["privacy", "security", "governance", "audit", "jailbreak"])) {
    return { floor: 3, room: "Review", department: "Oversight", neighborhood: "Mission Control" };
  }
  if (primary.includes("orchestr") || primary === "operations" || has(["fleet", "devbox", "routing"])) {
    return { floor: 3, room: "Dispatch", department: "Coordination", neighborhood: "Mission Control" };
  }
  if (has(["voice", "speech", "livekit", "avatar", "transcript", "zoom"]) || hasWord(blob, "call") || hasWord(blob, "calls") || hasWord(blob, "video")) {
    return { floor: 1, room: "Voice", department: "Presence", neighborhood: "Presence" };
  }
  if (primary === "knowledge" || primary.includes("catalog")) {
    return { floor: 2, room: "Library", department: "Knowledge", neighborhood: "Knowledge" };
  }
  if (primary === "research" || has(["alignment", "eval", "evidence", "benchmark"])) {
    return { floor: 2, room: "Lab", department: "Research", neighborhood: "Research" };
  }
  if (has(["finance", "property", "campaign", "household", "parcel", "municipal"])) {
    return { floor: 1, room: "Front desk", department: "House", neighborhood: "Operations" };
  }
  return { floor: 1, room: "Build", department: "Making", neighborhood: "Engineering" };
}

async function githubPages(url) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "agent-office-ring" };
  const items = [];
  for (let page = 0; page < 8 && url; page += 1) {
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) return { ok: false, status: response.status, items };
    const batch = await response.json();
    if (!Array.isArray(batch)) return { ok: false, status: 500, items };
    items.push(...batch);
    const link = response.headers.get("link") || "";
    const next = link.split(",").map((part) => part.trim()).find((part) => part.includes('rel="next"'));
    const match = next && next.match(/<([^>]+)>/);
    url = match ? match[1] : "";
  }
  return { ok: true, status: 200, items };
}

export async function listRingMembers() {
  const repo = process.env.JOIN_REPO || "appl044/agent-office-ring";
  const [issuePage, commentPage] = await Promise.all([
    githubPages(`https://api.github.com/repos/${repo}/issues?state=all&labels=join-request&per_page=100`),
    githubPages(`https://api.github.com/repos/${repo}/issues/comments?per_page=100&sort=created&direction=desc`),
  ]);
  if (!issuePage.ok || !commentPage.ok) {
    return { ok: false, status: issuePage.status || commentPage.status, members: [] };
  }
  const approved = new Set();
  for (const comment of commentPage.items) {
    const number = Number(String(comment.issue_url || "").split("/").pop());
    if (String(comment.body || "").includes(`approve join ${number}`)) approved.add(number);
  }
  const members = [];
  for (const issue of issuePage.items) {
    if (issue.pull_request || !approved.has(issue.number)) continue;
    const extracted = extractJoinJson(issue.body || "");
    const request = extracted.ok ? extracted.value : {};
    const seat = assignSeat(request);
    members.push({
      agent_id: request.agent_id || `issue-${issue.number}`,
      display_name: request.display_name || issue.title,
      status: "thinking",
      last_active: issue.created_at,
      floor: seat.floor,
      room: seat.room,
      department: seat.department,
      neighborhood: seat.neighborhood,
      primary_category: request.primary_category || "unspecified",
      secondary_category: request.secondary_category || "unspecified",
      primary_contact: request.primary_contact || "operator",
      talks_to: Array.isArray(request.talks_to) ? request.talks_to.map(String) : [],
      typical_task: String(request.typical_task || "Asked to join").slice(0, 240),
      previous_task: String(request.previous_task || "Join request").slice(0, 240),
      work_url: request.primary_objective_url || issue.html_url,
      in_ring: true,
      join_issue: issue.number,
    });
  }
  return { ok: true, status: 200, members };
}

export async function listJoinIssues() {
  const repo = process.env.JOIN_REPO || "appl044/agent-office-ring";
  const page = await githubPages(
    `https://api.github.com/repos/${repo}/issues?state=open&labels=join-request&per_page=100`
  );
  if (!page.ok) return { ok: false, status: page.status, issues: [] };
  return {
    ok: true,
    status: 200,
    issues: page.items
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        body: String(issue.body || "").slice(0, 4000),
        user: issue.user && issue.user.login,
      })),
  };
}
