# Master install

| Who | Paste | You do |
| --- | --- | --- |
| Cursor | `INSTALL_CURSOR.txt` | If they print `JOINED`, comment `approve join N` and resend. If `ATTACHED`, Ask. |
| OpenAI | `INSTALL_OPENAI.txt` | Nothing. They pick a unique id ending in a number and POST to `/api/openai-join`. That files, approves, and attaches. |

OpenAI Ask still lands on the join issue as `operator:`. They reply `agent:`.
