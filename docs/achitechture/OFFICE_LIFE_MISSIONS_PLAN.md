# Office life in the campaign missions: plan for a reusable skill

Status: plan only, nothing built. Written 2026-11-13 and revised 2026-11-14 after the user's decisions of that day (section 14). The pilot is m02 ransomed_trust.

This plan covers a new skill, `mission-office-life`, which brings the office-life engine (NPC needs, habits, chatter, exchanges, levers, the physical-pentest mechanics) into the SAFETYNET campaign missions m01 to m10. Each mission is handled in its own extra pass with four steps: analyse, design, implement, review. The plan sets out:

- the skill's stages;
- the validator and report support it needs;
- how well each mission fits;
- the pilot (m02) in detail, and the rollout order;
- the engine gaps;
- the costs;
- the review loop for each mission.

## 1. Aims and limits

What the user asked for (2026-11-06):

- The skill recommends rooms and items (kitchen, vending, coffee, printers) and proposes new rooms and NPCs where a mission lacks them.
- It adds needs behaviour, and the physical-pentest mechanics where they fit.
- Staff grumbles and chat move into scenario files (NPC JSON chatter pools and ink exchange knots), with no large rewrites.
- The validator gives the skill useful checks.
- The player directs events through existing systems (delivering a cake draws people to the kitchen; throwing a breaker empties a desk).

Rules that bind every mission pass:

1. **Office life never gates the critical path or a VM flag.** The campaign missions are a spy thriller with required VM flags. Office life adds atmosphere and optional content: intel, an optional task, a side room, an optional conversation. No required task, objective, `concludeRequires` or required lock depends on an NPC's needs timing, on an office-life event, or on a global that office life writes. This rule binds the campaign missions. The labs and test scenarios (`lab_physical_pentest`, `test_needs_sims`, `test_access_work`, `test_access_social`) complete required tasks from office-life events on purpose, and the validator's checks for this rule leave them alone (section 4).
2. **Canon and the lock and key structure stay as they are.** No lock, key, PIN, password, card, gate or flag is moved, removed or given a second way past it. A physical-pentest opening opens **optional content only**: a side room, a drawer of intel, an optional task. An opening that would bypass a lock the critical path uses counts as a lock and key change and is not built (the user's decision, 2026-11-14). The lock and key diff proves none slipped in. New rooms join off existing rooms and never sit between the player and a required step. Section 3, stage 0 defines the lock and key baseline that proves this.
3. **No large rewrites.** Existing knots, barks and eventMappings stay. New spoken material goes into new chatter pools and new exchange knots. An existing line changes only to fix a contradiction the change creates, and every such change is listed, because it costs re-voicing.
4. **Social compatibility.** NPCs chat only with people they plausibly get on with. Distrusted or suspect NPCs carry `needsCompany.avoids` entries (the user's own example: nobody joins m01's Derek at the cooler).
5. **Room leash and private objects.** Every needs NPC has a post (`needsHome`), a leash (`needsRooms` or `needsAvoidRooms`) and stays out of other people's private rooms (room-level `needsPrivateTo`). Private things (an owner's PC, their kettle) carry an explicit owner and are marked private.
6. **Voiceable speech.** Every spoken line lives in a scenario file: NPC `chatter` pools, scenario-level `chatter` pools, eventMapping `bark` fields or ink. Nothing is spoken from engine text. Chatter lines are one line, 40 characters at most, with no `{ }` variables and no speaker prefix. Exchanges are heard once.
7. **Cast.** A new NPC brings variety in ethnicity and age to that mission's cast, and the concept prompt says what was chosen. A recurring named character uses their own sprite key, never a generic one.
8. **Props are square to the walls**, with one or two angled props per room at most, placed through the mission-room-dressing rules.
9. **Sync stays small.** No new state grows in player_state. Each new piece is a bounded value sent as a per-key delta (section 7).
10. **Students' missions are protected.** Four scenarios are deployed to students on Hacktivity: m01, sis01, sis02 and lab_social_engineering (`docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md:27`). sis01, sis02 and lab_social_engineering are not campaign missions and are out of scope. m01 takes its normal place in the rollout (section 6); when its office-life work lands, the m01, sis01 and sis02 gate playtests are run again before any release carries it. There is no production release until office life has settled across the rollout (the user's rule, 2026-11-14). A mission's office-life work stays on its own branch until it is reviewed and voiced, and no release carries unvoiced office-life lines (section 10).

## 2. What the engine offers today

Everything below is built and merged. The field names are today's names; section 8 covers the coming renames. The author references are:

- `docs/achitechture/NPC_NEEDS_SYSTEM.md`, sections 3 and 5;
- the slice sections of `docs/achitechture/OFFICE_LIFE_PLAN.md`, and its section 12.11, written for this skill;
- `README_scenario_design.md` for access, work needs, workarounds and feeds;
- `scripts/scenario-schema.json` for every field.

