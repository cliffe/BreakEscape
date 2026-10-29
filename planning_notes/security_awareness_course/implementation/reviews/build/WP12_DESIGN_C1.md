# WP-12 "First-play brief (core_00) and annual edition (core_17)": design C1 + dialogue C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the `E9_DESIGN_C2_DIALOG_C1.md` / `E12_DESIGN_C1.md` reviews in this folder for format and bar. Specs: `00_README.md` (WP-12) and `11_WP12_FIRST_PLAY_AND_ANNUAL.md`; module `concepts.md` for core_00 and core_17.

Two pieces in one review:
- **core_00** `scenarios/awareness_core_00_first_play/` — a brief-only episode (ENG-10 `variant: "brief"`), host Anjali Rao at Quayholt Insurance.
- **core_17** `scenarios/awareness_core_17_annual_2027_defend/` — a `defendOnly` annual mixed edition, 8 messages drawn from E1/E3/E5/E6/E7, host Graham Whitfield (neutral proctor, Brightwell default).

Scope read end to end: both shells (scenario.json.erb, mission.json, ink); the source fragments `awareness/e{1,3,5,6,7}/defend.json` for the 8 reused items; the WP-12 spec; and the engine the findings depend on (`episode-runner-minigame.js` ENG-10 paths, `episode-model.js` `variantOf`/`stagesFor`, `inbox-triage/triage-kinds.js` call rendering, `triage-scoring.js`).

How screens were judged:
- **core_00: from a live render.** Node 24 is present here (`v24.11.1`), so I ran the `core00` bridge on the keyless :3001 server: game 4989, **10/10 PASS**, covering the fresh-game state, the 7-card brief with Back/Next/"Card n of 7", the "Got it" completion, the done global, the host task mapping, and the close-and-reload (second-visit) path.
- **core_17: from code and authored data.** The spec says core_17 has **no bridge job**, and there is none in `run-suite.sh` (`JOBS` has `core00` but no `core17`); I did not author one (read-only). The defend-set and debrief copy is judged from the authored data, the reshape against the E3 source, and `triage-kinds.js`/`triage-scoring.js`.

Ran (both shells):
- `validate_scenario.rb --strict-social --no-graph --skip-ink`: **both pass**, schema clean, no social errors or warnings. Only the generic m01-style suggestions (add VM launcher / hostile NPC / lock variety / timedConversation), which never apply to an awareness episode.
- `dialoguelint.mjs`: **core_00 clean** (anjali_rao `lines=3 median=17 max=22`, no rule hits). **core_17 one ERROR** — `graham_whitfield.ink:24` is **41 words** against the 30 cap (MA1 below). This is the item the brief flagged.
- Em/en dash scan: core_00 clean. core_17 carries **one em dash** (line 92, the E1 bank subject), copied verbatim from the shipped E1 shell, which ships the same em dash (`awareness_e1_invoice_fraud/scenario.json.erb:150`). Noted below (mi2), not a core_17-introduced defect.
- Every reused id confirmed present in its source fragment (e1_lookalike_bank, e1_bank_confirmed, e3_push_early, e3_call_gordon_impostor, e3_call_gordon_real, e5_sso_lookalike, e6_shift_moved, e7_vm_ravinder_cloned), and the two E3 calls' reshape (tells → `truth.flags`, notes → `truth.perFlagNote`/`whyFine`, `ifTrusted`/`reportReply` carried, `claims` dropped, `isPhish` set from `genuine`) checked against the source objects and is faithful.

## Counts

### core_00 (first-play brief)

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** |

Clean. Two observations (not findings) recorded below. Shape: `variant: "brief"`, `stages: ["brief"]`, 7 `briefCards`, `oncePerLearner: true`, `doneGlobal: episode_core_00_first_play_done`.

### core_17 (annual mixed edition)

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 0 | 0 | 1 |
| Minor | 2 | 0 | 0 | 2 |
| **Total** | **3** | **0** | **0** | **3** |

Shape: `variant: "defendOnly"`, `stages: ["brief","defend","debrief"]`. Defend set `annual_2027_mixed`, **8 messages**: 5 phish, 3 genuine, across email (2), call (2), voicemail (1), SMS (1), push (1) and a sign-in page (1), from Brightwell, Quayholt and Tarrowby, with one mirror pair (impostor Gordon → real Gordon). `channelTells` are all `00`-library ids; `verifyVerdict: true`; `feedbackMode: "immediate"`; `passPercent: 0`; `setGlobalPrefix: "episode_core_17_annual_2027_defend_defend_"`. No `defend.calls` key (calls reshaped into `messages`). No `flip*` strings (clean, unlike E12 MI1). All three findings are the shared-generator / shared-scorer / source-copy class already recorded across E9/E12/E18, none episode-local.

