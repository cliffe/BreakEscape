---
name: mission-office-life
description: Takes a Break Escape campaign mission from no office life to the m02 standard: a cast audit, room affordances and machine presets, needs and routines for ambient staff, chatter pools and once-only exchanges, player levers and security windows, poses, lighting and door hearing, then the validator, lock/key diff and live proof. It plans first, reviews the plan for five rounds, builds, and reviews the build until it is clean. Story NPCs stay where the plot needs them and VM flags stay required. Trigger when the user asks to "bring office life into m0X", "add office life", "make the staff feel alive", "add a kitchen and coffee to the mission", "add needs to the NPCs", "add ambient staff", "add chatter/exchanges to m0X", "add physical-pentest openings to m0X", or "do the m02 office-life treatment on <mission>".
---

# Mission office life

Make a finished campaign mission feel like a working building: people who drink coffee, talk at the cooler, lock their screens and go home, without moving a single lock, key or required step. m02 (`scenarios/m02_ransomed_trust/office_life/`) is the worked example; read its `PLAN.md` for the shape of every section below. `test_needs_sims` is the showcase for each feature.

The skill assumes main includes the m03 office-life engine fixes (`build/ol-m03`, train 131): the pair side swap and the instant unseat when a seated NPC is hidden. Where it says "the engine now...", that is those fixes; engine, schema and script line numbers are as on main at 8894096d3. A bare engine file name (`npc-needs.js`) is in `public/break_escape/js/systems/`.

Sources, read by section, never end to end:

- `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md`: section 1 (the ten rules), 2 (what the engine offers and its limits), 3 (stages), 4 (validator checks V1 to V11), 7 (sync caps), 12 (review loop). Section 2's protection 3 (a `patrolOverride` walk) and the V2 row in section 4 are superseded by protection 3 below (the beat gate); the plan's text on them is marked.
- `docs/achitechture/NPC_NEEDS_SYSTEM.md` sections 3 and 5; `docs/achitechture/NPC_POSES.md`; `scripts/scenario-schema.json` for every field.
- `scenarios/m02_ransomed_trust/office_life/HANDOVER.md` and `PLAN.md`; for m03 (second worked example) `scenarios/m03_ghost_in_the_machine/office_life/`.

References, read when the step needs them (this file is the procedure, they hold the detail):

- `references/measurement-recipes.md`: setup for live measurement, one machine not two, trip timing and the lock threshold, pair use, lazy rooms, hide/reload/night, trouble handling, the object position baseline.
- `references/mapping-patterns.md`: JSON shapes for Tiled machines, the readable laptop, night hides, mapped breaks, trouble globals, pools and exchanges.
- `references/gotchas.md`: what bit m02 and m03, with the fix for each.
- `references/checklists.md`: per slice, per review round, per live check, before merge.

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
10. **Campaign missions m01 to m10 and the sis missions keep `"npcThoughts": false` (D77), so `showPressingNeeds` and `actionIcons` do nothing there.** Do not offer them as levers; security windows must read from movement, barks, sounds and held items, not icons. The flag also turns off picture chat.

## Outputs

