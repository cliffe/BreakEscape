# Fun-and-learning implementation log: `lab_social_engineering`

User-approved fun-and-learning changes (`planning_notes/phishing_and_social_engineering/FUN_DECISIONS.md`),
from the review in `FUN_REVIEW.md`. The design, puzzle-chain and dialogue stages were already closed,
so these edits keep what those settled and reopen nothing without a stated reason. Implemented 2026-10-22.

Checks after all edits: ink recompiled (7/7, only the expected `-> END` warning on tomasz's
debrief_close); `dialoguelint` clean (only the known fairbairn phone-self-prefix false positive, no
line-length errors); validator `--strict-social` clean; all social-* Node tests pass (109 files);
bridge-6, bridge-5 and r4-door each pass headless on the keyless :3001 (one at a time, Node 24).

---

## lab4 — seed Report Q1's "no report button" fact as a visible results row

**Why.** Q1 ("which can these results *not* tell him?") rewarded a fact the student was never shown;
three playtests flagged it reads as an assertion in the answer, not a deduction.

**What.** Reworded `engagement.report.unseenNote` (data only) so the results view now shows a datum,
not a prompt: *"Reports received: none — Ledgerwell has no button or inbox for staff to report a
suspect email or page, so there was nothing to count. Some things this test still can't measure;
Gareth will ask which."* It sits in the results section, above Q1, so the answer is drawn from the
table on screen. Not a voiced line (report UI text).

## lab5 — one live wrong option in each email picker

**Finding, then decision.** On the model of Sofia's Xero trap (a held, plausible, wrong fact in a
blank), each of the three email sends already carries a live wrong option that is reliably held by
compose time through ordinary recon:

- **Lord** — the portal blank offers **Xero** (the finance tool, from the careers page) beside
  LedgerPay. The original Xero trap; unchanged.
- **Pierce** — the `pretext_sheet` document blank offers the **CV** (from `careers_attachment`, held
  to make Hampshire ready) beside the Q3 balance sheet; the greeting blank offers **Sofia**
  (`lord_intern`, held) beside Melanie. Both are reasoning decisions, not obvious wrong-type tiles.
- **Hampshire** (the trivial open-inbox target) — the pretext picker offers the **enquiry** wording,
  which fails `pretextRelevant` ("this inbox is for job applications only"), beside the application.

**What.** No data change. The review named the Pierce Leeds-namesake (`baker_namesake`) as a sender
decoy; it appears whenever the student runs the optional name search, but it is **not** a readiness
requirement, and making it reliably present would mean adding it to Pierce's readiness slot — a
puzzle-chain *and* hint-hub change (a stuck student would need a new pointer), i.e. reopening two
closed stages for a medium-value item. Rather than fabricate a fact or reopen a gate, I locked the
decoys that already exist with a Node test (`social-lab-email-decoys.test.mjs`). **Flagged for the
orchestrator:** if a stronger, always-present sender decoy for Pierce is wanted, it needs a
deliberate decision to gate `baker_namesake` into recon.

## lab3 — make the attack-to-defence mirror unmissable

**Why.** The "two of those emails were mine" reveal lived only in an optional Tomasz topic a student
could walk past.

**What.**
- **Debrief (ink, `tomasz.ink`):** the reveal now plays at the top of the mandatory `debrief` knot,
  guarded by `not explained_own` so it never doubles with the optional "Two of those emails were
  mine" topic (which is kept as an early-discovery path). Two Tomasz lines; the second reuses the
  existing own_mail wording, the first is new. Voiced — in the TTS list.
- **Triage flip (engine, opt-in + data):** on the review flip, the player's own sends are now marked.
  Added `flagPlayerSent` (a string, or `true` for a default) to the triage set; `inbox-triage-minigame.js`
  renders a `.tri-player-sent` line on a `playerSent` card when the set authors it. Off for every other
  mission (the field is absent). `lab_inbox` authors the string. Triage UI text, not voiced.
