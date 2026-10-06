"use client";

import { useState } from "react";
import { STATUS } from "../../lib/glyphs";

const FLOORS = [
  { id: "board", level: 8, name: "Board", blurb: "Mission Control resides around the table. This is where direction happens." },
  { id: "red", level: 7, name: "Red Team", blurb: "Four rooms. Defense, privacy, audit, and governance each have their own door." },
  { id: "architecture", level: 6, name: "Architecture", blurb: "Studios for the work, and a meeting room where review happens." },
  { id: "presence", level: 5, name: "Presence", blurb: "Video rooms are where calls happen. The other desks are where people reside." },
  { id: "research", level: 4, name: "Research", blurb: "Labs. The work happens at the benches." },
  { id: "knowledge", level: 3, name: "Knowledge", blurb: "The library. People reside in the stacks." },
  { id: "engineering", level: 2, name: "Engineering", blurb: "Two wings off the boulevard. This is where the build resides." },
  { id: "lobby", level: 1, name: "Lobby", blurb: "Arrival and gathering. Coffee, juice, the plaza, and the front desk." },
];

const RED_ROOMS = ["Defense", "Privacy", "Audit", "Governance"];

function byRecent(list) {
  return [...list].sort((a, b) => (a.seconds_since ?? 1e12) - (b.seconds_since ?? 1e12));
}

function ringOf(agents) {
  return agents.filter((agent) => agent.in_ring && agent.neighborhood && agent.neighborhood !== "Observed");
}

function homeOf(agent) {
  if (agent.neighborhood === "Mission Control") return "board";
  if (agent.neighborhood === "Red Team") return "red";
  if (agent.neighborhood === "Architecture") return "architecture";
  if (agent.neighborhood === "Presence") return "presence";
  if (agent.neighborhood === "Research") return "research";
  if (agent.neighborhood === "Knowledge") return "knowledge";
  if (agent.neighborhood === "Engineering") return "engineering";
  return "lobby";
}

function splitResidence(people) {
  const working = byRecent(people.filter((agent) => agent.status === "working"));
  const walkerCount = working.length > 2 ? 2 : working.length > 1 ? 1 : 0;
  return {
    walkers: working.slice(0, walkerCount),
    residing: working.slice(walkerCount),
  };
}

