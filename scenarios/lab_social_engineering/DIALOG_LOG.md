# Lab: Phishing and Social Engineering — Dialogue fix log

Fixer for the dialogue stage, resumable across cycles 2–5. Each cycle is a severity
table with an outcome for every finding, plus the list of every spoken line changed
(old → new) for TTS later. Do not commit (per brief).

Caps this pass (brief): in-person lines 30 words, phone lines 25. The brief governs
over the C1 reviewer's "confirm which cap" note. M4/M5 are optional tightens — done
only if the line reads better shorter.

Snapshot of the lab ink taken before any edit (for `tagdiff --old` structure proof):
`<session scratchpad>/ink_snapshot/*.ink`.

---

## Cycle 1 (fixing DIALOG_REVIEW_C1.md) — 2026-10-22

### Severity table

| ID | Sev | File:line (pre-edit) | Type | Outcome |
|----|-----|----------------------|------|---------|
| M1 | minor | fairbairn.ink:68 | spoken (Ruth) | Fixed — dropped the preachy "Most countries have one like it." tack-on; 28→22 words |
| M2 | minor | tomasz.ink:117 | spoken (Tomasz) | Fixed — 31→24 words, over either cap |
| M3 | minor | ruth.ink:198 | spoken (Ruth) | Fixed — tightened, 29→22 words |
| M4 | minor (optional) | tomasz.ink:119 | spoken (Tomasz) | Fixed — reads better shorter; split "Credit for that." as its own beat, cut filler "a thing"; 27→23 words |
| M5 | minor (optional) | tomasz.ink:123 | spoken (Tomasz) | Kept as-is — already 28w (within the 30 person cap); the tighten ("stops all of it") loses the more specific, teaching-friendlier "to a number on file … stops every line of that". Different debrief branch from M2/M4, so no shared-phrasing inconsistency |
| M6 | minor | tomasz.ink:131 | player choice label (not spoken) | Fixed — "[DMARC off p=none…]" → "[Move DMARC off p=none, plus an external-sender banner.]" to avoid momentarily reading as "turn DMARC off" |
| M7 | minor (trivial) | fairbairn.ink:77 | spoken (Gareth) | Fixed — "fake supplier" → "spoofed supplier" to match the briefing noun (ruth.ink:63) so the callback echo lands |
| W1 | worth-considering | ruth.ink:66–72 / fairbairn.ink payoff | stance var + spoken callback | Done — cheap and clean (see below) |
| W2 | worth-considering | tomasz.ink:128–136 | — | Skipped (per brief; last line before credits, nothing to pay back) |

### W1 — anonymity stance callback (done)

- New global `overpromised_anonymity` added to `scenario.json.erb` `globalVariables`
  (after `fairbairn_payoff_heard`).
- `ruth.ink` briefing: the second opening choice ("nobody will ever know it was them")
  now sets `#set_global:overpromised_anonymity:true` (placed after the spoken lines,
  before `-> brief_close`, matching the sign-knot tag convention). The setter file does
  not read it, so no `VAR` added there (same pattern as `sends_done`).
- `fairbairn.ink`: `VAR overpromised_anonymity = false` declared; Gareth's `payoff` knot
  gains a conditional callback line gated on `{ overpromised_anonymity: … }`. Fixed
  string, no printed variables (he is voiced). It rewards the over-promise moment without
  blocking the player who picked the straight answer.

### Spoken-line changes (old → new) — for TTS

1. **fairbairn.ink — Ruth Adeyemi (M1)**
   - OLD: `That signature is the difference between a test and a crime. Without it, this is an offence under the Computer Misuse Act. Most countries have one like it.`
   - NEW: `That signature is the difference between a test and a crime. Without it, you're committing an offence under the Computer Misuse Act.`
2. **fairbairn.ink — Gareth Fairbairn (M7)**
   - OLD: `She'll read it too, the one who nearly wired that invoice to a fake supplier last quarter. Nothing in it points at her. Thank you.`
   - NEW: `She'll read it too, the one who nearly wired that invoice to a spoofed supplier last quarter. Nothing in it points at her. Thank you.`
3. **fairbairn.ink — Gareth Fairbairn (W1, NEW conditional line)**
   - NEW: `You nearly promised nobody'd ever know, that first morning. I asked for the promise we could keep. You kept it.`
4. **ruth.ink — Ruth Adeyemi (M3)**
   - OLD: `Dev's manager rang Gareth about a dodgy call. Gareth promised to look into it, with a straight face. Give the desk a couple of minutes, then ring back softer.`
   - NEW: `Dev's manager rang Gareth about a dodgy call. Gareth kept a straight face. Give the desk a minute, then ring back softer.`
