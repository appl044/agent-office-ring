export const STATUS = {
  sleeping: "Sleeping",
  working: "Working",
  thinking: "Thinking",
  searching: "Searching",
  talking: "Talking",
  blocked: "Blocked",
};

export function secondsSince(iso) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 1000));
}
