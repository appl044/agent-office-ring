export const STATUS = {
  sleeping: "Sleeping",
  working: "Working",
  idle: "Idle",
  thinking: "Thinking",
  searching: "Searching",
  talking: "Talking",
  blocked: "Blocked",
};

export const WORKING_WINDOW_SECONDS = 3 * 60 * 60;

export function secondsSince(iso) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 1000));
}

export function presenceStatus(agent) {
  if (!agent || agent.in_ring === false) return "sleeping";
  const seconds = agent.seconds_since != null ? agent.seconds_since : secondsSince(agent.last_active);
  if (seconds == null) return "idle";
  return seconds <= WORKING_WINDOW_SECONDS ? "working" : "idle";
}
