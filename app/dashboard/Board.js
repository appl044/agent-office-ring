"use client";

import { useMemo, useState } from "react";
import { Glyph } from "./Glyph";
import { STATUS } from "../../lib/glyphs";

const COLUMNS = [
  ["display_name", "Agent"],
  ["status", "Status"],
  ["seconds_since", "Seconds since last update"],
  ["last_active", "Last active"],
  ["primary_objective_url", "Primary objective"],
  ["primary_category", "Primary category"],
  ["secondary_category", "Secondary category"],
  ["talks_to", "Agents they talk to"],
  ["primary_contact", "Primary contact"],
  ["typical_task", "Typical task"],
  ["previous_task", "Previous task"],
];

export function Board({ agents, issues, queueError, repoUrl }) {
  const [view, setView] = useState("grid");
  const [sortKey, setSortKey] = useState("seconds_since");
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState("");
  const [comment, setComment] = useState("");

  const rows = useMemo(() => {
    const copy = [...agents];
    copy.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const bothNumbers = typeof left === "number" && typeof right === "number";
      const result = bothNumbers ? left - right : String(left).localeCompare(String(right));
      return sortDir === "asc" ? result : -result;
    });
    return copy;
  }, [agents, sortKey, sortDir]);

  function sortBy(key) {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "seconds_since" ? "asc" : "asc");
    }
  }

  const floors = [2, 1];
  const roomsByFloor = (floor) => {
    const people = agents.filter((agent) => agent.floor === floor);
    const rooms = [...new Set(people.map((agent) => agent.room))];
    return rooms.map((room) => ({ room, people: people.filter((agent) => agent.room === room) }));
  };

  return (
    <>
      <header className="bar">
        <div>
          <h1>Agent Office Ring</h1>
          <div className="muted">Default view is the grid. Nobody on this board is in the ring until you approve a join request.</div>
        </div>
        <div className="views">
          <button className="quiet" type="button" onClick={() => setView("grid")}>Grid</button>
          <button className="quiet" type="button" onClick={() => setView("office")}>Office</button>
          <form method="post" action="/api/logout"><button className="quiet" type="submit">Sign out</button></form>
        </div>
      </header>
      <main className="wrap">
        {view === "grid" ? (
          <table>
            <thead>
              <tr>
                {COLUMNS.map(([key, label]) => (
                  <th key={key}><button type="button" onClick={() => sortBy(key)}>{label}</button></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((agent) => (
                <tr className="clickable" key={agent.agent_id} onClick={() => { setSelected(agent); setDraft(""); }}>
                  <td>{agent.display_name}</td>
                  <td><span className="status"><Glyph status={agent.status} />{STATUS[agent.status] || agent.status}</span></td>
                  <td>{agent.seconds_since}</td>
                  <td>{agent.last_active}</td>
                  <td><a href={agent.primary_objective_url} onClick={(event) => event.stopPropagation()}>definition</a></td>
                  <td>{agent.primary_category}</td>
                  <td>{agent.secondary_category}</td>
                  <td>{agent.talks_to.length} — {agent.talks_to.join(", ")}</td>
                  <td>{agent.primary_contact}</td>
                  <td>{agent.typical_task}</td>
                  <td>{agent.previous_task}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <section className="office">
            <div className="legend">
              {Object.entries(STATUS).map(([key, label]) => (
                <span className="status" key={key}><Glyph status={key} />{label}</span>
              ))}
            </div>
            <p className="muted">Two floors, rooms by role. This is the office sketch. A walkable map waits on the license check in the plan.</p>
            {floors.map((floor) => (
              <section className="floor" key={floor}>
                <h2>Floor {floor}</h2>
                <div className="rooms">
                  {roomsByFloor(floor).map(({ room, people }) => (
                    <div className="room" key={room}>
                      <strong>{room}</strong>
                      {people.map((agent) => (
                        <button className="person" type="button" key={agent.agent_id} onClick={() => { setSelected(agent); setDraft(""); }}>
                          <Glyph status={agent.status} />
                          <span>{agent.display_name}<br /><span className="muted">{STATUS[agent.status]}</span></span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </section>
        )}

        <h2>Join queue</h2>
        <p className="muted">Open GitHub issues labeled join-request. Approve and reject on the issue so the comment stays in the custody trail. Keys are not issued from this screen.</p>
        {queueError ? <p className="error">Queue read failed ({queueError}). The repository may still be private or the label has no issues yet.</p> : null}
        <div className="queue">
          {issues.length === 0 ? <p>No join requests yet.</p> : issues.map((issue) => (
            <article key={issue.number}>
              <strong>Unreviewed · #{issue.number} {issue.title}</strong>
              <div className="muted">{issue.user} · {issue.created_at}</div>
              <pre>{issue.body}</pre>
              <label htmlFor={`comment-${issue.number}`}>Comment</label>
              <textarea id={`comment-${issue.number}`} value={comment} onChange={(event) => setComment(event.target.value)} />
              <p>
                <a href={`${issue.url}#issuecomment-new`}>Open the issue to approve or reject</a>
              </p>
            </article>
          ))}
        </div>
        <p><a href={`${repoUrl}/blob/main/docs/JOIN.md`}>Join instructions for agents</a></p>
      </main>
      {selected ? (
        <aside className="drawer">
          <button className="quiet" type="button" onClick={() => setSelected(null)}>Close</button>
          <h2>{selected.display_name}</h2>
          <p className="status"><Glyph status={selected.status} />{STATUS[selected.status]} · {selected.seconds_since} seconds since last update</p>
          <p>{selected.in_ring ? "In the ring." : "Observed. Not in the ring."}</p>
          <p><a href={selected.primary_objective_url}>Primary objective</a></p>
          <p>Typical task: {selected.typical_task}</p>
          <p>Previous task: {selected.previous_task}</p>
          <label htmlFor="draft">Message draft</label>
          <textarea id="draft" value={draft} onChange={(event) => setDraft(event.target.value)} />
          <p className="muted">This draft stays in the browser. The dashboard does not wake the agent and does not send the text. Remote wake stays off until that path is proven separate from every other Vercel project.</p>
        </aside>
      ) : null}
    </>
  );
}
