"use client";

import { Glyph } from "./Glyph";
import { STATUS } from "../../lib/glyphs";

const RED_BAYS = ["Defense", "Privacy", "Audit", "Governance"];

function byRecent(list) {
  return [...list].sort((a, b) => (a.seconds_since ?? 1e12) - (b.seconds_since ?? 1e12));
}

function layOutFloor(agents) {
  const ring = agents.filter((agent) => agent.in_ring && agent.neighborhood && agent.neighborhood !== "Observed");
  const idle = byRecent(ring.filter((agent) => agent.status === "idle"));
  const coffee = idle.slice(0, 4);
  const juice = idle.slice(4, 8);
  const gather = idle.slice(8, 12);
  const parked = new Set([...coffee, ...juice, ...gather].map((agent) => agent.agent_id));
  const wing = (name) => byRecent(ring.filter((agent) => agent.neighborhood === name && !parked.has(agent.agent_id)));

  const pullNewest = (name) => {
    const people = wing(name);
    const newest = people.find((agent) => agent.status === "working");
    return { person: newest || null, rest: newest ? people.filter((agent) => agent.agent_id !== newest.agent_id) : people };
  };

  const engineering = pullNewest("Engineering");
  const knowledge = pullNewest("Knowledge");
  const research = pullNewest("Research");
  const red = pullNewest("Red Team");
  const standup = [engineering.person, knowledge.person, research.person, red.person].filter(Boolean);

  const presence = wing("Presence");
  const videos = [presence.slice(0, 2), presence.slice(2, 4), presence.slice(4, 6)];
  const presenceDesks = presence.slice(6);

  const architecture = wing("Architecture");
  const reviewers = architecture.filter((agent) => agent.subgroup === "Review");
  let meeting = reviewers;
  let studios = architecture.filter((agent) => agent.subgroup !== "Review");
  if (meeting.length === 0) {
    meeting = studios.slice(0, 3);
    studios = studios.slice(3);
  }

  const redPeople = red.rest;
  const redBays = RED_BAYS.map((label) => ({
    label,
    people: redPeople.filter((agent) => agent.subgroup === label),
  }));

  return {
    library: knowledge.rest,
    lab: research.rest,
    redBays,
    operations: wing("Operations"),
    coffee,
    juice,
    gather,
    standup,
    meeting,
    studios,
    videos,
    presenceDesks,
    build: engineering.rest,
    board: wing("Mission Control"),
  };
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

function Person({ agent, onSelect, activity }) {
  const active = agent.status === "working";
  return (
    <button type="button" className={active ? "court-person working" : "court-person idle"} onClick={() => onSelect(agent)}>
      <Figure />
      <strong>{agent.display_name}</strong>
      <span className="muted">{agent.neighborhood}{agent.subgroup ? ` · ${agent.subgroup}` : ""}</span>
      <span className="task">{activity}</span>
      <span className="status"><Glyph status={agent.status} />{STATUS[agent.status] || agent.status} · {ageLabel(agent.seconds_since)}</span>
    </button>
  );
}

function DeskGrid({ people, onSelect, activityFor, aisleEvery = 0 }) {
  if (!people.length) return <p className="muted empty-room">Open</p>;
  const rows = [];
  const size = aisleEvery > 0 ? aisleEvery : people.length;
  for (let index = 0; index < people.length; index += size) rows.push(people.slice(index, index + size));
  return (
    <div className="desk-rows">
      {rows.map((row, index) => (
        <div key={row[0].agent_id}>
          <div className="room-desks">
            {row.map((agent) => (
              <Person key={agent.agent_id} agent={agent} onSelect={onSelect} activity={activityFor(agent)} />
            ))}
          </div>
          {aisleEvery > 0 && index < rows.length - 1 ? <div className="aisle">Aisle</div> : null}
        </div>
      ))}
    </div>
  );
}

function Room({ title, note, className, children }) {
  return (
    <section className={`plan-room ${className || ""}`}>
      <header>
        <strong>{title}</strong>
        {note ? <span className="muted">{note}</span> : null}
      </header>
      {children}
    </section>
  );
}

function Walk({ kind, label }) {
  return <div className={kind === "v" ? "walk walk-v" : "walk walk-h"}>{label}</div>;
}

export function Court({ agents, onSelect }) {
  const floor = layOutFloor(agents);
  const task = (agent) => agent.typical_task || "At a desk";

  return (
    <section className="court-wrap">
      <p className="muted">A wide floor from the live roster. Work rooms keep people at their own desks. Idle people are at the coffee bar, the juice bar, or the plaza. Walkways stay open.</p>
      <div className="plan-scroll">
        <div className="floor-plan">
          <div className="plan-row">
            <Room className="room-library" title="Library" note={`${floor.library.length} at desks`}>
              <DeskGrid people={floor.library} onSelect={onSelect} activityFor={task} aisleEvery={4} />
            </Room>
            <Walk kind="v" label="North walk" />
            <Room className="room-lab" title="Lab" note={`${floor.lab.length} at benches`}>
              <DeskGrid people={floor.lab} onSelect={onSelect} activityFor={task} aisleEvery={4} />
            </Room>
          </div>

          <Walk kind="h" label="East–west walkway" />

          <div className="plan-row plan-middle">
            <div className="plan-stack">
              <Room className="room-red" title="Red Team" note="Four rooms">
                <div className="bay-grid">
                  {floor.redBays.map((bay) => (
                    <div className="bay" key={bay.label}>
                      <h3>{bay.label}</h3>
                      <DeskGrid people={bay.people} onSelect={onSelect} activityFor={task} />
                    </div>
                  ))}
                </div>
              </Room>
              <Room className="room-ops" title="Front desk" note="Operations">
                <DeskGrid people={floor.operations} onSelect={onSelect} activityFor={task} />
              </Room>
            </div>

            <Walk kind="v" label="West walk" />

            <div className="plan-stack plaza">
              <div className="plan-row amenity-row">
                <Room className="room-coffee" title="Coffee bar" note="Idle">
                  <div className="counter" />
                  <DeskGrid people={floor.coffee} onSelect={onSelect} activityFor={() => "At the coffee bar"} />
                </Room>
                <Room className="room-juice" title="Juice bar" note="Idle">
                  <div className="counter counter-juice" />
                  <DeskGrid people={floor.juice} onSelect={onSelect} activityFor={() => "At the juice bar"} />
                </Room>
              </div>
              <Room className="room-plaza" title="Plaza" note="Gathering, kept open">
                <DeskGrid people={floor.gather} onSelect={onSelect} activityFor={() => "In the plaza"} />
              </Room>
              <div className="plan-row amenity-row">
                <Room className="room-meet" title="Meeting room" note="Architecture">
                  <div className="table" />
                  <DeskGrid people={floor.meeting} onSelect={onSelect} activityFor={() => "In a meeting"} />
                </Room>
                <Room className="room-meet" title="Cross-team room" note="Newest from four wings">
                  <div className="table" />
                  <DeskGrid people={floor.standup} onSelect={onSelect} activityFor={() => "In a meeting"} />
                </Room>
              </div>
            </div>

            <Walk kind="v" label="East walk" />

            <div className="plan-stack">
              <Room className="room-arch" title="Architecture studios" note="By subgroup">
                <DeskGrid people={floor.studios} onSelect={onSelect} activityFor={(agent) => agent.subgroup || task(agent)} />
              </Room>
              <Room className="room-video-bank" title="Video rooms" note="Presence">
                <div className="video-row">
                  {floor.videos.map((people, index) => (
                    <div className="video-room" key={index}>
                      <h3>Video {index + 1}</h3>
                      <div className="screen" />
                      <DeskGrid people={people} onSelect={onSelect} activityFor={() => "In a video room"} />
                      {people.length < 2 ? <p className="muted empty-room">Open seat</p> : null}
                    </div>
                  ))}
                </div>
              </Room>
              <Room className="room-voice" title="Presence desks" note="Beside the video rooms">
                <DeskGrid people={floor.presenceDesks} onSelect={onSelect} activityFor={task} />
              </Room>
            </div>
          </div>

          <Walk kind="h" label="South walkway" />

          <div className="plan-row plan-south">
            <Room className="room-build" title="Build floor" note={`${floor.build.length} at desks, aisles between rows`}>
              <DeskGrid people={floor.build} onSelect={onSelect} activityFor={task} aisleEvery={6} />
            </Room>
            <Walk kind="v" label="Board walk" />
            <Room className="room-board" title="Board room" note="Mission Control">
              <div className="board-layout">
                <DeskGrid people={floor.board.slice(0, 3)} onSelect={onSelect} activityFor={() => "Around the board table"} />
                <div className="board-table">Board table</div>
                <DeskGrid people={floor.board.slice(3)} onSelect={onSelect} activityFor={() => "Around the board table"} />
              </div>
            </Room>
          </div>
        </div>
      </div>
    </section>
  );
}
