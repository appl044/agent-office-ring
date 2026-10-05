"use client";

import { useMemo, useState } from "react";
import { Glyph } from "./Glyph";
import { STATUS } from "../../lib/glyphs";
import { OrgMap } from "./OrgMap";
import { Campus } from "./Campus";
import { Stage } from "./Stage";
import { Court } from "./Court";

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

export function Board({ agents, issues, queueError, repoUrl, clawUrl }) {
  const [view, setView] = useState("grid");
  const [sortKey, setSortKey] = useState("seconds_since");
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(null);
  const [actionNote, setActionNote] = useState("");

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
          <button className={view === "grid" ? "quiet active" : "quiet"} type="button" onClick={() => setView("grid")}>Grid</button>
          <button className={view === "org" ? "quiet active" : "quiet"} type="button" onClick={() => setView("org")}>Org</button>
          <button className={view === "court" ? "quiet active" : "quiet"} type="button" onClick={() => setView("court")}>Court</button>
          <button className={view === "stage" ? "quiet active" : "quiet"} type="button" onClick={() => setView("stage")}>Stage</button>
          <button className={view === "office" ? "quiet active" : "quiet"} type="button" onClick={() => setView("office")}>Office</button>
          <button className={view === "campus" ? "quiet active" : "quiet"} type="button" onClick={() => setView("campus")}>Campus</button>
          <button className={view === "claw" ? "quiet active" : "quiet"} type="button" onClick={() => setView("claw")}>Claw3D</button>
          <form method="post" action="/api/logout"><button className="quiet" type="submit">Sign out</button></form>
        </div>
      </header>
      <main className="wrap">
        <p className="muted">The roster is read from your join issues. This page does not send that roster to Claw3D or any other office service. It does not contact Cursor and does not wake agents.</p>
        {view === "org" ? (
          <OrgMap
            agents={agents}
            waiting={issues.length}
            onSelect={(agent) => {
              setSelected(agent);
              setActionNote("");
            }}
          />
        ) : view === "court" ? (
          <Court
            agents={agents}
            onSelect={(agent) => {
              setSelected(agent);
              setActionNote("");
            }}
          />
        ) : view === "stage" ? (
          <Stage
            agents={agents}
            onSelect={(agent) => {
              setSelected(agent);
              setActionNote("");
            }}
          />
        ) : view === "campus" ? (
          <Campus
            agents={agents}
            onSelect={(agent) => {
              setSelected(agent);
              setActionNote("");
            }}
          />
        ) : view === "claw" ? (
          <section className="claw-pane">
            <p className="muted">This is the Claw3D service on this server. It reads the ring names from a file on this machine. Nothing is sent to claw3d.ai. The open seating is the Court tab.</p>
            <iframe className="claw-frame" title="Claw3D office" src={clawUrl} />
          </section>
        ) : view === "grid" ? (
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
                <tr className="clickable" key={agent.agent_id} onClick={() => { setSelected(agent); setActionNote(""); }}>
                  <td>{agent.display_name}{agent.in_ring ? <div className="muted">In the ring</div> : <div className="muted">Not in the ring</div>}</td>
                  <td><span className="status"><Glyph status={agent.status} />{STATUS[agent.status] || agent.status}</span></td>
                  <td>{agent.seconds_since}</td>
                  <td>{agent.last_active}</td>
                  <td><a href={agent.primary_objective_url} onClick={(event) => event.stopPropagation()}>definition</a></td>
                  <td>{agent.department}</td>
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
                        <button className="person" type="button" key={agent.agent_id} onClick={() => { setSelected(agent); setActionNote(""); }}>
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
          <p>{selected.neighborhood || "Observed"} · {selected.department || "Observed"}</p>
          <p>Primary skill: {selected.secondary_category || "Not filed"}</p>
          <p>Current assignment: {selected.typical_task}</p>
          <p>Last recorded task: {selected.previous_task}</p>
          <div className="actions">
            <button className="quiet" type="button" onClick={() => setActionNote("Voice is not connected. Talk will open an avatar conversation in a later slice.")}>Talk</button>
            <button className="quiet" type="button" onClick={() => setActionNote("Messages are not carried on this dashboard yet.")}>Message</button>
            <button className="quiet" type="button" onClick={() => setActionNote("Assignments are not on yet. The current assignment is what they filed when they joined.")}>Assign</button>
            <a href={selected.primary_objective_url}>Inspect work</a>
          </div>
          {actionNote ? <p>{actionNote}</p> : null}
          <p className="muted">This panel does not send text and does not wake the agent.</p>
        </aside>
      ) : null}
    </>
  );
}
