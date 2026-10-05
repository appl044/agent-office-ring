"use client";

import { useMemo, useState } from "react";
import { Glyph } from "./Glyph";
import { STATUS } from "../../lib/glyphs";

const NEIGHBORHOODS = ["Red Team", "Architecture", "Engineering", "Presence", "Knowledge", "Research", "Operations", "Mission Control", "Observed"];

export function OrgMap({ agents, waiting, onSelect }) {
  const [chip, setChip] = useState("All");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const inRing = agents.filter((agent) => agent.in_ring).length;

  const visible = useMemo(() => {
    return agents.filter((agent) => {
      if (chip !== "All" && (agent.neighborhood || "Observed") !== chip) return false;
      if (!needle) return true;
      const haystack = [agent.display_name, agent.neighborhood, agent.department, agent.secondary_category, agent.typical_task, agent.previous_task]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [agents, chip, needle]);

  const groups = NEIGHBORHOODS
    .map((name) => ({ name, people: visible.filter((agent) => (agent.neighborhood || "Observed") === name) }))
    .filter((group) => group.people.length > 0);

  return (
    <section className="org">
      <p className="org-summary">{inRing} in the ring · {waiting} waiting on you</p>
      <input
        className="org-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search a skill, task, or name"
        aria-label="Search the organization"
      />
      <div className="org-chips">
        {["All", ...NEIGHBORHOODS.filter((name) => agents.some((agent) => (agent.neighborhood || "Observed") === name))].map((name) => (
          <button key={name} className={chip === name ? "quiet active" : "quiet"} type="button" onClick={() => setChip(name)}>{name}</button>
        ))}
      </div>
      {groups.length === 0 ? <p className="muted">No one matches.</p> : groups.map((group) => {
        const subgroups = [...new Set(group.people.map((agent) => agent.subgroup).filter(Boolean))];
        const blocks = subgroups.length
          ? subgroups.map((name) => ({ name, people: group.people.filter((agent) => agent.subgroup === name) }))
          : [{ name: "", people: group.people }];
        return (
          <section key={group.name}>
            <h2>{group.name} · {group.people.length}</h2>
            {blocks.map((block) => (
              <div key={block.name || group.name}>
                {block.name ? <h3>{block.name} · {block.people.length}</h3> : null}
                <div className="org-grid">
                  {block.people.map((agent) => (
                    <button className="org-card" type="button" key={agent.agent_id} onClick={() => onSelect(agent)}>
                      <strong>{agent.display_name}</strong>
                      <span>{agent.secondary_category || agent.department}</span>
                      <span className="status"><Glyph status={agent.status} />{STATUS[agent.status] || agent.status}</span>
                      <span className="muted">{agent.typical_task}</span>
                      {agent.in_ring ? null : <span className="muted">Not in the ring</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </section>
  );
}
