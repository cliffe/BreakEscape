# mission-office-life skill, review round 1

Scope: `.claude/skills/mission-office-life/SKILL.md` and `references/{measurement-recipes,mapping-patterns,gotchas,checklists}.md` at e46d8c2de (branch plan/ol-m03). Checked against the engine on this branch and on main, the validator under `scripts/`, the m03 build docs and `scenario.json.erb` on build/ol-m03 (tip b4b7c5119), and `docs/achitechture/M03_OFFICE_LIFE_PLAN.md`.

Counts: 0 blockers, 3 majors, 6 minors, 4 nits.

The round stopped at the reviewer's context limit. Not yet checked: `SOFA_FIX.md` and the R2/R3 fix handovers line by line, the port and PID wording against the playtest-scenario skill, and how the skill's layout compares with sibling skills. Round 2 should cover those.

## What holds

These were checked and are correct: the onceOnly key format `<npc>:<pattern>:<handlerIndex>` (`npc-manager.js:1264`), with the condition checked after the once and cooldown tests so a false condition does not count as a fire (`:1269` to `:1300`), and persistence only for handlers that open no conversation or minigame (`:1489`, `:2193`). Also correct: `decideLocked` comparing `expectedAwayMs` once at the leave (`workstation-state.js:155` to `:157`, `:404`); `_expectedAwayMs` at `npc-needs.js:3326`; `HOME_EPS` 12; `OVERHEAR_RADIUS` 160; `THROUGH_DOOR` 0.4; `CHAT_LINE_MAX` 40 as an error; `||` as an error (`validate_scenario.rb:6446`); `STACKED_TEXT_GAP_MS` 4000; the V1 to V10 meanings; the rake task name; `lock_key_diff.rb --write` and its graph rebuild; the preset types with both spellings (`office-presets.json`); `officeType` as a preset id. Every JSON shape in `mapping-patterns.md` sections 1 to 5 matches `scenario.json.erb` on build/ol-m03 (coffee 648 to 651, cooler 1573 to 1575, laptop 650 to 672, night hides 847 to 851 and 887 to 891, breaks 853, 854, 893, 894, trouble 1363 to 1374, credits 229). The final timings in `measurement-recipes.md:41` (use 16/20, threshold 24, expected 18.6/28.7 s, real 22.0 to 22.4 and 32.2 to 33.0 s) match `SLICE3_4.md:68`, `M03_SLICES3_4_REVIEW_R1.md:116` and the scenario comment at 828. `build/ol-poses-code`, `build/ol-pose-art`, `build/ol-hidden-hostiles` and the D34 falloff are on main, as the skill says.

## Majors

### M1. The pair side-swap and instant unseat are described as engine behaviour, but they are only on build/ol-m03

- Where: `references/measurement-recipes.md:52` ("The engine now swaps sides"), `references/gotchas.md:20` and `:48` ("The engine now unseats instantly on hide").
- Evidence: `_sideBlocker` and `pair_side_swap` occur 0 times in `npc-needs.js` on main and on HEAD, and 3 times on build/ol-m03. `git diff main build/ol-m03` touches `npc-needs.js` (+48), `seating.js` (+49), `npc-behavior.js`, `npc-poses.js` and two new tests. build/ol-m03 is not an ancestor of main.
- Risk: if the skill lands first, an m06 builder on main reads that the engine fixes the second claimant's lane and the seated ghost image. Neither fix is there, so the builder skips the check the skill says is no longer needed, or chases a log line that never appears.
- Fix: land the skill with or after build/ol-m03. If it lands first, mark both statements "(build/ol-m03 engine fix; on main once m03 lands)" and keep the pre-fix check as the instruction.

### M2. Ambient staff are not taken from the awareness course cast

- Where: `SKILL.md:64` and `:69` (cast audit, cast diversity), `:217` (Stage 6, new NPCs).
- Evidence: standing user decision D53 (16 Nov) says mission extras and ambient staff come from the cyber awareness course cast. m03 followed it: `M03_OFFICE_LIFE_PLAN.md:5`, `:30` ("New ambient staff, reused from the Cyber Aware course cast"), with the voices from `planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md`. The skill never mentions the course.
- Risk: a builder following the skill designs new characters, writes concept prompts and files an art approval. That is a wasted approval round, PixelLab spend, and a cast that goes against a user decision.
- Fix: in Stage 1, add "Ambient staff come from the awareness course cast (D53): pick from `planning_notes/phishing_and_social_engineering/awareness/` (`VOICE_CAST.md` for voices), reuse their sprite keys, voices and backstories, and adapt the job to the mission's building." Stage 6 then covers only the art those characters still lack (seated or pose frames).

### M3. Globals are declared in `globalVariables`, not `globalVars`, and `requireGlobal` false needs the declaration

