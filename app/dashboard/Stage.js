"use client";

import { useMemo, useState } from "react";
import { Glyph } from "./Glyph";
import { STATUS } from "../../lib/glyphs";

const ROOMS = ["Red Team", "Architecture", "Engineering", "Presence", "Knowledge", "Research", "Operations", "Mission Control", "Observed"];

const ROOM_CLASS = {
  "Red Team": "room-red",
  Architecture: "room-arch",
  Engineering: "room-build",
  Presence: "room-voice",
  Knowledge: "room-library",
  Research: "room-lab",
  Operations: "room-desk",
  "Mission Control": "room-control",
  Observed: "room-quiet",
};

function ageLabel(seconds) {
  if (seconds == null) return "no time";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function Figure() {
  return (
    <svg className="figure" viewBox="0 0 64 80" aria-hidden="true">
      <ellipse className="shade" cx="32" cy="74" rx="14" ry="3" />
      <rect className="arm left" x="12" y="40" width="8" height="16" rx="3" />
      <rect className="arm right" x="44" y="40" width="8" height="16" rx="3" />
      <rect className="torso" x="22" y="36" width="20" height="26" rx="6" />
      <circle className="head" cx="32" cy="20" r="11" />
    </svg>
  );
}

export function Stage({ agents, onSelect }) {
  const ranked = useMemo(() => {
    return [...agents].sort((a, b) => (a.seconds_since ?? 1e12) - (b.seconds_since ?? 1e12));
  }, [agents]);
  const liveliest = ranked.find((agent) => agent.neighborhood)?.neighborhood || "Engineering";
  const [room, setRoom] = useState(liveliest);
  const people = ranked.filter((agent) => (agent.neighborhood || "Observed") === room);
  const liveCount = people.filter((agent) => agent.status === "working").length;
  const recentStrip = ranked.slice(0, 12);

  return (
    <section className="stage">
      <p className="muted">Working and Idle come from the same check-in clock as the grid and the court.</p>
      <div className="stage-strip" aria-label="Most recent check-ins">
        {recentStrip.map((agent) => (
          <button key={agent.agent_id} type="button" className={`strip-person ${agent.status === "working" ? "live" : "quiet"}`} onClick={() => onSelect(agent)}>
            <Figure />
            <span>{agent.display_name}</span>
            <span className="muted">{ageLabel(agent.seconds_since)}</span>
          </button>
        ))}
      </div>
      <div className="org-chips">
        {ROOMS.filter((name) => agents.some((agent) => (agent.neighborhood || "Observed") === name)).map((name) => (
          <button key={name} className={room === name ? "quiet active" : "quiet"} type="button" onClick={() => setRoom(name)}>{name}</button>
        ))}
      </div>
      <section className={`stage-room ${ROOM_CLASS[room] || "room-quiet"}`}>
        <header>
          <h2>{room}</h2>
          <p className="muted">{people.length} here · {liveCount} working</p>
        </header>
        <div className="desks">
          {people.map((agent) => {
            const heat = agent.status === "working" ? "live" : "quiet";
            return (
              <button key={agent.agent_id} type="button" className={`desk ${heat} ${heat === "live" ? "moving" : ""}`} onClick={() => onSelect(agent)}>
                <Figure />
                <strong>{agent.display_name}</strong>
                <span>{agent.subgroup || agent.secondary_category || agent.department}</span>
                <span className="status"><Glyph status={agent.status} />{STATUS[agent.status] || agent.status} · {ageLabel(agent.seconds_since)}</span>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}
