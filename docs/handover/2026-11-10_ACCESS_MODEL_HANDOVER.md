# Handover: access model, physical pentest follow-up and voice work (parked 2026-11-10)

Everything below was parked at the user's request so another session can finish it. This file is self-contained: read it, then the documents it names.

## How to resume

- Branch for this work: `claude/break-escape-access-design-090sjx` (BreakEscape). `main` is fast-forwarded to it at park time.
- Four build branches were not merged. They existed only as local worktree branches, so each is saved as `git format-patch` output in `docs/handover/2026-11-10_parked_branches/<branch-name>/`. To restore one:
  ```
  git checkout -b build/<name> <base>
  git am docs/handover/2026-11-10_parked_branches/<name>/*.patch
  ```
  Bases: `f86912dd4` for `9-1-step5-holds-doors`, `9-2-u-a` and `voice-direction-tag`; `1f959061d` for `stage-directions-m02-m07`. Both bases are ancestors of `main`, so the patches can also be applied on a fresh branch from `main` (use `git am -3`).
- Process the user set: each piece of work gets at least 2 and up to 5 rounds of code review (Opus 5.5 reviewers, `opus55` agent type, given the code rather than a summary), fixing blockers and majors between rounds, until a round finds none. Merge only with `bin/rails test` and `bin/test-js -j 3` green. Each plan or review copy is complete and self-contained.
- Rules: `AGENTS.md` (no attribution lines in commits), UK spelling, "cyber security" two words, no em or en dashes, no model names in repository files. Environment and builder rules: see "Builder rules" at the end.

## Done and on `main`

- Earlier access model slices (sign-in, doors, sessions, declared grants) with their playtests.
- **Engine feedback from the lab playtest** (plan `docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`, reviews R1 to R5): toasts of at least 5 s with door sign titles; the ending check before the choice; one RFID sound; dropped items keep their sprite; the inventory click menu and tray refresh (E3); the hard door bar (E1); the captured credentials holder with server-checked proofs (E4); a badge clone in dialogue waits until its line is shown.
- **Slice 9.3a networks, steps 1 to 8** (plan `ACCESS_MODEL_SLICE_9_3_PLAN.md`): planting in a jack, the network view, remote sign-in with a captured password, file shares, return to the screen you came from, `scenarios/test_access_networks` with scripted runs.
- **Slice 9.1 awareness and habits, steps 0 to 4, 6 and 7** (plan `ACCESS_MODEL_SLICE_9_1_PLAN.md`, log `ACCESS_MODEL_SLICE_9_1_BUILD_LOG.md`): screen-lock habits, sticky notes, clue-built passwords, validator, graph, tooling, `scenarios/test_access_habits` beats H1 to H8.
- **Lab content part (a)** (plan `PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md`, items A1 to A18) and its review fixes.
- **Stage direction audit** of all ink: `docs/achitechture/physical_pentest_followup/STAGE_DIRECTIONS_AUDIT.md` (523 flagged lines; made by a cheap model, verify before acting on it).

Last full suites on `main` code: Rails 1298 runs, 0 failures; JS 474 of 474 files.

## Parked, not merged

### 1. Voice delivery tag (`build/voice-direction-tag`, head `0ae824812`)

A `#delivery: <acting note>` ink tag: the note goes into the voice prompt for that line only and into the cache key only when present, so untagged lines keep their clips. Build log: `docs/achitechture/physical_pentest_followup/VOICE_DELIVERY_TAG_BUILD_LOG.md` (in the patches; has a handover section). Review R1 (on `main`): `VOICE_DELIVERY_TAG_CODE_REVIEW_R1.md`, 0 blockers, 2 majors, 8 minors, 5 nits.

- Fixed and tested: M1 (the server now uses the ink's own note, never the client's text), M2 server side (an unmatched note is dropped and the line plays untagged; the walker carries a note over a plain divert; parity test against inkjs), m1, m2, m3, m4, m5, m7, n1, n3, n5.
- Not done: M2 lint checks for glued lines and lines that print variables (those notes play untagged today); m6 (lint false positives on emphasis at sentence edges); m8 docs (tts-audio "Serving order", rule 7 still says "else 403", `README_ink_best_practices.md` limits); n2 behavioural test; n4.
- Not run: full `bin/test-js -j 3`; the 8,475-key identity check that every untagged key matches base `f86912dd4`. Rails at park: 1329 runs, 0 failures.
- Next: finish the above, then review round 2.
- Separate open issue, outside this branch: the TTS endpoint's `text` parameter accepts lookalike characters appended to a real line, which get spoken and cached under the real key. Needs its own fix.
- Not supported yet: notes on voiced phone call lines (they are dropped, consistently on client and server).