function layOut(agents) {
  const ring = ringOf(agents);
  const idle = byRecent(ring.filter((agent) => agent.status !== "working" && agent.neighborhood !== "Operations"));
  const homes = {};
  for (const floor of FLOORS) homes[floor.id] = [];
  for (const agent of ring) {
    if (agent.status !== "working") continue;
    if (agent.neighborhood === "Operations") continue;
    homes[homeOf(agent)].push(agent);
  }
  const floors = {};
  for (const floor of FLOORS) {
    if (floor.id === "lobby") continue;
    floors[floor.id] = splitResidence(homes[floor.id]);
  }
  return {
    floors,
    lobby: {
      desk: byRecent(ring.filter((agent) => agent.neighborhood === "Operations")),
      coffee: idle.slice(0, 5),
      juice: idle.slice(5, 10),
      plaza: idle.slice(10),
    },
  };
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

function Resident({ agent, onSelect, activity }) {
  return (
    <button type="button" className={agent.status === "working" ? "hq-person working" : "hq-person"} onClick={() => onSelect(agent)}>
      <Figure />
      <strong>{agent.display_name}</strong>
      <span>{activity}</span>
      <span className="hq-quiet">{agent.subgroup || STATUS[agent.status] || agent.status}</span>
    </button>
  );
}

function SeatGrid({ people, onSelect, activityFor }) {
  if (!people.length) return <p className="hq-quiet">Open</p>;
  return (
    <div className="hq-seats">
      {people.map((agent) => (
        <Resident key={agent.agent_id} agent={agent} onSelect={onSelect} activity={activityFor(agent)} />
      ))}
    </div>
  );
}

function Boulevard({ walkers, onSelect }) {
  return (
    <div className="hq-boulevard" aria-label="Boulevard">
      <span className="hq-boulevard-label">Boulevard</span>
      {walkers.length === 0 ? <span className="hq-quiet">Walkway clear</span> : null}
      {walkers.map((agent, index) => (
        <button
          key={agent.agent_id}
          type="button"
          className={index === 0 ? "hq-walker fast" : "hq-walker"}
          style={{ animationDelay: `${index * -1.4}s` }}
          onClick={() => onSelect(agent)}
        >
          <Figure />
          <span>
            <strong>{agent.display_name}</strong>
            <em>{index === 0 ? "Fast walk" : "Walking"}</em>
          </span>
        </button>
      ))}
    </div>
  );
}

function Room({ title, note, children, wide }) {
  return (
    <section className={wide ? "hq-room wide" : "hq-room"}>
      <header>
        <strong>{title}</strong>
        {note ? <span>{note}</span> : null}
      </header>
      {children}
    </section>
  );
}

function WorkFloor({ title, blurb, plan, onSelect, children }) {
  return (
    <div className="hq-plate">
      <header className="hq-plate-head">
        <div>
          <p className="hq-kicker">Floor {title.level}</p>
          <h2>{title.name}</h2>
        </div>
        <p>{blurb}</p>
      </header>
      <Boulevard walkers={plan.walkers} onSelect={onSelect} />
      {children}
    </div>
  );
}

export function Court({ agents, onSelect }) {
  const layout = layOut(agents);
  const [floorId, setFloorId] = useState("lobby");
  const index = Math.max(0, FLOORS.findIndex((floor) => floor.id === floorId));
  const floor = FLOORS[index];
  const task = (agent) => agent.typical_task || "At a desk";

  function step(direction) {
    const next = (index + direction + FLOORS.length) % FLOORS.length;
    setFloorId(FLOORS[next].id);
  }

  function countFor(id) {
    if (id === "lobby") {
      const lobby = layout.lobby;
      return lobby.desk.length + lobby.coffee.length + lobby.juice.length + lobby.plaza.length;
    }
    const plan = layout.floors[id];
    return plan.walkers.length + plan.residing.length;
  }

  let body = null;
  if (floor.id === "lobby") {
    const lobby = layout.lobby;
    body = (
      <div className="hq-plate">
        <header className="hq-plate-head">
          <div>
            <p className="hq-kicker">Floor 1</p>
            <h2>Lobby</h2>
          </div>
          <p>{floor.blurb}</p>
        </header>
        <Boulevard walkers={[]} onSelect={onSelect} />
        <div className="hq-rooms">
          <Room title="Front desk" note="Operations reside here">
            <SeatGrid people={lobby.desk} onSelect={onSelect} activityFor={task} />
          </Room>
          <Room title="Coffee" note="Gathering">
            <SeatGrid people={lobby.coffee} onSelect={onSelect} activityFor={() => "At the coffee bar"} />
          </Room>
          <Room title="Juice bar" note="Gathering">
            <SeatGrid people={lobby.juice} onSelect={onSelect} activityFor={() => "At the juice bar"} />
          </Room>
          <Room title="Plaza" note="Open gathering" wide>
            <SeatGrid people={lobby.plaza} onSelect={onSelect} activityFor={() => "In the plaza"} />
          </Room>
        </div>
      </div>
    );
  } else if (floor.id === "engineering") {
    const plan = layout.floors.engineering;
    const mid = Math.ceil(plan.residing.length / 2);
    body = (
      <WorkFloor title={floor} blurb={floor.blurb} plan={plan} onSelect={onSelect}>
        <div className="hq-rooms">
          <Room title="West wing" note="Residing">
            <SeatGrid people={plan.residing.slice(0, mid)} onSelect={onSelect} activityFor={task} />
          </Room>
          <Room title="East wing" note="Residing">
            <SeatGrid people={plan.residing.slice(mid)} onSelect={onSelect} activityFor={task} />
          </Room>
        </div>
      </WorkFloor>
    );
  } else if (floor.id === "knowledge") {
    const plan = layout.floors.knowledge;
    const mid = Math.ceil(plan.residing.length / 2);
    body = (
      <WorkFloor title={floor} blurb={floor.blurb} plan={plan} onSelect={onSelect}>
        <div className="hq-rooms">
          <Room title="North stacks" note="Residing">
            <SeatGrid people={plan.residing.slice(0, mid)} onSelect={onSelect} activityFor={task} />
          </Room>
          <Room title="South stacks" note="Residing">
            <SeatGrid people={plan.residing.slice(mid)} onSelect={onSelect} activityFor={task} />
          </Room>
        </div>
      </WorkFloor>
    );
  } else if (floor.id === "research") {
    const plan = layout.floors.research;
    body = (
      <WorkFloor title={floor} blurb={floor.blurb} plan={plan} onSelect={onSelect}>
        <Room title="Lab benches" note="Where the work happens" wide>
          <SeatGrid people={plan.residing} onSelect={onSelect} activityFor={task} />
        </Room>
      </WorkFloor>
    );
  } else if (floor.id === "presence") {
    const plan = layout.floors.presence;
    const video = [plan.residing.slice(0, 2), plan.residing.slice(2, 4), plan.residing.slice(4, 6)];
    const desks = plan.residing.slice(6);
    body = (
      <WorkFloor title={floor} blurb={floor.blurb} plan={plan} onSelect={onSelect}>
        <div className="hq-rooms">
          {video.map((people, roomIndex) => (
            <Room key={roomIndex} title={`Video ${roomIndex + 1}`} note="Happening">
              <div className="hq-screen" />
              <SeatGrid people={people} onSelect={onSelect} activityFor={() => "In a video room"} />
            </Room>
          ))}
          <Room title="Studios" note="Residing">
            <SeatGrid people={desks} onSelect={onSelect} activityFor={task} />
          </Room>
        </div>
      </WorkFloor>
    );
  } else if (floor.id === "architecture") {
    const plan = layout.floors.architecture;
    const meeting = plan.residing.filter((agent) => agent.subgroup === "Review");
    let room = meeting;
    let studios = plan.residing.filter((agent) => agent.subgroup !== "Review");
    if (!room.length) {
      room = studios.slice(0, 3);
      studios = studios.slice(3);
    }
    body = (
      <WorkFloor title={floor} blurb={floor.blurb} plan={plan} onSelect={onSelect}>
        <div className="hq-rooms">
          <Room title="Meeting room" note="Happening">
            <SeatGrid people={room} onSelect={onSelect} activityFor={() => "In a meeting"} />
          </Room>
          <Room title="Studios" note="Residing">
            <SeatGrid people={studios} onSelect={onSelect} activityFor={(agent) => agent.subgroup || task(agent)} />
          </Room>
        </div>
      </WorkFloor>
    );
  } else if (floor.id === "red") {
    const plan = layout.floors.red;
    body = (
      <WorkFloor title={floor} blurb={floor.blurb} plan={plan} onSelect={onSelect}>
        <div className="hq-rooms">
          {RED_ROOMS.map((name) => (
            <Room key={name} title={name} note="Residing">
              <SeatGrid people={plan.residing.filter((agent) => agent.subgroup === name)} onSelect={onSelect} activityFor={task} />
            </Room>
          ))}
        </div>
      </WorkFloor>
    );
  } else {
    const plan = layout.floors.board;
    const mid = Math.ceil(plan.residing.length / 2);
    body = (
      <WorkFloor title={floor} blurb={floor.blurb} plan={plan} onSelect={onSelect}>
        <div className="hq-board">
          <SeatGrid people={plan.residing.slice(0, mid)} onSelect={onSelect} activityFor={() => "Around the board table"} />
          <div className="hq-table">Board table</div>
          <SeatGrid people={plan.residing.slice(mid)} onSelect={onSelect} activityFor={() => "Around the board table"} />
        </div>
      </WorkFloor>
    );
  }

  return (
    <section className="hq">
      <aside className="hq-directory">
        <p className="hq-kicker light">Building directory</p>
        <div className="hq-nav">
          <button type="button" onClick={() => step(-1)}>Prev</button>
          <button type="button" onClick={() => step(1)}>Next</button>
        </div>
        {FLOORS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === floor.id ? "hq-floor-btn active" : "hq-floor-btn"}
            onClick={() => setFloorId(item.id)}
          >
            <span>{item.level}</span>
            <strong>{item.name}</strong>
            <em>{countFor(item.id)}</em>
          </button>
        ))}
        <p className="hq-legend">Fast walk is the newest person on that floor’s boulevard. Walking is the next. Everyone else on a work floor is residing. Idle people gather in the lobby.</p>
      </aside>
      <div className="hq-stage">{body}</div>
    </section>
  );
}
