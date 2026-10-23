# Awareness course: handover (on hold from 2026-10-23)

The user put development of the 38-scenario security-awareness course on hold on 2026-10-23. This note is for whoever picks it up later, human or agent. Read it with `AGENTS.md` (mission loop, model choice, standing rules) and the files it points to; trust the scenario files over any design document.

## 1. What the course is

Seven short episodes, each played at a kiosk in a company training room. In the attack half the learner sees how a social-engineering attack is put together (and builds one); in the defend half they triage messages, calls, pages or prompts; a debrief closes it. Each episode also exists as a defend-only version, and each of six staff roles has a pre and post check in two orders. No VMs, no runtime LLMs.

| Episode | Topic | Company (room) |
|---|---|---|
| E1 | Invoice and bank-detail fraud | Brightwell (`room_aw_brightwell`) |
| E2 | CV and recruitment lures | Tarrowby (`room_aw_tarrowby`) |
| E3 | Help-desk password reset by phone, MFA fatigue | Quayholt (`room_aw_quayholt`) |
| E4 | Executive whaling | Merrin & Sallow (`room_aw_merrin_sallow`) |
| E5 | Fake sign-in pages | Quayholt |
| E6 | Texts and QR codes | Tarrowby |
| E7 | Cloned CEO voice | Merrin & Sallow |

Scenario folders (38): `scenarios/awareness_e{1..7}_*` (full, hand-authored), `scenarios/awareness_e{1..7}_*_defend` (generated), `scenarios/awareness_{pre,post}_{finance,hr,helpdesk,executive,general,mobile}_{ab,ba}` (generated). Which company and room each uses: `BRAND_SET.md`.

## 2. Where it stands

Format as in AGENTS.md "Reporting progress by stage": bar = cycles done of the planned five; B/M/m = blockers/majors/minors open from the latest review or playtest; "fixing" = fixed but not yet confirmed by a playtest.

```
Design              ██████████  0/0/0       closed (3 cycles)
Check forms         ██████████  0/0/0       permuted, disjoint phish slots, audited all 6 roles
Engine              ██████████  0/0/0 fixing  rounds 1–5 in (last: eb358d5d1); P6 to confirm
Data / dialogue     █████████░  0/0/–       rounds 1–7 in (last: 98bba5e50); round 8 see §6
Playtest            █████████░  0/0/18 fixing  P5 done (no majors); its minors fixed in engine r5 + data r7/r8
Fun changes         ██████████  –           aw1–6, aw8, aw9 + genuine-mail feedback in; aw7 on hold
Dialogue reviews    ██████░░░░  0/0/0       C1–C3 done and fixed; C4–C5 not run
Training rooms      █████░░░░░  0/0/0 fixing  C1 reviewed and fixed (4501b7c26); C2–C5 not run
Puzzle-chain pass   ░░░░░░░░░░  –           light pass, not started
Host art            ░░░░░░░░░░  –           waits for PixelLab quota (reset 3 Nov) and user approval
Timing              ░░░░░░░░░░  –           human runs postponed by the user; E3 ~17 min accepted
POV backgrounds     ░░░░░░░░░░  –           for the 4 training rooms, after room cycles; Gemini needs approval
Game configuration  ██░░░░░░░░  –           options form sent to the user, not answered (§5)
```

Trend: P4 and P5 found no blockers or majors; remaining work is polish plus the unstarted stages above.

## 3. Resume plan, in order

