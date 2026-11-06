# Review round 2 (adversarial): `lab_social_engineering` PLAN.md

Reviewer: Opus, round 2 (fresh). Packet P6-A. Read-only review of
`scenarios/lab_social_engineering/PLAN.md` against `designs/10_lab_social_engineering.md` (`10`),
`designs/00_data_contract.md` (`00`), `IMPLEMENTATION_PLAN.md`, `SE_BUILD_LOG.md`, and the engine at HEAD
on 2026-10-21. Round 1 and its outcomes are in `REVIEW_R1.md`. Kind of game: a lab game, education
first, browser-only, no VMs, no combat. Brief: `docs/agents/SE_BUILD_BRIEF.md`.

Round 2 did two things: confirmed each round-1 finding is really closed in the current plan, then looked
past round 1 at whether each stage is a real puzzle rather than a checklist, whether the characters have
their own voices and agendas, whether a student would feel clever, whether the teaching lands without
lecturing, the difficulty curve, tension and ending, and the places a blind playtester would trip.

## Part 1: are the round-1 findings really closed?

All ten are folded in. Confirmed by reading the current plan:

| R1 id | claimed fix | confirmed in plan |
|-------|-------------|-------------------|
| R1-M1 | `test_account` a settled §4 row, counts updated to 23 | Yes: §4 table row (`test_account` / `acct_freemail` / "first active non-entry task"); "eight aims and 23 tasks" (§4); §9 cut maths against 23 baseline |
| R1-M2 | open-inbox edge made legible, no hard block, F14 | Yes: §4 block "`test_account` and the open-inbox edge"; §5 stage 3 cue; §10 F14 |
| R1-m1 | §5 opening rewritten to `timedConversation` | Yes: §5 "Opening" uses `timedConversation` + `waitForEvent: "game_loaded"` / `skipIfGlobal` / `setGlobalOnStart`, "not a music event"; §14 Q3 settled |
| R1-m2 | §1 landing row refreshed to "Partly built" | Yes: §1 table row rewritten (model P5-A, render P5-B, lint P5-C exist; scene/registration/branch/persistence still to do) |
| R1-m3 | §8 notes Fairbairn voiced per README decision Z | Yes: §8 "Audio" |
| R1-m4 | reply delay follows `00` placement | Yes: §4 "Reply delay" (char for Pierce/Lord, target for Hampshire, cites `mail-scheduler.js:346-352`) |
| R1-m5 | mappings carry `condition: "value === true"` | Yes: §4 "How a task completes, and who listens" |
| R1-m6 | goalStrings name where to look, backlog slot names careers inbox | Yes: §4 "No dead ends, and hints"; §2; §5 stage 2; §13 risk row; §10 F15 |
| R1-m7 | playtest coverage of the task and the two traps | Yes: §10 L3 assertion, F14, F15 |
| R1-m8 | triage domain from authored `social.landingPages` menu | Yes: §7 "Mail records feed the report and the triage" |

No round-1 finding was re-opened by round 2. The engine audit in §1/§7 remains accurate where I
re-checked it.

## Part 2: new findings

