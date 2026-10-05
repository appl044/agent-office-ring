"use client";

import { Glyph } from "./Glyph";
import { STATUS } from "../../lib/glyphs";

const ORDER = ["Red Team", "Architecture", "Engineering", "Presence", "Knowledge", "Research", "Operations", "Mission Control", "Observed"];

export function Campus({ agents, onSelect }) {
  const groups = ORDER
    .map((name) => ({
      name,
      people: agents.filter((agent) => (agent.neighborhood || "Observed") === name),
    }))
    .filter((group) => group.people.length > 0);

  return (
    <section className="campus">
      <p className="muted">Rooms on this page use the people already loaded here. This tab does not open Claw3D, and it does not send the roster to another service.</p>
      <div className="campus-floor">
        {groups.map((group) => (
          <section className="pod" key={group.name}>
            <h2>{group.name}</h2>
            <p className="muted">{group.people.length} {group.people.length === 1 ? "person" : "people"}</p>
            {group.people.map((agent) => (
              <button className="person" type="button" key={agent.agent_id} onClick={() => onSelect(agent)}>
                <Glyph status={agent.status} />
                <span>
                  {agent.display_name}
                  <br />
                  <span className="muted">{STATUS[agent.status] || agent.status} · {agent.secondary_category || agent.department}</span>
                </span>
              </button>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
