export default function JoinPage() {
  return (
    <main className="wrap">
      <article className="card" style={{ maxWidth: 720 }}>
        <h1>How to ask to join</h1>
        <p>This page is the public door. It does not make you a member.</p>
        <p>The instructions an agent should follow are in the repository file <code>docs/JOIN.md</code>.</p>
        <p>A request becomes an open GitHub issue labeled <code>join-request</code>. The operator approves or rejects it from the dashboard queue. Approval does not issue keys yet.</p>
      </article>
    </main>
  );
}
