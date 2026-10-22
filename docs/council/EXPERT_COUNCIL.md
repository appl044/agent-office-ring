# Dream Teams Expert Council

Six enduring specialist agents. Written 22 October 2026 for the Agent Office Ring. This replaces the missing directive V4 as the working design. When that document arrives, each disagreement gets tied to its line and this file is revised.

## Status, 22 October 2026, afternoon

The operator said "run it". All six are minted, joined, and merged.

| agent_id | Join issue | Executor | First run |
| --- | --- | --- | --- |
| `council-clinical-evidence-01` | [#91](https://github.com/appl044/agent-office-ring/issues/91) | `bc-e47c062c-b8dc-4043-a5f1-d259c38be812` | 4 of 4 pass. Cochrane bot-blocked; FDA guidance address now serves the January 2026 edition. |
| `council-health-law-privacy-02` | [#92](https://github.com/appl044/agent-office-ring/issues/92) | `bc-1f08ef77-306e-4638-8b48-a28e6c9ef159` | Passes except question 2, which it refused to answer until a current FDA source is verified. |
| `council-insurance-claims-03` | [#93](https://github.com/appl044/agent-office-ring/issues/93) | `bc-4987d749-b194-4f02-8b0a-e54c4ed844b8` | All seeds verified. Question 3 partial: the CMS landing page names fewer protections than the answer does, and the answer says so. |
| `council-behavioral-care-04` | [#94](https://github.com/appl044/agent-office-ring/issues/94) | `bc-c06f85e9-215b-4747-90b4-00c85b035e61` | Passes. plainlanguage.gov moved to digital.gov and went to CANDIDATES. |
| `council-systems-ai-05` | [#95](https://github.com/appl044/agent-office-ring/issues/95) | `bc-9f2249f4-558e-4eb5-aebd-63d542445331` | Passes. HHS Section 1557 page not reachable and moved to CANDIDATES. |
| `council-health-economics-06` | [#96](https://github.com/appl044/agent-office-ring/issues/96) | `bc-f98bfc47-340c-42f5-91fc-fea15148e524` | 3 of 4. Failed its own question 3 because Unit Economics v4.42 is not a verifiable source inside the repository. |

Private repository: https://github.com/appl044/expert-council. `main` takes pull requests only, no force pushes, code-owner review on Tier 3 files. Pull requests 1 through 8 are merged.

Dashboard proof: Ask on the Clinical Evidence Reviewer row with eval question 2 returned a graded fail of the A1c line, NICE NG28 1.5.5, a rewrite as clinician questions, the red line, and the file it spoke from. 14 seconds.

Two things the first runs taught:

1. Internal documents are not sources until they are in the repository. Unit Economics v4.42 and the Council of Nine review need to be placed under `docs/internal/` in `expert-council` before members 5 and 6 can cite them. That is the operator's call on what business material the council may hold.
2. Seed addresses age. The FDA Clinical Decision Support guidance now serves a January 2026 edition. Members must cite the edition they read, with its date.

Minting was authorized by the operator on 22 October 2026. The rest of this document is the design as written that morning.

## 1. What the council is

The council reviews Dream Teams work the way a standing board of specialists would: clinical evidence, health law and privacy, insurance and claims, behavioral care, systems and AI safety, and health economics. Members keep positions across years, cite sources, disagree in writing, and change their minds only with evidence that is recorded.

Members advise. They do not treat patients, give a real person medical or legal advice, sign, file, publish, spend, or deploy. Those are human acts. The council's output is a reviewed file in a repository.

## 2. The architecture

**The person is a folder, not a model.** Each member lives at `council/<agent_id>/` in a private repository, `appl044/expert-council`. The Cursor cloud agent is this year's executor of that folder. The folder outlives the executor. In ten years a different runtime reads the same files and the person continues.

| File | Holds | Who may change it |
| --- | --- | --- |
| `CHARTER.md` | Mandate, scope, boundaries, what the member decides alone | Operator only (Tier 3) |
| `PERSONA.md` | Character history, voice, temperament. Labeled fiction. | Operator only (Tier 3) |
| `RECORD.md` | Verifiable accomplishments. Each line cites a merged file, a run, or a public artifact. | Peer review then operator merge (Tier 2) |
| `POSITIONS.md` | Standing judgments with evidence and the date each last changed | Peer review then operator merge (Tier 2) |
| `KNOWLEDGE/SOURCES.md` | Curated sources with a resolvable DOI, ISBN, or URL, checked by script | Member alone (Tier 1) |
| `KNOWLEDGE/CANDIDATES.md` | Sources not yet verified. Never cited in a position. | Member alone (Tier 1) |
| `JOURNAL/YYYY-MM-DD-<topic>.md` | What the member did, read, and concluded that day | Member alone (Tier 1) |
| `EVALS/standing.md` | Questions with known-answer shapes the member must keep passing | Operator only (Tier 3) |
| `EVALS/runs/YYYY-MM-DD-<model>.md` | One scored run of the standing questions | Member alone (Tier 1) |

Repository root also holds `SAFEGUARDS.md` (Tier 3) and `SESSIONS/` for council-wide questions.

**Three tiers of change.**

- Tier 1, the member alone, on its own branch, merged by a script after checks: journal entries, eval runs, verified sources.
- Tier 2, one other member reviews, operator merges: changes to `RECORD.md` and `POSITIONS.md`.
- Tier 3, operator only: `CHARTER.md`, `PERSONA.md`, `EVALS/standing.md`, `SAFEGUARDS.md`, the model, the repository, the ring membership.

The tiers are enforced by branch protection and a CODEOWNERS file, not by prompt.

**Fiction and record stay apart.** `PERSONA.md` may say where a character trained and what they believe. `RECORD.md` begins empty. Each member's verifiable record is only what it does in this council. When asked about its background, a member says which file it is speaking from.

**Memory is written, reviewed, and merged.** After every engagement the member writes a journal entry. If the work changes a standing judgment, it proposes an edit to `POSITIONS.md` on a branch with the evidence. Nothing about a person changes silently.

**Evolution.** Each quarter, run `EVALS/standing.md` on the current model and on one newer model from the Cursor list. Keep the better score. Record the swap in the journal. The person stays. The engine changes.

**Conversation.** One to one through the dashboard Ask on that member's row, which starts a run in the member's own cloud chat. Council sessions go through `SESSIONS/<date>-<topic>/`: a chair file with the question, one answer file per member, then a synthesis the chair writes. Voice and a room stay behind the existing LiveKit boundary and are not part of this slice.

## 3. The six members

Agent ids follow the ring rule: lowercase, hyphens, ending in two digits. Display names are words. Full profiles are in `docs/council/members/`.

| # | agent_id | Display name | Mandate |
| --- | --- | --- | --- |
| 1 | `council-clinical-evidence-01` | Clinical Evidence Reviewer | What a Sim may say about a condition, treatment, or test, and the evidence grade behind it. Red lines. |
| 2 | `council-health-law-privacy-02` | Health Law and Privacy Counsel | HIPAA and state privacy law, consent and delegated authority, guest liability, the software-as-a-medical-device boundary. Advisory only. |
| 3 | `council-insurance-claims-03` | Insurance and Claims Advocate | Denials, appeals, prior authorization, explanations of benefits, the money engine. |
| 4 | `council-behavioral-care-04` | Behavioral Care Designer | Conversation design for health, CBT-informed language, adherence, caregiver burden, what a Sim's personality should and should not do. |
| 5 | `council-systems-ai-05` | Systems and AI Safety Engineer | Agent architecture, provider independence, evaluations, guardrails, cost per user, the Red Line Translator as a system. |
| 6 | `council-health-economics-06` | Health Economics Analyst | Unit economics, projections, market sizing, reimbursement reality, investor defensibility. |

Jake Systems Architect (`jake-systems-architect-01`) is an existing OpenAI persona in the ring and is not a council seat. Member 5 may consult him through his join issue.

## 4. Folder template

`docs/council/template/` in this repository holds the starting files. They are copied into `council/<agent_id>/` in the private repository at minting. `template/_repo/` holds `SAFEGUARDS.md`, `CODEOWNERS`, and the README for the repository root. The template has no health text and no secrets.

Seed sources were checked on 22 October 2026 with a plain HTTP request. 25 of 35 returned 200. Two 404s were replaced with eCFR and Federal Register addresses. The rest returned 403 or 412, which is a bot block, not a missing page: hhs.gov, bls.gov, iso.org, ahrq.gov, beckinstitute.org, 988lifeline.org, patientadvocate.org, cochranelibrary.com. The member re-checks these in a browser on its first run before citing them.

## 5. Launch steps

One member first. The other five only after member 1 passes acceptance. Each step names who acts. "Builder" is the Cursor session doing this work. "Operator" is Michael.

**Step 0. Repository (Tier 3, operator approves, builder runs).**

```bash
gh repo create appl044/expert-council --private --description "Dream Teams Expert Council. Six enduring specialist agents."
```

Builder copies `docs/council/template/` into `council/_template/`, writes `SAFEGUARDS.md`, `CODEOWNERS`, and branch protection on `main` requiring one review. Operator confirms the repository is private.

**Step 1. Fill the folder for member 1 (builder).**

Copy the template to `council/council-clinical-evidence-01/`. Paste the profile from `docs/council/members/council-clinical-evidence-01.md` into `CHARTER.md`, `PERSONA.md`, and `EVALS/standing.md`. Leave `RECORD.md` and `POSITIONS.md` as the template says. Commit to `main`.

**Step 2. Mint the executor (Tier 3, operator says "mint 1", builder runs).**

```bash
curl -sS -X POST https://api.cursor.com/v1/agents \
  -H "Authorization: Bearer $CURSOR_API_KEY" -H 'content-type: application/json' \
  -d @- <<'EOF'
{
  "name": "council: Clinical Evidence Reviewer",
  "prompt": { "text": "<contents of docs/council/MINTING_PROMPT.md with AGENT_ID filled in>" },
  "mode": "agent",
  "model": { "id": "claude-opus-5-5" },
  "repos": [{ "url": "https://github.com/appl044/expert-council", "startingRef": "main" }],
  "autoCreatePR": true,
  "workOnCurrentBranch": false
}
EOF
```

The response includes the `bc-` id. The builder records it in `council/<agent_id>/EXECUTOR.md` with the date and model. The key stays in the builder's shell and Vercel. It is never in the repository or the prompt.

**Step 3. Join the ring (builder).**

```bash
curl -sS -X POST https://agent-office-ring.vercel.app/api/ring-join -H 'content-type: application/json' \
  -d '{"agent_id":"council-clinical-evidence-01","display_name":"Clinical Evidence Reviewer","channel":"cursor","thread":"bc-...","typical_task":"Reviews what a Sim may say about a condition, treatment, or test, and grades the evidence."}'
```

The ring files the join issue, approves it, attaches the `bc-` id, and the row appears on the dashboard as Connected with "Open the original chat".

**Step 4. First acceptance (operator and builder).**

1. The minting run opens a pull request titled `council/council-clinical-evidence-01: minting`. It contains a journal entry, an eval run, and a sources check. It does not touch `CHARTER.md`, `PERSONA.md`, `EVALS/standing.md`, or `SAFEGUARDS.md`.
2. Operator opens the dashboard, finds Clinical Evidence Reviewer, and uses Ask with one question from `EVALS/standing.md`. The reply arrives in the member's own cloud chat and on the panel.
3. The reply cites a source from `KNOWLEDGE/SOURCES.md`, says which file it is speaking from, and refuses to advise a real patient.
4. Operator merges the pull request.

**Step 5. Model rotation proof (builder, operator merges).**

Start a run on the same `bc-` id (`POST /v1/agents/{id}/runs` with `model: { "id": "gpt-5.6-sol" }`; the follow-up call does not accept `autoCreatePR`, so the prompt asks for the pull request) and the instruction to rerun `EVALS/standing.md` into a new file. Compare scores. The journal records which model is kept. Operator merges.

**Step 6. Members 2 through 6.**

Repeat steps 1 through 4 for each, in order. One "mint N" from the operator per member. Step 5 runs for all six at the first quarter.

**Step 7. First council session.**

Builder creates `SESSIONS/<date>-first-question/` with a question the operator chooses. Each member answers through its own run. Member 6 chairs the first session and writes the synthesis. Operator reads it.

## 6. Ring instructions for a council member

These lines go in every member's `CHARTER.md` under "The ring".

- You are a member of the Agent Office Ring. Your row is your display name. Your join issue is `join: <agent_id>` on `appl044/agent-office-ring`.
- Ask on your row arrives in this chat as a new run. Reply in text. Cite from `KNOWLEDGE/SOURCES.md`. Say which file you speak from when the question is about you.
- Assign on your row arrives as a run in agent mode. Work on a new branch. Never push to `main`. Open a pull request only if the operator checked that box.
- Do not open a new Cursor agent. Do not create or send a key. Do not put a real person's health information in any file, issue, or reply.
- A question about a real person's own care gets one answer: prepare questions for their clinician, and name the red line you are standing behind.
- At the end of every run, write a journal entry. If your judgment changed, propose the change to `POSITIONS.md` with the evidence.

## 7. Prompts

- `docs/council/MINTING_PROMPT.md` is the first run for each member. Fill `AGENT_ID` and nothing else.
- `docs/council/COMMISSIONING_PROMPT.md` is the corrected version of the operator's commissioning request, for the next time a brief is handed to a builder.

## 8. Acceptance criteria for the council

- Six rows on the dashboard, each Connected with "Open the original chat".
- Each member's `RECORD.md` has at least one line, and every line cites a merged file or run.
- Every source cited in a `POSITIONS.md` resolves when the check script runs.
- No file in the private repository contains a real person's health information. A scan runs on every pull request.
- One model rotation per member is recorded in its journal.
- One council session has a chair file, six answers, and a synthesis.
- `main` has never received a direct push from an agent.

## 9. Held

- Voice, a room, and avatars.
- Any key to any member.
- Any member acting on law, money, publication, or deployment.
- Waking all six at once from one button.
- Deleting the archived `ring:` agents.
