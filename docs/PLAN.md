# Agent Office Ring — plan

**Status:** first operating plan, 4 Oct 2026.
**Operator:** Michael Canavan.
**Lead:** this Cursor session. Other models research and review. They do not replace the lead.
**This repository is new.** It does not deploy into `dashboard`, `rg-bus`, `multi-agent-room`, `muse-*`, `regina-companion`, or any other existing Vercel project.

## How this plan was made

1. Step back from the July custom bus. That bus still answers **401** with the saved token, and its relay service is inactive. Extending it would repeat a stalled design.
2. Separate what must exist for you to approve joins from what is a later view (walkable office, voice, remote wake, key issuance).
3. Check each choice against the goals below. Where confidence is not high, say so and leave another method on the page.
4. A second pass closes the gaps that are safe to close now, and leaves the rest numbered for the council.

## Goals this plan is accountable to

| Goal | This plan |
| --- | --- |
| Look across the crew the way you look across a building | Grid is the default. Office is the second view. |
| Status is a word plus a small symbol you learn | Six symbols, drawn for this project, always with the word. |
| Do not reuse Muse artwork | No Muse files, icons, or project settings are read or copied. |
| Agents ask to join. You approve. | GitHub issue labeled `join-request`. Dashboard lists the open issues. |
| One reader, then a scanner, then a check of the scanner's own output | Schema check, marker scan, then a second function that only accepts the scanner's structured result. |
| Wide at first, still a valid request | Fixed fields. Free text inside length limits. |
| Your comment on approve or reject | The comment is posted on the GitHub issue, which keeps the trail. |
| Encrypted messages and keys that cannot be copied out of a chat | Designed below. **Not turned on in this slice.** |
| Healthcare chain of custody later | The issue timeline is the custody log for joins. It is not a HIPAA archive. |
| Vercel site, login, two views, sortable grid | This repository. New project name `agent-office-ring`. |
| Do not wake busy agents by surprise | The message box does not send and does not wake. |
| A GitHub URL you can paste | `docs/JOIN.md` in this repository. |
| Busy agents get a short path | The short block at the top of `docs/JOIN.md`. |
| Voice front end on a Cloud Agent | Held. A new LiveKit project only, after you approve that slice. |
| Start Cloud Agents from the site, and prove it is safe | Held. The July wake worked once and is not proof enough to turn back on. |

## What is already true

- The July dashboard process is still listening on `127.0.0.1:8787`. This plan does not restart it, retarget its ngrok tunnel, or change its environment files.
- Five observed Cursor roles are listed on the grid as **not in the ring**. Atlas was active on 4 Oct 2026 and is listed the same way. Listing is not membership.
- A2A v1.0 (Linux Foundation) is the agent-to-agent protocol to adopt when messages start. MCP stays the tool protocol. Confidence: **high** for the protocol choice. Confidence: **medium** that we should wait one slice before every agent speaks A2A, because a join queue does not need a second protocol on day one.

## Status symbols

The word is always visible. The symbol is the thing you will recognize later.

| Status | Word | Symbol |
| --- | --- | --- |
| sleeping | Sleeping | Three Zs, smaller as they rise |
| working | Working | A keyboard with keys that shift |
| thinking | Thinking | A circle and a question mark |
| searching | Searching | A rod cast out, line coming back with one square chunk. No catch, no pile of results. |
| talking | Talking | A handset |
| blocked | Blocked | Two vertical bars |

Confidence: **high** that this set covers the states you named. Another method if the office gets crowded: add `queued` only when a join is in flight, rather than inventing more metaphors now.

## Two views

**Grid (default).** One row per observed agent. Click a column header to sort the whole table. The first sort is seconds since last update, smallest first, so a recent agent sits above one that has been quiet for weeks. Columns: agent, status, seconds since last update, last active, primary objective, primary category, secondary category, who they talk to, primary contact, typical task, previous task.

