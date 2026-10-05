import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import agents from "../../data/agents.json";
import { secondsSince } from "../../lib/glyphs";
import { classifyIssue, listJoinIssues } from "../../lib/queue";
import { verify } from "../../lib/session";
import { Board } from "./Board";

const REPO = process.env.JOIN_REPO || "appl044/agent-office-ring";
const REPO_URL = `https://github.com/${REPO}`;

export default async function DashboardPage() {
  const token = cookies().get("ring_session")?.value;
  if (!verify(token)) redirect("/login");
  const queue = await listJoinIssues();
  const issues = queue.issues.map((issue) => ({ ...issue, review: classifyIssue(issue) }));
  const rows = agents.map((agent) => ({
    ...agent,
    seconds_since: secondsSince(agent.last_active),
    primary_objective_url: `${REPO_URL}/blob/main/${agent.primary_objective_path}`,
  }));
  return (
    <Board
      agents={rows}
      issues={issues}
      queueError={queue.ok ? "" : String(queue.status)}
      repoUrl={REPO_URL}
    />
  );
}
