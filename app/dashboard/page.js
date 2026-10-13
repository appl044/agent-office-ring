import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import agents from "../../data/agents.json";
import { presenceStatus, secondsSince } from "../../lib/glyphs";
import { classifyIssue, listJoinIssues, listRingMembers } from "../../lib/queue";
import { verify } from "../../lib/session";
import { Board } from "./Board";

const REPO = process.env.JOIN_REPO || "appl044/agent-office-ring";
const REPO_URL = `https://github.com/${REPO}`;

export default async function DashboardPage() {
  const token = cookies().get("ring_session")?.value;
  if (!verify(token)) redirect("/login");
  const queue = await listJoinIssues();
  const ring = await listRingMembers();
  const issues = queue.issues.map((issue) => ({ ...issue, review: classifyIssue(issue) }));
  const extras = new Map(agents.map((agent) => [agent.agent_id, agent]));
  const byId = new Map();
  for (const member of ring.members) {
    const extra = extras.get(member.agent_id) || {};
    const plain = member.agent_id;
    const existing = byId.get(plain);
    if (existing && existing.join_issue !== member.join_issue) {
      const incoming = { ...extra, ...member, in_ring: true };
      const [keep, move] = Number(existing.join_issue) <= Number(member.join_issue) ? [existing, incoming] : [incoming, existing];
      byId.set(plain, { ...keep, agent_id: plain });
      byId.set(`${plain}#${move.join_issue}`, { ...move, agent_id: `${plain}#${move.join_issue}` });
    } else {
      byId.set(plain, { ...extra, ...member, in_ring: true });
    }
  }
  const rows = [...byId.values()].map((agent) => {
    const seconds_since = secondsSince(agent.last_active);
    const seated = { ...agent, seconds_since };
    return {
      ...seated,
      status: presenceStatus(seated),
      primary_objective_url: agent.work_url || `${REPO_URL}/blob/main/${agent.primary_objective_path}`,
    };
  });
  return (
    <Board
      agents={rows}
      issues={issues}
      queueError={queue.ok ? "" : String(queue.status)}
      repoUrl={REPO_URL}
      clawUrl={process.env.CLAW3D_PUBLIC_URL || "https://swing-replies-kelkoo-keeping.trycloudflare.com/office"}
    />
  );
}