## What works

### core_00
- **A first-time learner is oriented in full and in order.** The 7 cards follow the spec beats exactly: Welcome and scope; How it works; Nothing real is asked for; What we record and who sees it; Why anyone targets you; The habit to keep; Report and no blame. The scope note ("An authorised exercise at Quayholt Insurance, a fictional company. Everything here is practice; nothing you do leaves the game.") shows on card 1, and the `scenario_brief` repeats it. **"Authorised exercise at a fictional company" is unmistakable.**
- **The kiosk and the verdicts are explained before the learner meets them.** Card 2 names the stages (brief, attack half, flip, scored defend half, debrief) and the verdicts ("Trust, Report, Delete, and sometimes Verify, then tick what gave each item away"), and states "Only the defend half is scored. The attack half never is." Card 4 gives what is recorded (items, verdicts, flags, times; no free text, no identity; organiser group figure; never for discipline).
- **The rule of thumb is quoted exactly** (card 6 and `awareness.ruleOfThumb`), matching `AWARENESS_RULE_OF_THUMB_TEXT`; the validator's rule-of-thumb path and the em-dash scan are clean. "Pause. Check. Report." is correctly not used.
- **How to start is clear.** Anjali says "Open the kiosk for a short brief before your first episode. It's all practice." and the kiosk observation reads "ready to read".
- **The second visit behaves sensibly, confirmed live.** `_seenAlready()` (`episode-runner-minigame.js:301`) returns true when `oncePerLearner === true` and the done global is set, and `_render` (`:375`) then shows `_renderFinished` with `strings.alreadySeen` ("You have seen this already. Start your first episode whenever you are ready.") rather than re-running the 7 cards. The bridge's close-and-reload steps pass, so this is verified on-screen, not only in code.
- **Short, no-blame, voices well.** `durationTargetMin: 5`, 7 short cards; Anjali's two lines are calm and within the word cap (dialoguelint max 22); no printed variables; the no-blame beat is explicit ("Reporting is never wrong, and reporting a mistake quickly is thanked, not blamed.").

