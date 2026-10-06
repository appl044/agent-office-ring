# Cursor Cloud Agents Cookbook

Saved 5 October 2026. This is the reference for the person panel. The decisions that follow from it are in `docs/CONTROL_PLAN.md`.

The v1 API is public beta. It separates a persistent agent from individual prompt runs. Another message is `POST /v1/agents/{id}/runs` on the same agent, not a new agent.

Official reference: https://cursor.com/docs/cloud-agent/api/endpoints

The dashboard uses REST v1. It does not use `@cursor/sdk`, because that package asks for Node.js 22.13 and this app runs on Node 20.

## Entry points

| Route | Continue work | Best use |
| --- | --- | --- |
| Cursor Desktop, Web, iOS, Android | Open the same cloud conversation | Interactive and mobile supervision |
| Slack, GitHub, Bitbucket, Linear | Mention `@cursor` or follow up in the thread | Team and issue tools |
| REST `POST /v1/agents` | `POST /v1/agents/{id}/runs` | This dashboard |
| TypeScript SDK `Agent.create` / `Agent.resume` | `agent.send()` | A Node 22 controller |
| Cursor Automations | A new automation run, unless you keep an agent id | Schedules and provider events |

For this app: REST, one agent per ring person, a new run per Ask or Assign. Automations, Slack, and self-hosted pools stay out until the panel needs them.

## Agents and runs

| Object | Meaning | Status |
| --- | --- | --- |
| Agent | Persistent conversation and workspace | `ACTIVE`, `IDLE`, `ARCHIVED` |
| Run | One prompt | `CREATING`, `RUNNING`, `FINISHED`, `ERROR`, `CANCELLED`, `EXPIRED` |

`IDLE` does not mean the last run succeeded. Read the run.

Auth is `Authorization: Bearer` or Basic with the key as the username and an empty password. The key is a server secret. Create it in Cursor Dashboard → API Keys.

## Recipes the panel uses

Start, named `ring:{agent id}`, on `https://github.com/appl044/agent-office-ring`, `startingRef` `main`, `workOnCurrentBranch` false:

`POST /v1/agents`

Follow-up on that same id:

`POST /v1/agents/{id}/runs`

Ask uses `mode: plan` and tells the agent not to edit files. Assign uses `mode: agent`. A pull request is created only when `autoCreatePR` is true, which the panel sets only if the operator checks that box.

Read status, reply, duration, and current branches:

`GET /v1/agents/{id}/runs/{runId}`

`git.branches[]` is the agent's current branch and pull-request snapshot. It is not a private history of one old run.

List runs, newest first:

`GET /v1/agents/{id}/runs?limit=8`

Stop the current run. The cancelled run cannot resume. The next message is a new run:

`POST /v1/agents/{id}/runs/{runId}/cancel`

Files:

`GET /v1/agents/{id}/artifacts`

`GET /v1/agents/{id}/artifacts/download?path=` returns a URL that lasts about 15 minutes. Paths stay under `artifacts/`.

Usage:

`GET /v1/agents/{id}/usage`

The response uses `totalUsage` for tokens and can include `cost`. The panel shows tokens.

Which key is connected:

`GET /v1/me`

The panel shows `apiKeyName` only.

If the agent is `ARCHIVED`, the panel calls `POST /v1/agents/{id}/unarchive` before the next run. Archive is reversible. `DELETE /v1/agents/{id}` is not used.

## Recipes held

Stream with `GET /v1/agents/{id}/runs/{runId}/stream`. The panel polls instead. A serverless request is a poor place to hold an event stream. If the stream returns `410 stream_expired`, read the run.

`409 agent_busy`: wait or cancel. Do not try to steer a cloud run in flight. The SDK `run.steer()` is local-only for this purpose.

`409 agent_id_conflict`: the client-supplied id already exists. This app lets Cursor mint the id.

`409 run_not_cancellable`: the run already finished. Read it.

No-repo agents, named cloud environments, worker pools, and `env.type: machine` are documented and unused here. A named environment must not be combined with `repos`.

`envVars` is a rolling beta and can be ignored. Do not depend on it.

v1 completion webhooks are not ready. Do not build a webhook receiver for them yet.

Inline `mcpServers` on a follow-up replace the previous inline set. This panel does not send MCP servers.

## Controller rules

1. Look up `ring:{agent id}` before creating another agent.
2. Save nothing secret in the browser.
3. If a run is `CREATING` or `RUNNING`, do not send another prompt.
4. Poll until the run is terminal, then show the reply.
5. Show branch and pull-request links from `git` when they exist.
6. Leave unrelated people alone. There is no button that starts the whole ring.