5. **tomasz.ink — Tomasz (M2)**
   - OLD: `Dev reported one of your calls — credit to him — but you rang back and still got what you needed. A call-back rule to a number on file stops both.`
   - NEW: `Dev reported one of your calls, credit to him. But you rang back and still got it. A call-back rule on file stops both.`
6. **tomasz.ink — Tomasz (M4)**
   - OLD: `Dev gave you what Sofia's email needed, and he reported a call too. Credit for that, but a call-back rule stops it without him noticing a thing.`
   - NEW: `Dev gave you what Sofia's email needed, and reported a call too. Credit for that. A call-back rule stops it without him noticing.`

(M6 is a player-choice label, not a voiced line — not in the TTS list.)

### Checks run

- **compile-ink.sh lab_social_engineering:** 7/7 compiled, 0 failed. The two `-> END`
  warnings (dev_service_desk hang-up, tomasz debrief→credits) are the expected legitimate
  endpoints.
- **tagdiff --old (vs pre-edit snapshot):**
  - `ruth.ink`: 1 structural diff — the intended W1 `#set_global:overpromised_anonymity:true`
    tag. Prose: 1 line changed (M3). Explained.
  - `fairbairn.ink`: 2 structural diffs — the intended W1 `VAR overpromised_anonymity` and
    the `{ overpromised_anonymity }` condition in `payoff`. Prose: M1, M7, new W1 line. Explained.
  - `tomasz.ink`: STRUCTURE UNCHANGED. Prose: 3 lines (M2, M4, and the M6 label reword, which
    tagdiff counts as prose). Explained.
  - No unintended structural changes.
- **dialoguelint:** only finding is `phone-self-prefix` on fairbairn.ink (the Ruth two-hander
  line) — the known false positive (Fairbairn is a person NPC the lint misclassifies as phone);
  NOT actioned, per brief. No line-length errors; all lines within caps (ruth max 25, tomasz
  max 28, phone files ≤ 23).
- **validate_scenario.rb --strict-social:** no errors. Only pre-existing warnings: the three
  `mutuallyExclusiveGlobals` on Ruth's eventMappings (left alone, per brief) and the
  `#speaker:narrator` / no top-level narrator voice-block warning (pre-existing; audio/voice
  layer, not a dialogue finding). The new `overpromised_anonymity` global triggers nothing.
  (The validator regenerated `dungeon_graph.*` as a side effect.)