| Area | Fields and events | Showcase |
|---|---|---|
| Needs and posts | `needs.<name>{decayPerMin, urgentAt, initial, weight, maxUnmetMin, jitterPct, deferrable}`, `needsHome`, `needsSpeed`, `interests`, `onUse` | test_needs_sims |
| Presets | scenario `officePresets: true`; `office-presets.json` gives a default `affordance` for desk PCs, coffee, kettle, cooler, fridge, microwave, sofa, copier, shredder, filing, post tray, desk phone. A preset matches an exact sprite type (`kettle1`, `water_cooler1`, `photocopier1` and so on); any other type takes one through `officeType` (a hot-water boiler as `kettle`, an undercounter fridge as `fridge`). Takeable objects, objects with a `lockType`, objects with no id and `decor: true` never gain one (`public/break_escape/js/systems/office-presets.js`). | test_needs_sims |
| Leash and privacy | `needsRooms`, `needsAvoidRooms`, room `needsPrivateTo`, `affordance.private`, `affordance.owners` | test_needs_leash |
| Social | `needsCompany{groups, avoids, avoidRadius}`, `maxQueue`, `needsDeferMin` | test_needs_sims, lab_physical_pentest |
| Talk | NPC and scenario `chatter` pools, `chattiness`, `chatterCooldownMin`, `exchanges[{with, knot, requireGlobal}]`, `answersPhones`, `phoneCalls` | test_needs_sims |
| Levers | magnet items (`affordance.magnet`, the cake), `offWhen` outages with switch objects, `desk_phone_ring:<id>`, droppable items with `interests` | test_needs_sims, test_access_work |
| Workstation habits | `screenHabit`, `printHabit`, `usbHabit`, `workstation`, `lockChance`, `autoLockSeconds`, `screenOwner`, `leftBehindBy`, `leftBehindChance`, `outputOf`, `revealOnGlobal` | test_needs_sims, test_access_social |
| Awareness | `awareness` low, medium or high; `habits.{locksScreen, writesDown, password, passwordPattern, holdsDoors}` | test_access_habits |
| Work and frustration | top-level `roles`, `resources{kind, access, object, offWhen}`, NPC `workNeeds`, `frustration`, `workarounds` (`writes_down`, `prop_door`, `emit`, `borrow_session`, `share_login`) | test_access_work, lab_physical_pentest (Kieran Doyle's wedged door) |
| Friendface | `feed{site, person, posts}`, reactive posts, replies, reactions, the `phoneOf` phone item | test_access_social |
| Physical pentest | `rfid` doors with `access`, `# clone_keycard` in ink, door `gate` (tailgating), `wearable` disguises, keypad shoulder-surf windows, USB drops, network jacks and drop boxes, capture log | lab_physical_pentest, test_gate_tailgate |
| Atmosphere | `roomTone`, `swivelChance`, `lockCues`, `showPressingNeeds`. Room-tone profiles (`js/data/room-tones.json`: office, reception, it, quiet_office, meeting, kitchen, server) match exact room types; a mission with its own room types (the hospital set, for example) maps them with scenario `roomToneTypes`, and an unmapped type stays quiet. | test_needs_sims |

No m01 to m10 mission uses any of this yet, and none has a Friendface `feed`, so feed work would be new content rather than an extension. All ten validate with 0 errors, all have lighting and POV backgrounds, and all are finished (m09 and m10 included). Vending sprites exist (`assets/objects/vending_machine1.png`, `drinks_vending1.png`) but have no preset. There is no toilet object.

Limits that shape the design:

- **Only loaded rooms exist.** The needs system sees objects only in rooms the player has opened. A kitchen behind an unopened door is never used, and an NPC in an unloaded room is not simulated. Each NPC's post and need objects belong in its own room, or in a room that is always loaded with it.
- **Scripts win over needs.** A scripted walk (`goToAndStay`, a patrolOverride, a walk home after a conversation) suspends needs. An eventMapping can set `"needs": "suspend"` or `"resume"`. A needs NPC may not also have `behavior.patrol`.
- **There is no "be at your post for this beat" guarantee.** A story-critical conversation needs the NPC to be reachable. Only three protections count: (1) the NPC is stationary (no `needs`); (2) its needs are confined to its own room (`needsRooms` lists only that room, and every need target is in it); (3) a mapping on a named event that always comes before the beat (for example `room_entered:<room>`) with `patrolOverride.targetTile` set to the post tile. That scripted walk suspends needs and brings the NPC home. A `"needs": "resume"` mapping on an event after the beat lets it go again. A bare `suspend` freezes an NPC where it stands, possibly in another room. A `resume` on an NPC that is not suspended does nothing. A conversation the player starts has no earlier event to hang it on. `deferrable: false` is not a protection: it marks a story need that skips the avoid and queue checks, so the NPC leaves more readily, and it is used only where a beat needs the NPC to walk to something.
- **Any NPC can become hostile.** Attacks are on in every campaign mission unless `disableAttacks` is set. Attacking a non-hostile NPC turns it hostile (`public/break_escape/js/systems/player-combat.js:453`). The needs system skips knocked-out, hostile and hidden NPCs, and a unit test covers the drop and walk-home. The live path is unproved: an NPC attacked mid-walk outside its post room, calming down, walking back, and its `globalVarOnKO`, `taskOnKO` and KO item drops firing once (gap E1).
- **Reload resets needs.** Need levels, queues and positions live in the browser and restart at the posts on reload. Only scalar globals are saved.
- **Old `npc_arrived:<id>` mappings now also see needs arrivals.** No m01 to m10 mission has one today, but a check guards against new ones.
- **Workaround `setGlobal`s are client-writable.** Nothing required may read them (rule 1).
- **Office-life events depend on timing.** These include `npc_exchange_heard`, `npc_chatted`, `desk_phone_answered`, `workstation_screen_changed`, `npc_left_post`, `object_revealed` and `magnet_placed`. They may complete optional tasks only.

## 3. The skill: `mission-office-life`

Layout: `.claude/skills/mission-office-life/SKILL.md` (frontmatter `name` and `description`, like the other mission skills) with a `references/` folder:

- `references/field-map.md`: today's field names beside their format 2 and format 3 names (section 8), and the rule for which to write.
- `references/patterns.md`: one minimal authoring pattern per feature, each copied from the showcase scenarios with file:line. It covers:
  - a post and leash;
  - a private office;
  - cooler chat with avoids;
  - a cake lever;
  - print and forget;
  - a screen-lock habit;
  - a desk-phone call;
  - an exchange knot;
  - a frustration workaround;
  - a reactive post.

  It also states one correction: `OFFICE_LIFE_PLAN.md` 12.11 says a story beat uses `deferrable: false`, but that flag makes an NPC leave more readily (`NPC_NEEDS_SYSTEM.md:100`); story beats use the three protections in section 2.
- `references/fit-checklist.md`: the analysis checklist from stage 1.
- `references/costs.md`: how to price art, voice and approvals (section 11).

Triggers: "bring office life into m0X", "add office life", "make the staff feel alive", "add a kitchen and coffee to the mission", "add needs to the NPCs", "add physical-pentest openings to m0X".

The skill plans first, then builds. Stages 1 and 2 produce a plan in the mission folder. Stage 3 settles approvals with the user. Stage 4 builds and dresses it, stage 5 reviews and playtests it, stage 6 finishes the art that copies the final look, stage 7 voices it and stage 8 closes and merges it. Each stage has inputs, outputs and an exit test.

Agent routing, from AGENTS.md "Choosing a model":

- Planning, review and dialogue writing go to Opus.
- Mechanical implementation from an approved plan goes to Sonnet.
- Physical-pentest openings and any text naming security techniques go to the agent type AGENTS.md names for VM and technical material. AGENTS.md routes SecGen and VM steps there; this text goes there too because the orchestrator's model also over-flags social engineering and intrusion wording. If a safety classifier stops that agent, follow AGENTS.md's stop procedure.
- Every multi-step brief carries the handover rule: at about 150k tokens or 80 tool calls, finish the step, commit, write a handover note, report and stop.

### Stage 0: preconditions and baseline

Inputs: the mission name.

Checks:

- the mission kind, from AGENTS.md "Kinds of game" (campaign missions only; any other kind needs the user's say-so);
- whether the mission is one students play (m01): if so, the pass records that the m01, sis01 and sis02 gate playtests must run again before any release carries it;
- whether the mission needs VM flags (m01 to m08 do): every browser run in stages 5 and 6 seeds them, as section 12 describes;
- the format version, whether steps 8b and 8c have merged (`STEPS` in `lib/break_escape/format_upgrade.rb`), and whether `tools/format/rewrite_templates.rb` exists for each merged step;
- the cached clip count in `tts_cache/<mission>/`;
- a clean validator run.

Outputs, in `scenarios/<m>/office_life/`:

- `BASELINE.md`, holding:
  - the validator summary;
  - the aim chain's critical path from the dungeon graph;
  - the `gameClock` start and rate, if any;
  - the cached clip count, and the list of clip keys the mission already has uncached (once V6 exists), so the release stop in section 10 ignores lines that predate office life;
  - the walkthrough file it was checked against.
- `baseline_locks.json`, the **lock and key baseline**, written by V9 (section 4). It takes the lock nodes, key edges and `optional` flags from the dungeon graph's JSON. The graph scrubs secrets and builds the critical path only for its HTML and Markdown, so V9 adds, from the rendered scenario:
  - a hash of each lock's requirement (key id, code, password, card), so a moved or changed secret shows without the secret being written down;
  - every `gate`, `access` list and `wearable`;
  - every task, objective and `concludeRequires` with its trigger, and the aim chain worked out from them.
- Saved copies of the validator's `ℹ️` lines, for later diffs.
- The base commit's hash. The `--office-summary` baseline (V1) is generated from that commit once V1 exists, before stage 4 starts.

Exit: the baseline is written and the validator shows 0 errors.

### Stage 1: analyse

An Opus analyst reads the scenario, its ink, the dungeon graph, the walkthrough and the mission's logs, and fills in `fit-checklist.md`:

- **Rooms.** Each room's type and whether it is office-like. Any kitchen, break room, coffee point, cooler, vending, printer or toilet. Which rooms load together. Spare space for a kitchenette. Which rooms have a `chatBackground`.
- **NPCs, classified one by one:**
  - story-critical: holds a required task, a conversation the critical path needs, a key or card source, or a cutscene role;
  - suspect or plot-located: the deduction relies on where they are;
  - fixed by the text: a narrator line, ink or note says where they are or that they have not moved (m02's narrator says Sister Doyle has not left bed two since three o'clock);
  - optional flavour: an optional conversation only;
  - ambient: no story duty;
  - hostile from the start, or patrolling;
  - several records of one character (one person written once per beat or room);
  - non-human (an AI receptionist, a hologram);
  - phone or cutscene only.

  The last four classes never get needs. Every NPC in a mission without `disableAttacks` is marked "can be attacked".
- **Beats keyed on NPC position or presence:** `npc_arrived`, conversation-reachable knots, sight and line-of-sight challenges, KO tasks and globals, `initiallyHidden` reveals.
- **Tone and time of day.** Crisis, night shift, a hostile building, the game clock. Office life suits a working day. Evening or night missions get a thinning office (staff working late, a cleaner, a security round) or the light tier.
- **Word of mouth.** A magnet's announce needs two needs NPCs posted in one room, in a different room from the magnet, and a scenario-level pool. Note whether the mission can have it.
- **Physical security already present** (RFID, keypads, PCs with sign-in, guards), and where an opening could reward optional content.
- **Hard-rule secrets and story items.** Every PIN, password, key, card, code and flag, and every place it is written; every PC that is a puzzle lock or is locked by the story (m02's ransomware screens); every item type an existing lock, ink check or mapping reads (`key`, `keycard`, `id_badge` and so on). Office-life printouts, left-behind items and reveal slots never carry a hard-rule secret and never use one of those item types.
- **Existing barks and timed messages**, and any ambient grumbles held in eventMappings that would read better as chatter pools.

Output: `scenarios/<m>/office_life/ANALYSIS.md` with a recommended tier:

- **Tier 0, none.** The mission is left alone, with the reason stated.
- **Tier 1, ambient.** Office presets on existing desks and kitchen objects, new kitchen props in an existing room, chatter pools, an exchange or two, room tone. Existing NPCs keep their positions or get needs only inside their own room.
- **Tier 2, routines and habits.** Needs with posts and leashes for optional-flavour and ambient staff, screen-lock and print habits, desk phones, one or two player levers (cake, breaker, desk-phone ring), Friendface posts where the mission already has a feed.
- **Tier 3, extensions.** A new room (kitchen, break room, print room), up to two new ambient NPCs, and physical-pentest openings into optional content: an unlocked session while the owner is at the coffee machine, a sticky note, a propped door, a tailgate gate.

Exit: every NPC is classified, every position-keyed beat is listed with file:line, and the tier is justified in one paragraph.

### Stage 2: design

An Opus planner writes `scenarios/<m>/office_life/PLAN.md` from the analysis. Its sections, in order:

1. Aim and tier.
2. People table, one row per NPC that gets anything:

   | NPC | class | post | leash | needs | company groups and avoids | habits | beats protected by | if attacked mid-walk |
   |---|---|---|---|---|---|---|---|---|

   "Beats protected by" names which of the three protections in section 2 keeps each story beat safe, and for protection 3 names the preceding event. The last column says what the E1 probe result means for this NPC.
3. Rooms and objects: each new or changed object, with its room, position, sprite key, preset or hand-written affordance, and a dressing note (square to the walls). A new room comes with the door that joins it and the lock it uses.
4. Levers: what the player can do to move people (deliver the cake, ring a desk phone, throw a breaker, jam the printer) and what each lever opens. Every lever is optional.
5. Physical-pentest openings: each opening, the cyber security lesson it carries, the optional content it rewards, and the CyBOK area if it adds one. An opening that would touch a critical-path lock is dropped (rule 2).
6. Spoken lines: every new chatter pool, exchange, phone call and bark, in a table of speaker, pool or knot, line and character count. Also the list of existing lines changed (old to new), which should be empty or nearly so.
7. Sync budget (section 7 template).
8. Field names to write (section 8).
9. Costs and approvals (section 11 template).
10. Test plan:
    - the walkthrough steps that must still pass;
    - the office-life checks to make live;
    - the reload checks;
    - the expected lock and key diff (empty, or the approved items).

Then 3 to 5 adversarial review rounds by fresh Opus reviewers (section 12). After each round the planner rewrites the plan as a standalone document.

Exit: a round with 0 blockers and 0 majors, after at least 3 rounds.

### Stage 3: approvals

The orchestrator gathers every approval item in the plan into one review page (artifact) with a "Copy picks" box, as AGENTS.md "Asking the user for input" describes, and enters the page on the shared Input Queue page that lists everything waiting on the user, closing the entry when the picks come back. Typical items:

- new rooms;
- new NPCs, with the cast choice for each;
- new art;
- any engine or shared-data change;
- the voicing spend;
- any change to an existing spoken line.

Paid steps wait for the picks. Mission-local work that needs no approval carries on.

### Stage 4: implement

Work happens on a branch, `build/office-life-<m>`. A Sonnet implementer works from the approved plan in slices, one commit per slice, with explicit paths. An Opus writer handles the exchange and phone-call knots. Slice 4 (levers and physical-pentest openings), both its text and its wiring, goes to the agent type AGENTS.md names for VM and technical material, because Sonnet also trips the safety classifier on that work. The slices, in order:

1. New rooms and objects, then presets, needs, posts, leashes and privacy. Tiled decor that should take part (a coffee point or copier drawn into the map) is declared as a scenario object so it can carry a preset. An undeclared decor sprite is hidden when another sprite with the same image is claimed, so every same-image twin in the room is declared too, or given a distinct variant. Preset queue cells and `useFrom` approach cells are checked against neighbouring objects and walls, and hand-written where they clash (`queue.cells`, `"queue": false`, or `useFrom`).
2. Workstation habits (screen, print, USB) and awareness.
3. Chatter pools and exchange knots.
4. Levers and physical-pentest openings, with any switches, reveal slots, magnet spots and desk phones they need.
5. Dressing and lighting of every changed room: mission-room-dressing, then mission-room-lighting (new screens, machine glow, dark corners), each run as its own design-heavy loop of about five cycles, up to ten while it keeps improving. Need objects, queue cells, posts and workstations are re-checked by the validator after each cycle.
6. Room tone, last, because it follows the final layout and dressing.

Checks after each slice, from AGENTS.md's mission loop:

- the ink compile;
- `ruby scripts/validate_scenario.rb`: 0 errors, and every new warning cleared or justified;
- the `--office-summary` diff against the baseline;
- the lock and key diff against `baseline_locks.json` (empty, or exactly the approved items);
- the aim chain's critical path (unchanged);
- `python3 scripts/check_door_alignment.py` and the room depth check for new or changed rooms;
- inkcheck and loopcheck over a state matrix;
- `scripts/ink_runtime_check/reopencheck.mjs`, and the mission's own route suite where it has one;
- `dialoguelint.mjs` on changed ink;
- `tagdiff.mjs` against the last commit for any existing ink touched.

Field names follow `FormatUpgrade.current` at the time of writing (section 8). Renamable office-life keys are never written inside an ERB loop or tag, so a format rewrite can map each one to a single span.

Exit: all slices committed on the branch, static checks clean, and `scenarios/<m>/office_life/BUILD_LOG.md` written.

### Stage 5: review

The per-mission review loop is in section 12.

### Stage 6: art follow-ups

Dressing and lighting already happened in stage 4. Two things remain, because they copy the final look:

1. room-pov-background, redone for every changed room that has a `chatBackground`. A room whose background is split into two images needs both redone.
2. pixellab-character-pipeline for any new NPC: a concept through agy, the walk atlas, the bust and `<key>_headshot.png` (sign-in tiles, including captured sign-ins on the remote screen, show it), visemes from a talk run, and seated frames if they sit. This can start once the cast is approved in stage 3, alongside stage 4, because it touches only character assets. It must finish before the stage 5 playtests.

After any art change, a closing check runs on the final commit: the validator, the `--office-summary` diff, the lock and key diff, and a short Haiku regression playtest.

### Stage 7: voice

The tts-audio skill runs once the mission's words are signed off (section 10).

### Stage 8: close

- Record each round's severity table and every finding's outcome in `scenarios/<m>/office_life/LOG.md`.
- Flag the lab-sheet impact for the user: new optional routes and openings change what a student can do, and lab sheets are written last, by the user's rule.
- Update `CYBOK_MAPPING.md` if an opening teaches something new.
- Hand the voiced branch to the integrator, following the merge rule in section 10: it goes into the current merge batch, its checks run on the batch tip beside the full suites, and the integrator fast-forwards main to exactly that hash. The pass never moves main itself.
- Fold the lessons into the skill's references.

## 4. Validator and report support

The skill relies on the checks that already exist in `scripts/validate_npc_needs.rb`, `scripts/validate_access_work.rb` and `scripts/validate_npc_habits.rb`:

- the T1/P timing report per need;
- needs that cannot be met under the leash, and targets reachable only through a forbidden room;
- private objects with no owner;
- the list of objects that gained a preset. This catches puzzle terminals, because a `pc` with no `lockType` gains a desk preset, so the planner checks every object on the list;
- queue cells in doorways or forbidden rooms;
- chatter line rules;
- that exchange and call knots exist and their speakers have voices;
- workstation owners and habit bounds;
- `offWhen` globals that nothing sets;
- print habits, magnets, desk phones, room tone and swivel;
- the workaround, frustration and feed checks.

New tooling for the skill. None of it changes the game at runtime.

| Id | Check or tool | Kind | Why the missions need it |
|---|---|---|---|
| V1 | `--office-summary`: one line per NPC, in a stable order so it diffs. It gives class hints (owns a knot that sets a task, is a key or card source, has `behavior.hostile`, patrols, `initiallyHidden`, can be attacked because `disableAttacks` is unset), then the post, leash, needs, groups and avoids, habits, and the number of chatter lines and exchanges. | info flag | The stage 0 baseline and every slice diff. OFFICE_LIFE_PLAN.md 12.11 already asks for it. |
| V2 | A needs NPC who owns a knot that sets a required task, or is the target of a conversation-mode mapping, or is a key or card source, and whose needs can take it out of its own room, unless a `patrolOverride.targetTile` mapping to its post precedes the beat (protection 3). `deferrable: false` never exempts. | warning | Story NPCs must stay reachable. |
| V3 | An `npc_arrived:<id>` mapping on an NPC that has `needs`. | warning | Needs arrivals fire these mappings. Nothing to catch today; cheap insurance. |
| V4 | A needs NPC in a scenario without `disableAttacks`, until the E1 probe has passed. After that it becomes an info line that lists the NPC's KO globals and tasks for the reviewer. | warning, then info | Any NPC can be attacked mid-walk. |
| V5 | A required task, objective, `concludeRequires`, required lock, or mapping that completes a required task, whose trigger is a global written only by office life or an office-life event. The globals are a workaround `setGlobal`, an `onUse.setGlobal`, `<id>_servings`, `heard_<knot>` (exchanges and phone calls), the workstation globals including `<id>_accessed`, and the reveal globals. The events come from one constant, `OFFICE_LIFE_EVENT_PREFIXES`, matched by one rule: an entry ending in `_` matches any event name that starts with it; any other entry matches the name exactly, alone or followed by `:`. The entries are given below the table. Combat and KO events are not office life and are never listed. **Scope: the ten campaign missions only** (see below). | error, campaign missions only | Rule 1. Extends the existing workaround-global rule to every office-life global and event. |
| V6 | `bin/rails "app:break_escape:tts:office_lines[<mission>]"` (the same form as the existing `tts:wasted` task), a rake task in the existing `break_escape:tts` namespace beside `tts:wasted`, run keyless against the development database (it reads only; no database setup or migration commands from a worktree) that uses `TtsLineExtractor` with `chatter: true`. It lists every chatter, exchange, call and bark clip **per voice**, counted exactly as the extractor counts them, marks each as cached or uncached under the current cache key, and totals characters and clips. | report task | Prices the voice cost in stage 2 and drives stage 7. It has to live in Rails, because the cache key and line extractor do. |
| V7 | A chatter pool line that repeats another pool line or an existing bark word for word, or matches the first line of the same NPC's ink opener. | warning | npc-dialog-review's "same fact twice" rule, made mechanical. |
| V8 | Sync budget: counts, by kind, every piece in section 7 that the scenario can write, and prints each kind's total and the sum. Warns when a kind passes its cap. | info, warning above a cap | Keeps the sync size rule visible. |
| V9 | `scripts/lock_key_diff.rb <baseline>`: reads the lock nodes, key edges and `optional` flags from the JSON that `generate_dungeon_graph.rb` writes, and adds from the rendered scenario a hash of each lock's requirement, the `gate`s, `access` lists, `wearable`s, task and objective triggers, and the aim chain. It diffs the result against the stage 0 baseline and flags any new door or gate whose far side holds a required task or a critical-path lock. | report tool | Rule 2. Reusing the graph's lock parser keeps one parser in step with format changes. |

**V5's event entries.**

- Stems (match by prefix): `npc_print_`, `npc_need_`, `npc_visit_`, `npc_usb_`, `npc_use_` (covers `npc_use_heard` from `npc-office-visuals.js`), `workstation_`, `desk_phone_`, `magnet_`, `room_tone_`.
- Names (match exactly, alone or before `:`): `npc_left_post`, `npc_returned_post`, `npc_posted`, `npc_placed`, `npc_reacted`, `npc_used`, `npc_queued`, `npc_turned_back`, `npc_chatted`, `npc_overheard`, `npc_mutter`, `npc_exchange_heard`, `npc_call_heard`, `npc_caught_at_post`, `npc_announced`, `npc_told`, `npc_borrow`, `npc_workaround`, `npc_saw_magnet`, `npc_frustration_changed`, `npc_locked_out`, `npc_action_windup`, `npc_avoided`, `npc_checked`, `npc_job_failed`, `npc_picked_up`, `npc_needs_leashed`, `npc_sat`, `npc_sat_at`, `npc_stood`, `npc_swivelled`, `npc_fetching_chair`, `npc_guest_left`, `npc_left_item_gone`, `object_revealed`, `door_propped`, and `item_dropped` only for an item with an `interests` tag.
- Exclusions, each with its reason: `npc_ko`, `npc_attacked`, `npc_became_hostile`, `npc_hostile_changed`, `npc_hostile_state_changed`, `npc_influence_changed`, `npc_items_changed` (combat, KO and story state); `npc_reported`, `npc_conversation`, `mail_sent` (player conversations and story); `npc_arrived` (scripted arrivals; V3 covers the needs case); `npc_used_object` and `npc_used_object_done` (the scripted patrol route's `useObject` step, `npc-behavior.js`, not office life). Because `npc_used` matches only itself or `npc_used:`, it does not catch these two.

A fixture test keeps the list honest. It collects **every string or template literal under `public/break_escape/js/` that begins with an office-life stem** (`npc_`, `workstation_`, `desk_phone_`, `magnet_`, `room_tone_`, `object_revealed`, `door_propped`), whatever call it sits in, so a name handed to a helper (`_emitRouteUse('npc_used_object', …)`) is seen as well as the direct emit forms. It strips a template's `${…}` tail at the first `:`, then requires each name to match an entry by the rule above or be on the exclusion list. Literals that are not event names (CSS classes, ids, log keys with the same stem) go on a short ignore list in the test, each with its file. A new engine event therefore fails the test until someone decides which list it belongs on.

All nine are built before the pilot's stage 4. Each gets fixture tests under `test/` and a line in `README_scenario_design.md`.

**Scope of V2, V4 and V5.** These protect campaign beats, so they run only for the ten campaign missions, named in one constant in `validate_office_life.rb`. The validator takes a `--campaign` flag that adds the scenario being checked to that set for one run; V5's positive fixtures (for example, a synthetic scenario whose required task is keyed on `npc_used:x` must give an error) use it, and the lab and test-scenario fixtures run without it. Elsewhere the opposite pattern is intended: `lab_physical_pentest` completes its required `usb_foothold` task from `npc_used:usb_target_pc`, `test_needs_sims` completes `see_coffee` and `see_meal` from `npc_used:*`, and `validate_access_work.rb` tells lab authors to gate on the `npc_workaround` event rather than its global. Two node tests (`npc-needs-slots.test.mjs`, `npc-left-behind.test.mjs`) already require `test_needs_sims` to validate with 0 errors. Fixture tests assert that:

- V5 reports 0 errors on m01 to m10 as they stand, so its event list cannot catch existing combat and KO mappings;
- V2, V4 and V5 report nothing on `lab_physical_pentest`, `lab_social_engineering`, `test_needs_sims`, `test_access_work` and `test_access_social`.

V1, V7 and V8 are reports or warnings and run for every scenario.

Format steps 8b and 8c rewrite the owner and habit readers in `validate_npc_needs.rb`, `validate_access_work.rb` and `validate_scenario.rb`. To stay out of that work, V1, V2, V4, V5, V7 and V8 live in a new file, `scripts/validate_office_life.rb`, called from `validate_scenario.rb` with one line. It reads renamable keys only through a small name table keyed on `FormatUpgrade.current`, which gains its format 2 and format 3 rows when 8b and 8c land. V3 is a one-line rule in the same file. V6 and V9 touch no renamed key.

## 5. Per-mission fit

This table comes from a survey of the ten scenario files on 2026-11-13. "Cached" is the number of voiced clips already in `tts_cache/<m>/`. Stage 1 checks each row again before a pass starts.

| Mission | Setting | Office-like rooms and kit today | Suggested tier and features | Main risk |
|---|---|---|---|---|
| m01 first_contact | Media and PR office | 13 rooms including a break room (notes only), open office and meeting room. 4 stationary staff, each with KO globals and tasks. 3 PCs. Cached 1365. | Tier 2. Coffee and cooler in the break room. Needs for Sarah, Kevin and Maya inside their own rooms. Derek isolated with `avoids`. Screen-lock habits. A cake lever. | Played by students, large audio cache. Takes its normal rollout slot; the m01, sis01 and sis02 gate playtests run again when it lands. |
| m02 ransomed_trust | Hospital at night, ransomware crisis | 13 rooms. The Night Handover room (`staff_room`) is a full staff kitchen drawn as Tiled decor (hot-water boiler, sink, microwave, undercounter fridge, dishwasher, cooler, lockers) with no NPC. IT has a declared kettle, and a photocopier, shredder and desk phone as decor. The Boardroom has a declared cooler. The corridor has drinks and coffee vending machines as decor, on Val's patrol. Every hospital PC is ransomware-locked except Gary's (a password puzzle). Story NPCs: Bernie, Kim, Gary, Doyle, Reeves; Val and Nurse Raval patrol; three patients are immovable. No `disableAttacks`. Cached 1113. | **Pilot.** Tier 2 inside existing rooms for Gary, plus one Tier 3 ambient NPC in the Night Handover room (user approval). Detail in section 6. | A crisis tone, and a cast where every existing NPC carries a beat or a fixed position. No screen-habit openings: the screens are encrypted or a puzzle lock. |
| m03 ghost_in_the_machine | Pentest firm, night infiltration | 7 rooms, no kitchen, few staff. Cached 643. | Tier 0, or a small Tier 1: a coffee point and an exchange at reception before the night transition. | Night premise. The night transition is a story beat. |
| m04 critical_failure | Battery storage plant | Ops office and reception only. Hostile operatives. Timed. Cached 525. | Tier 1. An ops-office kettle, and desk presets for Robert Vance confined to his room. A little shift chatter. | Live threat and a timer. Hostile NPCs never get needs. |
| m05 insider_trading | Quantum crypto company hunting an insider, from 16:30 | Break room (leaflet note) and an open office with no declared objects. Every staff NPC is story-critical: Owen (required talk, RFID clone source), Patricia (keycard; two records), Halloran (badge in the flag deduction), Lisa (talk task, KO task). Cached 725. | Tier 2 or 3. Kitchen kit in the break room, with Lisa's needs confined to it. A thinning evening office with one or two new ambient staff at new desks. Screen-lock and print habits on those new desks. Story staff stationary. | Every existing NPC carries a beat. The visible life needs new NPCs and desks, so art and approvals come first. |
| m06 follow_the_money | A crypto exchange late at night, still staffed; the player poses as a visiting supervisor | Trading floor with Irina (story-critical, holds a server-room item) and Dani (optional flavour, `taskOnKO` fallback), a trading workstation, and a coffee point and copier drawn as Tiled decor. Priya (optional flavour) works in the blockchain lab, whose door to the floor is unlocked. The floor's POV background is two images. Cached 566. | Tier 2 inside existing rooms, after the pilot: declare the floor's coffee point, copier and every same-image monitor twin; Dani and Priya posted and leashed with screen and print habits on their own PCs; a cake magnet seen rather than announced, which draws Dani or Priya from a desk and opens a screen-habit window; one or two Dani-and-Priya exchanges. The magnet needs a hunger source or a tempt-band setting, `cake_servings` in `globalVariables`, and an in-world source for the cake. Irina, Satoshi, the checkpoint guard and Kemal Aydin stay as they are. | The visitor cover: staff lines must fit an FCA supervisor walking the floor at night. The split POV background follows the NPC's position. |
| m07 architects_gambit | Grid control facility | 6 rooms. Badge station, handover sheet, abandoned workstation. Elena is the only friendly staff member; the rest are hostile. Timed. Cached 629. | Tier 1. Elena gets desk presets and needs confined to the server room, with a kettle there. Shift-handover chatter. | Crisis timer, and only one friendly NPC. |
| m08 the_mole | SAFETYNET HQ | Break room with a coffee-machine note, visitor badge printer, operations floor. Colleagues are suspects or allies; ATHENA is an AI receptionist; Nightshade has two records. The off-duty agent in the break room is a sight beat (he catches lock picking). Cached 39, because most of m08 is unvoiced, so its voicing cost is mainly the existing backlog. | Tier 2. A real coffee machine in the break room. Needs for the junior analyst. The off-duty agent stays stationary or keeps needs inside the break room. Suspects stationary. Exchanges that add colour without new clues. | Every named NPC matters to the deduction, and exchanges must not leak or contradict clues. |
| m09 digital_archaeology | Records archive after hours (finale) | No break room. Hostile staff. Sorensen has three records. Heavily scripted. Cached 137. | Tier 0, or Tier 1 limited to a front-desk kettle and a short pool for Jesse Tran. | Scripted finale with hostile staff. |
| m10 full_disclosure | Cold War bunker (finale) | No office. About 30 characters written as many per-beat records. Hostile patrolling guards. Countdown. Cached 117. | Tier 0. | Nothing office-like to add, and a finished finale to protect. |

## 6. Pilot and rollout

**Pilot: m02 ransomed_trust** (the user's choice, 2026-11-14). The reasons it suits a pilot:

- **A hospital is staffed all night.** Night staff take short breaks even in a crisis, so a working kitchen at 03:00 fits the premise without the "thinning office" device a corporate night mission needs.
- **The kit is already drawn.** The Night Handover room is a full staff kitchen in Tiled decor with nobody in it, and IT has a declared kettle and a photocopier. The pilot needs no new prop and no new room.
- **It tests the hardest protection.** Gary Whitlock carries a required conversation, is the source of the server-room keycard and the contractor lanyard, and owns a conversation-mode mapping. Giving him a routine that stays inside his own room proves protection 2 and V2 on a story NPC.
- **It tests the approval route.** The Night Handover room has no one to bring it alive, so the pilot's one Tier 3 item, a new ambient NPC, goes through stage 3 as the skill intends.
- **It has a theme the openings can teach.** With every system encrypted, the hospital runs on paper, and paper leaks. Print and forget fits the story better than an unlocked screen, which the premise rules out.
- **It is not deployed to students.** Its work stays on its branch until reviewed and voiced.

What m02 cannot prove: screen habits (every hospital screen is encrypted or a puzzle lock) and a player lever with a payoff (6.5). m06 proves those second.

### 6.1 What m02 has today

From `scenarios/m02_ransomed_trust/scenario.json.erb` as rendered, the Tiled maps under `public/break_escape/assets/rooms/`, `TESTING_WALKTHROUGH.md`, and a live game checked on 2026-11-14 with every room open.

| Room | Office kit | People | Office-life use in the pilot |
|---|---|---|---|
| `staff_room` (Night Handover; four doors: corridor south, CTO north, Boardroom west, IT east; motion lighting) | Decor: hot-water boiler, sink counter, microwave, undercounter fridge, dishwasher, water cooler, lockers, two tables with chairs, a tray and mug of coffee (existing consumables). Declared: handover board, snag list, noticeboard, Ward Clerk's Laptop (takeable), Wrapped Contractor Lanyard (takeable). | Nobody (walkthrough step 10). | Post for the new ambient NPC. Boiler, cooler, microwave and fridge declared as need objects. |
| `it_department` (key lock, Bernie's override key or a pick) | Declared: `it_department_kettle`. Decor: photocopier, shredder, desk phone, network rack. Two PCs: `infected_terminal` (ransomware screen) and `gary_workstation` (password lock). `it_filing_cabinet` (key lock, pickable). | Gary Whitlock: required `talk_to_gary`; holds the server-room keycard and the contractor lanyard; `lockpick_used_in_view` opens `on_cabinet_picked`; `taskOnKO: talk_to_gary`; sight 400 px, 360 degrees, no occlusion. | Gary's routine: tea at the kettle, prints at the copier. |
| `conference_room` (Boardroom, PIN lock) | Declared cooler; a coffee station in the map's conditional layer, undeclared. | Graham Reeves, the inside asset: plot-located, ambush scene, `setVisible` mappings. | None. Reeves stays as he is. |
| `office_corridor` | Decor: drinks and coffee vending machines. | Val Okonkwo patrols the west end; her blind window is a lock-pick route past a critical-path door. | None. Vending has no preset until after the pilot, and the machines stand in Val's patrol lane. |
| `hospital_ward` | Paper obs rack, BP cuff, EHR terminal (ransomware). | Sister Doyle (optional talk, `gather_pin_clues` fallback, lanyard source; the narrator says she has not left bed two since three o'clock), Nurse Raval (patrol), three immovable patients. | None. |
| `reception_lobby`, `dr_kim_office`, `security_office`, the halls, storage, server room | Reception kiosks and terminal (ransomware); a kettle drawn in the security office. | Bernie (required sign-in, IT key source), Kim (required meeting), no one else. | None. |

Locks and secrets (the lock and key baseline records these by hash): Boardroom PIN, emergency-store safe PIN, Kim's safe PIN, Gary's workstation password, IT override key, Security Office key, server-room RFID card, the four VM flags and the flag-locked staging cache. None may appear on an office-life printout or slot.

### 6.2 People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Gary Whitlock | story-critical | his current tile (6.3, 5.8) | `needsRooms: ["it_department"]` | thirst (IT kettle), print (IT copier) | group `night_staff` | print habit on the copier (6.4) | protection 2: every need target is in IT. His sight already covers the whole room, so `on_cabinet_picked` fires as it does today. | He stays in IT, so a knock-out drops the keycard and lanyard inside his own scenario room, where the server accepts drops today, and `taskOnKO` fires once. E1 confirms the hostile walk-back. |
| New ambient NPC (N1, user approval) | ambient | a chair at a Night Handover table | `needsRooms: ["staff_room", "it_department"]` | thirst (boiler, cooler, IT kettle), hunger (microwave, fridge), print (IT copier: paper obs charts for the ward) | group `night_staff` | none | no story duty | Holds nothing and sets no KO global. E1 confirms the chase, calm-down and walk home. |
| Bernie, Kim, Reeves, Doyle | as above | unchanged | none | none | none | none | protection 1: stationary | unchanged |
| Val, Nurse Raval | patrolling | unchanged | none | never (a patrol excludes needs) | none | none | unchanged | unchanged |
| Three patients, phone contacts, cutscene records | never | unchanged | none | never | none | none | unchanged | unchanged |

N1 notes:

- **IT comes alive only once opened.** IT is locked and does not exist for the needs system until the player opens it (section 9, E4). Until then N1's IT targets are absent and she stays in the Night Handover room. After it opens, N1 walks through an unlocked door the player has already passed.
- **No story items.** N1 carries nothing and leaves nothing behind. A lanyard or badge of hers on a table would be a second source for `staff_lanyard_obtained`, which is a route past Val, so rule 2 forbids it.
- **The free items in her room.** The contractor lanyard and the Ward Clerk's Laptop are free to take while she is there. N1 does not react; this matches HaX's line about the lanyard ("no matter how you came by it"). Her pools use `hush`, so she goes quiet when the player is close.
- **Her conversation.** A short ink story (a greeting, two or three choices, a parting line) so that talking to her works. It gives no clue, sets no task and completes nothing. Her lines never mention the consultant booking, Reeves, the badge or the door override.
- **Cast.** m02's speaking cast already spans Nigerian-British, Irish, South Asian, Korean and white British characters, mostly middle-aged. The recommended choice is a healthcare assistant in her early twenties of Polish-British heritage; the alternative is a night porter in his sixties of Filipino heritage. Either gets a sprite key of their own.

### 6.3 Rooms and objects

| Object | Room | How | Preset or affordance |
|---|---|---|---|
| Hot-water boiler (`hot_water_boiler1`) | staff_room | declare as a scenario object at its drawn position | `officeType: "kettle"` |
| Water cooler (`water_cooler1`) | staff_room | declare | cooler preset (capacity 2, `chatter: "cooler"`) |
| Microwave (`microwave1`) | staff_room | declare | microwave preset |
| Undercounter fridge (`undercounter_fridge1`) | staff_room | declare | `officeType: "fridge"` |
| Photocopier (`photocopier1`) | it_department | declare | copier preset, with one reveal slot for the printout |
| `it_department_kettle` | it_department | already declared | kettle preset, with `capacity: 2` and `chatter: "coffee"` written on the object so Gary and N1 can share it (the exchange spot) |
| `conference_water_cooler` | conference_room | already declared | gains the cooler preset when `officePresets` is on. No leash reaches the Boardroom, so it is inert; stage 2 writes `affordance: false` on it to keep the preset list clean. |

Not declared: the shredder (Gary feeding a shredder during an investigation into him would read as destroying evidence), the desk phone, the sink counter, the dishwasher and the lockers. The ransomware PCs and Gary's workstation have a `lockType`, and the two portable workstations are takeable, so none gains a preset. Stage 4 checks the preset list against this table.

Dressing checks for stage 4:

- The staff room has four doors. Queue cells and approach cells stay out of all four doorways, and N1's post leaves the path from the corridor door to the CTO door clear.
- `water_cooler1` appears in two rooms (decor in the staff room, declared in the Boardroom). Stage 4 confirms with `tools/playtest/room-snapshot.mjs` before and after that declaring the staff-room cooler hides no other sprite.
- No layout moves, so the POV backgrounds stay as they are. If dressing moves anything in a room with a `chatBackground`, that background is redone in stage 6.

### 6.4 Openings: paper, not screens

- **No screen habits.** Every hospital PC shows the ransomware screen, and Gary's workstation is a password puzzle the server checks. An unlocked session on it would be a second way past a lock (rule 2).
- **Print and forget.** Gary's print need and N1's print need send jobs to the IT copier. With Gary's print habit, some of his printouts stay on the tray as a reveal slot the player can pick up. The printout is optional lore on the paper-fallback theme, for example a page from the hospital's downtime pack. Its rules:
  - it carries no PIN, password, key, card, flag, server address or account detail;
  - it is a `notes` item, never a type an existing lock or ink check reads;
  - it sets only its own read global and gives no new route to an existing story global;
  - it repeats no existing clue word for word and contradicts none.
- **The lesson.** When the IT fails, staff fall back to paper, and paper ends up on trays and desks. This sits in CyBOK Human Factors and Security Operations; stage 8 flags it for the lab sheet.
- **No left-behind items** in the pilot.

### 6.5 Levers

m02 has no player lever with a payoff that respects rule 2:

- **A magnet** (a tin of chocolates from a patient's family would fit) could draw Gary to the Night Handover room and let the player pick the IT filing cabinet without his catch. That takes Gary out of his room, so V2 would need protection 3, and protection 3's walk home on entering IT would close the very window the magnet opens. The pilot does without it.
- **A desk-phone ring** in IT moves nobody: Gary answers at his desk, and N1 is not posted in IT.
- **A power switch** (`offWhen` on the kettles) has nothing to open.

The pilot records "no lever" with these reasons. m06 proves the magnet.

### 6.6 Spoken lines

| Speaker | Pool or knot | Lines | Notes |
|---|---|---|---|
| Gary | own `coffee` and `grumble` pools | about 6 each | his existing voice; crisis tone; 40 characters at most; none repeats his ink or barks (V7) |
| N1 | own `coffee`, `cooler`, `grumble`, `greet` pools | about 5 each | new voice; `hush` on each pool |
| Gary and N1 | two exchange knots on N1's story, played at the IT kettle | about 6 lines each | one gated on `{ "cover_burned": false }`, one on `gary_protected`; neither names Reeves, the badge, the override, a code or the seven warnings beyond what Gary already says aloud |
| N1 | her conversation knots | about 12 to 15 lines | optional, no clue |

Existing lines changed: none. Estimated clips: about 55 to 65, within the Tier 3 range. V6 gives the exact count per voice.

### 6.7 Sync budget

| Piece | m02 count |
|---|---|
| `heard_<knot>` | 2 |
| Reveal global for the printout slot | 1 |
| New `onceOnly` mappings | at most 2 |
| Printout in the inventory echo | 1 item |
| Workstation, frustration, workaround, servings, Friendface, capture or card records | 0 |

At most 5 small keys and one inventory item. Nothing grows with play time.

### 6.8 Validator expectations

- V1: two lines change (Gary, N1).
- V2: Gary passes: his leash is IT only and every need target is in IT. N1 has no story duty.
- V3: nothing.
- V4: a warning on Gary and N1 until E1 passes, then an info line listing `gary_ko`, `taskOnKO: talk_to_gary` and his held keycard and lanyard.
- V5: 0 errors.
- V7: Gary's pool lines checked against his ink and barks.
- V8: at most 5 keys.
- V9: an empty lock and key diff. N1 adds an NPC node with no lock, key, door or gate.
- Existing checks: the preset list matches 6.3; N1's IT targets are reachable only through the Night Handover door to IT, which her leash allows; no queue cell in a doorway; chatter rules; both exchange knots exist and both speakers have voices.
- The aim chain stays at 4 hops.

### 6.9 The attack probe for m02

E1 (section 9) runs first, in its own small scenario. Then, live in m02:

1. Attack N1 while she walks between the Night Handover room and IT. She turns hostile, chases, calms down and walks back to her post. Reload: she is at her post.
2. Knock Gary out while he walks to the IT kettle. The keycard and lanyard drop once where he falls; `gary_ko` is set; `talk_to_gary` and `obtain_password_hints` complete once. Reload: Gary stays down and nothing drops twice.
3. Attack Gary mid-walk without knocking him out: his hostile and calm-down behaviour inside IT matches today's stationary Gary, and his conversation is reachable again afterwards.
4. Regression: Val's `lockpick_used_in_view` catch and Gary's `on_cabinet_picked` still fire as the walkthrough describes.

### 6.10 Approval items for m02's stage 3

1. N1: role, cast choice and name, and the art through the character pipeline (concept through agy at no cost, then PixelLab for the bust, visemes, walk and seated frames).
2. N1's voice style.
3. The voicing spend, priced by V6.

Decided by the orchestrator and logged: `roomTone` on for m02, with `roomToneTypes` mapping the staff room to `kitchen`, IT to `it`, the Boardroom to `meeting` and reception to `reception`, the ward and halls left quiet, subject to a listen check; the printout's wording; the exchange topics.

**If the user declines N1,** the pilot is Tier 2 inside IT: Gary's routine, his pools and the printout. With one needs NPC there are no exchanges, and the staff-room declarations are left out.

### 6.11 Rollout

1. m02 (pilot)
2. m06
3. m05
4. m08
5. m01, then the m01, sis01 and sis02 gate playtests again
6. m07
7. m04
8. m03
9. m09 and m10: the analysis stage runs, is expected to recommend Tier 0, records that and stops.

One mission is in implementation at a time. The next mission's analysis and design can run while the previous one is in review, as AGENTS.md's mission loop allows. Lessons from each mission go into the skill's references before the next one starts. The vending preset (E2) lands as its own item straight after the pilot, before m06.

## 7. Sync size

Needs state lives in the browser and is never synced: levels, positions, queues, cooldowns and chatter bags. Office life reaches the server and player_state only in the forms below. Each mission plan fills in this table with its own numbers. Plan reviewers check the sums by hand in stage 2; V8 confirms them from stage 4 on.

| Piece | Where it lives | How it is sent | Cap per mission |
|---|---|---|---|
| Workstation globals: `<pc>_screen_locked`, `<pc>_owner_away`, `<pc>_accessed` | globalVariables (engine-owned) | one key each, as a delta when it changes (on each leave and return); after a load, only when changed | 3 booleans per owned workstation; at most 8 owned workstations (24 keys) |
| `<npc>_frustration` | globalVariables (engine-owned) and the server's `npcFrustration` record | one key, as a delta on the 30-second sync; frustration reports batched, at most 20 per batch | one integer per NPC with work needs; at most 6. Server record about 450 bytes per NPC |
| Workaround fired flags (`done`, `handed`) | server `npcFrustration` | never re-sent whole; a short answer per report | one entry per authored workaround slot; at most 4 |
| Workaround and `onUse` `setGlobal`s | globalVariables | one key each, as a delta | one boolean each; at most 8 |
| `heard_<knot>` | globalVariables | one key each, set once | one boolean per exchange or phone call; at most 8 |
| `<magnet>_servings` | globalVariables | one integer that changes a few times | one per magnet item; at most 2 |
| Reveal and left-behind globals | globalVariables (engine-owned) | one key each, set once | one per slot or left-behind item; at most 6 |
| Friendface reveals | server `feedRevealed` | delta through `/feed_post`; the bootstrap once per load | bounded by authored posts; at most 10 posts |
| A dropped magnet item (the cake) | `room_states.objects_added`, deduplicated by id | one entry when dropped | one per magnet item; at most 2 |
| An attacked NPC | `npcHostility` and the KO record, as for any NPC today | one entry per NPC when it changes | bounded by the cast; not new to office life |
| A claimed unlocked session | the server's `sessions` and `signedInPcs`, sent in the bootstrap | one entry when claimed, removed when it ends | one per owned workstation; covered by the workstation cap |
| A propped door | `door_propped:<room>` event plus the workaround's `setGlobal` (row above) | one key | covered by the workaround cap |
| New `onceOnly` mappings | the keyed `triggeredEvents` section | one key when each first fires | one per new `onceOnly` mapping; at most 10 |
| A picked-up printout, left-behind item or cake | the inventory, echoed whole on `POST /inventory` as for any pickup today | the existing echo | at most 4 office-life items per mission; not a new mechanism |

Openings that write state sent whole are **not used by the pilot** and need their own approval item with a sync note: capture-log targets (`se_captures`, `__capture_log_seen`, both sent whole on each new capture), cloned cards (the cloner's `saved_cards`, sent whole in every inventory echo), footholds, lockouts and worn disguises. A later mission that adds one is capped at 2 capture targets, 1 clonable card and 1 foothold, and its plan states the bytes each adds to those whole-sent records. The pilot's openings are limited to workstation, print and left-behind slots, which use only the rows above.

The worst case at these caps is 64 small keys (workstation 24, frustration 6, workaround and `onUse` globals 8, `heard_` 8, servings 2, reveals 6, `onceOnly` 10) and about 3 KB of server records. None of it grows with play time: each piece has a fixed authored ceiling, and each change sends one key. The workstation globals change most often, but each change is one boolean. Before every task-completion and skip POST the client now flushes pending globals (`ObjectivesManager.flushPendingGlobals()`, two delta-only `stateSync.sync()` calls), so an optional office-life task sends its changed globals a little earlier; that is the same delta, not new traffic. A plan that needs more than a cap must say why, and the reviewer checks the sums against V8.

## 8. Field names and the format hardening steps

Scenario-format hardening step 8a (format 1, `offWhen` everywhere) is built. Step 8b is being built in another session (branch `build/hard-8b`, with its build plan re-anchored on 2026-11-13). Step 8c is planned. Both are specified in `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`.

| Today (format 1) | After 8b (format 2) | After 8c (format 3) |
|---|---|---|
| `screenOwner` on a workstation | `owner` | `owner` |
| `phoneOwner` on a desk phone | `owner`, plus `deskPhone: true` | same |
| `affordance.owners` | `owner` (a list on a private object) | same |
| `affordance.private` | object-level `private` | same |
| `phoneOf` on an item | `owner` | same |
| `leftBehindBy` (with optional `leftBehindChance`) | `owner`, with `leftBehindChance` required | same |
| `needsHome` implies an owner | `needsHome` no longer implies one; write `owner` | same |
| `screenHabit`, `printHabit`, `usbHabit` | unchanged | `habits.screen`, `habits.print`, `habits.usb` |

The schema is closed. Each step swaps the old key for the new one in the same commit, so the validator and loader accept only one set of names at any time. The template rewrite tool (`tools/format/rewrite_templates.rb --step <version>`) arrives with 8b and edits template text from the step's own transform. 8b's scope is the templates on main when it is built, so a mission still on its branch is not in it.

The rule:

1. Stages 0 to 3 (analyse, design, approvals) do not depend on field names. Plans name fields by meaning (owner, private, screen habit), and `references/field-map.md` gives the exact key.
2. Stage 4 writes the names of `FormatUpgrade.current` at that moment. If only 8b has merged, ownership uses format 2 names and habits keep today's names.
3. When the branch rebases over 8b or 8c, the implementer runs `rewrite_templates.rb` for that step on the branch if the tool exists and handles the ERB template. Otherwise the few renamed keys (about 2 to 6 in a pilot) are edited by hand and proved the way the step proves its own corpus: the step's `scenario` transform applied to the old render equals the new render. Either way the implementer re-runs the validator and V9, and logs the diff as mechanical. A key rename changes no spoken text and so re-keys no audio, and it needs no new dialogue review.
4. No renamable key is placed inside an ERB loop or tag, so the rewrite maps each one to a single span.
5. The branch also rebases over the other hardening steps that touch the pilot while it is open (step 3's clue markers where they touch the mission, and steps 6a and 6b, which mark NPC fields client-visible or server-only), re-running the validator and V9 each time. Steps 6a and 6b belong to the hardening session; before the pilot's stage 4, the orchestrator asks that session to confirm its 6a-1 client-visible list includes NPC `needs`, `chatter` and `exchanges`, which the client reads.
6. When 8b and 8c land, `references/patterns.md` and `references/field-map.md` are regenerated from the rewritten showcase scenarios, and the office-life validator's name table gains the new rows.

The user chose this route on 2026-11-14: build on today's names and rename on rebase. Holding stage 4 until both steps merge was rejected because 8c has no date.

Ownership is always written explicitly (an owner on every owned workstation, desk phone and private object), never left to `needsHome`. That keeps the 8b warning "needsHome no longer sets an owner" from firing.

## 9. Engine gaps

The pilot needs **no runtime engine change**, so it adds nothing that would by itself require fresh end-to-end playtests of m01, sis01 and sis02. The items below are probes, tooling, or later work. Every runtime or shared-data change goes to the user for approval and comes with unit tests, a focused test scenario and live proof.

| Id | Gap | Needed by | Proposal |
|---|---|---|---|
| E1 | Unproved live: a needs NPC attacked mid-walk outside its post room, and one knocked out there. Does it chase, calm down and walk back? Do `globalVarOnKO`, `taskOnKO` and the KO item drops fire once? Is a knocked-out NPC's job dropped cleanly? Also one NPC with `behavior.hostile` from the start. It also covers protection 3: an NPC in another room when the preceding event fires walks back and the beat opens. The server accepts a defeated NPC's drop outside its scenario room only once the defeat is recorded, so the probe includes an NPC holding an item, knocked out outside its post room, then a reload: the item must drop once, where the NPC fell, and the NPC must stay down. | every mission without `disableAttacks` | A live probe in a small `test_needs_attack` scenario, run **before the pilot's design closes**, because the result decides which NPCs may move. If it fails, those NPCs keep needs inside their own room only, and the fix goes to the user as an engine item. |
| E2 | No vending preset (the sprites exist) and no toilet. | optional, all missions | A vending entry in `office-presets.json` (hunger and thirst, a short use, a coin sound). Only test scenarios set `officePresets` today, so it changes no deployed game, but it is shared data and an approval item. It lands straight after the pilot, as its own item (the user's decision). Toilets: not planned. |
| E3 | Performance with more than 6 needs NPCs is unmeasured. The 6-NPC showcase has a mean tick of 0.19 ms. | m05, m08, any Tier 3 | Measure frame time with all of the pilot's needs NPCs active, at normal frame rate, before review. Measure first for any mission that would have more than 8. |
| E4 | Lazy room loading: a kitchen behind an unopened door is never used. | all | A design rule, not engine work. Need targets sit in rooms that load with the NPC's own room, or the plan accepts that the kitchen comes alive once the player opens it. |
| E5 | No guarantee that an NPC is at its post for a beat. | all with story NPCs | A design rule plus V2: the three protections in section 2. A "summon to post" helper is backlog only. |

## 10. Voicing

The user decided on 2026-11-14 that each mission is voiced after its reviews and playtests close, and then merged. The pilot counts as a proper office-life scenario.

- **During development**, the branch lives in its own worktree, and every stage 5 and stage 6 run uses a keyless server started from that worktree on a port in the running session's own range (3002 if the session has no range):

  ```
  env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<main repo>/vendor/bundle \
    bundle exec rails server -b 127.0.0.1 -p <port>
  ```

  Games are created with `bundle exec rails runner tools/playtest/new-game.rb` from the worktree (a worktree has no `.bundle/config`; `PLAYTEST_PORT` only changes the printed URL). The suite runner assumes :3001, which serves the main checkout, so the branch's regression playtests are driven by hand. No audio is generated, and new lines show as text and speech bubbles. The worktree shares the development database (AGENTS.md, "The dev database is shared"): seeding is allowed, and `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop` and `db:setup` are never run. Only the batch-tip checks after the merge run on :3001. Nobody plays a pass branch on :3000 or any other keyed server, which would generate clips on first play. If that happens anyway, `tts:wasted` and the tts-audio pruning step clear the stray clips before commit.
- **Voice before merge.** Missions ship together in the gem, and releases are cut as branches from main. Reverting one mission's commits from a release branch would conflict with later work, so office-life content reaches main only once it is voiced. Voicing runs straight after the reviews and playtests close, so a branch waits days, not weeks.
- **Merge rule.** One integrator session moves main for every work stream. The pass hands the voiced `build/office-life-<m>` branch to the integrator with its check list, and it goes into the current merge batch like any other build branch. The mission's own checks run on the batch tip next to the full suites (`bin/rails test`, `bin/test-js -j 3`): the validator, the route suite, V9, V6 (0 uncached office-life clips) and a short Haiku regression playtest. The integrator fast-forwards main to exactly the hash those runs used. A voice-style change on main re-keys clips, so V6 runs on every batch tip that carries the mission.
- **Safety net.** The bump-version skill gains a step: run V6 for each mission that has a `scenarios/<m>/office_life/` folder and stop on any uncached clip key that is not in that mission's stage 0 baseline list. Older unvoiced lines (most of m08, for example) are in the baseline and never stop a release. The step is added through the integrator when the first office-life mission merges, not before, because the release session uses bump-version (section 13).
- m02 is not one of the scenarios served to students, which limits the harm if anything slips past. m01 is, so its voicing and gate playtests both finish before it merges.
- **At sign-off:**
  1. V6 lists every new clip per voice, with characters and cached state.
  2. The tts-audio skill prices the batch, and the user approves the spend.
  3. The pass sets `"ttsPregenerateChatter": true` for the mission so the batch includes chatter pools. Exchange and call knots are ordinary ink lines and are included already.
  4. The batch is generated, a sample is checked by ear, then it is pruned and committed as tts-audio says.
- **When:** last, after the mission's dialogue review and playtests have closed, never part-way.
- **Design rules for lines:**
  - no printed variables;
  - 40 characters at most for chatter;
  - exchanges heard once;
  - about 4 to 8 lines per topic per NPC, with `chatterCooldownMin` at its default of 5 minutes or more, so a line rarely repeats in a session;
  - no change to existing voiced lines without listing it.
- **Budget guide per mission, in clips:**
  - Tier 1: about 20 to 40 clips;
  - Tier 2: about 40 to 80;
  - Tier 3: about 80 to 140.

  Campaign missions use **NPC-own chatter pools only**, with no scenario-level `chatter`. The line extractor voices every shared pool line for every voiced room NPC (in m02, every voiced person record in a room, briefing and debrief records included), and the waste report treats those clips as expected, so shared pools would voice lines nobody speaks. If shared pools are wanted later, narrowing the extractor to NPCs with needs or chatter is an engine item for approval. V6 gives the exact figure.

## 11. Art, voice and approval costs

Each mission plan carries a costs table:

| Cost | Source | Typical per mission | Who approves |
|---|---|---|---|
| Kitchen and office props | The object catalogue first. Coffee station, fridge, microwave, cooler, kettle, copier, desk phone and vending sprites exist. | 0 new images for Tier 1 and 2 | none, if taken from the catalogue |
| New props | PixelLab map objects at the target size, one at a time, never downscaled | 0 to 3 | user (image generation) |
| Changed room | re-dress, lighting check, and a POV background redo if the room has a `chatBackground` | 1 to 3 rooms; each POV image is one Gemini concept (free through agy) plus one PixelLab conversion, and a split background has two images | user, for the PixelLab conversion |
| New room | Tiled map from the existing room set, dressing, lighting; a POV background only if someone can be talked to there | 0 or 1 | user |
| New NPC | concept through agy (free), then the PixelLab pipeline: bust, visemes from a talk run, 8-direction walk with the standard animations, seated frames if they sit | 0 to 2 | user (cast and image generation) |
| Voice | Gemini TTS through tts-audio, priced in clips by V6 | section 10 ranges | user |
| Engine or shared data | section 9 | none for the pilot | user |
| Review and playtest time | section 12 | 3 to 5 plan rounds, 2 to 5 implementation-review rounds, 2 to 5 design-review rounds, about 5 dialogue cycles, up to 3 playtest rounds | orchestrator |

All of a mission's approvals go to the user on one review page in stage 3, with the plan's recommendation marked for each.

## 12. Review loop for each mission

Round rules, from the standing rules for built missions:

- **Plan review** runs 3 to 5 rounds and stops at a round with 0 blockers and 0 majors after round 3. This is stricter than the AGENTS.md minimum of 2, because the plan changes finished missions.
- **Built-mission phases** (implementation review, scenario design, dialogue) follow AGENTS.md: at least 2 rounds and at most 5, stopping after round 2 or later once a round finds no blockers or majors. Dialogue aims for about five cycles, as a design-heavy stage.
- **Room dressing and lighting** (stage 4, slice 5) are design-heavy: about five cycles each, up to ten while they keep improving, stopping when a cycle finds nothing above minor.

Each round is a fresh read-only Opus reviewer, with findings tagged blocker, major or minor and cited by file:line. A resumed fixer acts on them: Sonnet for mechanical findings, Opus for findings that need a design call. Every finding gets an outcome: fixed, withdrawn with the reason, or deferred with the reason.

1. **Plan review.** Each reviewer checks:
   - the expected lock and key diff and the aim chain;
   - that no opening became required;
   - V2 and V5 risks;
   - each NPC's class and what an attack mid-walk would do;
   - social compatibility and leashes;
   - the spoken-line rules;
   - the sync sums;
   - the field names;
   - cast diversity.

   The plan is rewritten as a standalone document after each round.
2. **Implementation review** against the approved PLAN.md. The reviewer checks that the build matches the people table, the leashes and privacy, the rooms and objects, the levers and openings, the spoken-line table, the sync budget (V8), the field names, and the test plan's expected lock and key diff (V9).
3. **scenario-design-review** of the built mission. The reviewer also confirms:
   - the walkthrough and the aim chain;
   - that each opening teaches what the plan says;
   - that "does the player always know what to do next?" still holds with NPCs moving.
4. **npc-dialog-review** of the new pools and knots. On the pilot, a short sample (a few chatter lines and one exchange) goes to the user before the dialogue cycles continue, as AGENTS.md's calibration step asks. It checks:
   - the voice against the spy-thriller aim;
   - social compatibility in each exchange;
   - that no exchange leaks or contradicts a clue;
   - the 40-character rule;
   - repetition (V7).
5. **Playtests** (playtest-scenario), on the branch worktree's keyless server (section 10). The campaign missions need VM flags, so each run seeds them: `new-game.rb` prints the game's FLAGS_XML, which goes to `tools/playtest/session-start.sh --flags <path>`, and each report gives `verify-run.rb`'s split of seeded flags against secrets earned in the game. Real-VM playtests run in another environment and are not queued from here.
   - A Haiku regression run of the mission's existing walkthrough with office life on. Every step must pass, and nothing mapped to NPC position may fire early or twice.
   - A Sonnet persona run of 10 to 15 minutes. It uses the levers (cake, desk phone, breaker), watches the office day, tries each opening, attacks one moving NPC, and reloads once mid-mission.
   - A check through the `window.__test.needs` bridge that posts, leashes and privacy hold.
   - A frame-time reading (E3).
   - Where the mission sets `roomTone`, a listen through a north or south door as well as an east or west one.

   At most 3 rounds, then a short confirmation run. A run counts only when `tools/playtest/verify-run.rb` shows progress. Any Haiku "stuck" claim is checked by a Sonnet run before it counts. The blind playtest that ends AGENTS.md's phase 5 waits for the lab-sheet update, which the user has written last.
6. **Art follow-ups** (stage 6) and their closing check, then **voice** (stage 7), then **close and merge** (stage 8).

## 13. Building the skill itself

1. Write `.claude/skills/mission-office-life/SKILL.md` and the four reference files from this plan. An Opus writer does this, followed by one review round by a fresh Opus reviewer against the showcase scenarios.
2. Build the tooling: V9 (the lock and key diff), V6 (the voice report task), and `scripts/validate_office_life.rb` with V1 to V5, V7 and V8 and the campaign-mission scope for V2, V4 and V5, all with fixture tests. After committing, run `bin/test-js -j 3` and the validator tests in full, since the labs and test scenarios must stay at 0 errors; any fix is a follow-up commit. Write the V6 stop for the bump-version skill, to be added through the integrator with the first office-life merge (section 10), and add a short office-life section to the tts-audio skill (V6, `ttsPregenerateChatter: true`, voice before merge, the branch worktree's keyless server for drafts), whose current note says chatter is generated on first play. A Sonnet implementer works from a short spec, followed by one Opus code review.
3. Run the E1 probe.
4. Run the pilot's stages 0 to 3 on m02.
5. Run the pilot's stages 4 to 8.
6. When 8b and 8c land, regenerate `patterns.md` and `field-map.md` and extend the office-life validator's name table.
7. Revise the skill from the pilot's log, then continue the rollout (section 6).

## 14. Decisions taken and what waits on the user

The user's decisions of 2026-11-14, which this plan follows:

1. **Pilot:** m02 ransomed_trust (section 6). m06 is the second mission.
2. **m01:** in its normal rollout slot (section 6.11), with the m01, sis01 and sis02 gate playtests run again when it lands.
3. **Format steps 8b and 8c:** build on the names current at the time and rename on rebase (section 8).
4. **Voicing:** each mission is voiced after its reviews and playtests, then merged (section 10).
5. **New rooms and NPCs:** Tier 3 is allowed, and each new room or NPC needs the user's approval on the mission's review page.
6. **Openings:** optional content only. A bypass of a required lock is not offered.
7. **Vending preset (E2):** added straight after the pilot as its own item.
8. **m09 and m10:** analysis only, Tier 0 expected.

Also: no production release until office life has settled across the rollout.

Waiting on the user, through m02's stage 3 review page (section 6.10): the new ambient NPC for the Night Handover room (role, cast, name, art), her voice style, and the voicing spend.

## Appendix: handover

State on 2026-11-14: plan only, nothing built. The pilot is m02. The plan was checked against the engine and m02's files after merging main that day: format step 8a is the only step in `FormatUpgrade::STEPS`, so stage 4 writes format 1 names; the conclude-race fix (pending globals flushed before task-completion and skip POSTs) is noted in section 7.

Requests to other sessions: the integrator adds the V6 release stop with the first office-life merge (section 10), and the hardening session confirms its 6a-1 client-visible list covers NPC `needs`, `chatter` and `exchanges` (section 8).

The next step is section 13 in order: write the skill, build the tooling with the V5 event list in section 4, run E1, then m02's stages 0 to 3, whose review page carries the approval items in section 6.10.
