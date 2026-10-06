"use client";

import { useCallback, useEffect, useState } from "react";

const LIVE = new Set(["CREATING", "RUNNING", "ACTIVE"]);

function plainStatus(record) {
  const run = record?.runs?.[0]?.status;
  if (run === "CREATING" || run === "RUNNING" || record?.agent?.status === "ACTIVE") return "Working on it";
  if (run === "FINISHED") return "Finished";
  if (run === "ERROR") return "Stopped with an error";
  if (run === "CANCELLED") return "Stopped";
  if (run === "EXPIRED") return "Expired";
  if (!record?.agent) return "Not started";
  return "Waiting";
}

function duration(ms) {
  if (!ms) return "";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function Control({ agent }) {
  const [text, setText] = useState("");
  const [openPr, setOpenPr] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/control?agent_id=${encodeURIComponent(agent.agent_id)}`);
    const body = await response.json();
    setRecord(body);
    return body;
  }, [agent.agent_id]);

  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    setNote("");
    load().catch(() => {
      if (!cancelled) setRecord({ error: "Could not read the cloud record." });
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const latest = record?.runs?.[0];
  const running = LIVE.has(latest?.status) || record?.agent?.status === "ACTIVE";

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      load().catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, [running, load]);

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
          open_pull_request: openPr,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Send failed");
      setNote(action === "cancel" ? "Stop requested." : "Sent. This page will keep checking until the run finishes.");
      if (action !== "cancel") setText("");
      await load();
    } catch (error) {
      setNote(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function openArtifact(path) {
    const response = await fetch(`/api/control?agent_id=${encodeURIComponent(agent.agent_id)}&artifact=${encodeURIComponent(path)}`);
    const body = await response.json();
    if (!response.ok || !body.url) {
      setNote(body.error || "Could not open that file.");
      return;
    }
    window.open(body.url, "_blank", "noopener,noreferrer");
  }

  const branches = latest?.branches || [];

  return (
    <div className="control">
      <div className="now">
        <strong>{record ? plainStatus(record) : "Checking"}</strong>
        {record?.agent?.url ? <a href={record.agent.url}>Open the original chat</a> : null}
      </div>
      {record?.keyName ? <p className="muted">Connected with Cursor key {record.keyName}.</p> : null}
      {record?.configured === false ? <p className="error">Add CURSOR_API_KEY from Cursor Dashboard → API Keys.</p> : null}
      {record?.problem ? <p className="error">{record.problem}</p> : null}
      {record?.error ? <p className="error">{record.error}</p> : null}
      <h3>Latest reply</h3>
      {latest?.result ? <div className="reply">{latest.result}</div> : <p className="muted">{running ? "Still working." : "No reply yet."}</p>}
      {latest?.durationMs ? <p className="muted">Last run took {duration(latest.durationMs)}.</p> : null}
      {branches.map((branch) => (
        <p key={`${branch.branch}-${branch.prUrl}`}>
          {branch.prUrl ? <a href={branch.prUrl}>Pull request</a> : null}
          {branch.branch ? <span className="muted"> {branch.branch}</span> : null}
        </p>
      ))}
      <label htmlFor="control-text">What should they do</label>
      <textarea id="control-text" rows={4} value={text} onChange={(event) => setText(event.target.value)} />
      <label className="check">
        <input type="checkbox" checked={openPr} onChange={(event) => setOpenPr(event.target.checked)} />
        Open a pull request when assigning work
      </label>
      <div className="actions">
        <button className="primary" type="button" disabled={busy || running} onClick={() => send("talk")}>Ask</button>
        <button className="quiet" type="button" disabled={busy || running} onClick={() => send("assign")}>Assign work</button>
        <button className="quiet" type="button" disabled={busy || !running} onClick={() => send("cancel")}>Stop</button>
        <a href={agent.primary_objective_url}>Filed work</a>
      </div>
      {note ? <p>{note}</p> : null}
      <h3>Earlier runs</h3>
      {record?.runs?.length ? (
        <ul className="history">
          {record.runs.map((run) => (
            <li key={run.id}><strong>{plainStatus({ runs: [run] })}</strong> {run.createdAt}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No runs on the original chat yet. Ask sends a question into that chat. The dashboard does not open a new agent.</p>
      )}
      <h3>Files</h3>
      {record?.artifacts?.length ? (
        <ul className="history">
          {record.artifacts.map((item) => (
            <li key={item.path}><button className="quiet" type="button" onClick={() => openArtifact(item.path)}>{item.path}</button></li>
          ))}
        </ul>
      ) : (
        <p className="muted">No files from this agent yet.</p>
      )}
      <h3>Use</h3>
      {record?.usage ? (
        <p className="muted">{record.usage.totalTokens.toLocaleString()} tokens across {record.usage.runs} runs.</p>
      ) : (
        <p className="muted">No token use yet.</p>
      )}
    </div>
  );
}
