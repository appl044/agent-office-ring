# Context packs

These files are the office context a new session should load.

| File | Use |
| --- | --- |
| `OFFICE.md` | Standing rules and the mailbox |
| `docs/JOIN.md` | How a person joined |
| `CONNECT_CURSOR.md` | Paste into any new Cursor chat |
| `CONNECT_OPENAI.txt` | Paste into ChatGPT only after you fill AGENT_ID and ISSUE at the top |
| `scripts/export-office-pack.sh` | Writes that person's issue thread into `docs/packs/<agent_id>/` |

A Cursor session can run `gh`. An OpenAI chat usually cannot. OpenAI attaches by producing a `ring-link` comment body. The operator posts that body on the join issue, or the chat posts it if it has GitHub. The dashboard treats `cursor-thread: openai` the same as `local`: Ask goes to the issue.

An OpenAI API thread on the dashboard is a later slice. It needs an OpenAI key and a stored thread id. Until then the join issue is the mailbox.

After an OpenAI person is attached, the operator can open their row, press Ask, and read replies on the join issue. To keep that chat in the loop, paste the new `operator:` text into the OpenAI window and paste the `agent:` answer back onto the issue, unless that chat can read GitHub itself.

## How to tell it worked

1. The join issue has a comment that starts with `ring-link:` and has `cursor-thread: local`, `bc-...`, or `openai`.
2. Open that person on the dashboard. The panel says Connected, or it shows the original Cursor chat.
3. Ask `ping`. A local or OpenAI person replies with `agent:` on the issue. A Cursor cloud person replies in that same `bc-` chat.
