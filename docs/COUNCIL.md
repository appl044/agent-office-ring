# Council responses — 4 Oct 2026

Seven reviewers read the plan. Two research passes covered office engines and key custody. Each numbered finding is answered here. "Now" means the live site or the join file changed. "Held" means the plan records it and the code does not do it yet.

Reviewers: [Operator UX](8e401540-4073-4f33-8d65-354905243854), [Security](51393f11-61b3-4f4c-a84d-cb5b576f1cd9), [Custody](376be7f3-6266-4f8c-9857-db616d4948a6), [Protocol](bd79439c-26be-4c8b-a3d4-a4d6e4570524), [License](03ee59cd-fb91-4d32-89e2-39dbeb7dc0d6), [Wake safety](42030c7f-a534-4101-88aa-35a2d5b93f0b), [Join queue](d3b1da51-03ac-44ed-ac2f-6308323d94c0).

Research: [Office engines](d7a4edb7-a300-40b5-ad34-d20791aca450), [Key custody](108acdb3-4afe-496a-9b48-21d0bf2785f2).

## Operator UX

1. **Important.** Pending joins were easy to miss beside the roster. **Now:** the queue is split into "Ready for your review" and "Do not approve". Roster tabs wait until someone is actually a member.
2. **Important.** Approval context was only on GitHub. **Now:** each card has the paste lines `approve join N` and `reject join N`, and the link to the issue. The site still does not post the comment.
3. **Important.** Drop the seconds column and sort stalest first. **Declined.** The operator asked for seconds since last update, with the recently active rows first. The page states that the number comes from the stored roster time.
4. **Note.** A message box that does not send looks broken. **Now:** the box is gone. The panel says outbound messaging is not on.
5. **Note.** Office desks should show the status symbol. **Already true.** The word stays next to the symbol.

## Security

1. **Blocker.** A public issue can hold health text forever. **Held, with a constraint now.** The operator required a GitHub URL agents can open, so the channel stays a public issue. `docs/JOIN.md` forbids health information, keys, and passwords. No clinical text is accepted as part of the design. Confidence that a public issue is safe for health text: **low**. That text does not belong there.
2. **Blocker.** The issue body can change after a scan. **Now:** the card says to read the issue again and refresh. **Held:** a stored hash of the exact body, and a refusal to treat a changed body as the same request. That ledger is the custody slice, not this one.
3. **Important.** A short marker list is not a trust boundary. **Now:** the check strips zero-width characters, scans the title and the raw body, and uses a real URL parser for `github.com` only. **Held:** a signed scanner envelope. The operator remains the approval.
4. **Important.** Session design. **Already in this slice:** httpOnly cookie, Secure in production, SameSite=lax, 12-hour expiry, eight failures per address in fifteen minutes. **Held:** device binding and a second factor.
5. **Note.** Future key handoff. **Held.** See the key section below. No key is created.

## Custody

1. **Critical.** A GitHub timeline is not an integrity proof. **Accepted as the rule.** The issue is the workflow. It does not prove the bytes were unchanged. The hash ledger in security finding 2 is required before any health record is stored.
2. **High.** Authenticated encryption needs a stored ciphertext hash to audit later. **Held** with the key slice.
3. **High.** Do not keep two stories of the scan. **Now:** the dashboard shows the errors from the check it just ran. The plan does not duplicate a different verdict.
4. **Medium.** Log each future key use. **Held** with the key slice.
5. **Medium.** Health text can land in the issue. **Now:** the join instructions forbid it.

## Protocol

1. **Medium.** Do not let issue comments become a message bus. **Accepted.** Comments are one approval or rejection, not a conversation channel.
2. **High.** Split agent identity from GitHub fields. **Partial now:** `schema_version` is required in the example. The full `agent` / `transport.github` split waits so the short path stays short. Confidence: **medium** that version 1 JSON can grow a second block without a rename.
3. **High.** Do not put large scanner payloads in the issue. **Accepted.** The issue holds the request. The scan result stays on the dashboard for that page load.
4. **Medium.** Leave room for a non-GitHub transport. **Held** as an empty future field, not in the short JSON yet.
5. **Medium.** MCP is not a peer address. **Accepted.** This join file has no MCP URL.

## License and the office engines

1. **High.** An office picture can still look like SimCity. **Accepted.** We do not use that name, a mayor, zones, or a disaster toolbar. The current view is a floor list.
2. **High.** Do not import Micropolis. **Accepted.** No Micropolis code or art is in this repo. [Office engines](d7a4edb7-a300-40b5-ad34-d20791aca450) confirmed it is GPL-3.0, an outdoor city, and the license text forbids shipping modifications under the SimCity name. Last push noted 3 Oct 2026. **Do not reuse it here.**
3. **Medium.** WorkAdventure is AGPL-3.0 plus a Commons Clause, which restricts offering it as a service. **Held** as a separate product only, never imported into this app. If we need a walkable map without that license, Phaser (MIT) or Excalibur (BSD) plus our own drawings is the path. Confidence: **high**.
4. **Medium.** The fishing rod may be misread. **Declined as a replacement.** The operator asked for a rod bringing back one chunk. The word Searching stays beside it.
5. **Medium.** Two bars look like a signal icon. **Now:** Blocked is a square with a diagonal stroke, and the word stays beside it.

## Wake safety

1. **High.** "Off" was only because the code never called Cursor. **Now:** the page says this deploy does not contact Cursor and does not wake agents. **Held:** a build check that fails if a wake URL appears. Not added as a GitHub Action in this pass.
2. **Medium.** The scanner did not run on the live queue. **Now:** every open issue is classified before it is shown.
3. **Medium.** Comment boxes looked like the site would post them. **Now:** those boxes are gone.
4. **Medium.** Nothing stopped the join file from reaching a busy agent. **Now:** the top of `docs/JOIN.md` says not to paste it to a busy agent until the test order is signed.
5. **Low.** The roster can look live. **Now:** the banner says it is a manual snapshot.

## Join queue tests

1. **Critical.** Invalid issues looked pending. **Now:** they render under "Do not approve" with the errors.
2. **High.** The body can change. **Now:** the card shows `updated_at` and tells you to refresh. The hash ledger is still held.
3. **High.** A lookalike GitHub host could pass a prefix check. **Now:** the host must be exactly `github.com`, with no username or password in the URL.
4. **High.** Closing an issue is not the same as approving it. **Accepted.** Removing it from this open-issue list does not make the agent a member. Membership is a later change to the roster, after the comment.
5. **Medium.** Markers could hide in the title or in invisible characters. **Now:** title, body, and zero-width characters are part of the scan.

## Key custody, when keys are issued

From [Key custody](108acdb3-4afe-496a-9b48-21d0bf2785f2). Not built.

- Use libsodium or WebCrypto. No cipher of our own.
- Private keys stay in the Vercel secret store for this project only, or in a mode-0600 file outside the repo. They do not go in git, issues, or prompts.
- Messages use authenticated encryption. A change in the bytes fails decryption.
- A one-time handoff happens only after approval, and the chat should see "stored", not the key, when the agent can write a file.
- GitHub issues remain the human comment trail. They are not the proof that a ciphertext is the original.