- Where: `references/mapping-patterns.md:44` and `:147`, `references/checklists.md:15`.
- Evidence: the scenario field is `globalVariables` (`scripts/scenario-schema.json:403`; m03 `scenario.json.erb:2174`). `globalVars.` is only the prefix used in conditions. `requiredGlobalsHold` tests `globals[name] === value` (`npc-needs.js:310` to `:314`), so `requireGlobal: { "x_ko": false }` never matches while `x_ko` is undeclared (undefined). m03 declares `receptionist_ko`, `zainab_ko` and `wh_staff_upset` false (`:2184`, `:2251`, `:2246`).
- Risk: a builder who adds a top-level `globalVars` block, or who leaves a KO global set only by `globalVarOnKO`, ends up with an exchange that never plays and gives no error.
- Fix: say `globalVariables` in all three places, and add to mapping-patterns section 6: "Every key a `requireGlobal` tests for `false` must be declared `false` in `globalVariables`; the test is strict, so undefined fails."

## Minors

### m1. SKILL.md quotes only the stale Stage 1 timings

- Where: `SKILL.md:136`, "(expected 14.6 s and 23.1 s)".
- Evidence: those are the Stage 1 figures from before the posts moved and the machines claimed their Tiled sprites (`STAGE1_CHECKS.md:19`, `:21`, `:30`). The final m03 values are expected 18.6 s for coffee and 28.7 s for the cooler, with useSeconds 16/20 and threshold 24 (`SLICE3_4.md:68`; scenario 651, 1575, 828). `measurement-recipes.md:39` and `:41` give both sets correctly. SKILL.md gives only the old one.
- Fix: "m03's planned 45 s was wrong for that reason (Stage 1 measured 14.6 s and 23.1 s; the build settled at use 16/20 s, expected 18.6/28.7 s, threshold 24 s)".

### m2. The pair-stall gotcha mixes the cooler and coffee cases

- Where: `references/gotchas.md:28`.
- Evidence: the cooler pair's real 50.9 to 58.5 s is against an expected 28.7 s, which is already over 24, so that trip locks and the overshoot does no harm. The open-laptop gap is the coffee pair: real 22 to 30 s against an expected 18.6 s (`M03_REVIEW_R7.md:32` to `:35`; `COFFEE_PAIR_FIX.md:29` to `:31`, `:71` to `:72`). As written, the paragraph reads as if the cooler stall leaves the laptop open.
- Fix: state the coffee case as the risk and the cooler case as harmless because it is already over the threshold.

### m3. Line cites are main's and drift once build/ol-m03 lands

- Where: `references/mapping-patterns.md:72` (`npc-needs.js:4575`, `:4617`) and `:100` (`:3513`).
- Evidence: on build/ol-m03, `npc_use_started` is at `:3557`, and the hidden-skip lines move by 44.
- Fix: cite the function or emit string (`npc_use_started:${job.targetId}`), or refresh the numbers after the merge.

### m4. The validator list omits V11 and the V4 info case

- Where: `SKILL.md:193`.
- Evidence: `validate_office_life.rb:13` defines V11 (a chatter pool line that names a credential, warning), and `:41` and `:489` turn V4 into an info line once the E1 attack probe has passed.
- Fix: add V11 to the list and note that V4 can be info.

### m5. No explicit voicing yes and no train request

- Where: `SKILL.md:220`, `:223`; `references/checklists.md:45`; `references/gotchas.md:93`.
- Evidence: AGENTS.md:65 says audio runs "only when the user agrees to the cost". The skill says "once the words are signed off", which is about the wording, not the spend. AGENTS.md:200 makes `tools/playtest/train-check.sh` the one pre-merge command, with a GREEN verdict that includes rubocop, the payload scan, train-smoke and the validator corpus. The checklist instead tells the builder to run `bin/test-js` and the Rails suite by hand, which is a subset, and never says to ask the integrator for a train.
- Fix: Stage 7 should read "voice only after the user's yes on the V6 cost (through the decisions page)". Before merge should read "commit, then ask the integrator for a train (train-check.sh must be GREEN on the hash to be merged)". Keep the flake note as a footnote.

### m6. `overhearRadius` is said to be read only from `affordance`

- Where: `SKILL.md:111`.
- Evidence: a chatter pool given as an object can carry its own `overhearRadius` (`npc-needs.js:271` to `:293`). It is used for mutters and is the fallback for a chat whose object sets none (`:2996` to `:3004`).
- Fix: "On an object, `overhearRadius` goes in `affordance`; a pool written as `{ lines, overhearRadius }` sets it for mutters and as a fallback."

## Nits

- n1. `SKILL.md:113`: the machine list leaves out `shredder` (`npc-poses.js:52`, `:56`).
- n2. `references/mapping-patterns.md:141` to `:144`: the exchanges snippet drops `ex_tailgate` and the KO keys on `ex_client_sites` (m03 `:838` to `:840`). Copy the real gates, or say they are abridged.
- n3. `references/gotchas.md:51`: a TODO in a shipped skill. Move it to the backlog, or word it as "not yet measured".
- n4. `SKILL.md`: the stages run 0, 1, 2, then the loop, then 4, 6, 7 and 8. There is no Stage 3, so the slice numbers and stage numbers are easy to mix up. Number the loop as Stage 3, or drop the stage numbers.

