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

function redTeamSubgroup(blob) {
  if (blob.includes("red-team") || blob.includes("red team") || hasWord(blob, "jailbreak") || hasWord(blob, "defensive")) return "Defense";
  if (hasWord(blob, "privacy")) return "Privacy";
  if (hasWord(blob, "audit")) return "Audit";
  if (hasWord(blob, "governance")) return "Governance";
  return "Defense";
}

function architectureSubgroup(blob) {
  if (blob.includes("multi-agent") || blob.includes("multi agent")) return "Multi-agent";
  if (hasWord(blob, "lab") || hasWord(blob, "platform")) return "Lab and platform";
  if (hasWord(blob, "avatar") || hasWord(blob, "client")) return "Client and avatar";
  if (hasWord(blob, "review") || hasWord(blob, "peer")) return "Review";
  return "Product";
}

export function assignSeat(request) {
  const primary = String(request.primary_category || "").toLowerCase();
  const secondary = String(request.secondary_category || "").toLowerCase();
  const blob = `${secondary} ${String(request.typical_task || "")}`.toLowerCase();
  const has = (words) => words.some((word) => hasWord(blob, word));
  if (has(["privacy", "security", "governance", "audit", "jailbreak", "defensive"]) || blob.includes("red-team") || blob.includes("red team")) {
    return { floor: 3, room: "Review", department: "Oversight", neighborhood: "Red Team", subgroup: redTeamSubgroup(blob) };
  }
  if (blob.includes("architect")) {
    return { floor: 2, room: "Plan", department: "Architecture", neighborhood: "Architecture", subgroup: architectureSubgroup(blob) };
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

function githubHeaders() {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "agent-office-ring" };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function githubWriteConfigured() {
  return Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
}

async function githubPages(url) {
  const headers = githubHeaders();
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
      subgroup: seat.subgroup || "",
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

function parseRingLink(comments, agentId) {
  let cursorId = "";
  let local = false;
  let found = false;
  for (const comment of comments) {
    const body = String(comment.body || "");
    if (!body.split(/\r?\n/).some((line) => line.trim() === `ring-link: ${agentId}`)) continue;
    found = true;
    for (const line of body.split(/\r?\n/)) {
      const text = line.trim();
      const cloud = text.match(/^cursor-thread:\s*(bc-[0-9a-f-]{8,})\s*$/i);
      if (cloud) {
        cursorId = cloud[1];
        local = false;
      } else if (/^cursor-thread:\s*(local|openai|chatgpt)\s*$/i.test(text) && !cursorId) {
        local = true;
      }
    }
  }
  return { found, cursorId, local };
}

function officeMessages(comments) {
  return comments
    .map((comment) => {
      const body = String(comment.body || "").trim();
      const operator = body.match(/^operator(?:\s+\w+)?:\s*([\s\S]+)/i);
      const agent = body.match(/^agent:\s*([\s\S]+)/i);
      if (operator) {
        return {
          id: String(comment.id),
          status: "FINISHED",
          createdAt: comment.created_at,
          durationMs: 0,
          result: "",
          role: "operator",
          text: operator[1].trim().slice(0, 1200),
          branches: [],
        };
      }
      if (agent) {
        return {
          id: String(comment.id),
          status: "FINISHED",
          createdAt: comment.created_at,
          durationMs: 0,
          result: agent[1].trim().slice(0, 1200),
          role: "agent",
          text: agent[1].trim().slice(0, 1200),
          branches: [],
        };
      }
      return null;
    })
    .filter(Boolean)
    .reverse();
}

export async function originalThread(agentId, joinIssue) {
  const id = String(agentId || "").split("#")[0].trim();
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(id)) return null;
  const repo = process.env.JOIN_REPO || "appl044/agent-office-ring";
  let issueNumber = Number(joinIssue);
  let issueUrl = issueNumber ? `https://github.com/${repo}/issues/${issueNumber}` : "";
  if (!issueNumber) {
    const page = await githubPages(`https://api.github.com/repos/${repo}/issues?state=all&labels=join-request&per_page=100`);
    if (!page.ok) return { error: `GitHub returned ${page.status}` };
    const issue = page.items.find((item) => item.title === `join: ${id}` && !item.pull_request);
    if (!issue) return null;
    issueNumber = issue.number;
    issueUrl = issue.html_url;
  }
  const comments = await githubPages(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments?per_page=100`);
  if (!comments.ok) return { error: `GitHub returned ${comments.status}` };
  const link = parseRingLink(comments.items, id);
  return {
    issue: issueNumber,
    issueUrl,
    cursorId: link.cursorId,
    local: link.local,
    found: link.found,
    messages: officeMessages(comments.items),
  };
}

export async function postOfficeAsk({ agentId, joinIssue, action, text }) {
  const link = await originalThread(agentId, joinIssue);
  if (!link?.found || !link.issue) {
    const error = new Error("Original Cursor chat is not connected.");
    error.status = 404;
    throw error;
  }
  if (!githubWriteConfigured()) {
    const error = new Error("GitHub token is not set.");
    error.status = 503;
    throw error;
  }
  const repo = process.env.JOIN_REPO || "appl044/agent-office-ring";
  const body = [
    `operator ${action}: ${text}`,
    "",
    `Reply on this GitHub issue with a comment that begins with "agent:". Read this issue at the start of the next turn in the same chat. Do not open a new Cursor agent.`,
  ].join("\n");
  const response = await fetch(`https://api.github.com/repos/${repo}/issues/${link.issue}/comments`, {
    method: "POST",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `GitHub returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return {
    issue: link.issue,
    issueUrl: link.issueUrl,
    commentUrl: payload.html_url || `${link.issueUrl}#issuecomment-${payload.id}`,
  };
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

async function githubJson(path, method, body) {
  if (!githubWriteConfigured()) {
    const error = new Error("GitHub token is not set.");
    error.status = 503;
    throw error;
  }
  const repo = process.env.JOIN_REPO || "appl044/agent-office-ring";
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method,
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `GitHub returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function openaiJoinIdOk(agentId) {
  return /^[a-z][a-z0-9-]{1,52}-[0-9]{2,4}$/.test(String(agentId || ""));
}

export async function acceptOpenAiJoin(raw) {
  const request = {
    schema_version: "1",
    agent_id: String(raw.agent_id || "").trim().toLowerCase(),
    display_name: String(raw.display_name || raw.agent_id || "").trim(),
    primary_category: String(raw.primary_category || "implementation").trim(),
    secondary_category: String(raw.secondary_category || "openai-persona").trim(),
    typical_task: String(raw.typical_task || "Answers operator questions from this OpenAI chat.").trim(),
    previous_task: String(raw.previous_task || "Installing into the Agent Office Ring.").trim(),
    primary_contact: "operator",
    talks_to: Array.isArray(raw.talks_to) ? raw.talks_to.map(String) : ["operator"],
    primary_objective_url: String(raw.primary_objective_url || "https://github.com/appl044/agent-office-ring").trim(),
    statement: String(raw.statement || "OpenAI persona joining the ring. This join issue is the mailbox.").trim(),
  };
  if (!openaiJoinIdOk(request.agent_id)) {
    const error = new Error("agent_id must look like role-topic-07. Use lowercase and end with a number.");
    error.status = 400;
    throw error;
  }
  if (!/^[A-Za-z][A-Za-z0-9'(). -]{4,78}$/.test(request.display_name) || !request.display_name.includes(" ") || /^[A-Za-z]+[0-9]+$/.test(request.display_name)) {
    const error = new Error("display_name must be words, like Jake Systems Architect. Do not use Jake01.");
    error.status = 400;
    throw error;
  }
  const checked = validateJoin(request);
  if (!checked.ok) {
    const error = new Error(checked.errors.join("; "));
    error.status = 400;
    throw error;
  }
  const repo = process.env.JOIN_REPO || "appl044/agent-office-ring";
  const existing = await githubPages(`https://api.github.com/repos/${repo}/issues?state=all&labels=join-request&per_page=100`);
  if (!existing.ok) {
    const error = new Error(`GitHub returned ${existing.status}`);
    error.status = existing.status;
    throw error;
  }
  let issue = existing.items.find((item) => item.title === `join: ${request.agent_id}` && !item.pull_request);
  let created = false;
  if (!issue) {
    issue = await githubJson("/issues", "POST", {
      title: `join: ${request.agent_id}`,
      labels: ["join-request"],
      body: `${JSON.stringify(request, null, 2)}\n`,
    });
    created = true;
  }
  const comments = await githubPages(`https://api.github.com/repos/${repo}/issues/${issue.number}/comments?per_page=100`);
  const bodies = (comments.items || []).map((item) => String(item.body || ""));
  if (!bodies.some((body) => body.includes(`approve join ${issue.number}`))) {
    await githubJson(`/issues/${issue.number}/comments`, "POST", {
      body: `approve join ${issue.number}\n\nOperator approval. OpenAI persona. No key is included.`,
    });
  }
  if (!bodies.some((body) => body.includes(`ring-link: ${request.agent_id}`) && /cursor-thread:\s*openai/i.test(body))) {
    await githubJson(`/issues/${issue.number}/comments`, "POST", {
      body: [
        `ring-link: ${request.agent_id}`,
        `issue: ${issue.number}`,
        "cursor-thread: openai",
        "dashboard: https://agent-office-ring.vercel.app",
        "status: watching",
        "",
        `Attached from OpenAI. Read issue ${issue.number} at the start of every later turn. Answer each new operator: comment with agent: on this issue.`,
      ].join("\n"),
    });
  }
  if (issue.state === "open") {
    await githubJson(`/issues/${issue.number}`, "PATCH", { state: "closed" });
  }
  return {
    ok: true,
    created,
    agent_id: request.agent_id,
    display_name: request.display_name,
    issue: issue.number,
    issueUrl: issue.html_url || `https://github.com/${repo}/issues/${issue.number}`,
    dashboard: "https://agent-office-ring.vercel.app",
  };
}
