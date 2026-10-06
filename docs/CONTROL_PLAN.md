# Control plan, 6 Oct 2026

This is the current plan for talking to people on the dashboard. The API reference is `docs/CURSOR_CLOUD_COOKBOOK.md`. Older sentences in `docs/PLAN.md` that say the site does not contact Cursor, or that Ask creates `ring:{id}`, are out of date.

## What is true now

The live site is https://agent-office-ring.vercel.app. The roster is the 81 approved join issues. Cloud Orchestrator, Dashboard Manager, and Cloud Wake Proof are not on the page. They never joined.

The grid is the default view. Org, HQ, Stage, Office, Campus, and Claw3D stay. HQ seats each person on their home floor. Coffee and juice take at most four idle visitors each. Working is a check-in inside three hours.

Ask and Assign use the Cursor Cloud Agents API from the Next.js server. The key stays on the server. The browser never sees it.

The first Ask used to create a new cloud agent named `ring:{id}` on this repo. That produced empty threads. Atlas’s questions went to https://cursor.com/agents/bc-bd5f7cc6-08bb-4ea0-a946-c0c8c40dd6a6, not the chat they already had. Those two dummy agents are archived:

- `ring:atlas-librarian` — `bc-bd5f7cc6-08bb-4ea0-a946-c0c8c40dd6a6`
- `ring:cursor-cloud-wake-proof` — `bc-98f61052-c9a1-431f-b540-89e597be2126`

Comments on the join issue do not reach a local Cursor window. Issues 1, 2, 3, 4, and 9 have operator comments only. No `ring-link:` comment exists. Opening a person still says the original chat is not connected.

A local Cursor chat has no id this key can write to. A cloud chat on this account, with a `bc-` id, does.

## Decision

The original Cursor chat is the person. The dashboard does not create a second one.

| Need | Choice | Why |
| --- | --- | --- |
| Identity | `cursor-thread: bc-...` on that person’s join issue | Cursor is still the record. The join issue stores which existing chat to use. |
| Missing link | Do not send. Show that the original chat is not connected. | Creating `ring:{id}` was the failure. |
| Dummy name | Reject any linked agent named `ring:` or `dummy:` | Those threads are empty. |
| Ask | `mode: plan` on the linked `bc-` id | A reply in the original cloud chat. No file edits. |
| Assign | `mode: agent` on the same id | Work stays in that chat. New branch. No push to `main`. |
| Pull request | Off unless the operator checks the box | Same as before. |
| Progress | Poll the run | Serverless cannot hold SSE. |
| Stop | Cancel the current run on that id | Documented. Does not resume. |
| History and files | Runs, artifacts, and usage on that id | The panel shows the original chat, not a dummy. |
| GitHub comments as the mailbox | Not the path unless the five windows have no `bc-` id | A comment cannot wake a local chat. |
| Five first | Issues 9, 1, 2, 3, 4 | Atlas, Push-Pull Judge, Knowledge Muse Architect, Incident Researcher, Campaign Coach. |

## How a person gets connected

1. Paste one prompt into that person’s older Cursor window. Not into a `ring:` tab.
2. That window posts a comment on its own join issue. The comment starts with `ring-link:` and includes `cursor-thread: bc-...` or `cursor-thread: local`.
3. The dashboard reads that line. Ask, Assign, Stop, the latest reply, earlier runs, and files all use that `bc-` id.
4. `local` means that window cannot receive Ask. Do not invent a new agent to paper over it.

Do not send that paste to the other 76 until one of the five has a real `bc-` id and Ask on that row replies in the original chat.

## Next work, in order

1. Get `ring-link` comments from the five older windows.
2. Prove Ask, history, and the original-chat link on one of those five. Assign only if you want work on that same thread.
3. Show connection on the row: connected, waiting on a `bc-` id, or dummy rejected. Never link an archived `ring:` agent.
4. After one proof, use the same comment text for the rest of the ring. One prompt. The agent fills its own id.
5. Keep the archived `ring:` agents until the five original chats are proven. Archive is the mark. Delete them later.

## Held

- Do not start the whole ring from one button.
- Do not push to `main`.
- Do not put the API key in the browser or in git.
- Do not add a GitHub write token for issue mail unless the five windows have no `bc-` id.
- Do not copy Zoom recordings until the operator picks a path.
- Do not restart Wiki, Nginx, Perplexica, LibreChat, Neo4j, Postfix, the July dashboard, or start a second tunnel.
- Voice, Slack, Linear, completion webhooks, and a busy queue stay later.
