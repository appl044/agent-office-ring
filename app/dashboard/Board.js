"use client";

import { useMemo, useState } from "react";
import { Glyph } from "./Glyph";
import { STATUS } from "../../lib/glyphs";

function QueueList({ title, issues }) {
  return (
    <section>
      <h3>{title}</h3>
      <div className="queue">
        {issues.length === 0 ? <p className="muted">None.</p> : issues.map((issue) => (
          <article key={issue.number}>
            <strong>{issue.review?.verdict === "valid" ? "Unreviewed" : "Held"} · #{issue.number} {issue.title}</strong>
            <div className="muted">{issue.user} · updated {issue.updated_at}</div>
            {issue.review?.errors?.length ? <p className="error">{issue.review.errors.join("; ")}</p> : <p>Scanner passed this snapshot. Read the issue again before you comment. If the body changed, refresh this page.</p>}
            <pre>{issue.body}</pre>
            <p><a href={`${issue.url}#issuecomment-new`}>Open the issue to approve or reject</a></p>
            <p className="muted">Approval comment to paste: approve join {issue.number}. Rejection comment to paste: reject join {issue.number}.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const COLUMNS = [
  ["display_name", "Agent"],
  ["status", "Status"],
  ["seconds_since", "Seconds since last update"],
  ["last_active", "Last active"],
  ["primary_objective_url", "Primary objective"],
  ["department", "Department"],
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

  const floors = [...new Set(agents.map((agent) => agent.floor).filter((floor) => floor))].sort((a, b) => b - a);
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
          <div className="muted">Default view is the grid. Approved join requests appear here as in the ring.</div>
        </div>
        <div className="views">
          <button className="quiet" type="button" onClick={() => setView("grid")}>Grid</button>
          <button className="quiet" type="button" onClick={() => setView("office")}>Office</button>
          <form method="post" action="/api/logout"><button className="quiet" type="submit">Sign out</button></form>
        </div>
      </header>
      <main className="wrap">
        <p className="muted">The grid is filled from approved GitHub join requests. This page does not contact Cursor and does not wake agents. Agent-to-agent messages are not carried here yet.</p>
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
                <tr className="clickable" key={agent.agent_id} onClick={() => setSelected(agent)}>
                  <td>{agent.display_name}{agent.in_ring ? <div className="muted">In the ring</div> : <div className="muted">Not in the ring</div>}</td>
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
            <p className="muted">Floors follow the department taxonomy: making on 1, knowledge and research on 2, coordination and oversight on 3. This is a floor plan, not a 3D city.</p>
            {floors.map((floor) => (
              <section className="floor" key={floor}>
                <h2>Floor {floor}</h2>
                <div className="rooms">
                  {roomsByFloor(floor).map(({ room, people }) => (
                    <div className="room" key={room}>
                      <strong>{room}</strong>
                      {people.map((agent) => (
                        <button className="person" type="button" key={agent.agent_id} onClick={() => setSelected(agent)}>
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
        <p className="muted">Open issues labeled join-request. A request is not approved until you comment on the GitHub issue and close it. Do not put health information in an issue. Keys are not issued here.</p>
        {queueError ? <p className="error">Queue read failed ({queueError}).</p> : null}
        <QueueList title="Ready for your review" issues={issues.filter((issue) => issue.review?.verdict === "valid")} />
        <QueueList title="Do not approve" issues={issues.filter((issue) => issue.review?.verdict !== "valid")} />
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
          <p className="muted">Outbound messaging is not on. This panel does not send text and does not wake the agent.</p>
        </aside>
      ) : null}
    </>
  );
}