### 2. Stage directions out of voiced lines, m02 to m07 (`build/stage-directions-m02-m07`, head `5ee479515`)

The user's rule: voiced lines hold only spoken words; a cue inside a spoken line becomes a `#delivery:` tag; a line that is entirely a scene direction is said by the narrator; text-only phone chats keep their on-screen cues. Changed: 67 lines, 64 tags, 5 narrator lines; 72 lines to voice, 43 replacing committed clips (m02 and m03). Details: `STAGE_DIRECTIONS_M02_M07.md` and the m02 to m07 sections of `VOICING_NEEDED.md` (in the patches).

- Review R1 (on `main`, `STAGE_DIRECTIONS_M02_M07_REVIEW_R1.md`): 0 blockers, 1 major, 3 minors, 5 nits; all fixed in `5ee479515`.
- Review R2 (on `main`, `STAGE_DIRECTIONS_M02_M07_REVIEW_R2.md`): 0 blockers, 0 majors, 2 minors, 6 nits, so the review loop has cleared. The m04 Voltage 36 to 35 lint count is not a lost line: the line is only a cycle, which the lint never counts once its cue is gone. Still to apply before merge: m1 (rewrite the new narrator line at `m02_npc_receptionist.ink:267`, which repeats the line above it, and row 19 in both docs), m2 (one sentence in `STAGE_DIRECTIONS_M02_M07.md` explaining the m04 count), and the nits as the review lists them (Val's radio beat is left for the user).
- Merge order: after the voice tag branch, or every tagged line logs "Unknown game action tag: delivery" and the voice gets no note.
- Before deploy: run the voice batch for the affected m02 to m07 lines (the user approves TTS cost), then a `tts:wasted` or batch dry run to confirm the keys.
- Open user question: Gary's keycard and Irina's badge hand-overs got delivery notes, not narrator lines, because `#give_item` already shows the hand-over.
- Not started: the same rewrite for m01, m08 to m10, the shared `scenarios/ink/` scripts (check which are actually loaded by a mission first; many look like old examples) and test scenarios. The user asked for m02 to m07 only so far.

### 3. Slice 9.1 step 5, `holdsDoors` (`build/9-1-step5-holds-doors`, head `8d92d822d`)

A careful guard will not open a gate with the player near and shuts it as soon as the player comes close (`gate.noHold`). Handover section with exact next steps: `ACCESS_MODEL_SLICE_9_1_BUILD_LOG.md` (in the patches).

- Built and unit-tested: the client in `door-gates.js` (the plan's 5.4 contract held, no door-code change needed), presets and gate fill, loader, schema, validator, dungeon graph label, `verify-run --access` lines, README paragraph. Extra commit `588f7afb3` fixes a false validator warning for a gate whose `requires` card its guard carries; droppable if unwanted.
- Browser: H9 passed (game 133). H1 to H7 and the reload passed again (game 134); the H8 rerun was not done.
- Not done: H8 rerun, the H9 section of `scenarios/test_access_habits/PLAYTEST.md` and its run report, full Rails and JS suites (last full Rails run had 1 failure, since fixed), a `test_gate_tailgate` browser run, then review rounds.
- Found, for the door and route code: a guard sent back to his door can stop exactly on the 56 px radius edge with no target; a door waypoint directly above the door stopped a route unlock. H9 works round both (radius 80, other waypoints).
- Proposed playtest-scenario skill sentence is in the build log; skills need the user's say-so.

### 4. Slice 9.2 sub-slices U and A (`build/9-2-u-a`, head `64322fb32`)

Plan `ACCESS_MODEL_SLICE_9_2_PLAN.md` (design cleared R5). Handover section: `ACCESS_MODEL_SLICE_9_2_BUILD_LOG.md` (in the patches).

- U, the USB policy: done; U1 to U3 pass in the browser (game 128), leak check clean, report `scenarios/test_access_work/reports/2026-11-10_run_u.md`.
- A: A-1 (work resolver `lib/break_escape/access_work.rb`), A-2 (work plan in room data, withheld keys), A-3 (`POST /npc_frustration`, server-held frustration), A-5 (`npc-work.js`, needs core), A-6 (report queue, icons, debug F bar, test bridge, `verify-run`) are committed. A-7 (scenario rooms for W1 to W7) is a WIP commit: W1 and W2 pass (game 135); W3's task `w3_eased` never ticks because its condition compares two event fields, which the mapping evaluator probably does not support; W4 to W7 not run.
- Not started: A-4 (validator checks, including the expected warning for Kai), A-8 (documents), the needs regression captures.
- Not run since A-5: full suites. Last full Rails after A-3: 1340 runs, 0 failures.
- Shared-file edits to check on merge: `npc-coffee-off` test lists the new `failed` turn-back; `validate_npc_needs.rb` ignores other people's desks for a judged need and lets a `social_media` need have no object; withheld NPC keys are a separate constant beside `WITHHELD_NPC_KEYS`.
- The 9.1 step 5 branch touches the schema, validator and `npc_habits.rb` too; apply one, then the other with `git am -3`, and resolve any conflicts.

## Not started

- 9.3a step 9: the lab adopts networks (content B1, B2: the drop box console and the door controller needing the box plus Chris's password; `captureProofs` for hampshire, lord and pierce).
- 9.1 step 8: the lab adopts habits.
- 9.2 sub-slices B (workarounds), H, L (lockout as a cause: the user said yes, decision 14), C.
- 9.3b (second half of networks): plan only.
- Lab content part (b) items in `PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md`.
- Suggested order: finish and review the four parked branches; merge voice tag, then stage directions; then 9.3a step 9 and 9.1 step 8 together (both change the lab); then 9.2 B, H, L, C; then 9.3b.

## Decisions the user made on 2026-11-10

- Per-line voice directions as an ink tag: yes; voice skill rule 7 becomes "no stage directions in voiced lines". Audit the existing ink (done) and update m02 to m07 (parked branch 2). Scene-only directions are said by the narrator.
- Account lockout counts as a cause of NPC frustration (9.2 decision 14, sub-slice L).
- No asset version stamp (engine plan E2b): bumping the Break Escape version already invalidates the cache.
- Reception: Dev's line is enough; no guarded gate.

## Open questions for the user

1. Re-voice the 34 lab lines in `VOICING_NEEDED.md` (under US$0.10), and later the 72 m02 to m07 lines.
2. The lock chime: loud enough, or one of the engine plan's proposals? A "worn" frame for the vest, or a no-change-while-seen rule?
3. Update `docs/agents/PASS4_BRIEF.md` line 30, which still allows inline asterisk cues.
4. Remove attribution lines from older pushed commits (needs a history rewrite).
5. A second coffee source for Chris.
6. The playtest-scenario skill sentences proposed in the 9.1 build log.
7. Narrator lines instead of notes for the Gary and Irina hand-overs.

## Small follow-ups

- Stale ink comments in m03 and m04 and the m03 Victoria line order after the clone timing change.
- Stale sound lines in `scenarios/test_access_sessions/PLAYTEST.md`.
- Shared dev database leftovers from playtests: game rows 92 and 115, mission row 167 (`test_access_work`), games 121, 128, 133, 134, 135. The deletion of 115 was refused by the permission check; ask before deleting.
- `capture_log.png` art.
- The lab look and listen by the user (`docs/achitechture/physical_pentest_followup/LOOK_AND_LISTEN.md`).

## Builder rules (for agents resuming this)

- `export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6`; `pg_lsclusters | grep -q online || pg_ctlcluster 16 main start`.
- Validator: `LANG=C.UTF-8 ruby scripts/validate_scenario.rb <file> --no-graph` (restore unrelated `dungeon_graph.json` rewrites).
- Tests: `bin/rails test` (about 30 s), `bin/test-js -j 3` (3 to 5 min; timing flakes in fingerprint-generator, client-purchase and password-signin-mode pass alone).
- Browser runs: own keyless server via `tools/playtest/start-keyless-server.sh` on a free port; never touch :3000. Chromium at `/opt/pw-browsers/chromium`.
- Worktrees cost about 1.6 GB each; truncate `test/dummy/log/test.log` when it grows.
- Never read SecGen credential files, Vagrantfiles or git remote URLs; never put credentials on a command line; no new gems without asking; never bare `git stash`; ask before reset, rebase or branch deletion.