- **Lab Node tests (test/js/social-lab-*):** 23 pass, 2 fail — both in
  `social-lab-ruth-keys.test.mjs` ("Recon key given on the hub reopen"; "withheld until Gareth
  signed"). **Pre-existing, not caused by this pass.** Verified: HEAD's committed `ruth.json`
  returns the same empty give-item list as the edited one. The test's `reopen` helper replays
  the briefing from the choices' source knot without choosing, so `greeted` never gets set
  (it is set in `brief_close`) and the flow never reaches the `hub`→`keys` tunnel. The
  briefing choice at HEAD is byte-identical to the snapshot, so this is a stale test vs the
  briefing-choice structure, not a dialogue regression. Flagged for the orchestrator.
  `social-lab-ruth-payoff-lines` (3/3), `social-lab-fairbairn-scenes` (1/1),
  `social-lab-ruth-phone-keys` (7/7) all pass.
- **bridge-6 (headless, Node 24 ~/.cache/ms-playwright-go/1.57.0/node, keyless :3001):** FAIL
  58/36, and bridge-r4-door FAIL 1/3. **Pre-existing/environmental, not caused by this pass.**
  All 14 bridge-6 failures are in the report-workstation minigame (`getTestState` null,
  `container` null, `s.confirmed is not iterable`, `spoofed_colleague` undefined) — report
  UI/app-code paths that none of my dialogue edits touch. r4-door fails on `recon_room.lockedHint`
  and the engagement-office door sprites, which I never touched. The working tree has an
  uncommitted change to `public/break_escape/js/core/game.js` (another agent's in-flight work)
  that the running :3001 server reflects. Flagged for the orchestrator; out of the dialogue
  fixer's scope.

### Files changed this cycle

- `scenarios/lab_social_engineering/scenario.json.erb` (globalVariables: + `overpromised_anonymity`)
- `scenarios/lab_social_engineering/ink/ruth.ink` (M3 + W1 set_global) and recompiled `ruth.json`
- `scenarios/lab_social_engineering/ink/fairbairn.ink` (M1, M7, W1) and recompiled `fairbairn.json`
- `scenarios/lab_social_engineering/ink/tomasz.ink` (M2, M4, M6) and recompiled `tomasz.json`
- The other lab ink `.json` files were re-emitted by `compile-ink.sh` but are byte-identical
  to their sources (no `.ink` change).
- `scenarios/lab_social_engineering/dungeon_graph.*` regenerated by the validator (side effect).

---

## Cycle 1 follow-up — the flagged test/bridge failures — 2026-10-22

Coordinator confirmed the root cause: commit **9d6a7fba** moved `~ greeted = true` from
`start` into `brief_close` on purpose, so an Esc + reload now replays Ruth's opening. Not
to be reverted; our checks adapt to it.

### Lab Node tests (test/js/social-lab-*)

- **Root cause of the 2 `social-lab-ruth-keys.test.mjs` failures:** the test built its
  starting `saved` state by draining `start` without ever choosing a briefing option. Since
  9d6a7fba, `greeted` is set in `brief_close`, so an unchosen briefing never leaves `start`;
  the `reopen` helper then kept replaying the briefing and never reached the `hub`→`keys`
  tunnel, so no key was handed over.
- **Fix:** in the two affected test cases (lines ~55 and ~95), after the initial drain, pick
  the briefing option (`ChooseChoiceIndex(0)`) and drain to the hub before saving — the way
  test 3 already did (which is why it passed) and the way a player does. The shared `reopen`
  helper was left unchanged, because it also drives hub reopens where picking a briefing choice
  would be wrong.
- **Result:** `social-lab-ruth-keys` 3/3, and all `social-lab-*` 14/14 pass.
- **Separate, out of scope:** the full `social-*` suite shows 8 failures, all in **untracked**
  `social-gap-*` test files (the deduction/"gap" workstream's WIP; e.g. `social-gap-mail-bridge`
  "sent is NaN" on a partial-metrics restore). None reference anything in this stage; not mine.

### Bridges (headless, Node 24, keyless :3001)

- **bridge-6 and bridge-r4-door are not actually broken.** Run **isolated and serially** they
  pass: bridge-6 **36/36** (confirmed twice), bridge-r4-door **3/3**. The reload step in
  bridge-6 (the one that exercises the 9d6a7fba replay) passes; its lone
  `waitFor … Execution context was destroyed … navigation` warning is benign and present on the
  passing run.
- **Root cause of the earlier suite FAILs:** concurrency. `run-suite.sh` runs up to 3 bridges
  at once against :3001, and a human browser tester is also playing the lab on :3001. Under that
  load the game page did not finish initialising within the step timeout, so assertions saw
  `window.__test` / `window.gameScenario` / `container` as null and the page navigated
  mid-assertion. The failing step set was different on each suite run (14 report-workstation
  steps one run, 3 scope/plan steps the next) — the signature of flakiness, not a real defect.
- **Not the `greeted` change:** the reload steps pass isolated.
- **Not the uncommitted `public/break_escape/js/core/game.js` preload:** every awareness asset
  it now references exists on disk (`rooms/room_aw_*.json`, `tiles/rooms/room_aw_*.png`,
  `objects/aw_logo_*1.png`, `objects/aw_poster_report_*1.png`), and the lab loads cleanly in
  isolation. No missing-asset load error.
- No bridge `.jsonl`, `game.js`, or awareness file was touched.

### Files changed this follow-up

- `test/js/social-lab-ruth-keys.test.mjs` — the two starting-state setups now reach
  `brief_close` by choosing the briefing option (adapts to 9d6a7fba). No production code changed.

---

## Cycle 2 — DIALOG_REVIEW_C2.md + R11 browser-pass findings — 2026-10-22

Caps unchanged (30 person / 25 phone). Snapshot baseline for `tagdiff --old` is the same
cycle-1 pre-edit snapshot; cycle-1 diffs (the W1 set_global tag) still show against it and
are already explained above.

### Severity table

| ID | Sev | Where | Outcome |
|----|-----|-------|---------|
| m-C2-1 | minor | ruth.ink:67 (Gareth) | Fixed — dropped the "read that sheet properly" echo of brief_close; "Good answer. Get it right and I'll put my name to it." |
| m-C2-2 | minor (optional) | ruth.ink:213 (Ruth) | Fixed — removed the double "all three"; "…All three were right. Her own service desk handed us every one. That's your finding." Kept the lesson (the three facts she checked map to the three the desk gave); used a full stop, not the reviewer's em dash, per house style |
| w-C2-1 | worth-considering | ruth.ink:220 (Ruth hub else) | Done — third alternation now "Still here. Earning my fee." (was "Still here. Good."), giving her the boss-but-fond dry beat her castmates have |
| R11 F1 | minor | ruth.ink:198, ruth_phone.ink:151 | Fixed — the lockout line was gated `not pretext_call_done`, which the date already set, so it never showed on the date→reported→portal route. Re-gated both on `pretext_call_reported and not (se_intel_lord_portal_name and se_intel_lord_payslip_date)`: the lockout now shows whenever Dev was reported and both facts aren't held, and clears once they are. Line text unchanged (no re-voice) |
| R11 F3 | minor | ruth.ink:194 | Fixed — the throwaway nag was gated only `not phish_hampshire_landed`, so it showed after Melanie or Sofia landed from the guest account. Now `not (phish_hampshire_landed or phish_pierce_landed or phish_lord_landed)` — gone once any target has landed |
| R11 F4 | trivial | ruth.ink topic_account | Fixed — split the Chris/Melanie line into two conditional lines: Chris's clause shows only `not phish_hampshire_landed`, Melanie's only `not phish_pierce_landed`. No more "Melanie's trickier" after she's landed |
| R11 F5 | minor | ruth.ink hub (new branch + topic_report gate) and scenario.json.erb objectives | Fixed — see below |

### R11 F5 — Sofia landed out of order (two parts)

- **Dialogue:** added a hub branch above the throwaway / "delivered isn't landed" branches,
  gated `phish_lord_landed and not (phish_hampshire_landed and phish_pierce_landed)`:
  *"Sofia's in, but the report needs all three. Whoever's left still has to act before you can
  write it up."* Also gated the "What goes in the report?" hub choice on all three landed (was
  just `phish_lord_landed`), so the report topic no longer appears on the Sofia-first route.
  The phone needed nothing: its stage3 already points at the remaining sends when Careers/Melanie
  aren't both landed.
- **Objective data fix (authorised: "make it if it's in scenario.json.erb objectives"):** the
  "report" aim unlocked on `aimCompleted: "phish_hard"` (landing Sofia), which announced
  "New Objective: Write the report" even though the report workstation needs `sends_done`
  (all three). Changed its `unlockCondition` to `{ "globalVariable": "sends_done", "equals": true }`.
  This scenario sets `"social"`, so `game.js:1694` runs the objectives manager with
  `liveGlobalUnlock`, and `objectives-manager.js watchGlobalUnlocks` opens the aim the moment
  `sends_done` flips (the three `setGlobal: sends_done` eventMappings, scenario L1409-1411).
  On the normal route Sofia lands last, so `sends_done` and `phish_hard` complete together and
  the timing is unchanged; on the P2 route the aim stays story-gated (hidden) until all three
  land, so no premature announcement. No engine change.

### Spoken-line changes (old → new) — for TTS

1. **ruth.ink — Gareth (m-C2-1)**
   - OLD: `Good answer. Show me you've read that sheet properly and I'll put my name to it.`
   - NEW: `Good answer. Get it right and I'll put my name to it.`
2. **ruth.ink — Ruth (m-C2-2)**
   - OLD: `Sofia checked the sender, the portal's name and the date. All three were right. Her own service desk gave us all three. That's your finding.`
   - NEW: `Sofia checked the sender, the portal's name and the date. All three were right. Her own service desk handed us every one. That's your finding.`
3. **ruth.ink — Ruth (w-C2-1, hub `else` alternation, third option only)**
   - OLD: `Still here. Good.`  (within `{&Need me?|Something else?|Still here. Good.}`)
   - NEW: `Still here. Earning my fee.`
4. **ruth.ink — Ruth (R11 F5, NEW hub line)**
   - NEW: `Sofia's in, but the report needs all three. Whoever's left still has to act before you can write it up.`
5. **ruth.ink — Ruth (R11 F4, topic_account split)** — one combined line became two standalone
   conditional lines; the Chris sentence is now voiced on its own:
   - OLD (one line): `Chris's careers inbox takes anything. Melanie's trickier — you'll have to work out what gets past her.`
   - NEW (line a, shows `not phish_hampshire_landed`): `Chris's careers inbox takes anything.`
   - NEW (line b, shows `not phish_pierce_landed`): `Melanie's trickier — you'll have to work out what gets past her.`

R11 F1's lockout lines (ruth.ink:199, ruth_phone.ink:152) changed only in their gating
condition, not their spoken text, so they need no re-voicing.

### Checks run

- **compile-ink.sh:** 7/7, 0 failed (expected `-> END` warnings only).
- **tagdiff --old (vs cycle-1 snapshot):** ruth.ink — 10 structural diffs, all intended (the
  cycle-1 W1 tag; the F5 branch condition; F3/F1 condition rewrites; the two F4 topic_account
  conditions; the topic_report choice-gate change). ruth_phone.ink — 2 diffs, the F1 condition
  swap only (prose unchanged). No unintended structural change.
- **dialoguelint:** only the known fairbairn phone-self-prefix false positive (not actioned).
  No line-length errors; ruth max 25, ruth_phone max 23 — within caps.
- **validator --strict-social:** no errors; no missing recommended fields; only the three
  pre-existing `mutuallyExclusiveGlobals` warnings (left alone, per brief). `overpromised_anonymity`
  and the new `sends_done` objective gate trigger nothing.
- **loopcheck (200 steps × 6 strategies):** clean on ruth@start, ruth@hub, ruth_phone@hub,
  ruth_phone@stage4 — the changed conditions create no starved knot.
- **Lab Node tests (test/js/social-lab-*):** 14/14 pass. `social-lab-ruth-phone-keys` stage-4
  test was updated to F1's new route (the lockout persists until both Dev facts are held, not
  until the first successful call) — a deliberate route change, so the test was adapted rather
  than the code. (The separate `social-gap-*` untracked workstream failures from the follow-up
  are unchanged and out of scope.)
