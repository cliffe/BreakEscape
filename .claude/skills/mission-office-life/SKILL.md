---
name: mission-office-life
description: Takes a Break Escape campaign mission from no office life to the m02 standard: a cast audit, room affordances and machine presets, needs and routines for ambient staff, chatter pools and once-only exchanges, player levers and security windows, poses, lighting and door hearing, then the validator, lock/key diff and live proof. It plans first, reviews for 5+ rounds, builds, and reviews again. Story NPCs stay where the plot needs them and VM flags stay required. Trigger when the user asks to "bring office life into m0X", "add office life", "make the staff feel alive", "add a kitchen and coffee to the mission", "add needs to the NPCs", "add ambient staff", "add chatter/exchanges to m0X", "add physical-pentest openings to m0X", or "do the m02 office-life treatment on <mission>".
---

# Mission office life

Make a finished campaign mission feel like a working building: people who drink coffee, talk at the cooler, lock their screens and go home, without moving a single lock, key or required step. m02 (`scenarios/m02_ransomed_trust/office_life/`) is the worked example; read its `PLAN.md` for the shape of every section below. `test_needs_sims` is the showcase for each feature.

Sources, read by section, never end to end:

- `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md`: section 1 (the ten rules), 2 (what the engine offers and its limits), 3 (stages), 4 (validator checks V1 to V10), 7 (sync caps), 12 (review loop).
- `docs/achitechture/NPC_NEEDS_SYSTEM.md` sections 3 and 5; `docs/achitechture/NPC_POSES.md`; `scripts/scenario-schema.json` for every field.
- `scenarios/m02_ransomed_trust/office_life/HANDOVER.md` (gotchas) and `PLAN.md`.

## Standing rules

1. **Office life never gates the critical path or a VM flag.** No required task, objective, `concludeRequires` or required lock reads an office-life global or event. Office life opens optional content only.
2. **The lock and key structure does not move.** No lock, key, PIN, password, card, gate or flag is moved, removed or given a second way past it. An opening that would bypass a critical-path lock is dropped, not built.
3. **No large rewrites.** Existing knots, barks and eventMappings stay. New speech goes in new pools and new knots. An existing line changes only to fix a contradiction office life creates, and each such change is listed.
4. **VM flags stay required and diegetic.** Never open SecGen XML, Vagrantfiles or the four exploit field guides. Any question about the VM side goes to the user.
5. **Spoken lines are scenario data**: NPC or scenario `chatter` pools, eventMapping `bark` fields, or ink. Nothing is spoken from engine text. Every line must be voiceable by TTS.
6. **Sync stays small.** Nothing new grows in player_state; each new piece is a bounded value sent as a per-key delta (missions plan section 7 caps).
7. **Art needs a yes.** New sprites and pose frames need the user's yes before any PixelLab generation. No custom animations or states: the stock six plus seated frames only.
8. **Commit each pass** with explicit paths. Run `git diff --cached --stat` before every commit. Never `git add -A` or a glob in the shared tree.
9. Work on a branch (`plan/ol-<m>` for the plan, `build/ol-<m>` for the build) and merge main after each landing on main.

## Outputs

