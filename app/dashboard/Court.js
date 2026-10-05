"use client";

import { Glyph } from "./Glyph";
import { STATUS } from "../../lib/glyphs";

const WINGS = [
  { id: "Knowledge", area: "knowledge", side: "north" },
  { id: "Research", area: "research", side: "north" },
  { id: "Red Team", area: "red", side: "west" },
  { id: "Operations", area: "ops", side: "west" },
  { id: "Architecture", area: "arch", side: "east" },
  { id: "Presence", area: "presence", side: "east" },
  { id: "Engineering", area: "build", side: "south" },
  { id: "Mission Control", area: "mission", side: "south" },
];

function ageLabel(seconds) {
  if (seconds == null) return "";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function Figure() {
  return (
    <svg className="figure" viewBox="0 0 64 80" aria-hidden="true">
      <rect className="arm left" x="12" y="40" width="8" height="16" rx="3" />
      <rect className="arm right" x="44" y="40" width="8" height="16" rx="3" />
      <rect className="torso" x="22" y="36" width="20" height="26" rx="6" />
      <circle className="head" cx="32" cy="20" r="11" />
    </svg>
  );
}

function baysFor(people) {
  const groups = new Map();
  for (const agent of people) {
    const label = agent.subgroup || "";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(agent);
  }
  return [...groups.entries()].map(([label, folks]) => ({ label, people: folks }));
}

function Person({ agent, onSelect }) {
  const active = agent.status === "working";
  return (
    <button type="button" className={active ? "court-person working" : "court-person idle"} onClick={() => onSelect(agent)}>
      <Figure />
      <strong>{agent.display_name}</strong>
      <span className="muted">{agent.subgroup || ageLabel(agent.seconds_since)}</span>
      {active ? <span className="task">{agent.typical_task}</span> : null}
      <span className="status"><Glyph status={agent.status} />{STATUS[agent.status] || agent.status}</span>
    </button>
  );
}

export function Court({ agents, onSelect }) {
  const seated = agents.filter((agent) => WINGS.some((wing) => wing.id === agent.neighborhood));
  const working = seated
    .filter((agent) => agent.status === "working")
    .sort((a, b) => (a.seconds_since ?? 1e12) - (b.seconds_since ?? 1e12));

  return (
    <section className="court-wrap">
      <p className="muted">Desks face the open middle. Working and Idle are the same check-in clock used on the grid.</p>
      <div className="court">
        {WINGS.map((wing) => {
          const people = seated
            .filter((agent) => agent.neighborhood === wing.id)
            .sort((a, b) => (a.seconds_since ?? 1e12) - (b.seconds_since ?? 1e12));
          const active = people.filter((agent) => agent.status === "working").length;
          const bays = baysFor(people);
          return (
            <section key={wing.id} className={`wing wing-${wing.side} area-${wing.area}`}>
              <header>
                <strong>{wing.id}</strong>
                <span className="muted">{active} working · {people.length - active} idle</span>
              </header>
              <div className="wing-bays">
                {bays.map((bay) => (
                  <div className="bay" key={bay.label || wing.id}>
                    {bay.label ? <h3>{bay.label}</h3> : null}
                    <div className="wing-people">
                      {bay.people.map((agent) => (
                        <Person key={agent.agent_id} agent={agent} onSelect={onSelect} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        <section className="court-middle">
          <strong>Open court</strong>
          <p>{working.length} working</p>
          <p className="muted">{seated.length} seated around this floor</p>
          <ul className="court-live">
            {working.slice(0, 8).map((agent) => (
              <li key={agent.agent_id}>
                <button type="button" onClick={() => onSelect(agent)}>
                  <span>{agent.display_name}</span>
                  <span className="muted">{agent.neighborhood}{agent.subgroup ? ` · ${agent.subgroup}` : ""} · {ageLabel(agent.seconds_since)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