## Verdict

Revise. The three majors are small text changes, but M1 decides when the skill can land: with or after build/ol-m03, or with the engine claims marked as pending. Round 2 should confirm the fixes and cover the unchecked scope listed at the top.

## Outcomes

Fixes are in the skill at `.claude/skills/mission-office-life/` (SKILL.md 230 lines). Engine line numbers are as on `build/ol-m03` (tip b4b7c5119).

| Finding | Outcome | Where |
|---|---|---|
| M1 side swap and instant unseat only on build/ol-m03 | Fixed. The skill lands after build/ol-m03 (train 131); the "engine now..." wording stays, with one line near the top saying main must include the m03 engine fixes. Cites are build/ol-m03 lines. | SKILL.md intro; `measurement-recipes.md` section 4 (`_sideBlocker` `:3445`, `pair_side_swap` `:3427`) |
| M2 ambient staff not from the awareness cast | Fixed. D53 rule added with the three awareness files, atlases with seated and pose frames, sprite key clash check, ethnicity and age variety, new design only with a reason and the user's yes. Stage 6 narrowed to missing frames. | SKILL.md Stage 1 (extras line replaces the diversity line); Stage 6 |
| M3 `globalVars` vs `globalVariables`, strict `requireGlobal` | Fixed. `globalVariables` named in all three places; the strict `===` gotcha added (`npc-needs.js:310` to `:314`). | `mapping-patterns.md` sections 3 and 6; `checklists.md` per slice; `gotchas.md` Smaller items |
| m1 stale timings in SKILL.md | Fixed. Final 18.6 s and 28.7 s, use 16/20, threshold 24; 14.6 and 23.1 given only as the Stage 1 figures. | SKILL.md Stage 2 levers |
| m2 pair stall mixed two cases | Fixed. Cooler stall is harmless (already over 24 s); coffee overshoot (22 to 30 s against 18.6 s) is the open-laptop gap. The IDEAS_BACKLOG line already exists on build/ol-m03 (`docs/IDEAS_BACKLOG.md:284`); a copy added here was removed as a duplicate in 166a146c1. | `gotchas.md` Pair walk-home stall; `measurement-recipes.md` section 3; `docs/IDEAS_BACKLOG.md:284` on build/ol-m03 |
| m3 main-based line cites | Fixed by M1: hidden-skip tests now `:1023`, `:1238`, `:2202`, `:4619`, `:4661`; `npc_use_started` emit `:3557`. | `mapping-patterns.md` sections 3 and 4 |
| m4 validator list missing V11 and V4 info | Fixed after reading `scripts/validate_office_life.rb` (V4 info `:41`, `:489`; V11 `:13`, `:743`). Source list now says V1 to V11. | SKILL.md Stage 1 sources, Stage 4 after-each-slice |
| m5 no voicing yes, no train request | Fixed. Voicing needs the user's explicit yes with the V6 clip count via the decisions page; before merge asks the integrator for a train and requires `train-check.sh` GREEN on the merge hash; the hand-run suites are marked as debugging only. | SKILL.md Stage 7 and 8; `checklists.md` Before merge; `gotchas.md` Suites |
| m6 `overhearRadius` only in `affordance` | Fixed. Objects take it in `affordance`; a pool `{ lines, overhearRadius }` sets it for mutters and as fallback (`:271` to `:293`, `:2996` to `:3004`). | SKILL.md Stage 2 rooms |
| n1 shredder missing | Fixed. `office-presets.json` and `npc-poses.js:52` both carry it. | SKILL.md Stage 2 rooms |
| n2 abridged exchanges snippet | Fixed. Real gates for `ex_open_door`, `ex_tailgate`, `ex_client_sites` copied (scenario `:838` to `:840`); chatter lines marked elided. | `mapping-patterns.md` section 6 |
| n3 TODO in gotchas | Fixed. Now "not yet measured", pointing to plan slice 7 and the future `SLICE7_SEATS_POSES.md`. | `gotchas.md` Seated pose checks |
| n4 stage numbering gap | Fixed. The loop is Stage 3, Live proof is Stage 5, and a note says slice numbers are not stage numbers. | SKILL.md headings |

Round 2 scope the review left open, done as a quick pass:

- `SOFA_FIX.md` and the R2/R3 handovers: consistent with the skill (breathing image cause, instant unseat on hide, the 20 px seated offset, `patrolOverride` stopping short, the flake note). No change.
- Port and PID wording: the skill said only "its own port". Added "never 3000, 3085 or 3086" (AGENTS.md) and "record the puma PID and stop that PID" to Live proof. It is consistent with the playtest-scenario skill's keyless-server rules.
- Form against sibling skills: same front matter and checklist style as `mission-room-lighting` and the others; no change.
- The agent-type id `opus55` still appears in SKILL.md and `checklists.md` as the routing name AGENTS.md uses, not as a model claim; left as is.