1. **Check the tree.** `git status` for awareness files; finish or revert anything round 8 left (§6). Run the checks in §4.
2. **P6 playtest**, two Sonnet agents (E1–E4; E5–E7 plus checks). Confirm every P5 finding (`playtests/PLAYTEST_P5_E1_E4.md`, `PLAYTEST_P5_E5_E7.md`) and the round-5/8 hooks: subjects that follow the pretext, template tells (secrecy, authority), the no-blame line rules, look-alike NPC sprite swap.
3. **Fix rounds** until a playtest finds only trivials: engine fixer (general-purpose) and data fixer (opus48) in parallel, each owning its own files (§4).
4. **Dialogue review cycles 4–5** (opus48 reviewer, then fixer).
5. **Training rooms cycles 2–5** (review `ROOMS_REVIEW_C1.md` for the method; fixes go through `scripts/room_gen/build_aw_rooms.py`, the prop/tileset scripts and `training_room.py`, then `apply_training_room.py --refresh`). Then the four POV conversation backgrounds (skill `room-pov-background`; Gemini calls need the user's approval).
6. **Light puzzle-chain pass** (skill `mission-puzzle-chains`, gating only).
7. **Host art** after the PixelLab reset, with the user's approval of scope (skills `pixellab-character-pipeline`, `pixellab-character-animations`; bust picks via a review page).
8. **Human timing runs** when the user asks; then any lab sheets or facilitator notes last.

## 4. How the files fit together (read before editing)

- **Source of truth.** Shared content lives in fragments `awareness/e*/{attack,defend}.json`. The 7 full episode erbs are hand-authored and must match the fragments for shared keys; `test/js/social-awareness-fragment-erb-parity.test.mjs` enforces this, with an allow-list of intended differences (each with a reason). Full-episode-only keys (e.g. `flipDefenderLineByChoice`, `conceptPanel`, `flipPageIntro`) live in the erbs only.
- **Generators** build the 31 generated shells: `gen_e1_shells.py`, `gen_e2_e4_shells.py`, `gen_e3_e5_shells.py`, `gen_e6_e7_shells.py`, using `training_room.py` (room, host, lighting from `training_room_lighting.json`) and `awareness_deploy.py` (the shared rule of thumb). `apply_training_room.py --refresh` re-splices only room fields into all 38 shells.
- **Never run a generator into the repo.** Regenerate into a scratch folder, confirm a no-change regen is byte-identical to HEAD first, diff, then copy in only changed `scenario.json.erb` / `mission.json` / ink. Restore any `dungeon_graph.*` churn to HEAD.
- **Engine** (shared with the lab and other games): `public/break_escape/js/minigames/{inbox-triage,episode-runner,mail-client,landing-page-builder,pretext-prep,person-chat,phone-chat}/`, `js/systems/{phish-rules,pretext-judge,mail-scheduler,awareness-measure}.js`, `js/utils/{player-avatar,npc-lookalike}.js`. Schema `scripts/scenario-schema.json`; social validators `scripts/validate_social/*.rb` (don't edit `scripts/validate_scenario.rb` without checking who else has it open).
- **Checks** (all must pass before a commit):
  - `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` (1810 passing at hand-over).
  - `ruby scripts/validate_scenario.rb <erb> --strict-social --no-graph --skip-ink` on all 38 shells.
  - Bridges `tools/playtest/se/bridge-e{1..7}-full.jsonl` (plus `bridge-p7-channels.jsonl`), **one at a time**, on the keyless server on :3001 only (never :3000), Node 24 at `~/.cache/ms-playwright-go/1.57.0/node`. Bridge logs append; `check-bridge.mjs` now scores only the latest session. A single retry is acceptable under heavy load.
- **Model routing.** Phishing/social-engineering content writing and review: opus48 (the default Opus safeguard over-flags this material). Engine work: general-purpose. Playtests: Sonnet.
- **Logs.** Every data and dialogue round appends to `DIALOG_LOG.md`; design decisions in `DESIGN_LOG.md`; the user's decisions in `../FUN_DECISIONS.md`.

## 5. Decisions already made by the user (don't reopen)

From `../FUN_DECISIONS.md`:
- aw1–aw6, aw8 built; aw9: the player's chosen avatar always wins and the portrait follows; the default hooded fallback stays.
- aw7 (E6/E7 defend-only by default): **on hold**.
- E3 stays about 17 minutes; no structural cut.
- E5 Quayholt logo made (PixelLab).
- Report sound: keep the generic confirm sound.
- Discrimination figure: organisers only; learners get detailed feedback on genuine items instead (built, 1c8106fd1).
- E7 mirror pair: keep the existing voicemail mirror; revisit with aw7.
- Deployment-wide reporting route: the user chose a Hacktivity setting, then asked for options. A proposal is in `HACKTIVITY_ROUTE_PROPOSAL.md` (this folder) and an options form at https://claude.ai/artifact/HapRJMpb8yT88cKy63iYn2 (approaches A–F, which settings, scope, fallback). **Not answered yet. Any Hacktivity edit needs the user's explicit go-ahead.**

## 6. Loose ends at hand-over

- **Data round 8** (hooks from engine round 5) was asked to stop at a clean point when the hold began: bind subjects to pretexts (E5, E6, audit others), add template tells (E4 secrecy, E7 "keep it between us"), reword authored no-blame lines, de-duplicate E6 canteen `whyFine`. Its outcome is recorded in the "Hold status" line below; whatever it did not finish is the first job on resume.
- **Training rooms review C2** was stopped before writing anything; run it fresh.
- Trivials carried from P5 not yet handled: E5 rule-of-thumb fit (reworded in r7; recheck), P5 timing not re-measured, the E3 MFA demo has no learner decision (E3-11), E4 offers only a webmail sender (kept deliberately).
- The lab (`lab_social_engineering`) is separate and not on hold.

Hold status: (filled in when data round 8 reports)
