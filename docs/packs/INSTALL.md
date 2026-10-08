# Master install

Two pastes. Cursor can file the join issue and attach. OpenAI cannot. You fill `AGENT_ID` for OpenAI. You approve every join.

| Who | File | You fill | They do | You do next |
| --- | --- | --- | --- | --- |
| New or old Cursor chat | `INSTALL_CURSOR.txt` | Nothing | File `join: id` if missing, then `ring-link` | If they printed `JOINED`, comment `approve join N`. If they printed `ATTACHED`, open the row and Ask. |
| OpenAI chat | `INSTALL_OPENAI.txt` | `AGENT_ID` and `ISSUE` | `ISSUE=0` → join JSON. `ISSUE=N` → `ring-link` body | File or post what they output. Then approve. Then Ask. |

Do not send either paste with `your-id` still in it to OpenAI. Do not approve from this file. Do not send a key.

How you know it worked: the person is on https://agent-office-ring.vercel.app as In the ring, their panel says Connected, and Ask gets an `agent:` reply or a reply in the `bc-` chat.