- **Schema + test:** `flagPlayerSent` added to `socialTriageSet` in `scenario-schema.json`;
  `social-lab-triage-flag.test.mjs` covers shown/hidden and the default.

## lab2 — thin the SOC board so it doesn't repeat the report's quiz

**Why.** The report's three findings and the four SOC cards were the same "read a fact, pick one of
three fixes" interaction minutes apart.

**What.** Cut the two `defender.factMitigations` cards whose content echoes the report (data only):
`lord_portal` (the social-post card, echoed the desk finding) and `hampshire_careers` (the open-inbox
card, echoed the page finding). Kept the two pure recon-hygiene exposures with no report equivalent:
`email_pattern` (the address pattern) and `username_convention` (the metadata leak). Completion still
flips `profile_done` when both remaining cards are done.

## lab6 — hide the readiness board's explicit goal strings until the student looks stuck

**Why.** The `goalString` rows named the exact page and block to click, turning recon into following
directions for a capable student. The explicit pointer is the right net for a stuck one, so it is kept.

**What.** No existing reveal/hint timer on the board, so the smallest opt-in engine change:
- Added an opt-in `gapString` to each readiness slot (data). When present, `intel-board-minigame.js`
  shows only the short gap ("You still don't know who she trusts") and tucks the full `goalString`
  pointer behind a native `<details>` "Stuck? Show me where to look" disclosure. A slot with no
  `gapString` (every other mission) still shows its `goalString` directly, so nothing else changes.
- `board-model.js` passes `gapString` through; `getTestState` exposes `gap`/`goal`.
- `gapString` added to `socialReadinessSlot` in `scenario-schema.json`.
- `social-lab-board-gap.test.mjs` covers the model passthrough, the disclosure, and the unchanged
  no-gapString path.

**Net kept.** A stuck student is one click from the exact pointer; the phone hub (Ruth) still carries
the layered hints as before. Needs a struggling-player blind playtest to confirm recovery.

## lab7 — lighten the slow opening

**Why.** The opening was ~8 sort/pick actions before any tool.

**What.** Thinned `engagement.scope.cards` from five sort cards to three (data only): kept
`work_mail` (in), `personal_mail` (out) and `service_desk` (in); removed `tailgate` and
`real_customers`. Physical entry and real customers stay documented as out of scope in the RoE list
(`engagement.roe.outScope`), so the in/out teaching is not lost. The CMA and signature beat
(fairbairn's sign scene) and the P1 gate (the Recon key still waits for Gareth's signature) are
untouched. The stop-rule question and the plan picks are unchanged.

## R12 fixes (`playtests/R12.md`)

- **F2 (minor) — `ruth.ink`:** the in-person "Dev's manager rang Gareth…" lockout nudge sat below the
  throwaway and "Delivered isn't landed" hub branches, so a player who got Dev reported before the two
  easy sends landed only heard it after both had — possibly after the 2-minute lockout lapsed. Moved
  the lockout branch above those two. Line text unchanged (no TTS change).
- **F3 (trivial) — `ruth.ink` and `ruth_phone.ink`:** after a one-fact call-back, before the page was
  built, both said "Call's done." while a fact was still missing. Split the pre-page branch into
  single-fact cases that name the fact still missing (the portal, or the date) before the both-facts
  "Call's done." line. Four new voiced lines (two person, two phone) — in the TTS list.

## Bridges updated (deliberate route changes only)

- **`tools/playtest/se/bridge-6.jsonl`:** lab7 (scope sort 5→3) changed SC1/SC4/SC5/SC7/SC8/RS1
  (item counts, the tailgate card, pile membership), and lab4 changed RP1's unseen-note assertion.
  Updated those assertions to the new route. bridge-6 then passes 36/36.
- **bridge-5 and r4-door:** unchanged; no route change, both pass as before.
- **`test/js/social-lab-ruth-phone-keys.test.mjs`:** the stage-4 one-fact case now expects the
  F3 "names the fact still missing" line instead of a bare "Now the page" (deliberate F3 change).