### core_17
- **A fair, matched refresher across the year.** 5 phish / 3 genuine across six channels and three companies in 8 items (the `EPISODE_MESSAGES` cap), with the awkward genuine (real, grumpy Gordon) placed right after its impostor twin, and the genuine bank confirmation right after the look-alike bank phish. Keeping three genuine items answers the module's "gotcha festival" pitfall: refusing everything is wrong on three of eight.
- **The two E3 calls are reshaped faithfully as data.** The source `tells`, `notes.perFlagNote`, `notes.whyFine`, `ifTrusted` and `reportReply` all map across unchanged; `claims` are dropped (a triage call does not read them); `isPhish` is set from `genuine`. The ids are kept, so the measurement matches the year's E3. No `defend.calls` key, so `call_checks`/`pretextNpcs` correctly do not run.
- **Every reused item is a verbatim copy of its current source fragment.** The E8–E20 fixes the brief named (the unfair Secrecy tells, the E19 look-alike-sender scoring, E11's genuine-but-report items) are all in E8–E20 episodes; the annual set draws only from E1/E3/E5/E6/E7, and each copy matches those sources today (flags, perFlagNote/whyFine, isPhish all identical). The e7 voicemail's `secrecy_or_bypass` flag is the current E7 flag, so the copy is correct.
- **The defendOnly strings are clean.** `brief`, `defendIntro`, `defendOnly`, `noBlameLine` and `mondayCard` are all rewritten to neutral year-review wording, and there are **no dead `flip*` strings** in the shell (the E12 MI1 / E13 MA2 pattern is absent here). The "year in three changes" brief is the three beats from `concepts.md` plus "break the chain at the first link", no voiced variable.
- **Host voices as a calm colleague** (apart from the length of the welcome line, MA1): Graham's done line ("That's the year covered, thanks. Check another way, report what doesn't sit right, and leave the rest to the people whose job it is.") is 24 words and warm.
- **Both shells validate with zero social lint**, and the conclusion wiring (done global → host `eventMappings` → `complete` the task) matches the built defend pattern.

## Findings

### core_17

#### MA1 — the annual host welcome line is 41 words and fails dialoguelint (cap 30). Major, needs-user (generator-owned).
`scenarios/awareness_core_17_annual_2027_defend/ink/graham_whitfield.ink:24`: "Welcome to the year-end edition. It's a mixed run of this year's messages across email, calls, a text and a sign-in page, from a few different companies. Real ones are in there with the scams. Take them one at a time." — 41 words. `dialoguelint.mjs` reports `ERROR L24 line-len: 41 words (cap 30)`, and the reviewer brief sets host lines "under 30 words". This is a hard lint failure on a shipped shell (the same class as E12 MA1, worse than E18's borderline 30). The ink header says it is "Written by ... gen_annual_shells.py", so the fix belongs in that generator's line table, not a hand edit (the Do-not list forbids hand-editing generated ink). Fix — split into two host lines, each under the cap, old → new:
old (one line) `"Welcome to the year-end edition. It's a mixed run of this year's messages across email, calls, a text and a sign-in page, from a few different companies. Real ones are in there with the scams. Take them one at a time."`
→ new (first line) `"Welcome to the year-end edition. It's a mixed run of this year's messages, across a few channels and a few companies."` (21 words)
→ new (second line) `"Real ones are in there with the scams. Take them one at a time, and say why on each."` (19 words)
Re-run `dialoguelint.mjs` on the regenerated shell to confirm green.

#### MI1 — the genuine mirror-pair call labels its speaker "Gordon" while the impostor labels it "Caller", a visible tell. Minor, needs-user (source-copy).
In `annual_2027_mixed`, item 4 `e3_call_gordon_impostor` has `transcript[*].who == "Caller"` (erb:182/186/190) and item 5 `e3_call_gordon_real` has `transcript[*].who == "Gordon"` (erb:216/220/224). `transcriptList` in `triage-kinds.js:382` renders `line.who` literally as the speaker name on each line, so the genuine call shows **"Gordon"** on screen and the impostor shows **"Caller"**. Placed as an adjacent mirror pair, this lets a learner sort the two on the speaker label alone, short-circuiting the pair's whole lesson ("the four facts couldn't tell them apart; the callback could", `whyFine.default` erb:234). Carried verbatim from E3, where the spec mandates exact copies, so it passes "same measurement"; but the mixed edition puts the pair side by side, where the asymmetry bites harder than in E3's role-swap queue. Fix (needs-user, a deliberate, tiny deviation from exact-copy that does not touch `truth`/`flags`/feedback, so measurement is unchanged): set the genuine call's three `who` values to `"Caller"` to match the impostor, in the `core17/annual_2027.json` fragment and the erb copy. If the user prefers strict exact-copy, accept the E3 behaviour and record that the mirror pair carries a label tell.

#### MI2 — the look-alike bank subject carries an em dash, against house style. Minor, needs-user (source-wide).
`scenario.json.erb:92`, item `e1_lookalike_bank` subject: "Updated bank details — please action today" (U+2014). House style (`REVIEWER_BRIEF.md`, `00_README.md` §7) bans em/en dashes. It is a verbatim copy of the shipped E1 shell, which carries the same em dash (`awareness_e1_invoice_fraud/scenario.json.erb:150` and `_defend:122`), so the annual copy is consistent with E1 and the exact-copy rule is honoured. This is a source-wide inconsistency that predates core_17, not a core_17-introduced defect. Fix (needs-user, only if the dash is to be removed everywhere so measurement stays matched): normalise the subject in E1 (both shells), the E1 fragment and the core_17 copy together, e.g. "Updated bank details, please action today". Do not change one copy without the others.

## Dialogue pass (voiced host lines)

Every host line read as spoken.
- **core_00 (Anjali Rao):** welcome "Welcome. I'm Anjali, I look after security here. Open the kiosk for a short brief before your first episode. It's all practice." and the done line "That's you set. Start your first episode whenever you're ready, and report anything that doesn't sit right." — both natural, calm, within cap. No change.
- **core_17 (Graham Whitfield):** the done line (24 words) and the hub goodbye voice well. The **welcome line is the only one I would change** — it is MA1, 41 words, a mouthful to voice and over the lint cap. The two-line split above is the fix; the second line also adds the "say why on each" cue the defend stage needs, which the current single line lacks.

## Notes (not findings)

- **core_00 card 2 describes the full attack/flip shape to every learner**, including one whose course is defend-only episodes (they will never meet an attack or flip). The wording is verbatim from the spec's card-2 beat (`11_WP12_FIRST_PLAY_AND_ANNUAL.md`), which intends the full shape, so it is on-spec; flagged only in case the user wants a hedge ("some episodes skip straight to sorting the post") for defend-only cohorts. Not a defect.
- **core_00 "once per learner" is per save/session here.** `_seenAlready` reads the done global from the current game state; the brief's "once per learner" across sittings is as durable as the global is. On-model for the product (the bridge confirms the within-session reload path); any cross-device once-per-learner persistence is an organiser/Hacktivity concern, not this shell's.
- **core_17 "report everything" / "verify everything" still scores ~100%.** Under `scoringProfile: "awareness"`, genuine items score full on report and verify (`triage-scoring.js:76-77`), and only the call-kind `trust` override drops Comply to 30 (`:44`). So the three genuine items (bank confirmation, real Gordon, shift text) discipline over-reporting only through `falseAlarmCost`/`whyFine` copy and the half-mark on the one genuine call, not the top-line score. This is the whole-set limitation recorded across E10/E12/E13/E18 — a request to `05`, not a core_17 defect. The edition's real measurement is the learner's existing role post-check that follows it, as the mission description says.
- **core_17 has no bridge job and I did not add one** (read-only; spec confirms none). A bridge that plays all 8 items with the right verdicts per kind (page has no Verify; call and voicemail do), checks the two reshaped E3 calls render and score, and confirms the done global concludes the objective, is still owed before ship — the spec's own acceptance list asks for it.
- **Timing unverified for both.** core_00 at 5 min (7 short cards) and core_17 at 10 min (8-item immediate-feedback run) are plausible but untimed; a timed agent run is the honest confirmation, per the definition of done.
- **Pre-ship web searches** for the invented names in both pieces ride on the existing E1–E7 search list; no new company or person is introduced by WP-12 (Anjali Rao, Graham Whitfield and the reused items are all already in `BRAND_SET.md`).

## Verdict

- **core_00: ship-ready.** 0 blocker, 0 major, 0 minor. It orients a first-time learner on what the course is, that it is an authorised exercise at a fictional company, how the kiosk and verdicts work, and how to start; it is short and no-blame; the rule of thumb is quoted exactly; and the brief-only second-visit behaviour (ENG-10 `oncePerLearner` + `doneGlobal`) is sensible and **verified live** (bridge 10/10, including the reload path). Only a timed run is outstanding.
- **core_17: close MA1, then it is ship-ready.** 0 blocker, 1 major, 2 minor, none episode-local. The edition is a fair, matched refresher: the right 8 items, faithfully copied from the current E1/E3/E5/E6/E7 sources, the E3 calls reshaped correctly, three genuine items kept (one awkward, mirror-paired after its impostor), neutral host voice, no dead flip strings, both shells validating clean. The one major is the generator-owned 41-word host line (MA1) failing dialoguelint; fix it in `gen_annual_shells.py` and re-lint. The two minors are needs-user source-copy calls (the Gordon speaker-label tell MI1; the E1 em-dash MI2). Recommend fixing MA1 and MI1, deciding MI2 source-wide, then authoring and running a core_17 bridge and one timed run before ship.

---

### Return (one line each)

- **Counts — core_00:** 0 blocker, 0 major, 0 minor (clean; validator + dialoguelint clean; bridge 10/10 live incl. second-visit).
- **Counts — core_17:** 0 blocker, 1 major, 2 minor (3 total; 0 episode-local, 0 engine, 3 needs-user; validator clean, one dialoguelint ERROR).
- **Blocker:** none in either piece.
- **Major (core_17) MA1 (needs-user):** `graham_whitfield.ink:24` host welcome is 41 words and fails dialoguelint (cap 30) — split into two <30-word lines in `gen_annual_shells.py` and re-lint.
- **Voiced line I'd change:** core_17 Graham welcome `graham_whitfield.ink:24` → "Welcome to the year-end edition. It's a mixed run of this year's messages, across a few channels and a few companies." + "Real ones are in there with the scams. Take them one at a time, and say why on each." (core_00's two Anjali lines need no change.)
- **Minors (core_17):** MI1 (needs-user) the genuine Gordon call shows "Gordon" as speaker while the impostor shows "Caller" (`triage-kinds.js:382` renders `who`), a mirror-pair tell — normalise both to "Caller"; MI2 (needs-user) the e1 bank subject carries an em dash (`erb:92`), verbatim from the shipped E1, a source-wide house-style call.
- **Verdict:** core_00 ship-ready; core_17 ship-ready once MA1 is fixed (recommend MI1 too, decide MI2), then a core_17 bridge and timed runs for both.
