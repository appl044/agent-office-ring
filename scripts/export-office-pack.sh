#!/bin/bash
set -euo pipefail
AGENT_ID="${1:-}"
if [ -z "$AGENT_ID" ]; then
  echo "usage: scripts/export-office-pack.sh <agent_id>" >&2
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="appl044/agent-office-ring"
COUNT=$(gh issue list --repo "$REPO" --state all --limit 20 --search "join: ${AGENT_ID} in:title" --json number,title --jq "[.[] | select(.title==\"join: ${AGENT_ID}\")] | length")
if [ "$COUNT" != "1" ]; then
  echo "STOP. Expected one join issue for ${AGENT_ID}, found ${COUNT}." >&2
  exit 1
fi
ISSUE=$(gh issue list --repo "$REPO" --state all --limit 20 --search "join: ${AGENT_ID} in:title" --json number,title --jq ".[] | select(.title==\"join: ${AGENT_ID}\") | .number")
DIR="$ROOT/docs/packs/${AGENT_ID}"
mkdir -p "$DIR"
gh issue view "$ISSUE" --repo "$REPO" --json number,title,url,body,comments --jq '{number,title,url,body,comments:[.comments[]|{login:.author.login,createdAt,body}]}' > "$DIR/issue.json"
python3 - "$DIR/issue.json" "$DIR/THREAD.md" "$AGENT_ID" "$ISSUE" "$REPO" <<'PY'
import json, sys
src, dest, agent_id, issue, repo = sys.argv[1:]
data = json.load(open(src, encoding="utf-8"))
lines = [
    f"# Thread export for {agent_id}",
    "",
    f"Issue {issue}: https://github.com/{repo}/issues/{issue}",
    "",
    "## Body",
    "",
    data.get("body") or "",
    "",
    "## Comments",
    "",
]
for comment in data.get("comments") or []:
    lines.append(f"### {comment.get('login')} {comment.get('createdAt')}")
    lines.append("")
    lines.append(comment.get("body") or "")
    lines.append("")
open(dest, "w", encoding="utf-8").write("\n".join(lines))
PY
cp "$ROOT/docs/packs/OFFICE.md" "$DIR/OFFICE.md"
if [ -f "$ROOT/docs/agents/${AGENT_ID}.md" ]; then
  cp "$ROOT/docs/agents/${AGENT_ID}.md" "$DIR/agent.md"
fi
echo "WROTE $DIR/THREAD.md ISSUE=${ISSUE}"