| id | severity | plan section | finding | evidence | suggested change |
|----|----------|--------------|---------|----------|------------------|
| R2-M1 | major | §1 "What exists" (mail client row); §5 stage 3 | The plan states as fact that "the red-flag meter is on for Hampshire, off for Pierce" (§5 stage 3), and leans on it as the gentle on-ramp for the first, easiest target. The live red-flag meter is **not built** in the mail client and **no packet owns building it**. `01` §3 calls it "optional per target" (`redFlagMeter`, default `mailClient.showRedFlagMeter`); `10` lists it only as a "student tuning knob" (line 975). It is not in `10`'s "New engine work" N-items, not in `10`'s "relies on `01`" row, not in the Phase-1 mail scope (`IMPLEMENTATION_PLAN.md:220`, which lists mail N1–N6, N9, N10, N12, N14, N15, N17 — no meter), and not in P6-M's UI-debt list. The §1 audit — the plan's defining contribution, and what round 1 praised — does not list the meter under "lab needs" or flag it absent. A builder reading §5 will author `redFlagMeter: true` on Hampshire's target and it will silently do nothing. | mail client source has no meter: `grep -rni "redFlagMeter\|showRedFlagMeter" public/break_escape/js test/js` returns nothing; mail client params doc block (`mail-client-minigame.js:10-20`) lists no meter param; `01` design line 108 ("optional"), `10` line 975 ("tuning knob"); `IMPLEMENTATION_PLAN.md:220` mail scope | Decide one way and write it into §1. Either (a) flag the meter as an unbuilt lab-needs item in the §1 mail row and give it an owner (a small mail-UI packet alongside P6-M), or (b) drop the meter from the plan, state in §5 stage 3 that the on-ramp is carried by the `onSend` checklist (which **is** built — `renderChecklist`/`redFlagsOf`, `mail-bridge.js:219-243`), and soften the "meter on/off" difficulty claim. The lab is solvable either way; this is about not relying on vapourware and about the first target's teaching scaffold. |
| R2-m1 | minor | §3 "Guards against stereotype"; §4 "Who writes each completing global"; §5 stage 3 | §3 promises "each reply that turns the student down gives a sensible reason in that person's voice." Hampshire is data-only, so her fail reply is `factors[firstFailed].reply` if authored, else `factors[firstFailed].line`, which is the **generic canonical** fail line, not her voice. `10` stage 3 explicitly accepts "the canonical fail line for the first failed factor" for her. `pretextRelevant` is authored in-voice (`10` line 228), but a realistic round-1 path — applicant pretext with the CV omitted — fails `attachmentPlausible`, whose fallback is the generic "Claims an attachment that isn't present". So that rejection reads out of character, against §3. | `mail-bridge.js:353-356` (`dataOnlyText` = `first.reply \|\| first.line`); `phish-rules.js` `CANONICAL.attachmentPlausible.fail` is generic; `10` stage 3 "canonical fail line for the first failed factor" | Require P6-E to author in-voice `reply` strings for the Hampshire required factors a student realistically hits (at least `attachmentPlausible`, ideally `senderTrust`), so her rejections stay in character; or note in §3 that her non-`pretextRelevant` fails use the canonical line and accept it. |
| R2-m2 | minor | §4 "No dead ends, and hints"; §5 stage 2 "Next-step cue" | `username_convention` (the metadata) is in **no** readiness slot (`10`: "The metadata is not in any target's readiness slot"), yet it is half of the Operations-door gate (`osint_done` **and** `se_intel_username_convention`). A student who fills all three target cards before picking the PDF author field sees the board go **fully green** while the Operations door stays locked — and the board is the plan's always-on "what next". Recovery rests on the still-open `metadata_read` task and Ruth's phone. R1-m6 required "where to look" wording for the backlog slot; the same guarantee is not made for this gate, which is arguably worse because the board gives zero signal (not even a "Missing:" row). | `00` §4 `readinessSlots` exclude `username_convention`; plan §4 critical path gate `osint_done (+ se_intel_username_convention)`; §5 stage 2 "Ruth asks for it herself" | Require the `metadata_read` objective text and Ruth's stage-2 rung to name the public-document properties panel (as R1-m6 did for the careers inbox), and add a playtest row (extend F15 or a new F16) for the all-readiness-complete-but-metadata-missing stuck state: confirm the open task and Ruth's rung both point at the PDF. |
| R2-m3 | minor | §5 stages 1–3 "Next-step cue"; §4 hand-over column | Each door key is handed over **only by talking to Ruth** (`#give_item` on her check-in), but completing a stage unlocks the next aim whose first task is `enter_<room>`. A blind student can read "enter the Recon Room", walk to the locked door, and not know the key is a conversation with Ruth away. The plan's cue for stage 1 is "the student goes back to Ruth" plus "Ruth's phone sends a one-line text **once the key is in the inventory**" — which fires only after the key is already held, so it cannot prompt the student to go and get it. | §5 stage 1 "On `plan_done`, the student goes back to Ruth, who gives the Recon key"; §5 stage 1 next-step cue (phone text after key in inventory); §4 hand-over column "Ruth's ink `#give_item` on her check-in" | Make the first hint rung of each key-gated stage (and/or the locked-door message) say plainly "see Ruth for the key", so a student stuck at a locked door with a pending key is pointed back to the hub. A blind run (P6-V) should include a key-gate return to confirm it. |
| R2-m4 | minor | §4 "Pacing"; §5 Opening, stages 0–1 | The two opening stages are ~9 minutes (5 + 4) of low-agency card-sorting and single-select picking before the first high-agency stage (OSINT). This is the plan's closest thing to a "checklist" run, and it is front-loaded. The through-lines give stage 0 (Fairbairn's condition) and stage 1 (the blame-measure trap) real weight, so it is defensible, but a student may read the first ten minutes as tutorial. | §4 pacing table (stage 0 = 5, stage 1 = 4); §5 stages 0–1 are drag-to-bins and two single-selects | A judgement call for the design-review stage (`scenario-design-review` / `npc-dialog-review`): consider sharpening the opening hook (Fairbairn's nerves, the "no names" promise) so the sorting feels like a decision with stakes, or trimming a scope card, rather than leaving two sequential low-agency exercises at the front. Not a build blocker. |

## Notes that are not findings

- **Tension and ending.** The lab is deliberately low-stakes (no timer, no lose state, free unlimited
  retries framed as rehearsal). That is the right call for an education-first lab (standing rule:
  minigames fun and educational, not hard), and the plan carries engagement through the three
  through-lines rather than through jeopardy. The one genuine tension beat is the Dev call (influence
  bar, the reportable call, the two-minute lockout), and the plan handles its failure branch well
  (channel-scoped lockout, email route stays open — verified `social-influence.js:631`, lockout channel
  is the call's channel unless `scope: "character"`). The ending (Tomasz's debrief paying off Fairbairn's
  "no names", "writing Dev a script, not a warning") is a satisfying thematic close that ties all three
  threads. No change needed; worth preserving through the dialogue stage.
- **Would a student feel clever?** The two stale-fact rakes (the J. Baker namesake, the 2019 org chart)
  are a real strength: they are offered as live blank options, so a careless student misuses them and the
  target's own words explain the miss, while a careful one avoids them. The "your own mail comes back" in
  triage (`playerSent`) is a strong reveal. The Jed-spoof borrow-trust in round 2 is a genuine insight,
  not a checklist step. These carry the "feel clever" aim.
- **Does the teaching lecture?** No. The law is stated once (stage 0), everything else is in behaviour;
  the blame-vs-no-blame choices (stage 1 measure, stage 6 findings) teach by consequence. Good.
- **Each stage is a puzzle, not a checklist** (with R2-m4's caveat on the opening). Stages 2, 3, 5, 6, 7
  each have a real decision, a trap or a reveal.

## Engine claims spot-checked this round (held)

- Empty required blank blocks Send with the neutral `PRE_SEND_GATE_LINE` and the message is **not
  judged** (`phish-rules.js:41,448-470`), so stage 5's "the aim can complete with the date unknown, Send
  stays blocked, Ruth points back at Dev" is sound.
- `landed = open.opened && failedRequired.length === 0` (`phish-rules.js:407`); tells computed on every
  result (`:409-415`) — the stage-7 replay and the open-inbox edge both hold.
- Lockout is channel-scoped: `channel = effect.scope === 'character' ? 'all' : (_channelFor(...) ||
  'all')` (`social-influence.js:631`); `isLockedOut(id, channel?)` takes a channel. So Dev's phone lockout
  leaves the email route to Lord open, as §5 stage 5 claims — provided P6-E does **not** author Dev's
  lockout with `scope: "character"` (worth a one-line note for the data packet, but `00` §8 owns it).
- Data-only fail reply path is `dataOnlyText` (`mail-bridge.js:321-331,353-356`) — basis for R2-m1.

## Verdict

**Counts: 0 blocker, 1 major, 4 minor.**

The plan is strong, accurate and solvable, and every round-1 finding is genuinely closed. The design is
fun in the ways that matter for this kind of game: real puzzles, live traps, three through-lines that pay
off, and a thematically satisfying ending. The one thing that must be settled before the build is R2-M1 —
the plan relies on an unbuilt, unowned engine feature (the red-flag meter) for its first-target
scaffold and the §1 audit missed it. That is a decision, not a rewrite: own it or drop it. The four
minors are quality and blind-playtest-safety items (an in-voice gap for Hampshire's fails, two "stuck at a
locked door / all-green board" trip states, and the front-loaded opening) that the planner can fold in and
the design/playtest stages will exercise.

Per the brief's §11 gate ("no blocker or major open before the build starts"), R2-M1 should be resolved
before P6-E/P6-F start; the minors can ride into the build and the design-review cycle.

## Review log

### Outcomes (P6-A planner, round-2 fix pass, 2026-10-21)

Orchestrator decisions applied: M1 keep the meter, recorded in §1 as unbuilt and owned by P6-M; m1
author in-voice Hampshire fail replies (incl. `attachmentPlausible`); m2 name the PDF properties panel
in the task text and Ruth's rung, add a playtest row; m3 the key-gated hint rung and locked-door line say
"see Ruth for the key"; m4 sharpen the opening (cut the low-agency front toward 5 minutes, add a real
choice or small reveal, keep what it teaches).

| id | severity | outcome | where fixed |
|----|----------|---------|-------------|
| R2-M1 | major | **Fixed.** §1 mail row now records the live red-flag meter as **unbuilt** (grep returns nothing; not in the mail scope; `01`/`10` call it optional) and names the built on-ramp (the `onSend` checklist). The P6-M debt note adds the meter to P6-M's scope: composing-time meter per `01`, optional per target, authored on for Hampshire, off for Pierce and Lord; if P6-M does not land it, the checklist carries the on-ramp and solvability is unaffected. §5 stage 3 softened to match. | §1 mail row + "UI debt carried in (P6-M)"; §5 stage 3 Beats |
| R2-m1 | minor | **Fixed.** §3 "Guards against stereotype" now requires P6-E to author in-voice `reply` strings for the Hampshire required factors a round-1 student realistically hits — `attachmentPlausible` and `senderTrust` at least — so her rejections stay in character, citing the data-only fallback path (`mail-bridge.js:353-356`). | §3 guards bullet |
| R2-m2 | minor | **Fixed.** New §4 hints bullet "The metadata gate has no board signal": the `metadata_read` task text and Ruth's stage-2 rung both name the published PDF's **properties panel**, because the board shows no "Missing:" row for `username_convention`; §5 stage 2 next-step cue updated; F16 added for the all-green-board-but-metadata-missing stuck state. | §4 "No dead ends"; §5 stage 2; §10 F16 |
| R2-m3 | minor | **Fixed.** §5 stage 1 next-step cue now states that the locked-door line and the first key-gated hint rung both say "see Ruth for the key" (for all three doors), because keys are handed over only in conversation and the phone text fires only after the key is held; F17 added for the key-gate return. | §5 stage 1 next-step cue; §10 F17 |
| R2-m4 | minor | **Fixed.** §5 "Opening" rewritten to carry a reveal with stakes (Fairbairn's near-miss: a finance colleague almost wired a five-figure spoofed invoice) and a real choice (how the student answers Fairbairn's "will this make my staff look stupid", the honest no-blame answer seeding through-line 1); §4 pacing gains a "Sharpening the low-agency front" note targeting ~5 minutes for the combined front, keeping `10`'s figures as the cut-maths estimate and keeping the learning. | §5 "Opening"; §4 "Pacing" |

No finding withdrawn; all five applied. §10 intro updated to F14–F17.
