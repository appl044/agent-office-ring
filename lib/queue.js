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

export function scanText(value) {
  const haystack = String(value || "").toLowerCase();
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
  const agentId = String(body.agent_id || "");
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(agentId)) {
    errors.push("agent_id must be 3-64 lowercase letters, numbers, or hyphens");
  }
  const displayName = String(body.display_name || "").trim();
  if (displayName.length < 2 || displayName.length > 80) errors.push("display_name must be 2-80 characters");
  const statement = String(body.statement || "").trim();
  if (statement.length < 8 || statement.length > 800) errors.push("statement must be 8-800 characters");
  const objective = String(body.primary_objective_url || "");
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/.test(objective)) {
    errors.push("primary_objective_url must be an https://github.com URL");
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
  const scan = scanText([displayName, statement, objective, ...Object.values(fields), ...talksTo].join("\n"));
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

export async function listJoinIssues() {
  const repo = process.env.JOIN_REPO || "appl044/agent-office-ring";
  const response = await fetch(
    `https://api.github.com/repos/${repo}/issues?state=open&labels=join-request&per_page=50`,
    {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "agent-office-ring" },
      cache: "no-store",
    }
  );
  if (!response.ok) return { ok: false, status: response.status, issues: [] };
  const issues = await response.json();
  return {
    ok: true,
    status: 200,
    issues: issues
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        created_at: issue.created_at,
        body: String(issue.body || "").slice(0, 4000),
        user: issue.user && issue.user.login,
      })),
  };
}
