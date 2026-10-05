"use client";

import { Glyph } from "./Glyph";

const WINGS = [
  { id: "Knowledge", area: "knowledge", side: "north", note: "Library, open to the court" },
  { id: "Research", area: "research", side: "north", note: "Lab, open to the court" },
  { id: "Red Team", area: "red", side: "west", note: "Defense, privacy, audit, governance" },
  { id: "Operations", area: "ops", side: "west", note: "Front desk, open to the court" },
  { id: "Architecture", area: "arch", side: "east", note: "Product, multi-agent, lab, client, review" },
  { id: "Presence", area: "presence", side: "east", note: "Voice and calls, open to the court" },
  { id: "Engineering", area: "build", side: "south", note: "Build floor, open to the court" },
  { id: "Mission Control", area: "mission", side: "south", note: "Dispatch, open to the court" },
];

function isWorking(seconds) {
  return seconds != null && seconds <= 3 * 60 * 60;
}

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

export function Court({ agents, onSelect }) {
  const seated = agents.filter((agent) => WINGS.some((wing) => wing.id === agent.neighborhood));
  const workingCount = seated.filter((agent) => isWorking(agent.seconds_since)).length;
  return (
    <section className="court-wrap">
      <p className="muted">Eight wings sit around an open middle. A check-in within three hours is shown as working.</p>
      <div className="court">
        {WINGS.map((wing) => {
          const people = agents
            .filter((agent) => (agent.neighborhood || "Observed") === wing.id)
            .sort((a, b) => (a.seconds_since ?? 1e12) - (b.seconds_since ?? 1e12));
          const working = people.filter((agent) => isWorking(agent.seconds_since)).length;
          return (
            <section key={wing.id} className={`wing wing-${wing.side} area-${wing.area}`}>
              <header>
                <strong>{wing.id}</strong>
                <span className="muted">{working} working · {people.length - working} idle</span>
              </header>
              <div className="wing-people">
                {people.map((agent) => {
                  const active = isWorking(agent.seconds_since);
                  return (
                    <button key={agent.agent_id} type="button" className={active ? "court-person working" : "court-person idle"} onClick={() => onSelect(agent)}>
                      <Figure />
                      <span>{agent.display_name}</span>
                      <span className="muted">{agent.subgroup || ageLabel(agent.seconds_since)}</span>
                      <span className="status">{active ? <Glyph status="working" /> : null}{active ? "Working" : "Idle"}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        <section className="court-middle">
          <strong>Open court</strong>
          <p>{workingCount} working</p>
          <p className="muted">{seated.length} seated around this floor</p>
        </section>
      </div>
    </section>
  );
}