All in `scenarios/<m>/office_life/`: `BASELINE.md`, `baseline_locks.json`, `v1_summary_base.txt`, `validator_info_lines.txt`, `ANALYSIS.md`, `PLAN.md`, `REVIEW_R<n>.md`, `SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, `BUILD_LOG.md`, `STAGE4_LIVE*.md`, `STAGE5_LIVE*.md`, `LOG.md`, `HANDOVER.md`. The plan's sections follow m02's: aim and tier, people, rooms and objects, levers, openings, spoken lines, sync budget, field names, costs and approvals, test plan.

## Stage 0: baseline

- [ ] Confirm the mission is a campaign mission (m01 to m10). Anything else needs the user's say-so. If it is m01, record that the m01, sis01 and sis02 gate playtests must run again before any release carries it.
- [ ] `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb`: 0 errors. Save the `ℹ️` lines to `validator_info_lines.txt`.
- [ ] `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb --office-summary > v1_summary_base.txt` (V1, one line per NPC, sorted so it diffs).
- [ ] `ruby scripts/lock_key_diff.rb scenarios/<m>/scenario.json.erb --write scenarios/<m>/office_life/baseline_locks.json` (V9).
- [ ] `bin/rails "app:break_escape:tts:office_lines[<m>]"` from the worktree root (V6) for the cached clip count and any uncached clips that predate office life.
- [ ] Note `gameClock`, `disableAttacks`, the base commit hash and the walkthrough file in `BASELINE.md`.

## Stage 1: analyse (ANALYSIS.md)

### Cast audit

One row per NPC record, with file:line. Classify each:

| Class | Gets needs? |
|---|---|
| story-critical (required task, conversation the critical path needs, key or card source, cutscene role) | only confined to its own room, or none |
| suspect or plot-located (the deduction relies on where they are) | no |
| fixed by the text (ink, note or observation says where they are) | no |
| optional flavour | yes, leashed |
| ambient (no story duty) | yes |
| patrolling or hostile from the start | never (a needs NPC may not have `behavior.patrol`) |
| several records of one character, non-human, phone or cutscene only | never |

- [ ] **Story NPCs stay where the plot needs them.** In most missions every existing person is story-critical (m02 and m03 both), so talk needs new ambient people or nothing.
- [ ] For each NPC who might sit or pose: does the atlas have seated frames (`--sit-from`) and pose frames (`pose_drink_*`, `pose_use_*`, `pose_phone_*`)? List what is missing; it is an art item, not a blocker.
- [ ] Mark every NPC "can be attacked" unless the scenario sets `disableAttacks`, and list each one's `globalVarOnKO`, `taskOnKO` and KO drops.
- [ ] List beats keyed on NPC position or presence: `npc_arrived`, `room_entered` mappings, conversation-reachable knots, LOS and `challengeOnSight`, KO tasks, `initiallyHidden` reveals, cutscene triggers.
- [ ] **Schedules.** There is no timetable field. Write down the mission's acts and the global that turns each (m03: `clone_call_done` turns afternoon into night). Ambient staff appear and leave on those globals through mappings (`hide`/`show`, `patrolOverride`), not on a clock.
- [ ] **Cast diversity.** A new NPC varies ethnicity and age against the mission's cast; the concept prompt records the choice. A recurring named character uses their own sprite key.
- [ ] Tone and time of day: a working day suits office life; night gets a thinning office (a cleaner, one late worker) or nothing.

### Rooms and machines

- [ ] Each room: type, office-like or not, which rooms load together (only loaded rooms simulate), `chatBackground`, lighting variants.
- [ ] Every kitchen, coffee point, cooler, vending machine, copier, printer and desk phone, both declared objects and Tiled decor. Decor cannot carry a preset until it is declared.
- [ ] Hard-rule secrets and story items: every PIN, password, key, card, code and flag and where it is written; every PC that is a puzzle or story-locked; every item type a lock or ink check reads. Office-life printouts, left-behind items and reveal slots never carry one of those secrets or item types.
- [ ] Existing barks and timed messages, and any grumbles in eventMappings that would read better as chatter pools (moving them is a change to an existing line; list it).

### Tier

Recommend one tier in a paragraph: **0** none (say why), **1** presets and chatter on existing objects, **2** needs, habits and one or two levers for flavour and ambient staff, **3** a new room, up to two new ambient NPCs, and openings into optional content.

## Stage 2: design (PLAN.md)

### People table

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|

- [ ] Every needs NPC has a post (`needsHome`), a leash (`needsRooms` or `needsAvoidRooms`) and stays out of private rooms (room `needsPrivateTo`).
- [ ] Keep new NPCs out of a guard's patrol room and LOS window with `needsAvoidRooms`, and out of the room where a story beat happens at a fixed spot.
- [ ] Name a protection for every story beat. Only three count: (1) the NPC has no `needs`; (2) its needs are confined to its own room and every target is in it; (3) a mapping on an event that always precedes the beat sends it home with `patrolOverride.targetTile`, and a `"needs": "resume"` mapping after the beat lets it go. `deferrable: false` is **not** a protection; it makes the NPC leave more readily.
- [ ] Never add an `npc_arrived:<id>` mapping to a needs NPC (needs arrivals fire it).
- [ ] Social compatibility: chat only between people who plausibly get on. Distrusted or suspect people carry `needsCompany.avoids`.
- [ ] Hostile ambient staff get `leash: true` so a punched NPC stays in its room. Add a credits line for KO and attack outcomes.

### Needs and routines

- [ ] Pick needs that the post room or an always-loaded neighbour can meet. A need goes to the post object if that satisfies it, else the nearest reachable free source, so two NPCs posted apart rarely meet.
- [ ] Natural rhythm first (`decayPerMin`, `urgentAt`, `initial`, `jitterPct`); then mapped breaks for timing: `room_entered:<room>` or `conversation_closed` with `delayMs` about 2000 and a cooldown of 120 to 150 s.
- [ ] Coupled breaks: a mapping on `npc_use_started:<object>` with a condition on the partner's id sets the other's need low through `needs: { set: ... }`. Coupling both ways can hold a cooler for minutes and shut out NPCs that avoid `*` (`SIMS_TIDY_LOG.md:600` to 612); couple one way, or cap with a cooldown.
- [ ] An NPC whose every need is met by its own post object never moves but stays registered, so it can print by command (`needs: { print: ... }`, `forget: true` leaves the page on the tray).
- [ ] Reload resets needs to the posts. Only scalar globals survive; design for that.

### Rooms, affordances and machine presets

- [ ] Set scenario `officePresets: true`. Presets match exact sprite types (`coffee_station1`, `kettle1`, `water_cooler1`, `photocopier1`, ...); anything else takes one through object-level `officeType` (a boiler as `kettle`, an undercounter fridge as `fridge`). Takeable, `lockType`, id-less and `decor: true` objects never gain one.
- [ ] Declare Tiled decor that should take part as a scenario object. Declare every same-image twin in the room too, or it is hidden when the first is claimed. Claimed decor is declared with no `position` (top-left semantics come from the map).
- [ ] Check every object V1 says gained a preset: a puzzle `pc` with no `lockType` gains a desk preset.
- [ ] Hand-write `useFrom`, `queue.cells` or `"queue": false` where a preset's cells hit a wall, door or neighbour. Aim `useFrom` at the NPC's body-centre cell (`HOME_EPS` is 12 px).
- [ ] `offWhen` lives at object level, never inside `affordance`. `overhearRadius` is read only from `affordance`; set it so the parts of the room where the player should hear the pair are within it of both users' cells (360 covers a whole room; the default 160 is narrow).
- [ ] Wall objects whose sprite sits beyond the 32 px reach get `wallMounted: true` (read by `reachY` in `interaction-reach.js`).
- [ ] Machines: `machine` defaults true for coffee, kettle, cooler, boiler, copier, printer, microwave, vending, keypad and socket. Set it only to override.
- [ ] Props square to the walls (one or two angled per room), placed through mission-room-dressing.

### Poses

- [ ] Poses (`drink`, `use`, `phone`) show only when the atlas has the frames. Object `pose` overrides the default (`false` for none); NPC `poses` limits or turns them off. Seated NPCs keep the sit frame.
- [ ] Missing pose or seated frames are an approval item (PixelLab spend). Until approved, use a stand-in atlas with seated frames (m02 used `male_telecom_v2` and `female_telecom_v2`) and plan the swap.

### Chatter pools and exchanges

- [ ] Talk needs a pair: two compatible NPCs using one capacity-2 chatter object at once. A lone NPC says nothing. `grumble` plays only on a turn-back; `greet` only at an affordance with `chatter: "greet"`.
- [ ] Pool lines: one line, 40 characters at most (validator error above), no `{ }` variables, no speaker prefix, nothing that repeats a bark or the NPC's ink opener (V7).
- [ ] Exchanges (`exchanges[{with, knot, requireGlobal}]`) are ink knots, heard once (`heard_<knot>`). The first line must stand alone, because the player may walk in on it. An exchange never leaks or contradicts a clue; gate one on the global that makes it true.
- [ ] Barks sit outside the TTS extractor; a new bark is voiced by hand, so prefer pools and knots.
- [ ] Put every line in a table in `SPOKEN_LINES.md`: speaker, pool or knot, line, characters. Plus the list of existing lines changed (old to new), ideally empty.
- [ ] Send `DIALOGUE_SAMPLE.md` (a few pool lines and one exchange) to the user before the dialogue cycles continue.
- [ ] **Re-voicing a line that a review changed needs the user's separate yes**, through the decisions page, even when the earlier voicing was approved.

### Security windows and player levers

Prefer **levers over schedules**: the player causes the event through existing systems rather than waiting on a timetable.

- [ ] Levers: deliver a magnet item (the cake), ring a desk phone (`desk_phone_ring:<id>`), throw a breaker (`offWhen` with a switch object), drop an item with `interests`. Each is optional and each says what it opens.
- [ ] Security windows: the gap while an owner is away (unlocked screen via `habits.screen`, a page on the copier via `habits.print`, a left-behind item, a propped door). Each opens optional content only: lore, an optional task, a side drawer. Never a critical-path door, the server room, a safe or a story-locked PC.
- [ ] Openings that write state sent whole (capture log, cloned cards, footholds, disguises) need their own approval item with a sync note.
- [ ] Physical-pentest openings and any text that names security techniques go to the agent type AGENTS.md names for VM and technical material.

### Lighting and doors

- [ ] Light any new room or new screen with mission-room-lighting; keep the mission's lighting variants (for example keyed on the act-turn global) consistent with who is present.
- [ ] Motion-sensor rooms stay dark until the player enters; an NPC posted there needs a light that matches.
- [ ] Hearing: a room's sounds play at 1 in the player's room and 0.4 through a door to an adjacent room (`room-hearing.js`). Once the chatter falloff (D34, branch `build/ol-chatter`) is on main, chatter carries faintly through an **open** door at 40% of the distance level and stops when the door shuts; lines heard that way do not set `heard_<knot>`. Place pairs so the player can walk in on them, not only hear them from the corridor.
- [ ] `roomTone`: the profile matches exact room types; map custom types with `roomToneTypes`. Room tone is the last slice, after dressing.

### Sync budget

- [ ] Fill in the missions plan section 7 table with this mission's counts: workstation globals, `heard_` keys, `onUse`/workaround globals, reveal globals, servings, `onceOnly` mappings, office-life items. Name any non-monotonic global and why last-write-wins is acceptable. Reveal globals go back to `false` on reload, so treat them as non-monotonic.

### Costs and approvals

- [ ] One page of approval items (new rooms, new NPCs with the cast choice, new art, engine changes, voicing spend from V6, any changed existing line), with a Copy picks box, saved inputs, entered on the shared decisions page. Paid steps wait for the picks.

### Test plan

- [ ] Walkthrough steps that must still pass; office-life checks to make live (five tries each at walking pace); reload checks; the attack probe (attack a moving NPC, a seated one and one leaving through a door, fresh game per step); the expected lock and key diff (empty, or exactly the approved items).

## The loop

```
plan -> review R1..R5+ (standalone rewrite after each) -> approvals -> implement in slices -> review R1..R5+ -> art follow-ups -> voice -> close
```

- [ ] **At least five rounds** for the plan and again for the build. Each round is a fresh read-only reviewer (planning and review tier, per AGENTS.md "Choosing a model"), findings tagged blocker, major or minor with file:line, saved as `REVIEW_R<n>.md` with B/M/m counts.
- [ ] After each plan round, **rewrite PLAN.md as a standalone document** with no references to reviews or earlier drafts. Every finding gets an outcome: fixed, withdrawn with the reason, or deferred with the reason.
- [ ] After round 5, fix **minors only**. A major found after round 5 sends the next round to the stronger tier.
- [ ] From R4, delta reviews (the diff since the last round) run on the cheaper tier.
- [ ] Stop at a round with 0 blockers and 0 majors after round 5.
- [ ] Plan reviewers check: the expected lock and key diff and aim chain; that no opening became required; V2 and V5 risks; each NPC's class and attack outcome; compatibility and leashes; spoken-line rules; sync sums; field names; cast diversity.
- [ ] Every multi-step brief carries the handover rule: at about 150k tokens or 80 tool calls, finish the step, commit, write `HANDOVER.md`, report and stop.

## Stage 4: implement (slices, one commit each)

1. New rooms and objects; presets, needs, posts, leashes, privacy.
2. Workstation habits (screen, print, USB) and awareness.
3. Chatter pools and exchange knots (a writer on the planning tier).
4. Levers and openings (the VM and technical agent type, text and wiring).
5. Dressing and lighting of every changed room: mission-room-dressing, then mission-room-lighting, about five cycles each, up to ten while improving. Re-run the validator after each cycle.
6. Room tone.

After each slice:

- [ ] Ink compiles; `dialoguelint.mjs` on changed ink; `tagdiff.mjs` against the last commit for any existing ink touched; inkcheck and loopcheck; `scripts/ink_runtime_check/reopencheck.mjs` and the mission's route suite (`scripts/ink_runtime_check/<m>_routes/`) where it has one.
- [ ] `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb`: 0 errors, every new warning cleared or justified. The office-life checks (`scripts/validate_office_life.rb`, run from it) cover V1, V2 (story NPC whose needs can leave its room), V3 (`npc_arrived` on a needs NPC), V4 (attackable needs NPC), V5 (required content keyed on an office-life global or event: an error), V7 (repeated lines), V8 (sync budget) and V10 (a pool or exchange nothing can trigger). The older needs, access and habits validators run too.
- [ ] `--office-summary` diffed against `v1_summary_base.txt`: only the planned NPCs changed.
- [ ] `ruby scripts/lock_key_diff.rb scenarios/<m>/scenario.json.erb scenarios/<m>/office_life/baseline_locks.json`: empty, or exactly the approved items. It regenerates the dungeon graph itself.
- [ ] `python3 scripts/check_door_alignment.py` and the room depth check for new or changed rooms.
- [ ] Field names at `FormatUpgrade.current`; office-life keys never inside an ERB loop or tag.
- [ ] Commit the slice with explicit paths after `git diff --cached --stat`, before any live test.

## Live proof

- [ ] Run a keyless server from the branch worktree on its own port (never the user's main server). Worktrees share the Postgres dev database: never `db:create`, `db:schema:load`, `db:migrate` or `db:reset`.
- [ ] **A fresh game per check** from `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <m>`. Use the id it prints; never infer or reuse an id. It synthesises stand-in VM flags and prints FLAGS_XML: pass that to `tools/playtest/session-start.sh --url <URL> --flags <path>`.
- [ ] **Never edit a game row's scenario copy or state, and never set globals in the page** to reach a state. If a check needs a head start, add it to a test scenario on the branch or ask. Type flags in play where a reward matters: seeding m02's flag 4 by `--submit-flag` did not open its cache.
- [ ] Headless only: `game.loop.setFPS(20)` with **fixed steps on**. Never `fixedStep = false` (bodies tunnel 8 px walls).
- [ ] Check through `window.__test.needs` that posts, leashes and privacy hold, both partners reach `using` at each chatter object, and nothing mapped to NPC position fires early or twice.
- [ ] A run counts only when `tools/playtest/verify-run.rb` shows progress. A scripted run's "stuck" is checked by a persona run before it counts.
- [ ] Stage 5 playtests: a scripted regression of the walkthrough with office life on; a persona run of 10 to 15 minutes that pulls each lever, tries each opening, attacks one moving NPC and reloads once; a frame-time reading; with `roomTone`, a listen through a north or south door and an east or west one. At most three rounds, then a short confirmation run.
- [ ] The Mission Brief reappearing and the start-room spawn after a reload are intended, not findings.

## Gotchas (from m02 and the sims tidy)

- **Doorway jams.** Queue cells, `useFrom` cells, posts and chairs must keep out of door gaps and the corridor a player walks in on (`SIMS_TIDY_LOG.md` about :35 to :140; the `chair_out_of_doorway` sweep, e131ef703). A player parked in a lane can block NPCs too.
- **The 20 s needs-walk deadline**: `max(20 s, 3 x distance / speed)` (`NPC_NEEDS_SYSTEM.md:474`). A long walk through traffic times out with `npc_job_failed`; keep need targets close to posts.
- **Second user's cell.** At each capacity-2 chatter object, check live that each partner can path to its cell. A cut-off cell shows as `npc_job_failed` with reason `no_beside_cell`.
- **Cooler coupling** both ways holds the object for minutes (above).
- **Only loaded rooms exist.** Need objects in a room the player has not opened are not live; an NPC there is not simulated.
- **Scripts win over needs.** A scripted walk suspends needs. A bare `suspend` freezes an NPC where it stands, possibly in another room.
- **Story room collisions.** Do not let a needs walk or a new `room_entered` mapping collide with a cutscene trigger room or a fixed-spot beat.
- **player_state delta sync**: every new value is a bounded key sent as a delta when it changes, never a growing list re-sent whole.
- `scenario.json.erb` holds ERB comments with `%>`; edit with `str.replace`, never a Python `%` format.
- Run V6 from the worktree root so it reads the branch's scenario.

## Stage 6: art follow-ups

- [ ] New NPCs, after the user's yes: pixellab-character-pipeline (concept through agy, walk atlas with the stock six animations, seated frames if they sit, bust, `<key>_headshot.png`, visemes from a talk run). No custom animations. Hand edits go in `tools/pixellab_overrides/`. Never rescale pixel art.
- [ ] Swap stand-in atlases for the real keys, then re-measure posts, seats and each pairing.
- [ ] room-pov-background for every changed room with a `chatBackground` (both halves of a split one), after dressing and lighting.
- [ ] Closing check on the final commit: validator, `--office-summary` diff, lock and key diff, a short scripted regression playtest.

## Stage 7 and 8: voice and close

- [ ] Voice with tts-audio once the words are signed off; V6 must show 0 uncached office-life clips. No release carries unvoiced office-life lines.
- [ ] Record each round's severity table and every finding's outcome in `LOG.md`.
- [ ] **Lab sheet last.** Flag the lab-sheet impact (new optional routes and openings) to the user; the mission-lab-sheet skill runs only as the final step. Update `CYBOK_MAPPING.md` if an opening teaches something new.
- [ ] Commit each pass; hand the branch to the integrator, who merges the tested hash. The pass never moves main itself.
- [ ] Fold new lessons into this skill.