- **bridge-6 (headless, Node 24, run on its own):** 36/36 PASS (the lone benign reload
  `waitFor` navigation warning as before). Note: bridge-6 does not cover the P2 (Sofia-first)
  route, so the F5 objective-timing fix is verified by the engine wiring (social →
  liveGlobalUnlock → watchGlobalUnlocks on sends_done) and loopcheck, not by a P2 browser run;
  a blind P2 playtest would confirm it live.

### Files changed this cycle

- `scenarios/lab_social_engineering/ink/ruth.ink` (m-C2-1, m-C2-2, w-C2-1, F1, F3, F4, F5) and recompiled `ruth.json`
- `scenarios/lab_social_engineering/ink/ruth_phone.ink` (F1) and recompiled `ruth_phone.json`
- `scenarios/lab_social_engineering/scenario.json.erb` (F5 report-aim unlockCondition → sends_done)
- `test/js/social-lab-ruth-phone-keys.test.mjs` (stage-4 test adapted to F1's new route)
- `scenarios/lab_social_engineering/DIALOG_LOG.md` (this section)

---

## Cycle 3 — DIALOG_REVIEW_C3.md — 2026-10-22

Caps unchanged (30 person / 25 phone). Snapshot baseline for `tagdiff --old` is still the
cycle-1 pre-edit snapshot. Cycle 2 committed in `ade3912f2`.

### Severity table

| ID | Sev | Where | Outcome |
|----|-----|-------|---------|
| M-C3-1 | minor | ruth.ink:200, ruth_phone.ink:151 | Fixed — narrowed the lockout gate to zero-facts (option (a)); see why below. Gate-only, no spoken-text change |
| M-C3-2 | minor | ruth_phone.ink stage3 opener | Fixed — door/key opener now shows only when nothing has landed; else an in-progress steer. See below |
| w-C3-1 | worth-considering | tomasz.ink:118-119, scenario.json.erb:174 | Traced (unreachable), kept as a safety net with a one-line comment in each file. See the trace below |
| w-C3-2 | worth-considering | tomasz.ink:120 vs :122 | No change (per brief; recorded by the reviewer so a later cycle doesn't "simplify" the leaned-on variant away) |

### M-C3-1 — chosen fix and why

Picked **option (a): narrow the lockout gate to `pretext_call_reported and not
se_intel_lord_portal_name and not se_intel_lord_payslip_date`** (zero facts held), on both
ruth.ink:200 and ruth_phone.ink:151 (both were re-gated identically in cycle 2, so they move
together). Why it gives the most useful line at each point on the Dev-reported route:

- **Zero facts held:** the lockout "give the desk a minute, then ring back softer" shows —
  correct, Dev is touchy and they have nothing yet.
- **One fact held (they rang back successfully):** the stale "ring back softer" clears, and the
  hub's own specific branch takes over — page built ⇒ ruth.ink:208/:210 "ring him back for the
  portal / the date"; page not yet built ⇒ ruth.ink:202 "Call's done. Now the page" (a real next
  step). On the phone, stage 4 falls through to "Now the page" and stage 5 then names the exact
  missing fact. No `else`-fallback gap — ruth.ink:202 (`…pretext_call_done and not
  landing_payroll_login_built`) catches the page-not-built case.
- **Both facts held:** lockout clears, flow proceeds to "write to Sofia".

Option (b) (keep the lockout until both facts) left the "ring back softer" steer up after a
successful call-back, which reads as though no call-back had happened. Spoken text is unchanged
either way, so no re-voice.

### M-C3-2 — phone stage3 opener

The door/key opener ("Operations now. If that door's locked, I've got the key — come and see
me.") read backward once the player was already inside Operations. Wrapped it:
`{ not (phish_hampshire_landed or phish_pierce_landed or phish_lord_landed): <door line>
- else: The rest still have to act in Operations before there's a report. }`. I included
`phish_lord_landed` in the gate (the reviewer's proposed gate omitted it) because the headline
case is Sofia-first with neither easy target landed — without the lord term the door line would
still show there, leaving the finding unfixed. Now the door line appears only at true first
entry (nothing landed); once anything has landed the else steer shows. This also tidies the
normal in-order route (the opener stops saying "if that door's locked" after the first send).

### w-C3-1 — reachability trace of the "reported, not got_it" branch

**Conclusion: unreachable on any path that reaches Tomasz's debrief; kept as a safety net.**

- Reaching `tomasz.ink`'s debrief requires `report_filed` → `sends_done` → Sofia landed, which
  (Lord mail design) requires both `se_intel_lord_portal_name` and `se_intel_lord_payslip_date`.
- Those facts come only from a *granting* Dev ask, i.e. a `got_it` outcome (R11 earned-secrets
  table; no hint leaks them).
- `got_it` is sticky: `person-chat-pretext.js finalisePretext` (lines 355-363) writes
  `pretext_${callId}_outcome = alreadyGotIt ? 'got_it' : outcome`, so once any call grants a
  fact the outcome global stays `'got_it'` for good, even if a later call is reported.
- Therefore at the debrief `pretext_service_desk_call_outcome === 'got_it'` always holds, so the
  first branch (`dev_reported && … === 'got_it'`, tomasz.ink:116) wins whenever a call was also
  reported, and the `dev_reported` (implicitly `!== 'got_it'`) branch at tomasz.ink:118 — and the
  mirror credits line at scenario.json.erb:174 — can never fire from here.

Kept both (not removed): the branch guards a sensible nuance, the cost of keeping dead-but-correct
text is nil, and the outcome mechanics could change. Added a one-line `//` comment above the ink
branch and an `<%# %>` comment above the credits line recording that it's a deliberate safety net.
(Outcome/sticky mechanics are formally `scenario-design-review`'s to own; this is the dialogue-side
trace the brief asked for.)

### Spoken-line changes (old → new) — for TTS

1. **ruth_phone.ink — Ruth (M-C3-2, NEW stage3 else line)**
   - NEW: `The rest still have to act in Operations before there's a report.`

M-C3-1 is gate-only (the lockout lines' text is unchanged). w-C3-1 is comments only. No other
spoken text changed.

### Checks run

- **compile-ink.sh:** 7/7, 0 failed (expected `-> END` warnings only; the w-C3-1 `//` comment
  inside tomasz's debrief switch compiles fine).
- **tagdiff --old (vs cycle-1 snapshot):** ruth.ink — the L200 condition now shows the
  zero-facts gate; all other diffs are the already-explained cycle-1/2 changes. ruth_phone.ink —
  the stage3 conditional (new condition + else) and the stage4 zero-facts gate. tomasz.ink —
  STRUCTURE UNCHANGED (comment only). No unintended structural change.
- **dialoguelint:** only the known fairbairn phone-self-prefix false positive. No line-length
  errors; ruth max 25, ruth_phone max 23 (the new else line is 12 words).
- **validator --strict-social:** no errors, no missing recommended fields; only the three
  pre-existing `mutuallyExclusiveGlobals` warnings (left alone). The w-C3-1 ERB comment renders
  and the JSON parses.
- **loopcheck (200 steps × 6 strategies):** clean on ruth@start, ruth@hub, ruth_phone@hub,
  ruth_phone@stage3, ruth_phone@stage4, tomasz@start — the changed conditions create no starved knot.
- **Lab Node tests (social-lab-*):** 14/14. Two `social-lab-ruth-phone-keys` cases were adapted
  to the deliberate cycle-3 route changes: the stage-4 lockout test now expects the lockout to
  clear once any fact is in (M-C3-1), and the "C4 n4" stage-3 test now expects the suppressed
  door-opener / else steer (M-C3-2). Code changed for a reason → tests follow it.
- **bridge-6 (headless, Node 24, on its own):** 36/36 PASS (the lone benign reload `waitFor`
  navigation warning as before). bridge-6 covers neither the Dev-reported nor the Sofia-first
  route, so M-C3-1 and M-C3-2 are verified by loopcheck and the Node tests, not a browser run;
  a blind playtest of those two edge routes would confirm them live.

### Files changed this cycle

- `scenarios/lab_social_engineering/ink/ruth.ink` (M-C3-1) and recompiled `ruth.json`
- `scenarios/lab_social_engineering/ink/ruth_phone.ink` (M-C3-1, M-C3-2) and recompiled `ruth_phone.json`
- `scenarios/lab_social_engineering/ink/tomasz.ink` (w-C3-1 comment) and recompiled `tomasz.json`
- `scenarios/lab_social_engineering/scenario.json.erb` (w-C3-1 credits comment)
- `test/js/social-lab-ruth-phone-keys.test.mjs` (two cases adapted to M-C3-1 / M-C3-2)
- `scenarios/lab_social_engineering/DIALOG_LOG.md` (this section)
- `dungeon_graph.*` regenerated by the validator (side effect).

---

## Cycle 4 — DIALOG_REVIEW_C4.md — 2026-10-22

Caps unchanged (30 person / 25 phone). Snapshot baseline for `tagdiff --old` is still the
cycle-1 pre-edit snapshot. Cycle 3 committed in `7e862a2db`. An R12 Sonnet tester was on :3001
during this cycle; all edits are wording/data only, no servers touched, bridge-6 run on its own.

### Severity table

| ID | Sev | Where | Outcome |
|----|-----|-------|---------|
| M-C4-1 | minor | scenario.json.erb Recon barks (×2) | Fixed — both Recon barks are now a plain nudge, no longer echoing Ruth's hand-over clause. Blue-Team bark left (see why) |
| M-C4-2 | minor | ruth_phone.ink stage3 door line | Fixed — reworded so it no longer rhymes with stage 2's "if that door's locked…", pointer kept |
| W-C4-1 | worth-considering | fairbairn.ink:92 (why topic) | Done — trimmed the repeated incident; Gareth's `why` now gives the fear angle, not the invoice story again |
| W-C4-2 | worth-considering | scenario.json.erb Hampshire landed reply | Done — gave Chris's flat reply character, tied to the CV-backlog recon fact |
| W-C4-3 | worth-considering | scenario.json.erb handle_decoy | Done — the dead-end OSINT lead now returns a dry result that teaches the lesson |

### M-C4-1 — Recon barks (both)

The two paired-but-exclusive Recon barks read "Plan's good and Gareth's signed. The Recon key's
ready for you." — the same opening clause as Ruth's in-person hand-over (ruth.ink:156), so the
player read it, walked over and heard it again. Both now read (kept identical, since only one
fires per run): **"Plan's signed off. Come and grab the Recon key when you're ready."** — a plain
nudge to collect; the teaching rider ("open-source intelligence only…") stays only on Ruth's line.

**Blue-Team bark left as-is.** "Report's filed. The Blue Team key's ready, and Gareth wants a
word." shares only the two words "Report's filed" with Ruth's hand-over, and the bark carries
distinct, useful information (key ready + Gareth wants a word). The reviewer judged it borderline
and recommended leaving it; a reword risked the "first"-ordering implication for no real gain.
The Operations bark has no echo with its in-person line, so it was not touched.

### M-C4-2 — phone stage3 door line

Stage 2 (ruth_phone.ink:113) and stage 3 both opened "…If that door's locked, I've got the key —
come and see me.", heard word-for-word on consecutive stages. Stage 3's door line now reads
**"Operations next, if you've not been in. The key's with me whenever the door won't open."** —
still points the student back to Ruth for the key, no longer rhymes with stage 2. The `else`
steer and the choices are unchanged.

### W-C4-1 / W-C4-2 / W-C4-3

- **W-C4-1 (invoice twice):** trimmed. Gareth's `why` was "Because one of mine nearly wired away a
  month's billing…" — the same incident the briefing already tells. Now **"Because next time it
  won't be caught, and I'd rather learn that from you than a thief."** — the fear, not the incident,
  so a player who digs right after the briefing gets a new angle, and the end payoff still has its setup.
- **W-C4-2 (Hampshire reply):** the careers auto-reply "Thanks, I'll get to this CV before Friday."
  is now **"Cheers, straight onto the Friday pile with the rest."** — character (an overwhelmed
  careers inbox) and a callback to the CV-backlog recon fact. Mail-UI text, not voiced.
- **W-C4-3 (handle_decoy dead end):** the `@mpierce_official` lead returned an empty array. It now
  returns one dry result: **"@mpierce_official: parked account, no posts since the day it was made.
  Not Melanie — anyone can register an official-looking handle."** Rewards the click and teaches that
  an official-looking handle proves nothing, while staying a dead end (grants no `fact`, so no gating
  change). Result-card text, not voiced.

### Spoken-line changes (old → new) — for TTS

1. **scenario.json.erb — Ruth phone bark (M-C4-1, both Recon barks, identical)**
   - OLD: `Plan's good and Gareth's signed. The Recon key's ready for you.`
   - NEW: `Plan's signed off. Come and grab the Recon key when you're ready.`
2. **ruth_phone.ink — Ruth phone (M-C4-2, stage3 door line)**
   - OLD: `Operations now. If that door's locked, I've got the key — come and see me.`
   - NEW: `Operations next, if you've not been in. The key's with me whenever the door won't open.`
3. **fairbairn.ink — Gareth (W-C4-1, why topic)**
   - OLD: `Because one of mine nearly wired away a month's billing, and I'd rather learn it from you than a thief.`
   - NEW: `Because next time it won't be caught, and I'd rather learn that from you than a thief.`

The Hampshire reply (W-C4-2) and the handle_decoy result (W-C4-3) are mail-UI / result-card text,
not voiced, so they are not in the TTS list.

### Checks run

- **compile-ink.sh:** 7/7, 0 failed (expected `-> END` warnings only).
- **tagdiff --old (vs cycle-1 snapshot):** fairbairn.ink and ruth_phone.ink — every structural diff
  is an already-explained cycle-1/2/3 change (fairbairn's W1 VAR + payoff condition; ruth_phone's
  cycle-3 stage3 conditional + stage4 gate). Cycle-4's ink edits are prose-only (the why line and the
  stage3 door line), confirmed in the prose counts, no new structural diff.
- **dialoguelint:** only the known fairbairn phone-self-prefix false positive. No line-length errors;
  ruth_phone max 23, fairbairn max 25 (the new door line is 16 words, the new bark 12).
- **validator --strict-social:** no errors, no missing recommended fields; only the three pre-existing
  `mutuallyExclusiveGlobals` warnings. The scenario.json.erb edits (barks, Hampshire reply, decoy
  result) all parse.
- **loopcheck (200 steps × 6 strategies):** clean on ruth_phone@stage3, fairbairn@start, fairbairn@hub
  (the files whose text changed) — no starved knot.
- **Lab Node tests (social-lab-*):** 14/14. One `social-lab-ruth-phone-keys` case (the stage-3 opener
  "points back to Ruth") had its regex widened to accept the M-C4-2 wording ("The key's with me…")
  alongside the old "come and see me"; the assertion still proves the opener points to Ruth for the key.
- **bridge-6 (headless, Node 24, run on its own):** 36/36 PASS (lone benign reload `waitFor`
  navigation warning). Run isolated, not via the suite, so it did not disturb the R12 tester's session.

### Files changed this cycle

- `scenarios/lab_social_engineering/scenario.json.erb` (M-C4-1 both Recon barks; W-C4-2 Hampshire reply; W-C4-3 handle_decoy result)
- `scenarios/lab_social_engineering/ink/ruth_phone.ink` (M-C4-2 stage3 door line) and recompiled `ruth_phone.json`
- `scenarios/lab_social_engineering/ink/fairbairn.ink` (W-C4-1 why topic) and recompiled `fairbairn.json`
- `test/js/social-lab-ruth-phone-keys.test.mjs` (stage-3 opener regex widened for M-C4-2)
- `scenarios/lab_social_engineering/DIALOG_LOG.md` (this section)
- `dungeon_graph.*` regenerated by the validator (side effect).

## Fun-and-learning pass (2026-10-22) — spoken-line changes for TTS

New voiced lines from the fun-and-learning changes (`FUN_LOG.md`) and the R12 F3 fix. The lab is not
yet voiced, so these are listed for when audio is generated; nothing here is a re-word of an existing
cached line except where noted. Caps held (person ≤30, phone ≤25). dialoguelint: ruth max 25, ruth_phone
max 23, tomasz max 28; no line-length errors.

### lab3 — Tomasz debrief mirror (`tomasz.ink`, person)

1. **NEW:** `Two of those were yours. Melanie's and Sofia's, straight out of your outbox.`
2. **reused:** `Bit different reading them from this side, isn't it? The headers had you the whole time.`
   — identical to the existing `own_mail` line, so same TTS cache key, no new audio.

### R12 F3 — one-fact call-back names the missing fact

3. **NEW (`ruth.ink`, person):** `Call got the date, not the portal's name or sender. Ring Dev back for those, and build the look-alike page.`
4. **NEW (`ruth.ink`, person):** `Call got the portal, not the payslip date. Ring Dev back for it, and build the look-alike page.`
5. **NEW (`ruth_phone.ink`, phone):** `Call got the date, not the portal. Ring Dev back for its name and sender, then the page.`
6. **NEW (`ruth_phone.ink`, phone):** `Call got the portal, not the date. Ring Dev back for it, then the page.`

R12 F2 only reordered Ruth's existing lockout line (no text change, no TTS). lab1/lab2/lab4/lab6/lab7
touched data and UI text (board/report/triage), none of it voiced.
