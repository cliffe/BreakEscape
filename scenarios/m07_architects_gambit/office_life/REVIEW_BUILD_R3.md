# m07 office life: build review R3 (delta)

Counts: B0 M0 m6

Reviewed: branch build/ol-m07 at 6f356a2cf, delta `8f6c32808..HEAD` over scenarios/m07_architects_gambit and tools/playtest (9 files: BUILD_LOG, DIALOGUE_SAMPLE, HANDOVER, LIVE_SLICE3, LOG, PLAN, QUESTIONS, two probes). Fresh reviewer, read only apart from this file. Static checks only; no server started, no audio.

## Assumptions

- Assumption: the D112 to D115 outcomes and the 17 Nov date on D113 are taken from the brief and the repo text; no decision log in the repo carries those ids, so the dates and letters could not be checked at source.
- Assumption: "standalone description of what is built" means PLAN.md should read as a finished spec, with no future tense, placeholders or unbuilt alternatives.

## Static checks

- Validator (`--skip-ink --no-graph`): 0 errors, 31 warnings, unchanged from R2.
- Lock and key diff against baseline_locks.json: empty.
- `git diff 8f6c32808..HEAD` on scenario.json.erb and ink/: no changes. The delta is documents and two probes only, so R2's scenario checks still hold.
- Model names: none in the office_life files or the two new probes (the only hits are the `GEMINI_API_KEY` boot-warning text in LIVE_SLICE3.md:3, an environment variable, not a model reference). Em and en dashes: none in the delta or the other .md files. FACT_DIGEST.txt:11 and :14 carry em dashes, but they quote the scenario's own credits text and predate this delta.
- UK English: no US spellings found in the delta.

## R2 findings

- m1 frame time: recorded (three games, LIVE_SLICE3.md "R2 m1", LOG.md:21), but the headline conclusion is not supported; see m5 below.
- m2 PLAN out of date: the listed values are now correct (D112 to D115 in the preconditions, `en-US` styles, `chaseRange` 200, `seat: "stand"`, sentence-case credits, display-name prefixes, all matching scenario.json.erb:284, :285, :1496-ish voice blocks, :1887, :1923, :2023 and the two ink files). QUESTIONS.md Q1 to Q4 outcome lines are right: D112 a Tier 2 small; D113 option B, American voices for both operators; D114 a, Adaeze Okafor and Gwen Pritchard; D115 a, Elena moved in a later room-dressing pass, and scenario.json.erb:2062 still has her at (3, 7.5), so nothing moved in this build. But PLAN.md is still not a standalone description of what is built (m1, m2 below).
- m3 dialogue sample: reworded, but the sign-off is overstated (m3 below).
- m4 HANDOVER header: fixed; the header reads correctly. Stale text lower down (m6).
- m5 Gwen's walk home: re-timed on three trips, with a labelling error and a comparison that is not like for like (m4 below).

## Findings

### m1 (minor): PLAN.md still reads as a pre-build plan, not an as-built spec

PLAN.md is meant to be standalone and as built (LOG.md:20, HANDOVER.md:3 "describes what is built"), but:
- PLAN.md:132 to :160 (2.9 skeleton) keeps placeholders (`<tile>`, `<4 lines>`, `<the three hides>`, `<tiles>` at :173); the built values are known (Adaeze position/needsHome tile (4,5), Gwen (2,5), `useFrom` dx 0 dy -1, scenario.json.erb:1867-1930, :2023).
- PLAN.md:181 "Slice 3 picks `useFrom` ...", :183 "Slice 3 also watches ...", :55 "Slice 3 records the final cells", :83 "Slice 3 measured ...", :275 "Open numbers" (all measured now), :281 "(and chair (60, 258) if the first cooler fallback is taken)", :183 fallback 2 (capacity 1 and a queue cell) is an unbuilt alternative.
- PLAN.md:188 "Slice 6 renders ... and, if they read too dark, adds a small emitter" and :65 "slice 7 renders the ops floor" (no slice 7 is recorded). LIVE_SLICE6.md says no emitter was added.
- PLAN.md:81 says "slice 3 also runs a manual-clock check ... 50 different needs seeds"; BUILD_LOG.md:56 says it was a node simulation, not a live manual-clock run, and that the seed is constant per scenario (BUILD_LOG.md:52).
- PLAN.md:165 "This plan does not build it" and :12 "written; signed off" are fine in meaning but still plan voice.

Fix: replace placeholders with the built values; turn the slice-numbered sentences into past or present statements (or move the measurement results into one "Measured" paragraph pointing at BUILD_LOG.md); drop fallback 2 and the "if" clauses; say the lighting check passed with no emitter; describe the order check as the 50-seed node simulation.

### m2 (minor): PLAN.md scenario line numbers are the pre-build numbering

PLAN.md:3 says line numbers are for scenario.json.erb, but every reference after the first inserted NPC block is the baseline numbering. Examples against the current file: muster board `:1794` to `:1801` now about :1823 (text at :1823); handover sheet `:1903`/`:1904` now about :1995; Elena `:1960` now :2062 (position at :2062); her hide `:1993`; ops lighting `:1810`; `:1913` to `:1917` warm-coffee console; `:1851` supervisor; globalVariables closing `}` `:2611` and last entry `:2610` (now :2719 and :2720, the new block is at :2715 to :2719); `:1948` to `:1952` server-room connection. Lines before :1417 (:283 credits, :1250 hands-down) are still right. HANDOVER.md:23 repeats `:1904`.
Fix: either state in PLAN.md:3 that the numbers are the baseline commit's (name the commit), or refresh them; and rewrite section 8's instruction about adding a comma at `:2610` as the built fact.

### m3 (minor): dialogue wording "signed off" is conditional but recorded as given