All in `scenarios/<m>/office_life/`: `BASELINE.md`, `baseline_locks.json`, `v1_summary_base.txt`, `positions_base.txt`, `validator_info_lines.txt`, `ANALYSIS.md`, `PLAN.md`, `REVIEW_R<n>.md`, `SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, `BUILD_LOG.md`, `LIVE_*.md` (the live-proof write-ups; m02 named its two `STAGE4_LIVE*.md` and `STAGE5_LIVE*.md`), `LOG.md`, `HANDOVER.md`. The plan's sections follow m02's: aim and tier, people, story-safe movement (when any existing NPC is free), rooms and objects, levers, openings, spoken lines, sync budget, field names, costs and approvals, test plan.

## Stage 0: baseline

- [ ] Confirm the mission is a campaign mission (m01 to m10). Anything else needs the user's say-so. If it is m01, record that the m01, sis01 and sis02 gate playtests must run again before any release carries it.
- [ ] `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb`: 0 errors. Save the `ℹ️` lines to `validator_info_lines.txt`.
- [ ] `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb --office-summary | sed -n '/^OFFICE-LIFE SUMMARY/,/^$/p' > v1_summary_base.txt` (V1, one line per NPC, sorted so it diffs). Keep only the summary block: the full report carries warnings and absolute worktree paths, so a later diff from another worktree is all noise. Filter every later run the same way.
- [ ] `ruby scripts/lock_key_diff.rb scenarios/<m>/scenario.json.erb --write scenarios/<m>/office_life/baseline_locks.json` (V9).
- [ ] Object position baseline: every declared object's room, id or name, type and position, and every NPC's `itemsHeld`, sorted so it diffs, into `positions_base.txt`. No validator flag prints this; use the one-liner in `references/measurement-recipes.md` section 9. Stage 4 diffs against it.
- [ ] `bin/rails "app:break_escape:tts:office_lines[<m>]"` from the worktree root with the env in `references/measurement-recipes.md` section 1 (V6; it does not count barks) for the cached clip count and any uncached clips that predate office life.
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

- [ ] **Story NPCs stay where the plot needs them.** In most missions every existing person is story-critical (m02 and m03 both), so talk needs new ambient people, or a short routine for an existing NPC that the D78 step below finds free.
- [ ] **Existing NPCs: story-safe movement (D78).** Give every existing NPC one of five classes, with the line that decides it. Only a **free** NPC may move.
  - *Pinned by the text*: its own lines fix it in place (m08's analyst: "If I leave this desk, somebody writes down that I left this desk", `m08_background_analyst.ink:26`).
  - *Witness or line of sight*: a mapping depends on where it stands or what it can see.
  - *Holding or guarding*: an item or clue; any NPC with `itemsHeld` (a knock-out drops them in the room the NPC fell in, not its home room, `npc-hostile.js:781` to `:784`, and a carried needs item goes the same way, `:806` to `:810`); the `owner` of a workstation (`scripts/scenario-schema.json:5481`), above all one with `lockType: "login"`, because the PC of an owner the needs system tracks answers `attended` while the owner is at post and `accessed` or `locked` while away, where an untracked owner's answers `signin` (`workstation-state.js:51` to `:67`, `:677` to `:680`), a change the lock and key diff cannot see; and any NPC whose presence an `onInteract` or ink condition reads.
  - *Plot-located*: a beat or cutscene needs it at a spot. A character with a phone or cutscene record counts here too, unless the plan shows that no phone or cutscene line places them and that no cutscene moves or hides that id while it is away: a phone call does not freeze the walking sprite (`inChatWith` counts person-chat only, `npc-needs.js:5389` to `:5400`), so "I'm at my desk" on the phone can be false on screen.
  - *Free*: none of the above, and not ruled out by the open-conversation rule below.
  A suspect in a whodunnit is not free unless the plan argues it: movement can read as a behavioural tell. Record the class per NPC in the people table (Stage 2, "Story-safe movement").
- [ ] **Open-conversation rule (D84, 17 Nov 2026).** A story NPC whose conversation is open at any time may still be free, and the player may talk to it away from its post, when all three hold:
  - *Its conversation reads no location.* No line places it ("I'm at my desk", "come and see me in the lab"), and nothing shows its post as the chat background. The background is chosen in this order (`public/break_escape/js/minigames/person-chat/person-chat-background.js:6` to `:15`): an ink `Background[...]` line, an explicit background passed to the chat (a mapping's or a timed conversation's `background`, or a phone-to-person transition), the NPC's own `chatBackground` (`scripts/scenario-schema.json:4963`, used "wherever the conversation happens"), and only then the `chatBackground` of the room it stands in. An NPC-level `chatBackground`, a `Background[...]` line, a mapping's or a timed conversation's `background`, or a phone-to-person transition, that shows its post would show its desk while it stands at the kitchen cooler, so any one of them rules it out (or the plan removes it as an approved change to an existing line).
  - *No beat hangs on the conversation.* No `conversation_closed` mapping on it, and no global set in its ink, starts a cutscene, a sight check, a patrol move, a timed message that places it, or a hand-over that needs it at a spot.
  - *The away-talk check passes* (Stage 5, story-safe movement live proof).
  - Why talk away from post is acceptable: a chat freezes a needs NPC where it stands, even mid-walk (`npc-needs.js:1434` to `:1444`; `npc-behavior.js:945` to `:958`), a use in progress keeps its remaining time (`npc-needs.js:1438`), the chat shows the background of the room it stands in when nothing above overrides it, and the trip resumes when the chat closes (`:1446` to `:1457`).
  - The rule does not lift the room limit. A talkable story NPC that owns a knot setting a required task, is the target of a conversation-mode mapping or is a key or card source still raises V2 when its needs leave its room (`check_story_npcs_leave` in `scripts/validate_office_life.rb`), and the cast table keeps it in its own room. Under D84 most talkable story NPCs therefore get a routine only at a machine in their own room; do not plan kitchen trips for them.
- [ ] **The five classes decide whether an existing NPC moves at all; the cast table above decides how far.** A free NPC that the table calls story-critical keeps its needs in its own room with every target there. Any free NPC may leave its room only when V2 (`check_story_npcs_leave`, `scripts/validate_office_life.rb`) is clear for it with the planned leash; otherwise its leash is its own room. V2's `patrolOverride` exemption (`post_override?`) is not a protection for any NPC: it exempts an NPC with any non-office-life `patrolOverride.targetTile` mapping, even one that does not cover every beat, so it can hide a real V2 warning. No needs NPC gets a `patrolOverride` recall (Stage 2).
- [ ] For each NPC who might sit or pose: does the atlas have seated frames (`--sit-from`) and pose frames (`pose_drink_*`, `pose_use_*`, `pose_phone_*`)? List what is missing; it is an art item, not a blocker.
- [ ] Mark every NPC "can be attacked" unless the scenario sets `disableAttacks`, and list each one's `globalVarOnKO`, `taskOnKO` and KO drops.
- [ ] List beats keyed on NPC position or presence: `npc_arrived`, `room_entered` mappings, conversation-reachable knots, LOS and `challengeOnSight`, KO tasks, `initiallyHidden` reveals, cutscene triggers.
- [ ] **Schedules.** There is no timetable field. Write down the mission's acts and the global that turns each (m03: `clone_call_done` turns afternoon into night). Ambient staff appear and leave on those globals through mappings (`hide`/`show`, `patrolOverride`), not on a clock.
- [ ] **Extras and ambient staff come from the awareness course cast** (decision D53). Pick from `planning_notes/phishing_and_social_engineering/awareness/` (`HANDOVER.md`, `VOICE_CAST.md` for voices, `BRAND_SET.md`), keep their name, look, voice and kind of job, and adapt the job to the mission's building (m03 did this). Prefer atlases that already have seated and pose frames, check their sprite keys do not clash with the mission's own, and vary ethnicity and age against the mission's cast. Design a new character only with a reason written in the plan; new art needs the user's yes. A recurring named character uses their own sprite key.
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

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | gate global, set by, lead time | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|

The class column holds the cast-table class and, for an existing NPC, its D78 class (`optional flavour / free`). The gate column is for story NPCs that have needs (protection 3); write "found at post first" there too (a home dwell or a first-talk break, Story-safe movement). Under the table, for each gated machine, list the ambient NPCs, pairs, levers and security windows that share it and what each does while the gate holds.

- [ ] Every needs NPC has a post (`needsHome`), a leash (`needsRooms` or `needsAvoidRooms`) and stays out of private rooms (room `needsPrivateTo`).
- [ ] Keep new NPCs and moved existing NPCs out of a guard's patrol room and LOS window with `needsAvoidRooms`, and out of the room where a story beat happens at a fixed spot.
- [ ] Name a protection for every story beat. Only three count: (1) the NPC has no `needs` (a scripted walker without needs may be returned to its spot by a `patrolOverride.targetTile` mapping on an event that always precedes the beat); (2) its needs are confined to its own room and every target is in it; (3) where a beat needs a story NPC that has needs at its post spot, the beat gate: a scalar global read by `offWhen` on the machines it may use away from its post object (and by the mapping `condition` of its breaks), with a measured lead time, as set out in Story-safe movement below. Never use `patrolOverride` on a needs NPC: it is a scripted walk that sets `scriptSuspended` (`onExternalMove`, `npc-needs.js:778` to `:788`), that flag starts `false` after a reload (`:582`) and the event that fired the override does not fire again, so a reload inside the beat window restarts the routine; and it ends within 32 px of its target, so it stops a tile short (`references/gotchas.md`, "Scripts win over needs"). For trouble (a hit, a KO), put `offWhen` on the machines and let the needs layer walk staff home (`references/mapping-patterns.md` section 5). V2's `post_override?` exemption is not a protection. `deferrable: false` is **not** a protection either; it makes the NPC leave more readily.
- [ ] Never add an `npc_arrived:<id>` mapping to a needs NPC (needs arrivals fire it).
- [ ] Social compatibility: chat only between people who plausibly get on. Distrusted or suspect people carry `needsCompany.avoids`.
- [ ] Hostile ambient staff get the chase `leash: true` (with `chaseRange`) so a punched NPC stays near its post. Add a credits line for KO and attack outcomes.

### Needs and routines

- [ ] Pick needs that the post room or an always-loaded neighbour can meet. A need goes to the post object if that satisfies it, else the nearest reachable free source, so two NPCs posted apart rarely meet.
- [ ] Natural rhythm first (`decayPerMin`, `urgentAt`, `initial`, `jitterPct`); then mapped breaks for timing: `room_entered:<room>` or `conversation_closed` with `delayMs` about 2000 and a cooldown of 120 to 150 s.
- [ ] Coupled breaks: a mapping on `npc_use_started:<object>` with a condition on the partner's id sets the other's need low through `needs: { set: ... }`. Coupling both ways can hold a cooler for minutes and shut out NPCs that avoid `*` (`SIMS_TIDY_LOG.md:600` to 612); couple one way, or cap with a cooldown.
- [ ] An NPC whose every need is met by its own post object never moves but stays registered, so it can print by command (`needs: { print: ... }`, `forget: true` leaves the page on the tray).
- [ ] Reload resets needs levels to `initial` and the NPCs to their posts. Only scalar globals survive; design for that. Two cases matter: inside a gate window the global still holds, so the NPC stays at post; outside one, a low `initial` can send it off at once.

### Story-safe movement (existing NPCs)

Write this section when the audit found a free existing NPC; otherwise write "none free" and the reason. A free NPC may get a short routine (a coffee, the cooler, the printer in its own room) at non-plot times only. **Move at most two or three existing NPCs per mission, each found at post first** (a home dwell or a first-talk break, below): a few people about the building stops it looking glued in place, while most of the cast stays where the player expects it. A window is not a machine: `officeType` has no window (`scripts/scenario-schema.json:5474`), so stretching at one needs a hand-written affordance; leave it out unless the plan writes that affordance.

- [ ] **Found at post first.** A moved NPC is at its post when the player first meets it and wanders only after its room has loaded. The engine supports this without a machine gate:
  - *Quiet time from first room load.* A room loads when the player opens its door (`doors.js:883`), and its NPCs register with the needs system then (`npc-lazy-loader.js:99` to `:105`), with levels at `initial` plus seeded jitter (`npc-needs.js:517`). The first trip comes only after (`initial` minus `urgentAt`) / `decayPerMin` needs-clock minutes, so a high `initial` (100) and slow decay keep it at post when first met. A reload registers it again at `initial` (`scripts/scenario-schema.json:4850`). Rooms never unload, so after its room has loaded it keeps its routine for the rest of the game.
  - *A long dwell at its own post.* A need its post object satisfies picks that object first (`npc-needs.js:1785` to `:1791`); using it keeps `atPost` (`_targetsOwnPost`, `:3256` to `:3259`, `:3522` to `:3530`), so a workstation still sees the owner present. `useSeconds` goes up to 600 (schema `:3966`), and `weight` (`:4851`) makes the home need win most choices. Only the need being met pauses its decay (`npc-needs.js:1555`), so when the use ends the most urgent need wins.
  - *A first-talk break (optional).* A `conversation_closed` mapping with `onceOnly`, `delayMs` about 2000 and `needs: { set: { <need>: <low> } }` (the mapped-break pattern under Needs and routines), on an NPC with a high `initial` and slow decay: it stays at post until first talked to, then goes. After a reload it dwells again until decay, which does no harm. Prefer this per-NPC mapping to an `offWhen` of `{ "<npc>_met": false }` on the machines: that form needs the global declared `false` in `globalVariables` (`requiredGlobalsHold` uses strict equality, so an unset global never matches), switches the machine off for every NPC, and on a sign-in PC refuses the player too.
  - *The planner measures two things* before choosing the numbers, and writes them in the plan: whether a newly urgent need cuts a long home use short (watch `window.__test.needs.state(<id>).job` through a long use while another level crosses `urgentAt`), and how needs-clock minutes map to real seconds (read a level twice a known real time apart and compare the fall with `decayPerMin`). `references/measurement-recipes.md` section 10 has both.
- [ ] **One beat gate per NPC beat: a beat global `<npc>_beat` read by `offWhen`, with a measured lead time.** Use it only where a beat needs the NPC at post and no other protection fits; each gated machine changes the rest of the office (below). Put `offWhen` (object level, a global name or `{ name: value }`, `scripts/scenario-schema.json:5480`) on every source the NPC may use away from its post object, and never on a `lockType: "login"` PC, or any PC that is a network host for a remote sign-in, a share or a pivot: there `offWhen` governs the player too, and the server refuses a walk-up sign-in with 403 "This PC is off" (schema `:5480`; `app/models/break_escape/network_access.rb:968` to `:985`), which can block the critical path. If the NPC's only away source for a need is such a PC, drop that need. The same beat global goes in the `condition` of each mapped break, negated so the break fires only while the gate is off: `"condition": "!globalVars.<npc>_beat"` (`:4973`). The beat global is set by the event that opens the window, from before the beat can first open until after it. Scalar globals survive a reload; nothing else here does.
  - `offWhen` takes one condition, and an object form means all must match, with strict equality (`_isOff`, `npc-needs.js:830` to `:837`; `requiredGlobalsHold`). A machine that already has an `offWhen` (m03's `wh_staff_upset` trouble gate, `references/mapping-patterns.md:11`, `:108`; a breaker lever) cannot take a second. Never overwrite the existing gate and never AND the two. On a machine with no other cause, use `offWhen: "<npc>_beat"` directly, with no derived global. Where a machine already has an `offWhen` or is shared by two beats, give it a derived global `<machine>_off` and use `offWhen: "<machine>_off"`: set it `true` by new mappings appended at the end on `global_variable_changed:<cause>` with `"condition": "value === true"`, and clear it by one appended mapping per cause on `global_variable_changed:<cause>` with `"condition": "value === false && !globalVars.<other cause>"` (one term per other cause; the validator rejects `||`, so never a single clearing rule). Put these mappings (and any mapping that sets `<npc>_beat`) on an NPC registered at game start, the mission's phone NPC or any NPC in the start room (`public/break_escape/js/core/game.js:2210` to `:2215`), appended last, never on the moved NPC or an NPC in another room: a room NPC's mappings go live only when its room loads (`npc-lazy-loader.js:96` to `:103`), and a missed `global_variable_changed` (emitted once per write, `npc-manager.js:1511`) is not replayed. Never edit an existing mapping's `setGlobal`. Mapped breaks always negate `<npc>_beat`. The shape is in `references/mapping-patterns.md` section 5. The derived global is non-monotonic, so it goes in the sync budget with its reason.
  - The gate switches the machine off for everyone. Ambient pairs at it stop talking, and exchange timing, `lockIfAwayOverSeconds` windows and security windows that rely on ambient trips change while it holds. List them under the people table. Where possible, gate a machine only the moved NPC uses.
  - What the gate does: a switched-off source is no candidate for a new trip (`npc-needs.js:1734` to `:1737`). An NPC walking to it or queued for it turns back through `_turnBack(s, 'off')` (`:3480` to `:3484`); the `off` rule has `fallback: true` (`:172`), so it first takes the next acceptable source for the same need (`:2089` to `:2093`) and parks the need and walks home only when none is found (`:2095`). An NPC already using the machine finishes its use first (schema `:5480`).
  - So the gate global must turn on before the earliest moment the beat can open by at least the use time plus the walk home plus a margin (3 s at least, as for the lock threshold). The needs clock stops while the VM is open (`npc-needs.js:666`): the gate's setting event must not be a VM flag or happen while the VM is open, and the lead time counts from when the player leaves the VM. Measure use and walk-home as in `references/measurement-recipes.md` section 3 (five tries, real time, which runs over expected time), and write the lead time and the event that sets the global in the people table.
- [ ] **No `suspend` route and no `patrolOverride` recall** for a moved existing NPC, or for any other needs NPC (see protection 3). `scriptSuspended` is client state: it starts `false` (`npc-needs.js:582`) and nothing restores it, so after a reload the routine runs again inside the beat window; and `suspend` does not walk the NPC home (`:1099` to `:1104`). A `patrolOverride` fails for two reasons: it ends within 32 px of its target, so it stops a tile short, and as a scripted walk it suspends needs (`onExternalMove`, `npc-needs.js:778` to `:788`), a suspension a reload drops while the event that fired the override does not fire again. (It resolves `targetTile` in the manager's `npc.roomId`, `npc-manager.js:1401`, `:1622` to `:1626`, which follows only a multi-room patrol route walker, `npc-behavior.js:1014` to `:1018`; a needs NPC may not patrol, so its override resolves in its declared room.) m03 built a `patrolOverride` send-home, lost staff a tile short with needs suspended, and replaced it with `offWhen` (`references/mapping-patterns.md:129`). That lesson is why `offWhen` is the gate.
- [ ] **Every way out is gated or removed.** List the NPC's V2 away rooms (`away_need_rooms` in `scripts/validate_office_life.rb`: needs sources, print fetches, interests, magnets and workaround visits). Every source it may use away from its post object, including any in its own room that the V2 list leaves out, carries the gate when a beat needs it at post; never a `lockType: "login"` PC, or any PC that is a network host for a remote sign-in, a share or a pivot (drop the need instead, see the beat gate above). A free existing NPC gets no `interests`, no `workarounds` and no need a magnet satisfies (a magnet would also let the player lure it away during a beat). `offWhen` is checked on the way only for `use` jobs (`npc-needs.js:3480`), so print fetches, phone answers and work-plan checks stay in its own room.
- [ ] **Leashed.** Its own room unless V2 is clear for it (the cast audit item above). The fields: `needsHome` (`scripts/scenario-schema.json:4881`), `needsRooms` (`:4894`) or `needsAvoidRooms` (`:4895`), and `needsPrivateTo` on rooms it must not use (`:4247`). The rhythm uses `needs` with `decayPerMin`, `urgentAt` and `initial` (`:4841` to `:4850`) and, for timing, a mapped break (`cooldown` `:4983`, `delayMs` `:4984`). A seat on the machine is `affordance.seat` (`:3983`).
- [ ] **At its post before any beat that needs it.** The proof is the measured lead time: for each beat that needs the NPC at post, name the event that sets the gate global and show it comes earlier than the beat by the lead time. An ordinary conversation is not such a beat: under the open-conversation rule (Stage 1) the player may talk to the NPC away from post, because the engine freezes it where it stands (`npc-needs.js:1434` to `:1444`; `npc-behavior.js:945` to `:958`), the chat shows the background of the room it is in unless an ink line, a mapping or timed-conversation background, a phone-to-person transition or an NPC-level background overrides it (`public/break_escape/js/minigames/person-chat/person-chat-background.js:6` to `:15`), and the trip resumes when the chat closes (`npc-needs.js:1446` to `:1457`). Nothing walks it home first. If the plan gives the NPC a first-talk gate (Found at post first), name it here.
- [ ] **If attacked mid-walk.** Fill this column of the people table for every moved NPC: the needs item it may be carrying and where that lands if it is knocked out away from post (the room it fell in, `npc-hostile.js:806` to `:810`; an NPC with `itemsHeld` is holding, Stage 1, and does not move, because its drops land there too, `:781` to `:784`); that it stays where it fell, not walked home, while knocked out or hostile, then walks home once available (`npc-needs.js:1235` to `:1239`, `:1418` to `:1431`); and the beats that read where it is.
- [ ] **Other NPCs.** A moved NPC can change other NPCs' beats and witness logic: an `npc_ko` or LOS mapping that counts "staff present" can now find the room empty, or count a trip as witnessed (m03 counted a cooler trip as witnessed, `references/mapping-patterns.md:142`). List every mapping that reads another NPC's presence in the rooms the moved NPC leaves or enters, and its expected result with the NPC away.
- [ ] Name, per moved NPC, the beats it must be at post for, the gate global for each and its lead time. A beat with no named gate means the NPC is not free; a conversation that is not a beat needs no gate.
- [ ] The plan states the expected result of every check below under "Test plan".

### Rooms, affordances and machine presets

- [ ] Set scenario `officePresets: true`. Declare Tiled-claimed machines with the **base type name** (`coffee_station`, `kettle`, `water_cooler`, `photocopier`; digits stripped), never `coffee_station1` and the like: a numbered name matches no Tiled sprite and the object lands at a random spot on every load (`references/gotchas.md`, "Base type names"). Presets take both spellings. Any other machine takes one through object-level `officeType` (a boiler as `kettle`, an undercounter fridge as `fridge`). Takeable, `lockType`, id-less and `decor: true` objects never gain one.
- [ ] Declare Tiled decor that should take part as a scenario object. Declare every same-image twin in the room too, or it is hidden when the first is claimed. Claimed decor is declared with no `position` (top-left semantics come from the map).
- [ ] Check every object V1 says gained a preset: a puzzle `pc` with no `lockType` gains a desk preset.
- [ ] Hand-write `useFrom`, `queue.cells` or `"queue": false` where a preset's cells hit a wall, door or neighbour. Aim `useFrom` at the NPC's body-centre cell (`HOME_EPS` is 12 px).
- [ ] `offWhen` lives at object level, never inside `affordance`. On an object, `overhearRadius` goes in `affordance`. A chatter pool written as `{ lines, overhearRadius }` also carries it: it sets the radius for mutters and is the fallback for a chat whose object sets none (`npc-needs.js:271` to `:293`, `:2996` to `:3004`). Set it so the parts of the room where the player should hear the pair are within it of both users' cells (360 covers a whole room; the default 160 is narrow).
- [ ] Wall objects whose sprite sits beyond the 32 px reach get `wallMounted: true` (read by `reachY` in `interaction-reach.js`).
- [ ] Machines: `machine` defaults true for coffee, kettle, cooler, boiler, copier, printer, microwave, vending, keypad, socket and shredder. Set it only to override.
- [ ] Props square to the walls (one or two angled per room), placed through mission-room-dressing.

### Poses

- [ ] Poses (`drink`, `use`, `phone`) show only when the atlas has the frames. Object `pose` overrides the default (`false` for none); NPC `poses` limits or turns them off. Seated NPCs keep the sit frame.
- [ ] Missing pose or seated frames are an approval item (PixelLab spend). The pose engine and the pose art for existing characters are on main (`build/ol-poses-code`, `build/ol-pose-art`). For a new character without frames, until approved, use a stand-in atlas with seated frames (m02 used `male_telecom_v2` and `female_telecom_v2`) and plan the swap.

### Chatter pools and exchanges

- [ ] Talk needs a pair: two compatible NPCs using one capacity-2 chatter object at once. A lone NPC says nothing. `grumble` plays only on a turn-back; `greet` only at an affordance with `chatter: "greet"`.
- [ ] Pool lines: one line, 40 characters at most (validator error above), no `{ }` variables, no speaker prefix, nothing that repeats a bark or the NPC's ink opener (V7).
- [ ] Pools in object form take `requireGlobal` (a global name, or `{ name: value }`, strict equality), read live each time a line is drawn. A closed pool says nothing, but the pair still meets and uses the object: with `npcThoughts` off (all campaign missions) it stands silent, with it on it chats in pictures. To stay silent while a state holds (for example upset) gate on the opposite: `"requireGlobal": { "ops_watch_upset": false }`, with `ops_watch_upset` declared `false` in `globalVariables` (an unset global is `undefined`, which never equals `false`, so the pool would never open; `"requireGlobal": "ops_watch_upset"` is the inverse and speaks only while upset). A gate silences only its own pool: exchanges, `grumble*`, `phone` and announce pools need their own gates. Never gate `login_aloud`, `usb_refused`, `work_fail*`, `station_fail`, `social_blocked` or a `wk_*` start pool (V12 warns): they open a security window. See `docs/achitechture/NPC_NEEDS_SYSTEM.md`, 5.6a "Gated pools".
- [ ] Exchanges (`exchanges[{with, knot, requireGlobal}]`) are ink knots, heard once (`heard_<knot>`). The first line must stand alone, because the player may walk in on it. An exchange never leaks or contradicts a clue; gate one on the global that makes it true.
- [ ] Barks (`eventMappings[].bark`) are voiced by the normal tts-audio batch and counted by V6 once build/tts-barks is on main (before it lands, see `references/gotchas.md`, "Voicing"), like pool lines and knots, so the voicing yes states a clip count that includes them. Voice a bark only for a person NPC with a `voice`. A bark still needs a reason in `SPOKEN_LINES.md`; prefer pools and knots. Agents never start a keyed server or play through to voice a line (`references/gotchas.md`, "Voicing").
- [ ] Put every line in a table in `SPOKEN_LINES.md`: speaker, pool or knot, line, characters, and for a bark how it gets its clip. Plus the list of existing lines changed (old to new), ideally empty.
- [ ] **Dialogue-sample rule.** Send `DIALOGUE_SAMPLE.md` (a few pool lines and one exchange) to the user and wait for the yes before slice 5 writes any line. Placeholder ink never reaches main, and built text matches the approved sample word for word. Run the `npc-dialog-review` concision check (2l) on the sample and the built lines before voicing.
- [ ] **Re-voicing a line that a review changed needs the user's separate yes**, through the decisions page, even when the earlier voicing was approved.

### Security windows and player levers

Prefer **levers over schedules**: the player causes the event through existing systems rather than waiting on a timetable.

- [ ] Levers: deliver a magnet item (the cake), ring a desk phone (`desk_phone_ring:<id>`), throw a breaker (`offWhen` with a switch object), drop an item with `interests`. Each is optional and each says what it opens.
- [ ] `lockIfAwayOverSeconds` is compared with the **expected** away time in `npc_left_post`, not real time. m03's planned 45 s was wrong for that reason (Stage 1 measured 14.6 s and 23.1 s; the build settled at use 16/20 s, expected 18.6 s for coffee and 28.7 s for the cooler, threshold 24 s); measure both numbers per trip (`references/measurement-recipes.md` section 3).
- [ ] Security windows: the gap while an owner is away (unlocked screen via `habits.screen`, a page on the copier via `habits.print`, a left-behind item, a propped door). Each opens optional content only: lore, an optional task, a side drawer. Never a critical-path door, the server room, a safe or a story-locked PC.
- [ ] Openings that write state sent whole (capture log, cloned cards, footholds, disguises) need their own approval item with a sync note.
- [ ] Physical-pentest openings are office-life builds and follow AGENTS.md "Which work goes to `opus48`": game builds, office life included, go to `opus55` or the cheaper tier on every account. Under the Cyber Verification Program `opus48` takes only the social-engineering text in an opening (pretexting, phishing) and CTF or VM solve scripts. A safeguard stop is retried once on `opus48`, and the log records the task type and the stop message.

### Lighting and doors

- [ ] Light any new room or new screen with mission-room-lighting; keep the mission's lighting variants (for example keyed on the act-turn global) consistent with who is present.
- [ ] Motion-sensor rooms stay dark until the player enters; an NPC posted there needs a light that matches.
- [ ] Hearing: a room's sounds play at 1 in the player's room and 0.4 through a door to an adjacent room (`room-hearing.js`). The chatter falloff (D34, on main) means chatter carries faintly through an **open** door at 40% of the distance level and stops when the door shuts, and chatter is muted while a person-chat or phone-chat is open; lines heard faintly do not set `heard_<knot>`. Place pairs so the player can walk in on them, not only hear them from the corridor.
- [ ] `roomTone`: the profile matches exact room types; map custom types with `roomToneTypes`. Room tone is the last slice, after dressing.

### Sync budget

- [ ] Fill in the missions plan section 7 table with this mission's counts: workstation globals, `heard_` keys, `onUse`/workaround globals, reveal globals, servings, `onceOnly` mappings, office-life items. Name any non-monotonic global and why last-write-wins is acceptable. Reveal globals go back to `false` on reload, so treat them as non-monotonic.

### Costs and approvals

- [ ] One page of approval items (new rooms, new NPCs with the cast choice, new art, engine changes, voicing spend (the V6 clip count, barks included once build/tts-barks is on main; before that, add the barks counted by hand, see `references/gotchas.md`, "Voicing"), any changed existing line), with a Copy picks box, saved inputs, entered on the shared decisions page. Paid steps wait for the picks.

### Test plan

- [ ] Walkthrough steps that must still pass; office-life checks to make live (five tries each at walking pace); reload checks; the attack probe (attack a moving NPC, a seated one and one leaving through a door, fresh game per step, plus each moved existing NPC while it is at the machine, checking where its carried item lands and that it walks home once available); the expected lock and key diff (empty, or exactly the approved items); for each moved NPC, the story-safe movement checks in Stage 4, the away-talk and found-at-post-first checks in Stage 5, and the poll-before-interact rule for scripted runs.

## Stage 3: the loop

```
plan -> plan review R1..R5 (standalone rewrite after each) -> approvals -> implement in slices -> build review until clean -> art follow-ups -> voice -> close
```

Two loops, two stopping rules. Each round is a fresh read-only reviewer (planning and review tier, per AGENTS.md "Choosing a model"), findings tagged blocker, major or minor with file:line, saved as `REVIEW_R<n>.md` with B/M/m counts (the same name in `references/checklists.md`). Plan rounds follow AGENTS.md "Iterating". The build loop follows the user's standing rule on full rounds (phases run at least 5 rounds; after round 5 minors only, set by the user on 15 November 2026), which departs from the 5-round cap at AGENTS.md:41. This skill overrides the counts in missions plan section 12 (plan 3 to 5 rounds, built phases 2 to 5).

**Delta rounds apply to both loops.** From round 4, or at the first round after a stronger-tier round with no blockers or majors, whichever comes first, a round is a delta review: the reviewer gets only the diff since the last round and the previous findings, and runs on the cheaper tier. For a plan, the diff is the rewritten PLAN.md, so plan rounds 4 and 5 are deltas too. AGENTS.md "Cheaper later rounds" sends a delta back to Opus (the `opus55` agent type) in three cases: (1) a cheaper-tier round found a major; (2) the delta touches secret handling, what the server serves or access checks (on an account without CVP, `opus48` instead); (3) the delta adds a new design decision.

**Plan review** (AGENTS.md "Iterating"):

- [ ] Five rounds, and **stop at round 5** unless a blocker is still open (a blocker allows round 6). Whatever major or minor is left at round 5 goes in the plan as open, with the reason.
- [ ] After each round, **rewrite PLAN.md as a standalone document** with no references to reviews or earlier drafts. Every finding gets an outcome: fixed, withdrawn with the reason, or deferred with the reason.
- [ ] Reviewers check: the expected lock and key diff and aim chain; that no opening became required; V2 and V5 risks; each NPC's class and attack outcome; compatibility and leashes; spoken-line rules; sync sums; field names; cast diversity.

**Build review** (m03 ran R1 to R9):

- [ ] Round 1 runs on the `opus55` agent type. Build phases run **at least five rounds** (user's standing rule). After round 5, rounds fix minors only, and a round past 5 runs only while a major or blocker is still open (the fixer closes those too, and the log says why the round ran). A fixer takes each round's findings, re-measures what the fix could move, and logs outcomes. Reviewers play the merged tip, not the build branch (`references/checklists.md`).
- [ ] In office life, delta case 2 is the usual one: a delta that changes what a workstation's text shows while its owner is away (the readable laptop and its text gate, `references/mapping-patterns.md` section 2), a PIN, password or card shown on a screen, or any opening that reveals a secret or item type. Case 3 is a new lever, opening or tier change. Send those to `opus55`, not the cheaper tier.
- [ ] Live checks run on the cheap scripted tier; a reported "stuck" gets a persona recheck before it counts.
- [ ] Every multi-step brief carries the handover rule: at about 150k tokens or 80 tool calls, finish the step, commit, write `HANDOVER.md`, report and stop.

## Stage 4: implement (slices, one commit each)

Slice numbers below are m03's build slices, not stage numbers. Slice order (m03):

1. **Slices 1 and 2**: baseline and plan (above), then approvals.
2. **Slice 3**: new rooms and objects, presets, needs, posts, leashes, privacy, night hides. Declare machines by base type name and check one of each after two loads.
3. **Slice 4**: workstation laptop and habits (screen, print, USB) and awareness; measure trip times and the lock threshold.
4. **Slice 5**: chatter pools, exchange knots and barks, only after `DIALOGUE_SAMPLE.md` has the user's yes. Replaces any placeholder ink.
5. **Slice 6**: dressing check and lighting of every changed room: mission-room-dressing, then mission-room-lighting, about five cycles each, up to ten while improving. Re-run the validator after each cycle. Check one of each machine with all rooms loaded.
6. **Slice 7**: seats and poses, after the pose art is on main. Render hidden seated NPCs at the night turn and dump the scene near the seats.
7. **Slice 8**: voice (tts-audio), room tone, close.

Levers and openings slot into slice 4 or 5 as the plan says; any social-engineering text in them is the one part that goes to `opus48`.

After each slice:

- [ ] Ink compiles; `dialoguelint.mjs` on changed ink; `tagdiff.mjs` against the last commit for any existing ink touched; inkcheck and loopcheck; `scripts/ink_runtime_check/reopencheck.mjs` and the mission's route suite (`scripts/ink_runtime_check/<m>_routes/`) where it has one.
- [ ] `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb`: 0 errors, every new warning cleared or justified. The office-life checks (`scripts/validate_office_life.rb`, called by `validate_scenario.rb`) cover V1, V2 (story NPC whose needs can leave its room), V3 (`npc_arrived` on a needs NPC), V4 (attackable needs NPC; an info line once the E1 attack probe has passed), V7 (repeated lines), V8 (sync budget, info until a cap is passed), V10 (a pool or exchange nothing can trigger) and V11 (a chatter pool line that names a credential), all warnings, and V5 (required content keyed on an office-life global or event), an error. V6 is the rake task and V9 the lock and key diff. The older needs, access and habits validators run too.
- [ ] `--office-summary` diffed against `v1_summary_base.txt`: only the planned NPCs changed.
- [ ] **Story-safe movement**, before and after: the lock and key diff is empty; item and clue positions are unchanged (rerun the `references/measurement-recipes.md` section 9 one-liner and diff it against `positions_base.txt`; only planned objects may differ); line-of-sight mappings and `challengeOnSight` are unchanged; no pinned, witness, holding, plot-located or suspect NPC gained any needs-layer key (`needs`, `workNeeds`, `habits`, `interests`, `workarounds`, `answersPhones`, `socialUse`, `needsHome`, `needsRooms`, `needsAvoidRooms`, `needsCompany`); where a beat needs a moved NPC at post, its `offWhen` gate is on every source it may use away from its post object and on neither a `lockType: "login"` PC, or any PC that is a network host for a remote sign-in, a share or a pivot; a derived global where a machine has two or more causes, with its mappings and any `<npc>_beat` mapping on the phone NPC or a start-room NPC, never the moved NPC; mapped breaks are conditioned `!globalVars.<npc>_beat`; at most two or three NPCs are moved, each found at post first; the machine's other users are listed; no `patrolOverride` on any needs NPC; it has no `interests`, `workarounds` or magnet-met need.
- [ ] `ruby scripts/lock_key_diff.rb scenarios/<m>/scenario.json.erb scenarios/<m>/office_life/baseline_locks.json`: empty, or exactly the approved items. It regenerates the dungeon graph itself.
- [ ] `python3 scripts/check_door_alignment.py` and the room depth check for new or changed rooms.
- [ ] Field names at `FormatUpgrade.current`; office-life keys never inside an ERB loop or tag.
- [ ] Commit the slice with explicit paths after `git diff --cached --stat`, before any live test.

## Stage 5: live proof

- [ ] Run a keyless server from the branch worktree on its own free port, with the exact command in `references/measurement-recipes.md` section 1 (never 3000, 3001, 3002, 3085 or 3086; do not use `tools/playtest/start-keyless-server.sh`, which is fixed to :3001, exits 0 when :3001 is already up, and has no `BUNDLE_PATH` in a worktree). Run it in the background with a log and a pid file, check the log, record the puma PID and stop that PID. Worktrees share the Postgres dev database: never `db:create`, `db:schema:load`, `db:migrate` or `db:reset`.
- [ ] **A fresh game per check** from `new-game.rb`, run from the same worktree with the same env as the server (section 1 of the recipes). Set `PLAYTEST_PORT` to the branch server's port so its printed URL is right. Use the id it prints; never infer or reuse an id. It synthesises stand-in VM flags and prints FLAGS_XML: pass that to `tools/playtest/session-start.sh --url <URL> --flags <path>`.
- [ ] **Never edit a game row's scenario copy or state, and never set globals in the page** to reach a state. If a check needs a head start, add it to a test scenario on the branch or ask. Type flags in play where a reward matters: seeding m02's flag 4 by `--submit-flag` did not open its cache.
- [ ] Headless only: `window.__test.throttleFps(20)` (replies `{ok, before, after}` in steps per second; `after` should read about 17 to 20) with `physics.world.fixedStep` **true** (the call refuses otherwise). Setting `fpsLimit` and `hasFpsLimit` by hand does nothing in Phaser 3.60.0. Never `fixedStep = false` (bodies tunnel 8 px walls). Call it again after a reload.
- [ ] **Story-safe movement live proof**: every story beat finds each moved NPC at post, five tries each at walking pace, starting the approach to the beat as the NPC leaves for its longest trip. Reload twice: inside a gate window (the global is set: the NPC must stay at post) and outside one (with a low `initial` it may leave at once; it must still be back before the next beat). A beat that finds one away fails the check and the NPC goes back to a class that does not move. Check found at post first: open the NPC's room for the first time and find it at post, and again after a reload. Talk to each moved NPC away from post three ways: mid-walk, queued, and using the machine. Each time the chat opens, the background is the room it stands in, no line contradicts where it is, and it finishes its trip and walks home after the chat closes. Then the attack probe on the moved NPC at the machine (Test plan).
- [ ] Check through `window.__test.needs` that posts, leashes and privacy hold, both partners reach `using` at each chatter object, and nothing mapped to NPC position fires early or twice.
- [ ] A run counts only when `tools/playtest/verify-run.rb` shows progress. A scripted run's "stuck" is checked by a persona run before it counts; one next to a moved NPC is usually office life, not a bug.
- [ ] **Scripted runs with moved NPCs.** Before each `interact` with a moved NPC, poll `window.__test.needs.state(<id>)` until `atPost` is true and `job` is null or targets `home.objectId` (a `null` state means it is not registered yet, so it stands at its spawn: count that as at post), with a timeout that fails the step and records the last state, then interact; or retry through `moveToNear` after each failure. `interact` walks to a snapshot of the NPC's position and `moveToNear` solves one standing point, so a walking NPC can move between the solve and the click (`different-room` when the player is elsewhere; `public/break_escape/js/systems/test-bridge/index.js:1051` to `:1063`, `:1340` to `:1383`). Never use `needs.setManualClock` in a regression run: it stops all office life and hides what the run is meant to test. Put both rules in the playtest-scenario brief for any mission with moved NPCs.
- [ ] Stage 5 playtests: a scripted regression of the walkthrough with office life on; a persona run of 10 to 15 minutes that pulls each lever, tries each opening, attacks one moving NPC and reloads once; a frame-time reading; with `roomTone`, a listen through a north or south door and an east or west one. At most three rounds, then a short confirmation run.
- [ ] The Mission Brief reappearing and the start-room spawn after a reload are intended, not findings.

## Stage 6: art follow-ups

- [ ] Art only for what the awareness cast atlases still lack (seated or pose frames), or for a new character the plan justified. After the user's yes: pixellab-character-pipeline (concept through agy, walk atlas with the stock six animations, seated frames if they sit, bust, `<key>_headshot.png`). No custom animations. Hand edits go in `tools/pixellab_overrides/`. Never rescale pixel art.
- [ ] **Talk visemes, in this order**: (1) the pipeline's `bust` stage makes the talk init candidates (`<name>_talk_init.png`, 4 per new character, about 1 generation each; no extra paid step): put the 4 side by side with the character's concept on a picks page (decisions page, Copy picks box, saved inputs, per AGENTS.md "Asking the user for input") and wait for the pick, installed with `pick <name> bust bNN`; (2) run `visemes --from-talk` only for NPCs that have no `<key>_visemes.png` yet (awareness-cast characters that already have one are skipped) and never inpaint. State the spend in the approval item: 15 generations per character, plus about 6 for a blink on a new character, and the pipeline needs the user's yes at about 20 generations or more, which several characters pass. The pipeline still makes the 2x2 talk sheet as the fallback, so make it as usual.
- [ ] Swap stand-in atlases for the real keys, then re-measure posts, seats and each pairing.
- [ ] room-pov-background for every changed room with a `chatBackground` (both halves of a split one), after dressing and lighting.
- [ ] Closing check on the final commit: validator, `--office-summary` diff, lock and key diff, a short scripted regression playtest.

## Stage 7 and 8: voice and close

- [ ] Voice with tts-audio only after the user's explicit yes on the spend, stating the clip count from V6, **barks included** (the batch counts and generates them once build/tts-barks is on main; before it lands see `references/gotchas.md`, "Voicing"), asked through the orchestrator's decisions page. Signed-off wording is not that yes. V6 must then show 0 uncached office-life clips. Agents never start a keyed server or play through to voice a line. No release carries unvoiced office-life lines.
- [ ] Record each round's severity table and every finding's outcome in `LOG.md`.
- [ ] **Lab sheet last.** Flag the lab-sheet impact (new optional routes and openings) to the user; the mission-lab-sheet skill runs only as the final step. Update `CYBOK_MAPPING.md` if an opening teaches something new.
- [ ] Commit each pass; ask the integrator for a train. `tools/playtest/train-check.sh` (AGENTS.md) must be GREEN on the hash to be merged; do not hand-run the suites instead. The integrator merges the tested hash; the pass never moves main itself.
- [ ] Fold new lessons into this skill.

## Gotchas

Full list with fixes in `references/gotchas.md`. The ones that cost most: declare machines by base type name; `lockIfAwayOverSeconds` reads expected, not real, away time; send staff home with `offWhen`, not `patrolOverride`; hiding a seated NPC needs a rendered check at the night turn; only loaded rooms simulate; stop servers by PID; one fresh game per scenario edit.

## Decisions

- D78, 2026-11-17: existing NPCs move only when free ("Yes, story-safe only"). Pinned, witness, holding, plot-located and, in a whodunnit, suspect NPCs stay put.
- D84, 2026-11-17 (option b): a talkable story NPC may take a short routine; talk away from post is allowed under the open-conversation rule. Move only a few NPCs per mission (at most two or three), so the building is not glued in place but most of the cast stays put. Each is found at post first (a home dwell, or a once-only first-talk break, preferred to a machine `offWhen` gate) and wanders only after its room has loaded.
