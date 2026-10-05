export function Glyph({ status }) {
  const label = status;
  if (status === "sleeping") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" aria-label={label}>
        <text x="2" y="24" fontSize="16" fill="#9ad">Z</text>
        <text x="14" y="16" fontSize="11" fill="#b9d4ff">z</text>
        <text x="22" y="10" fontSize="8" fill="#d5e4ff">z</text>
      </svg>
    );
  }
  if (status === "working") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" aria-label={label}>
        <rect x="4" y="16" width="24" height="8" rx="2" fill="none" stroke="#9ad" />
        <circle className="working-keys" cx="10" cy="20" r="1.4" fill="#9ad" />
        <circle className="working-keys" cx="16" cy="20" r="1.4" fill="#9ad" />
        <circle className="working-keys" cx="22" cy="20" r="1.4" fill="#9ad" />
      </svg>
    );
  }
  if (status === "thinking") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" aria-label={label}>
        <circle cx="12" cy="18" r="6" fill="none" stroke="#e6c07b" />
        <text x="18" y="14" fontSize="12" fill="#e6c07b">?</text>
      </svg>
    );
  }
  if (status === "searching") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" aria-label={label}>
        <path d="M6 24 L18 8" stroke="#7dcea0" fill="none" />
        <path d="M18 8 C26 8 28 16 24 18" stroke="#7dcea0" fill="none" />
        <rect x="22" y="18" width="5" height="4" fill="#7dcea0" />
      </svg>
    );
  }
  if (status === "talking") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" aria-label={label}>
        <path d="M10 8 h6 v10 h-6 z" fill="none" stroke="#8eb6ff" />
        <path d="M16 12 h6 v8 h-4" fill="none" stroke="#8eb6ff" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-label={label}>
      <rect x="6" y="6" width="20" height="20" fill="none" stroke="#f0a3a3" />
      <path d="M8 24 L24 8" stroke="#f0a3a3" />
    </svg>
  );
}