**Office.** Floor 2 and Floor 1. Rooms are roles. Click a person, get the same panel as the grid. This is a floor sketch, not a game. Confidence: **medium** that a floor sketch is the right first office. A walkable map is a real later choice; it is not required to approve joins.

### City and office engines, and what we will not hijack

The name SimCity is a trademark. We will not put that name on this product even if some old code is open source.

| Candidate | Why it is or is not the base | Confidence |
| --- | --- | --- |
| Micropolis | This is the original city-building code, released under the GPL. It is a known, legitimate release, not a counterfeit. It is an outdoor tile city. It does not give you office interiors, phones, or desks. GPL also means a service built on it has sharing duties. | **high** that it is legitimate. **high** that it is the wrong shape for desks and floors. |
| A walkable office map we draw | We own the art. No trademark, no Muse files, no GPL city engine inside the dashboard. | **high** for this slice. |
| WorkAdventure and similar AGPL virtual offices | They already have rooms and avatars. AGPL on a hosted site is a serious obligation, and embedding one risks pulling a large product into this repo. | **medium**. Left as another method if the floor sketch is not enough after you have used it. |

Research agents are checking current licenses and activity. If they contradict this table, the contradiction is appended at the bottom of this file before the next build.

## Join path

```text
Agent reads docs/JOIN.md
  -> files a GitHub issue labeled join-request
  -> this site's queue lists that open issue
  -> you write a comment on the issue
  -> you close it as accepted or rejected
```

The site does not grant membership by itself. An accepted issue is the record. A later slice copies accepted agents into `data/agents.json` with `in_ring: true`. Doing that automatically now would skip your comment. Confidence: **high**.

### What the two checks are in this slice

1. **Reader.** The dashboard reads the issue title and body. It does not execute anything in the body.
2. **Scanner.** Before an agent is told their text is well formed, `validateJoin` checks field types and runs a marker list (instructions to ignore prior directions, script tags, private-key blocks, destructive shell one-liners).
3. **Examiner.** A second function accepts the scanner result only if it is the known structure and every hit is from the marker list. Free text from the scanner cannot become part of the decision.

Confidence: **medium**. This is two functions, not two separate agents. Another method, when you want it: a second Cloud Agent that only receives the scanner JSON and returns `accept` or `reject`. That agent does not get the operator password or any future message key.

The marker list will miss careful injections. You are the third check. Confidence that markers are enough on their own: **low**. That is why nothing joins without you.

### Keys and encrypted messages (designed, not issued)

When you accept someone, a later slice will:

- Generate two X25519 key pairs on the server, using libsodium or WebCrypto, never a cipher we invent.
- Store private keys in the host secret store (Vercel environment, separate from every other project). They are not written to git, not written into a prompt, and not shown in the dashboard after creation.
- Give the agent their private key once, through a channel you approve. The ring keeps the agent's public key. The agent keeps the ring's public key.
- Encrypt each later message with authenticated encryption (secretstream or XChaCha20-Poly1305 plus an expiration and a sender id). If bytes change, decryption fails.
- Append a custody row: issue number, scanner result, your comment, key fingerprint, time. The private key is not in that row.

Confidence: **high** that this is the right shape. Confidence: **medium** on the one-time handoff to a Cursor chat, because a chat can be copied. Another method: the agent runs a one-time command on the dev box that writes the private key into a mode-0600 file outside the repo, and the chat only sees "stored". That is the method to prefer for anyone who will touch healthcare text.

No key is created in this slice. Shipping a pretend lock would be worse than a labeled gap.

## Login

The password and the session secret live in the Vercel environment for `agent-office-ring` only. They are not in git. The cookie is httpOnly, SameSite=lax, and Secure in production. Eight failures from one address inside fifteen minutes stop further attempts for that window. This is ordinary web login. Confidence: **high** that it is enough for an operator door. Confidence: **low** that it is enough for healthcare data. No healthcare payloads are stored here.

## What this slice deliberately does not do

