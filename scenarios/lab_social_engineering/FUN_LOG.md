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

---

# R13 follow-up (2026-10-23) — fixes for the live game

R13 (`playtests/R13.md`) found one major and several minor/trivial issues in the committed fun pass
(0a1fa3007). Fixed below; not committed. Checks re-run: ink recompiled 7/7, dialoguelint clean (only
the known fairbairn false positive), validator `--strict-social` clean, 110 social-* / validator-social-*
test files pass, and bridge-6 (36/36), bridge-5 (29/29), r4-door (3/3) each pass headless on :3001.

## lab1 / R13 F1 (major) — the Accounts opener could not be reached live

**Root cause.** `break_escape.games.scenario_data` is a Postgres **jsonb** column, and jsonb reorders
object keys by length then bytewise. So the live `intelFacts` order is not the ERB source order: it
comes back `tech_stack, lord_intern, lord_portal, pierce_role, email_pattern, old_org_chart, …`, with
`lord_intern` (11 chars) before `pierce_role` (11 chars, p > l). `blankSlot()` resolves Dev's team
slot from the first team→"finance" provider in that order — `lord_intern`, tagged `about: "intern"` —
so my round-1 `about: "recipient"` Accounts value was filtered out. My round-1 test read the ERB
order (pierce_role first → "recipient"), so it passed while the live game failed.

**Fix (data, order-independent).** `old_org_chart` now provides the stale "Accounts" value under BOTH
`about: "intern"` and `about: "recipient"`, so the decoy survives whichever `about` blankSlot resolves
to. The right "Finance" value is already provided under both (lord_intern/intern, pierce_role/recipient),
so it is always offered too.

**Test rewritten.** `test/js/social-lab-dev-call.test.mjs` now rebuilds `intelFacts` in the jsonb order
(sorted by length, then bytewise), asserts the slot resolves to `about: "intern"` (the live condition),
asserts Accounts is offered, and has a **control** that strips the intern-tagged entry (the R13 F1 bug)
and asserts Accounts vanishes — so the test fails without the fix.

**Browser confirmation (:3001, keyless).**
- The real `PretextPrepMinigame` option-builder, on a fresh game with the 2019 org chart held, returns
  Dev's Team blank as `["finance","accounts"]` — with `Object.keys(intelFacts)` starting
  `tech_stack, lord_intern, lord_portal, pierce_role, …` (the exact jsonb order R13 saw fail). So the
  Accounts opener is now selectable in the live game.
- The live compiled Dev ink (loaded via the game's `/ink?npc=dev_service_desk` endpoint into
  `window.inkjs.Story`) offered the opener **"I'm helping Sofia Lord, your new starter in Accounts."**;
  choosing it gave Dev **"Accounts? We folded Accounts into Finance a couple of years back. What's she
  after?"**; the repair choice **"Sorry, my mistake. She's in Finance."** then appeared, and choosing it
  gave Dev **"Finance, right you are. New intern, that'll be Sofia then. What's she after?"**
- Method note: the Dev reactions were driven through the live compiled ink directly, because reaching
  the desk phone in the Operations room through the UI needs the full recon and the room key; the
  composer step (Accounts offered) was confirmed through the real minigame.

## lab5 / R13 F2 (minor) — corrected the Xero-decoy claim

The round-1 FUN_LOG said Lord's Xero decoy is "reliably held by compose time through ordinary recon".
That is wrong: Xero (`tech_stack`) comes from the careers page line "You will use Xero and Office 365.",
which no readiness slot needs, so a student on the minimal route is not offered Xero in the portal blank
(they see LedgerPay only). What the student reliably sees as Lord's live wrong options at compose time:
the greeting blank offers the wrong recipient name (Melanie, held via pierce_role) beside Sofia, and the
pretext offers the password wording beside the payslip one. The Xero portal-blank decoy appears for a
student who read the careers tools line. Making Xero guaranteed would mean adding `tech_stack` to Lord's
readiness slot and a matching board/phone pointer — a puzzle-chain and hint change — so it is flagged for
a deliberate decision, not done here.

## Trivials

- **F3 (gap names a not-yet-identified target):** the board gap lines no longer use the first name
  ("You still don't know what she does here.", "…how they receive mail from strangers."), so a target
  headed "Not yet identified" is not named by its gap.
- **F4 (pointer repeats the gap):** each slot's `goalString` is trimmed to the pointer only ("The team
  page names the staff.", "Open the careers page and select its careers inbox line."), so the "Stuck?"
  disclosure no longer repeats the gap sentence.
- **F5 (phone had no lockout line):** `ruth_phone.ink` stage 3 now shows the lockout nudge at its top
  (reusing the existing phone line) when Dev is reported before the easy sends land, mirroring the
  in-person hub. No new spoken line.
- **F6 ("How do I reach Sofia?" said "You've made the call" after a one-fact call):** `ruth.ink`
  topic_hard now names the fact still missing (the portal, or the date) before "You've made the call".
  Two new voiced lines (in the TTS list).
- **F7 (Tomasz drifts):** left alone, per the coordinator.

## Q1 reword (R13 note) — keep a reasoning step

The results row and the Q1 answer option nearly repeated ("nothing to count / can't measure" vs
"whether anyone reported"). The row now states only the mechanism: **"Reports received: none. Ledgerwell
has no button or inbox for staff to flag a suspect email or page."** — no "can't measure / Gareth will
ask which". Q1 ("which can these results NOT tell him?") now needs the step of reasoning from the datum
(no channel to flag mail → reporting is unmeasurable) rather than matching the row's wording.

## Bridge updated (deliberate)

`tools/playtest/se/bridge-6.jsonl` RP1 regex updated for the new unseenNote wording
(`/no button or inbox for staff to flag/`). bridge-5 and r4-door unchanged.