PLAN.md:12 says "signed off on the user's instruction of 18 Nov 2026" and LOG.md:23 says "Fixed: ... records the 18 Nov 2026 instruction". DIALOGUE_SAMPLE.md:3 itself says the relayed "Implement these using your best judgement" signs off the wording only "once the dialogue review and the build review are clean"; the build review is not yet clean (this round). The line is also general, not a yes on this sample, and the project rule is that voicing and re-voicing need their own yes via the coordinator.
Fix: PLAN.md:12 should say "written; wording yes conditional on a clean build review (DIALOGUE_SAMPLE.md:3)", and the voicing request should still carry the sample and the V6 count. Also D113's date (17 Nov 2026) at QUESTIONS.md:19 and DIALOGUE_SAMPLE.md:33 appears nowhere else in the repo; confirm it against the coordinator's log.

### m4 (minor): R2 trip timings are labelled page clock but the probe measures wall time, and the before/after comparison is not like for like

BUILD_LOG.md:72 says "Seconds on the page clock". tools/playtest/m07-ol-r2.mjs:20 computes `now=(Date.now()-tEnter)/1000`, wall seconds, and tEnter is taken before the 30 s seated window. The same paragraph says the page clock ran behind wall time on the loaded machine, which is why use times were 34 to 36 s against 22 s; the walk figures are inflated by the same factor, and the earlier "before" table (BUILD_LOG.md:46) was taken on an unloaded machine. So "Gwen 5.9 to 9.3 s (before 5.5 to 17.25 s)" and "Adaeze 2.7 to 6.1 s (before 4.0 to 4.25 s)" mix conditions; the Adaeze range is wider and its top is higher than before, which the text does not remark on. Also in 8247 and 8260 both `using` phases ended in the same poll, so `home` is imprecise there, as noted.
Fix: relabel as wall seconds, give the page-clock rate for each game (use time against 22 s: about 0.62 for 8247 and 8260), and state the walk times in page-clock terms, or compare against 8239 only (the quietest game). Keep the hedge "reduced in these runs", and add that Adaeze's walk home was not shorter.

### m5 (minor): "no reading dropped the step below the 20 fps simulation rate" has no evidence, and the frame cost is not compared with a no-operator baseline

LIVE_SLICE3.md:227 and LOG.md:21 state that no reading dropped the step below 20 fps and that the operators' trips add no measurable cost. The probe (m07-ol-r2.mjs:8 to :11) records only the `requestAnimationFrame` interval and `loop.delta`; it does not count physics steps or compare sim time with wall time. In 8247 and 8260 the ops-floor means are 49 to 82 ms (12 to 20 fps) with p95 up to 216.6 ms, which is above the 50 ms step, and the same section's inflated use times show the sim ran slower than wall in those games. The claim holds at best for 8239 (p95 66.7 ms is still above 50 ms). The 1.4 to 1.6 ratio over the checkpoint is correct arithmetic but the cause ("a bigger room with more sprites, lights and the chat zone") is untested, and there is no reading of the ops floor without the two operators (or on main), so the cost of this build is not isolated. "Away against seated" 0.98, 1.20, 0.77 over three loaded runs cannot show "no measurable cost".
Fix: reword to "frame time was measured at 25 to 82 ms mean on a shared machine; the render rate is below the 20 step rate in two games; the build's cost was not isolated", or add one reading with the operators hidden or absent in the same game (hide both through the server-room entry mapping is not available before the room, so use a game with both `adaeze_ko`/`gwen_ko` bodies removed, or main at the same commit) and record the difference. Drop "no measurable cost" otherwise.

### m6 (minor): stale statements left in BUILD_LOG.md and HANDOVER.md

- BUILD_LOG.md:3 "Measurements below are NOT done yet; see HANDOVER.md." is false; they are done and the file records them.
- HANDOVER.md:101 (slice 3 part 4 note) "Open note: Gwen logs `mount_stuck` once per cooler trip but returns to post" was closed by the `seat: "stand"` fix (LIVE_SLICE3.md R1 fixes: no `mount_stuck`).
- HANDOVER.md:109 "Not done: m5" has no pointer to the later pass (LOG.md:15); a fresh reader sees an open item.
- HANDOVER.md:23 `scenario.json.erb:1904` (see m2).
Fix: one line each ("resolved, see ...") in the same style as the "Resolved:" notes already in BUILD_LOG.md.

## Checked and fine

- PLAN.md against scenario.json.erb and both ink files, spot-checked: `ops_cooler` (type, offWhen, observations, affordance with `seat: "stand"`), thirst numbers 40/10/30/10 and 55/8/30/10, `chaseRange` 200 on both, `globalVarOnKO`, three hides each, two `npc_attacked` rows and two `npc_ko` rows on the phone, credits text and conditions (:284, :285), five new globals false (:2715 to :2719), voices and `en-US`, exchanges with their `requireGlobal`, hub shape with `hub_quiet`, display-name speaker prefixes, the 4 ink-local booleans, 10 onceOnly rows and 3 cooldown rows in the sync budget.
- DIALOGUE_SAMPLE.md pool lines, exchange and voice styles match the scenario and ink word for word.
- No review or earlier-draft references remain in PLAN.md (the only "Proposed" is Elena's later move, which is a proposal by design).
- The frame-time ratios quoted (1.4 to 1.6 over checkpoint; 0.98, 1.20, 0.77 away against seated) follow from the table.
- R1 m5 route run (games 8225, 8229) reads consistently: L1 0 of 44 bad on both, texts and hide on arrival recorded, limits stated.

## Not checked

- Live behaviour (no server by brief); the probe results are read from the logs.
- Audio and TTS: none exists.
