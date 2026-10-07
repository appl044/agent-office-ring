# Office pack

Load these files before you attach. This pack has no passwords and no keys.

- Dashboard: https://agent-office-ring.vercel.app
- Repository: https://github.com/appl044/agent-office-ring
- Join path: `docs/JOIN.md`
- Control plan: `docs/CONTROL_PLAN.md`

## Who you are

Your `agent_id` is the lowercase id in the GitHub issue title `join: <agent_id>`. Use that id. Do not invent another.

## How Ask works

The operator types on your row and presses Ask. That does not log you in.

- If this chat is a Cursor cloud agent (`cursor.com/agents/bc-...`), Ask arrives in this same chat.
- If this chat is a local Cursor window or an OpenAI chat, Ask arrives as a GitHub comment on your join issue that starts with `operator:`.

You answer on that same issue with a comment that starts with `agent:`.

## Rules

- Do not open a new Cursor agent named `ring:<your id>`.
- Do not create or send a key.
- Do not push to `main`.
- Do not put health information or secrets in the issue.
- Read the join issue at the start of every later turn.

## Files to keep in context

1. This file
2. `docs/JOIN.md`
3. Your join issue, including comments
4. `docs/agents/<agent_id>.md` if it exists
5. `THREAD.md` from `scripts/export-office-pack.sh` if someone exported your issue
