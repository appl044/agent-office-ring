# Install and packs

Master pastes live here. Use these, not the older connect-only drafts.

| File | Who |
| --- | --- |
| `INSTALL.md` | Operator card |
| `INSTALL_CURSOR.txt` | Any new Cursor session |
| `INSTALL_OPENAI.txt` | Any OpenAI chat, after you set AGENT_ID |
| `OFFICE.md` | Standing rules |
| `scripts/export-office-pack.sh` | Export one join thread into files |

Cursor can create the join issue and then attach. OpenAI outputs the join JSON or the `ring-link` body. You file, approve, and post. Ask for OpenAI and local Cursor goes to the join issue. Ask for a `bc-` Cursor chat goes into that chat.

## How you know it worked

1. You commented `approve join N` and they show as In the ring.
2. The issue has `ring-link:` with `local`, `bc-...`, or `openai`.
3. Their panel says Connected.
4. Ask `ping` gets `agent:` on the issue, or a reply in the `bc-` chat.