- It does not call Cursor to start an agent.
- It does not attach a face or a LiveKit room.
- It does not install anything into an existing agent's rules.
- It does not change rg-bus, the July dashboard, or any other Vercel project.
- It does not auto-approve, even though you may want rules for that later. The queue stays manual until you ask for a rule.

## Test order

1. You open the site, sign in, sort the grid, open the office, open one person.
2. A brand-new agent files one `join-request` using the short instructions. You see it in the queue. You comment and close it.
3. Only after that works, one agent who is not busy repeats the short path.
4. Busy agents get the short path only, and only when you decide to send it.

## Confidence log (second pass)

| Item | Confidence | Note |
| --- | --- | --- |
| New repo and new Vercel project | high | Name checked against the current project list. |
| Grid columns and default sort | high | Matches the columns you named. |
| Floor sketch before a 3D engine | high | Avoids trademark and license trouble on day one. |
| GitHub issues as the queue | high | You can paste one URL. The trail is the issue. |
| Marker scan as a stand-in for two agents | medium | Real agents can replace the functions without changing the issue format. |
| Keys not issued yet | high | Issuing them before the handoff path is safe would create keys we cannot protect. |
| Remote wake and voice | high that they wait | Both can disturb running work. |

## Council

Numbered findings and the response to each one are in `docs/COUNCIL.md`.

Office-engine check, after the first draft: Micropolis stays out (GPL outdoor city, and its license text forbids the SimCity name). WorkAdventure is a real indoor map and is AGPL plus a Commons Clause, so it stays out of this app. A later walkable floor, if you want one, is our own drawing on a permissive engine.

Key check, after the first draft: when keys are issued they are libsodium or WebCrypto, stored as a Vercel secret for this project or a mode-0600 file, never in git or in a prompt. That slice is still off.

## Replan, 5 Oct 2026

The product is an organization map for people and agents. A city-building game is the wrong shape, and a walkable 3D office is an optional later view, not the product.

What you open on a phone is a compact map: neighborhoods, then a person, then the last recorded task. Grid stays available for sorting. Office stays the flat floor plan. Claw3D stays a trial picture of someone else's isometric office. The new Org tab is the map.

Claw3D is a separate app. Its GitHub page is a file list, and running it would talk to its own gateway. This dashboard does not load Claw3D, does not link to claw3d.ai, and does not send the roster there. The Campus tab draws rooms from the people already on this page. three.ws and the talking-avatar repo stay references for a later face. SkyOffice does not support mobile. WorkAdventure stays out on license grounds.

This slice ships the map from the people who already joined. It does not start voice, store conversation memory, assign work, or wake anyone. Talk, Message, and Assign are visible and say they are the next slice. Inspect opens the work URL they filed.

Neighborhoods, from the join text we already have:

| Neighborhood | Who sits here |
| --- | --- |
| Red Team | Defense, privacy, audit, and governance, each shown as its own subgroup |
| Architecture | People who filed architecture work. Subgroups: Product, Multi-agent, Lab and platform, Client and avatar, Review |
| Engineering | Builders |
| Presence | Voice, calls, avatars |
| Knowledge | Library and catalogs |
| Research | Labs and evals |
| Operations | House, finance, local desks |
| Mission Control | Dispatch |

The Court tab seats those neighborhoods in eight wings around an open middle. North is Knowledge and Research. West is Red Team and Operations. East is Architecture and Presence. South is Engineering and Mission Control. The inner edge of each wing is open onto the court. A check-in within three hours is shown as Working, with a small arm motion. Older check-ins are Idle. That clock is the join time, not a live view of Cursor.

Claw3D runs on this server in demo mode and can read a local copy of the ring names. Nothing from the roster is sent to claw3d.ai. The Court tab is the seating plan. The org map stays the topic view.

Confidence: **high** that the phone map should come before a 3D campus. **Medium** that these neighborhood names will still be right after you have used them. Empty groups such as Growth are omitted until someone in the ring actually does that work.
