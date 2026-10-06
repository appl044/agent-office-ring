# Control plan, 5 Oct 2026

This is the plan for the person panel. The reference cookbook is `docs/CURSOR_CLOUD_COOKBOOK.md`. The panel already starts a Cursor cloud run. This update makes that panel readable and uses more of the documented API.

## What the cookbook changes

The v1 API keeps one durable agent and starts a new run for every follow-up. The panel already does that: the first send creates `ring:{agent id}`, and the next send calls `POST /v1/agents/{id}/runs`.

An idle agent is not a success. The panel now leads with the latest run status, not the agent status alone.

A follow-up while a run is creating or running returns `409 agent_busy`. The panel shows that in plain language and offers Stop, which cancels the run. Cancellation ends that run. The next Ask or Assign starts a new run on the same agent.

`git` on a run is the agent's current branches and pull requests, not a private record of that one run. The panel shows those links and does not pretend each old run has its own pull request.

## Decisions

| Need | Choice | Why |
| --- | --- | --- |
| Controller | REST v1 from the Next.js server | This app runs on Node 20. `@cursor/sdk` asks for Node 22.13. REST is the cookbook's path for a service. |
| Identity | Cursor agent name `ring:{agent id}` | There is no database. Cursor is the record. |
| Ask | `mode: plan`, no file edits | A reply. Same thread if the agent already exists. |
| Assign work | `mode: agent`, new branch | This is the run that may change code. It does not push to `main`. |
| Pull request | Off unless the operator checks the box | `autoCreatePR` only when they ask for a pull request. `workOnCurrentBranch` stays false. |
| Progress | Poll the run every few seconds | A long SSE stream does not fit a short serverless request. Polling is the production form of cookbook recipe E. |
| Stop | `POST /v1/agents/{id}/runs/{runId}/cancel` | Documented. Does not resume the cancelled run. |
| Files | List artifacts, then a 15-minute download link | The API key stays on the server. The browser only receives the temporary file URL. |
| Account | `GET /v1/me`, show the key name | Confirms which Cursor key is connected. The key itself is not shown. |
| Voice, Slack, Linear, self-hosted pools | Not this update | They are other entry points in the cookbook. They do not make the person panel clearer. |
| Completion webhooks | Later | The cookbook says v1 completion webhooks are not ready. |
| Busy queue | Later | Needs a store. Until then the panel tells you to wait or stop. |

## What you see

Open a person. The panel says what is happening now, shows the last reply, and lets you ask a question or assign work. If a run is going, it keeps checking. When a branch or pull request exists, the link is on the panel. Files they produced are listed. Token use is one line, not the main story.

Campus and the grid stay as they are.

## Held

Do not start the whole ring from one button. Do not push to `main`. Do not put the API key in the browser or in git.
