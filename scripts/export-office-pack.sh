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
gh issue view "$ISSUE" --repo "$REPO" --json number,title,url,body,comments > "$DIR/issue.json"
{
  echo "# Thread export for ${AGENT_ID}"
  echo
  echo "Issue ${ISSUE}: https://github.com/${REPO}/issues/${ISSUE}"
  echo
  echo "## Body"
  echo
  jq -r .body "$DIR/issue.json"
  echo
  echo "## Comments"
  echo
  jq -r '.comments[] | "### \(.author.login) \(.createdAt)\n\n\(.body)\n"' "$DIR/issue.json"
} > "$DIR/THREAD.md"
cp "$ROOT/docs/packs/OFFICE.md" "$DIR/OFFICE.md"
if [ -f "$ROOT/docs/agents/${AGENT_ID}.md" ]; then
  cp "$ROOT/docs/agents/${AGENT_ID}.md" "$DIR/agent.md"
fi
echo "WROTE $DIR/THREAD.md ISSUE=${ISSUE}"
