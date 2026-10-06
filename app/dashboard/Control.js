"use client";

import { useEffect, useState } from "react";

export function Control({ agent }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    setNote("");
    fetch(`/api/control?agent_id=${encodeURIComponent(agent.agent_id)}`)
      .then((response) => response.json())
      .then((body) => {
        if (!cancelled) setRecord(body);
      })
      .catch(() => {
        if (!cancelled) setRecord({ error: "Could not read the cloud record." });
      });
    return () => {
      cancelled = true;
    };
  }, [agent.agent_id]);

  async function send(action) {
    setBusy(true);
    setNote("");
    try {
      const response = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          agent_id: agent.agent_id,
          display_name: agent.display_name,
          text,
          neighborhood: agent.neighborhood || "",
          typical_task: agent.typical_task || "",
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Send failed");
      setNote(body.created ? `Started a new cloud agent. Run ${body.run?.status || "queued"}.` : `Sent. Run ${body.run?.status || "queued"}.`);
      setText("");
      const refresh = await fetch(`/api/control?agent_id=${encodeURIComponent(agent.agent_id)}`);
      setRecord(await refresh.json());
    } catch (error) {
      setNote(error.message);
    } finally {
      setBusy(false);
    }
  }

  const cloud = record?.agent;
  const usage = record?.usage;

  return (
    <div className="control">
      <p className="muted">Talk and Message start a Cursor cloud run in plan mode and tell it not to edit the repo. Assign starts a run that may change a new branch and does not open a pull request. Voice is not connected.</p>
      {record?.configured === false ? <p className="error">CURSOR_API_KEY is not set on this deployment. Add a key from Cursor Dashboard, API Keys.</p> : null}
      {record?.error ? <p className="error">{record.error}</p> : null}
      <h3>Cloud agent</h3>
      {cloud ? (
        <p>{cloud.status} · <a href={cloud.url}>Open in Cursor</a></p>
      ) : (
        <p className="muted">{record ? "No cloud agent yet. Talk, Message, or Assign starts one." : "Reading the cloud record."}</p>
      )}
      <label htmlFor="control-text">What should they do</label>
      <textarea id="control-text" rows={4} value={text} onChange={(event) => setText(event.target.value)} />
      <div className="actions">
        <button className="quiet" type="button" disabled={busy} onClick={() => send("talk")}>Talk</button>
        <button className="quiet" type="button" disabled={busy} onClick={() => send("message")}>Message</button>
        <button className="quiet" type="button" disabled={busy} onClick={() => send("assign")}>Assign</button>
        <a href={agent.primary_objective_url}>Inspect work</a>
      </div>
      {note ? <p>{note}</p> : null}
      <h3>Work history</h3>
      {agent.primary_objective_url ? <p><a href={agent.primary_objective_url}>Filed work</a></p> : null}
      {record?.runs?.length ? (
        <ul className="history">
          {record.runs.map((run) => (
            <li key={run.id}><strong>{run.status}</strong> {run.createdAt} {run.result ? `· ${run.result}` : ""}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No Cursor runs yet. The filed work link above is the join record.</p>
      )}
      <h3>Performance</h3>
      {usage ? (
        <p>{usage.totalTokens} tokens across {usage.runs} runs. Input {usage.inputTokens}. Output {usage.outputTokens}.</p>
      ) : (
        <p className="muted">No token usage yet. Check-in time on the grid is still the activity clock.</p>
      )}
    </div>
  );
}
