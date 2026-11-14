# Office life in the campaign missions: plan for a reusable skill

Status: plan only, nothing built. Written 2026-11-13; draft 15 of 2026-11-14 follows the user's decisions of that day (section 14), including the m02 picks. The pilot is m02 ransomed_trust. One engine item, E7 to E9 (section 9.1), is approved and lands before the pilot's stage 4.

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
6. **Voiceable speech.** Every spoken line lives in a scenario file: NPC `chatter` pools, scenario-level `chatter` pools, eventMapping `bark` fields or ink. In the campaign passes, office-life lines go only where the batch voices them (section 10). Nothing is spoken from engine text. Chatter lines are one line, 40 characters at most, with no `{ }` variables and no speaker prefix. Exchanges are heard once.
7. **Cast.** A new NPC brings variety in ethnicity and age to that mission's cast, and the concept prompt says what was chosen. A recurring named character uses their own sprite key, never a generic one.
8. **Props are square to the walls**, with one or two angled props per room at most, placed through the mission-room-dressing rules.
9. **Sync stays small.** No new state grows in player_state. Each new piece is a bounded value sent as a per-key delta (section 7).
10. **Students' missions are protected.** Four scenarios are deployed to students on Hacktivity: m01, sis01, sis02 and lab_social_engineering (`docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md:27`). sis01, sis02 and lab_social_engineering are not campaign missions and are out of scope. m01 takes its normal place in the rollout (section 6); when its office-life work lands, the m01, sis01 and sis02 gate playtests are run again before any release carries it. There is no production release until office life has settled across the rollout (the user's rule, 2026-11-14). A mission's office-life work stays on its own branch until it is reviewed and voiced, and no release carries unvoiced office-life lines (section 10).

## 2. What the engine offers today

Everything below is built and merged. Field names are format 3 names (section 8). The author references are:

- `docs/achitechture/NPC_NEEDS_SYSTEM.md`, sections 3 and 5;
- the slice sections of `docs/achitechture/OFFICE_LIFE_PLAN.md`, and its section 12.11, written for this skill;
- `README_scenario_design.md` for access, work needs, workarounds and feeds;
- `scripts/scenario-schema.json` for every field.

| Area | Fields and events | Showcase |
|---|---|---|
| Needs and posts | `needs.<name>{decayPerMin, urgentAt, initial, weight, maxUnmetMin, jitterPct, deferrable}`, `needsHome`, `needsSpeed`, `interests`, `onUse` | test_needs_sims |
| Presets | scenario `officePresets: true`; `office-presets.json` gives a default `affordance` for desk PCs, coffee, kettle, cooler, fridge, microwave, sofa, copier, shredder, filing, post tray, desk phone. A preset matches an exact sprite type (`kettle1`, `water_cooler1`, `photocopier1` and so on); any other type takes one through `officeType` (a hot-water boiler as `kettle`, an undercounter fridge as `fridge`). Takeable objects, objects with a `lockType`, objects with no id and `decor: true` never gain one (`public/break_escape/js/systems/office-presets.js`). | test_needs_sims |
| Leash and privacy | `needsRooms`, `needsAvoidRooms`, room `needsPrivateTo`, object `private` and `owner` | test_needs_leash |
| Social | `needsCompany{groups, avoids, avoidRadius}`, `maxQueue`, `needsDeferMin` | test_needs_sims, lab_physical_pentest |
| Talk | NPC and scenario `chatter` pools, `chattiness`, `chatterCooldownMin`, `exchanges[{with, knot, requireGlobal}]`, `answersPhones`, `phoneCalls` | test_needs_sims |
| Levers | magnet items (`affordance.magnet`, the cake), `offWhen` outages with switch objects, `desk_phone_ring:<id>`, droppable items with `interests` | test_needs_sims, test_access_work |
| Workstation habits | `habits.screen`, `habits.print`, `habits.usb`, `workstation`, `lockChance`, `autoLockSeconds`, workstation `owner`, left-behind item `owner` with `leftBehindChance`, `outputOf`, `revealOnGlobal` | test_needs_sims, test_access_social |
| Awareness | `awareness` low, medium or high; `habits.{locksScreen, writesDown, password, passwordPattern, holdsDoors}` | test_access_habits |
| Work and frustration | top-level `roles`, `resources{kind, access, object, offWhen}`, NPC `workNeeds`, `frustration`, `workarounds` (`writes_down`, `prop_door`, `emit`, `borrow_session`, `share_login`) | test_access_work, lab_physical_pentest (Kieran Doyle's wedged door) |
| Friendface | `feed{site, person, posts}`, reactive posts, replies, reactions, the phone item with an `owner` | test_access_social |
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
- **Talk needs a pair.** Chatter and exchanges play only between two compatible NPCs using the same capacity-2 chatter object at once (`npc-needs.js` `_maybePair`; `NPC_NEEDS_SYSTEM.md` 5.6: "A lone NPC at a chatter object says nothing"). A need goes to the NPC's own post object if that satisfies it, else to the nearest reachable free source, so two NPCs posted in different rooms rarely meet. `grumble` (or a `grumble_<reason>` pool) is spoken only on a turn-back: avoid, queue, `off`, `gone`, or a printer that is off (`grumble_printer_off`); `greet` only at an affordance with `chatter: "greet"`. A plan that wants talk posts two NPCs where they share a chatter object, and can make their breaks coincide with a mapping on `npc_use_started:<object>` (payload `npcId`, `objectId`, `need`) with a condition on the partner's id, which sets the other's matching need low through the `needs: { set: {...} }` command. `npc_left_post` is not used for this: it fires only when an NPC leaves from its post, so a break that follows another break, or a leave while the NPC is still walking home, brings no partner. Two engine facts shape every pair: a pool line is taken, and the speaker's `chatterCooldownMin` started, at pairing whether or not anyone can hear it (`_pickBark`; only an exchange waits for the player to be in earshot), and the second user's cell (`besideCell`: right, left, below, above the first user's cell) is checked for being walkable but not for being reachable (the first user's object is route-checked when it is chosen, in `reachable()`), so a chatter object against a wall can leave the partner walking until its 20 s timeout. An exchange starts when either of the pair is in earshot, but it counts as heard once it runs to its end even if the player heard none of it (`_finishExchange`), so an exchange gated on another's `heard_` global can follow news the player never heard. A desk-phone call is the one voiced beat a single needs NPC can carry. The engine item E7 to E9 (section 9.1), approved and scheduled before the pilot's stage 4, changes three of these facts: a pool line is then taken, and the cooldown started, only when the player can hear the speaker; the second user's cell must be reachable from the partner, or the partner's job fails at once instead of walking to its timeout; and an exchange starts only when its first speaker is in earshot and counts as heard only when the player heard at least one line.
- **Staying put while taking part.** A `use` of the NPC's own `needsHome` object is not a leave: no walk, no `npc_left_post`, a seated NPC stays seated (`NPC_NEEDS_SYSTEM.md` 5.3, at-post jobs; `npc-needs.js` does not move an at-post job whatever the distance to the object). The 12 px home tolerance (`HOME_EPS`) matters only when the NPC is sent home: a `resume` command, or the walk back after hostility. An NPC whose every need is met by its own post object therefore never moves, yet it is registered with the needs system and can print through the `needs: { print: ... }` command, which reveals a slot on the copier at once with no walk (`npc-needs.js` `control`). A command print with `forget: true` is never fetched. The command needs a registered NPC: on an NPC with no `needs` it does nothing.
- **Office-life events depend on timing.** These include `npc_exchange_heard`, `npc_chatted`, `desk_phone_answered`, `workstation_screen_changed`, `npc_left_post`, `object_revealed` and `magnet_placed`. They may complete optional tasks only.

## 3. The skill: `mission-office-life`

Layout: `.claude/skills/mission-office-life/SKILL.md` (frontmatter `name` and `description`, like the other mission skills) with a `references/` folder:

- `references/field-map.md`: the format 3 field names beside the retired names they replaced (section 8), so an author reading an older note or showcase comment can map it.
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

- Planning, review and dialogue writing go to the planning and review tier.
- Mechanical implementation from an approved plan goes to the implementation tier.
- Scripted regression playtests go to the scripted-playtest tier, and any "stuck" it reports is checked by a persona-tier run before it counts.
- Physical-pentest openings and any text naming security techniques go to the agent type AGENTS.md names for VM and technical material. AGENTS.md routes SecGen and VM steps there; this text goes there too because the orchestrator's model also over-flags social engineering and intrusion wording. If a safety classifier stops that agent, follow AGENTS.md's stop procedure.
- Every multi-step brief carries the handover rule: at about 150k tokens or 80 tool calls, finish the step, commit, write a handover note, report and stop.

### Stage 0: preconditions and baseline

Inputs: the mission name.

Checks:

- the mission kind, from AGENTS.md "Kinds of game" (campaign missions only; any other kind needs the user's say-so);
- whether the mission is one students play (m01): if so, the pass records that the m01, sis01 and sis02 gate playtests must run again before any release carries it;
- whether the mission needs VM flags (m01 to m10 do): every browser run in stages 5 and 6 seeds them, as section 12 describes;
- the format version (`FormatUpgrade.current`, 3 when this plan was written); if a later step has landed, its renames are added to `field-map.md` before stage 2;
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

An analyst on the planning tier reads the scenario, its ink, the dungeon graph, the walkthrough and the mission's logs, and fills in `fit-checklist.md`:

- **Rooms.** Each room's type and whether it is office-like. Any kitchen, break room, coffee point, cooler, vending, printer or toilet. Which rooms load together. Spare space for a kitchenette. Which rooms have a `chatBackground`.
- **NPCs, classified one by one:**
  - story-critical: holds a required task, a conversation the critical path needs, a key or card source, or a cutscene role;
  - suspect or plot-located: the deduction relies on where they are;
  - fixed by the text: a narrator line, ink or note says where they are or that they have not moved (m02's observation text says Sister Doyle has not left bed two since three o'clock);
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

A planner on the planning tier writes `scenarios/<m>/office_life/PLAN.md` from the analysis. Its sections, in order:

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

Then 3 to 5 adversarial review rounds by fresh reviewers on the planning tier (section 12). After each round the planner rewrites the plan as a standalone document.

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

Work happens on a branch, `build/office-life-<m>`. An implementer on the implementation tier works from the approved plan in slices, one commit per slice, with explicit paths. A writer on the planning tier handles the exchange and phone-call knots. Slice 4 (levers and physical-pentest openings), both its text and its wiring, goes to the agent type AGENTS.md names for VM and technical material, because the implementation tier also trips the safety classifier on that work. The slices, in order:

1. New rooms and objects, then presets, needs, posts, leashes and privacy. Tiled decor that should take part (a coffee point or copier drawn into the map) is declared as a scenario object so it can carry a preset. An undeclared decor sprite is hidden when another sprite with the same image is claimed, so every same-image twin in the room is declared too, or given a distinct variant. Preset queue cells and `useFrom` approach cells are checked against neighbouring objects and walls, and hand-written where they clash (`queue.cells`, `"queue": false`, or `useFrom`). At every capacity-2 chatter object, the second user's cell is checked live for a path from each partner's post. With E8 the engine route-checks that cell itself, so a cut-off cell shows as an `npc_job_failed` with reason `no_beside_cell` rather than a 20 s walk; the live check still confirms that both partners end up `using` the object together.
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

After any art change, a closing check runs on the final commit: the validator, the `--office-summary` diff, the lock and key diff, and a short scripted regression playtest.

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
| V6 | `bin/rails "app:break_escape:tts:office_lines[<mission>]"` (the same form as the existing `tts:wasted` task, whose usage text is `bundle exec rake app:break_escape:tts:wasted[...]`), a rake task in the existing `break_escape:tts` namespace beside `tts:wasted`, run keyless against the development database (it reads only; no database setup or migration commands from a worktree) that uses `TtsLineExtractor` with `chatter: true`. It lists every chatter, exchange and call clip **per voice** (eventMapping barks are outside the extractor; section 10). The extractor yields a shared pool line once for every voiced NPC, so V6 first reduces its yields to distinct cache keys (voice and text), then groups them by voice, marks each as cached or uncached under the current cache key, and totals characters and clips. The stage 2 price and the merge gate's "0 uncached office-life clips" both count distinct keys. | report task | Prices the voice cost in stage 2 and drives stage 7. It has to live in Rails, because the cache key and line extractor do. |
| V7 | A chatter pool line that repeats another pool line or an existing bark word for word, or matches the first line of the same NPC's ink opener. | warning | npc-dialog-review's "same fact twice" rule, made mechanical. |
| V8 | Sync budget: counts, by kind, every piece in section 7 that the scenario can write, and prints each kind's total and the sum. Warns when a kind passes its cap. | info, warning above a cap | Keeps the sync size rule visible. |
| V9 | `scripts/lock_key_diff.rb <baseline>`: reads the lock nodes, key edges and `optional` flags from the JSON that `generate_dungeon_graph.rb` writes, and adds from the rendered scenario a hash of each lock's requirement, the `gate`s, `access` lists, `wearable`s, task and objective triggers, and the aim chain. It diffs the result against the stage 0 baseline and flags any new door or gate whose far side holds a required task or a critical-path lock. The committed `dungeon_graph.json` can be stale, so V9 runs `generate_dungeon_graph.rb` itself first and refuses a JSON older than the rendered scenario. | report tool | Rule 2. V9 consumes the graph's output rather than sharing its code, so a change to the graph's JSON format needs a matching change in V9; a fixture test pins the fields V9 reads. |
| V10 | A chatter pool, exchange or call that nothing in the scenario can trigger. `coffee`, `cooler` and any other chatter-object topic need a capacity-2 object with that `chatter` value that this NPC can use and a compatible partner who can use the same object; `grumble` and `grumble_<reason>` need a turn-back the NPC can meet (an avoid, a queue, an `offWhen` outage, a magnet that runs out, a printer that can be off); `greet` needs an affordance with `chatter: "greet"`; an exchange needs both speakers able to share one chatter object; a `phoneCalls` knot needs a phone this NPC owns or answers, and a mapping that rings it. | warning | A lone NPC at a chatter object says nothing, so an untriggerable pool is voiced and paid for and never heard. V6 marks these clips. V10 is static: whether the second user's cell can be reached is a live stage 4 check. |

**V5's event entries.** Generated on 2026-11-14 from the names the engine emits: every string or template literal under `public/break_escape/js/` that begins with an office-life stem, each checked at its emit site. A name listed here that nothing emits is not kept.

- Stems (match by prefix), with the emitted names each covers today:
  - `npc_print_`: `npc_print_blocked`, `npc_print_fetched`, `npc_print_gone`, `npc_print_uncollected` (`npc-needs.js`);
  - `npc_need_`: `npc_need_parked`, `npc_need_urgent`;
  - `npc_visit_`: `npc_visit_arrived`, `npc_visit_done`, `npc_visit_dropped`;
  - `npc_usb_`: `npc_usb_copied`, `npc_usb_refused`;
  - `npc_use_`: `npc_use_started`, `npc_use_failed`, `npc_use_refused` (`npc-needs.js`), `npc_use_heard` (`npc-office-visuals.js`);
  - `npc_borrow_`: `npc_borrow_done`, `npc_borrow_dropped` (`npc-workarounds.js`);
  - `workstation_`: `workstation_accessed`, `workstation_auto_locked`, `workstation_locked_attempt`, `workstation_owner_left`, `workstation_owner_returned`, `workstation_screen_changed` (`workstation-state.js`), `workstation_lock_heard` (`npc-office-visuals.js`);
  - `desk_phone_`: `desk_phone_ring` (the input a mapping emits), `desk_phone_ringing`, `desk_phone_answered`, `desk_phone_unanswered`, `desk_phone_hung_up`, `desk_phone_ring_heard`;
  - `magnet_`: `magnet_placed`, `magnet_unreachable`, `magnet_serving`, `magnet_finished` (and the decision-log keys `magnet_seen`, `magnet_left`, `magnet_gone`, which the stem also covers harmlessly);
  - `room_tone_`: `room_tone_started` (`office-room-tone.js`).
- Names (match exactly, alone or before `:`): `npc_action_windup`, `npc_announced`, `npc_avoided`, `npc_borrowed_session` (`npc-needs.js`, `pc-sessions.js`, `workstation-state.js`), `npc_call_heard`, `npc_caught_at_post`, `npc_chatted`, `npc_checked`, `npc_exchange_heard`, `npc_fetching_chair`, `npc_frustration_changed`, `npc_guest_left`, `npc_job_failed`, `npc_left_item_gone`, `npc_left_post`, `npc_locked_out`, `npc_mutter`, `npc_needs_leashed`, `npc_overheard`, `npc_overheard_login` (`npc-workarounds.js`), `npc_picked_up`, `npc_placed`, `npc_posted` (`social-feed.js`, `friendface-phone.js`, the OSINT browser minigame) and `npc_reacted` (`social-feed.js`, the OSINT browser minigame), `npc_queued`, `npc_returned_post`, `npc_sat`, `npc_sat_at`, `npc_saw_magnet`, `npc_stood`, `npc_swivelled`, `npc_told`, `npc_turned_back`, `npc_used`, `npc_used_phone` (`npc-needs.js`, `social-feed.js`), `npc_workaround`, `npc_workaround_due` (`npc-workarounds.js`), `object_revealed`, `door_propped`, and `item_dropped` (`item-drop.js`, `npc-needs.js`, the lever a magnet or tagged item reads). V5 cannot see whether a dropped item carries an `interests` tag, so any `item_dropped` trigger on required content is an error.
- Exclusions (events that are not office life), each with its reason: `npc_ko`, `npc_attacked`, `npc_became_hostile`, `npc_hostile_changed`, `npc_hostile_state_changed` (combat and KO); `npc_influence_changed`, `npc_items_changed`, `npc_reported` (story and conversation state); `npc_arrived` (scripted arrivals; V3 covers the needs case); `npc_used_object` and `npc_used_object_done` (the scripted patrol route's `useObject` step in `npc-behavior.js`). Because `npc_used` matches only itself or `npc_used:`, it does not catch these two, and because `npc_use_` needs the underscore at that place, it does not catch `npc_used_phone`, which is listed by name.
- Ignore list (literals with an office-life stem that are not event names), each with its file: `npc_name` (`npc-barks.js`, phone and person chat: an ink variable), `npc_location` (phone and person chat: an ink function), `npc_inventory` (`npc-game-bridge.js`: an object type), `npc_container_` and `npc_gift_` (`npc-game-bridge.js`: object id prefixes), `npc_story_state_` (`npc-manager.js`: a storage key), `npc_frustration request timed out` (`npc-reports.js`: an error message, listed verbatim because the collector keeps the whole literal), `npc_defeated` and `npc_hostile_system` (`npc-hostile.js`: source-type labels on a drop and a global write). With the `item_` stem collected, the other `item_` literals in today's tree are classified too: exclusions (story and inventory events) `item_picked_up` (`inventory.js`, `interactions.js`, `container-minigame.js`, `npc-game-bridge.js`, `objectives-manager.js`) and `item_unlocked` (`objectives-manager.js`, `interactions.js`, `unlock-system.js`, the ESD push-button), `item_consumed` (`consumables.js`), `item_removed_from_scene` (`consumables.js`, `interactions.js`, `inventory.js`, `notes-minigame.js`); ignore list `item_gone` (`npc-needs.js`, a job-abort reason), `item_interact`, `item_interact_1`, `item_interact_2`, `item_interact_3` (`sound-manager.js`, sound keys). `item_dropped` is the only `item_` name that counts as office life. The list is about ten entries, not "short", and each entry names its file.

A fixture test keeps the lists honest, and it is the source of truth: it is run once against the tree before the pilot's stage 4, and every hit is classified before the lists are fixed. It collects **every string or template literal in the `*.js` files under `public/break_escape/js/` that begins with an office-life stem** (`npc_`, `workstation_`, `desk_phone_`, `magnet_`, `room_tone_`, `object_revealed`, `door_propped`, `item_`), skipping backups such as the committed `npc-behavior.js.bak`, whatever call it sits in, so a name handed to a helper (`_emitRouteUse('npc_used_object', …)`) is seen as well as the direct emit forms. It strips a template's `${…}` tail at the first `:`, then requires each name to match an entry by the rule above, be an exclusion, or be on the ignore list. It also fails on an entry that no literal matches, so a phantom name cannot sit in the list. A new engine event therefore fails the test until someone decides which list it belongs on.

All ten are built before the pilot's stage 4. Each gets fixture tests under `test/` and a line in `README_scenario_design.md`.

**Scope of V2, V4 and V5.** These protect campaign beats, so they run only for the ten campaign missions, named in one constant in `validate_office_life.rb`. The validator takes a `--campaign` flag that adds the scenario being checked to that set for one run. `validate_scenario.rb` parses its options in `main`, so the flag exists only when the script is spawned: V5's positive fixtures (for example, a synthetic scenario whose required task is keyed on `npc_used:x` must give an error) spawn the validator with `--campaign`, the lab and test-scenario fixtures spawn it without, and `run_validation` passes the extra campaign id through `options` to the office-life entry point. Tests that `require` the validator and call its internals never see the flag and are not used for V5. The constant lists m01 to m10. AGENTS.md "Kinds of game" still names the campaign as m01 to m08; that wording is stale and the integrator has confirmed the constant's m01 to m10 (m09 and m10 get analysis only). Elsewhere the opposite pattern is intended: `lab_physical_pentest` completes its required `usb_foothold` task from `npc_used:usb_target_pc`, `test_needs_sims` completes `see_coffee` and `see_meal` from `npc_used:*`, and `validate_access_work.rb` tells lab authors to gate on the `npc_workaround` event rather than its global. Two node tests (`npc-needs-slots.test.mjs`, `npc-left-behind.test.mjs`) already require `test_needs_sims` to validate with 0 errors. Fixture tests assert that:

- V5 reports 0 errors on m01 to m10 as they stand, so its event list cannot catch existing combat and KO mappings;
- V2, V4 and V5 report nothing on `lab_physical_pentest`, `lab_social_engineering`, `test_needs_sims`, `test_access_work` and `test_access_social`.

V1, V7, V8 and V10 are reports or warnings and run for every scenario.

To keep office-life checks apart from the readers in `validate_npc_needs.rb`, `validate_access_work.rb` and `validate_scenario.rb`, V1, V2, V4, V5, V7, V8 and V10 live in a new file, `scripts/validate_office_life.rb`, called from `validate_scenario.rb` with one line. It reads owner and habit keys by their format 3 names only (the retired-key check already rejects old names); a later format step that renames one of them edits this file in the same commit, as steps 8b and 8c did for the other validators. V3 is a one-line rule in the same file. V6 and V9 touch no renamed key.

## 5. Per-mission fit

This table comes from a survey of the ten scenario files on 2026-11-13. "Cached" is the number of voiced clips already in `tts_cache/<m>/`. Stage 1 checks each row again before a pass starts.

| Mission | Setting | Office-like rooms and kit today | Suggested tier and features | Main risk |
|---|---|---|---|---|
| m01 first_contact | Media and PR office | 13 rooms including a break room (notes only), open office and meeting room. 4 stationary staff, each with KO globals and tasks. 3 PCs. Cached 1365. | Tier 2. Coffee and cooler in the break room. Needs for Sarah, Kevin and Maya inside their own rooms. Derek isolated with `avoids`. Screen-lock habits. A cake lever. | Played by students, large audio cache. Takes its normal rollout slot; the m01, sis01 and sis02 gate playtests run again when it lands. |
| m02 ransomed_trust | Hospital at night, ransomware crisis | 13 rooms. The Night Handover room (`staff_room`) is a full staff kitchen drawn as Tiled decor (hot-water boiler, sink, microwave, undercounter fridge, dishwasher, cooler, lockers) with no NPC. IT has a declared kettle, and a photocopier, shredder and desk phone as decor. The Boardroom has a declared cooler. The corridor has drinks and coffee vending machines as decor, on Val's patrol. Every hospital PC is ransomware-locked except Gary's (a password puzzle). Story NPCs: Bernie, Kim, Gary, Doyle, Reeves, all fixed by their beats or their text; Val and Nurse Raval patrol; three patients are immovable. No `disableAttacks`. Cached 1113. | **Pilot.** Two new non-clinical night staff waiting for radio calls in the Night Handover room (Tier 3, both approved): posts, leash, paired chatter at the boiler and the cooler, three exchanges. Gary prints a page at the IT copier without moving. Detail in section 6. | A crisis tone, and a cast where every existing NPC carries a beat or a fixed position, so all talk depends on the new pair. No screen-habit openings: the screens are encrypted or a puzzle lock. |
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

- **A hospital is staffed all night.** Porters and domestics take short breaks between runs whatever the IT is doing, so a staff room in use fits the premise without the "thinning office" device a corporate night mission needs.
- **The kit is already drawn.** The Night Handover room (`staff_room`) is a full staff kitchen in Tiled decor with nobody in it, and IT has a photocopier. The pilot adds one small prop (Gary's mug) and no room.
- **The paper theme.** With every system encrypted, the hospital runs on paper and on people carrying it. Porters carrying results by hand and a page left on a copier tray tell that story without touching a lock.
- **It tests the approval route.** The staff room's two new people went through stage 3 as the skill intends, and the user approved both.
- **It is not deployed to students.** Its work stays on its branch until reviewed and voiced.

### 6.0 Can m02 carry a convincing pilot?

Yes, with two new people in the staff room. Not with one.

The evidence. Every existing m02 NPC is ruled out as a talking partner: Gary Whitlock's text fixes him in his chair (6.2); Bernie, Kim, Reeves and Doyle carry beats at fixed places, and Doyle's observation text says she has not left bed two; Val and Nurse Raval patrol, which excludes needs; the patients do not move. Talk needs two NPCs at one capacity-2 chatter object (section 2). A single new NPC in the staff room would walk, drink and eat, but would never speak a pool line or play an exchange, so a pilot built that way could not show that office life adds anything a player hears. Two non-clinical night workers posted together on their break make a pair in the room the player crosses most: the staff room has four doors (corridor, CTO office, Boardroom, IT), and the walkthrough passes through it on the way to Kim, to IT and back, to the Security Office and to the Boardroom.

What the pilot then proves, and where the player meets it:

| Behaviour | In m02 | How the player meets it |
|---|---|---|
| Presets on drawn decor | boiler and cooler (shared), microwave (solo) in the staff room; the IT copier | the staff use them; kettle-boil, drink and copier sounds |
| Posts, leash, seating | the porter at the east table, the domestic at the centre table, both seated, leashed to the staff room | they get up, meet at the counter or the cooler, go back to their tables and sit; the porter warms food alone |
| Paired chatter and exchanges | the pair at the boiler and the cooler, breaks coupled by mapping, a shared boiler break about every four minutes, one on entering the staff room, and breaks started by events that come just before a crossing; lines are spent only when heard (E7) | on the first visit the player sees them get up, meet and talk, and hears the paper exchange if they stay a moment; on later crossings the pair are often at the boiler and, when they are, a line is waiting for the player; the burn exchange starts as the player walks out of IT with their cover blown if the player is still in earshot, and otherwise waits for the next meeting the player can hear (E9) |
| Print with no walk, a reveal slot | Gary prints a few seconds after the conversation in which the keycard changes hands closes | the copier runs, audibly, and a page lands on the tray |
| An NPC that takes part without moving | Gary sips his cold mug, standing at his post | a cup icon and a sip sound, never a step |
| Room tone | staff room `kitchen`, IT `quiet_office` | a quiet hum under the noir playlist |
| Attacks on moving NPCs | the pair, mid-walk | chase, calm-down, walk home; KO globals and credits lines |
| The tooling | V1 to V10 on a finished mission | stage reports |

What m02 cannot prove, and m06 proves second: a desk-phone call (m02 cannot have one, see 6.4), screen habits (every hospital screen is encrypted or a puzzle lock, so an open session would be a second way past a lock), a player lever with a payoff (6.7), print-and-forget with a fetch errand, and staff with work at desks.

The user approved both new people on 2026-11-14, so no smaller shape is planned.

### 6.1 What m02 has today

From `scenarios/m02_ransomed_trust/scenario.json.erb` as rendered, the Tiled maps under `public/break_escape/assets/rooms/`, `TESTING_WALKTHROUGH.md`, and a live game checked on 2026-11-14 with every room open.

| Room | Office kit | People | Office-life use in the pilot |
|---|---|---|---|
| `staff_room` (Night Handover, 10 by 10 tiles; doors: corridor south, CTO north, Boardroom west, IT east; motion lighting; a `chatBackground`) | Tiled decor: hot-water boiler (`items`, 4.75, 1.81, wall-mounted above the sink counter), sink counter (`tables`, 4.69, 3.44), microwave (`table_items`, 6.16, 2.69), undercounter fridge and dishwasher (`tables`), water cooler (`items`, 8.44, 7.25), lockers, coat stand, three tables with chairs (centre 2.69, 5.41; west 2.28, 7.75; east 6.16, 6.56). Existing consumables: a mug of coffee "still warm" on the east table (6.56, 5.79), a cup on the centre table (3.99, 4.66), a tray of mugs on the west table (3.19, 6.85). Declared: handover board, snag list, noticeboard, Ward Clerk's Laptop (on the centre table, takeable), Wrapped Contractor Lanyard (`contractor_lanyard`, on the west table, takeable). | Nobody (walkthrough step 10). | Posts for the night porter (east table) and the night domestic (centre table). Boiler, cooler and microwave declared as need objects. |
| `it_department` (key lock, Bernie's override key or a pick) | Declared: `it_department_kettle`. Decor: photocopier, shredder, desk phone, network rack. Two PCs: `infected_terminal` (ransomware) and `gary_workstation` (password lock). `it_filing_cabinet` (key lock, pickable). | Gary Whitlock (6.2). | Gary's mug, the copier and its slot. |
| `conference_room` (Boardroom, PIN lock) | Declared cooler; a coffee station in the conditional layer, undeclared. | Graham Reeves (plot-located, ambush scene). | None. |
| `office_corridor` | Decor: drinks and coffee vending machines. | Val Okonkwo patrols the west end. | None. Vending has no preset until after the pilot, and the machines stand in Val's lane. |
| `hospital_ward` | Paper obs rack, BP cuff, EHR terminal (ransomware). | Sister Doyle ("Two of us, manual obs every fifteen minutes, and a biro."), Nurse Raval (patrol), three patients. | None. |
| `reception_lobby`, `dr_kim_office`, `security_office`, the halls, storage, server room | Reception kiosks and terminal (ransomware); a kettle drawn in the security office. | Bernie, Kim. | None. |

Locks and secrets (the lock and key baseline records these by hash): the IT filing cabinet key lock, the server room's Sealed Equipment Case key lock, Boardroom PIN, emergency-store safe PIN, Kim's safe PIN, Gary's workstation password, IT override key, Security Office key, server-room RFID card, the four VM flags and the flag-locked staging cache. None may appear on an office-life printout or slot.

### 6.2 Gary Whitlock: still, printing by command

Gary carries a required conversation (`talk_to_gary`), holds the server-room keycard and a contractor lanyard, owns the `lockpick_used_in_view` catch at the filing cabinet, and has `taskOnKO: talk_to_gary`, `globalVarOnKO: gary_ko` and sight of 400 px through 360 degrees. Three pieces of existing text fix him in place (he stands at his post between his desk and the workbench at (6.3, 5.8); the IT chairs are too far for seating to sit him):

- his `observations` (`scenario.json.erb:2035`, shown text, not voiced): "Gary Whitlock has not moved from that chair since half ten. ...";
- the first-meeting narration (`ink/m02_npc_gary_whitlock.ink:80`, voiced, cached): "Two dead terminals, a cold mug with a skin on it, and a printed stack of his own emails squared up beside the keyboard.";
- the cabinet catch (`ink/m02_npc_gary_whitlock.ink:764`, voiced, cached): "Behind you, a chair creaks round."

Stage 1's rule puts him in the class "fixed by the text". The user chose (2026-11-14) to keep him where he is: he sips his cold mug at his post and prints by command after the keycard conversation. No line changes.

- A cold mug on his desk becomes a declared object, `gary_mug` (a catalogue cup sprite, not takeable, observation along the lines of "Cold. There is a skin on it."), with a hand-written `affordance: { satisfies: "caffeine", restores: 30, useSeconds: 4, capacity: 1, useSound: "drink_gulp", seat: "stand" }`, object-level `private: true` and `owner: ["gary_whitlock"]`, and a `useFrom` that makes its approach cell the 8 px walk-grid cell under Gary's body centre (an NPC's `position` is its body-centre point: (6.3, 5.8) is (201.6, 185.6) px; the sprite centre is 31 px above). His own post object meets his only need, so every sip is an at-post job, which the engine never moves (section 2). The aimed `useFrom` matters for the other path: after a `resume` or a calm-down the engine walks an NPC home unless it is within 12 px (`HOME_EPS`) of its home cell, and an aimed cell is within about 6 px. The cell is worked out from the mug's runtime sprite centre, not its declared tile: `dx = (201.6 - mug.x) / 32`, `dy = (185.6 - mug.y) / 32`, with `mug` read through `window.npcNeedsSystem.world.getObject('gary_mug')`. In the prototype a declared `position` of (5.6, 4.2) put the sprite centre at (187.5, 141), and `useFrom: { dx: 0.5, dy: 1.45 }` gave the cell (204, 188), 3.4 px from Gary; a cell worked out from the declared tile was 14.7 px off, and after `suspend` then `resume` he stuck in `returning`. Either way he drifted 0 px over 10 minutes of needs clock; with the aimed cell a `suspend` then `resume` left him idle, 0 px from his spawn.
- Gary gets `needsHome: "gary_mug"`, one need, `caffeine` (starting values `{ initial: 60, decayPerMin: 4, urgentAt: 35 }`: a first sip at about six minutes, then about every seven and a half), `needsRooms: ["it_department"]` and `swivel: false` (his sight beat stays exactly as it is). His own post object meets his only need, so every use is an at-post job: he is never moved and never takes a step. The mug sip shows a cup icon and a quiet sound. The narration "a cold mug with a skin on it" now describes what the player sees him sip.
- `it_department_kettle` gets `affordance: false`, so IT has no other caffeine source and no fallback walk.
- One mapping on Gary: `{ "eventPattern": "conversation_closed:gary_whitlock", "condition": "globalVars.cover_burned === true && globalVars.gary_ko !== true", "onceOnly": true, "delayMs": 6000, "needs": { "print": { "producer": "it_photocopier", "forget": true } } }`. `cover_burned` is set in the conversation in which the keycard changes hands (walking away earlier burns nothing), so the print follows the close of that conversation, after HaX's burn text (4 s), when room tone is no longer ducked and the copier's run sound is heard. It fits his own line "Know what I've been doing tonight, between restores? Printing those. All seven." (`:351`): he is still printing. A knock-out sets `gary_ko`, and no conversation closes, so a knock-out prints nothing. The copier's run sound plays only in the player's room, so a player who leaves IT within 6 s gets a silent print; the page is still there, and stage 5 records that case.
- Existing lines changed: none. Re-voiced clips: 0.
- Protection: 1 in effect (he never moves). V2 passes because every need target is his own post object in IT.
- Stage 4 proof: through `window.__test.needs`, Gary's position stays within 2 px of his spawn for 10 minutes of needs clock with the player in IT, his conversation opens at once at any moment, and the cabinet catch fires as today. Then a `suspend` and `resume` through a mapping or the test bridge leaves him within 2 px; this step is what catches a wrong `useFrom`, because the 10-minute run passes whatever the cell. The prototype measured the print at 6.0 s after the close, with `copier_run` heard in IT. `seat: "stand"` on the mug keeps seating from moving him to the chair about 42 px away. If he is moved at all, his spawn is set to the centre of the mug's approach cell as read through `window.__test.needs`, a one-line position change logged as such.

**Not chosen: a small routine inside IT.** Gary walking to the IT kettle and copier would have needed two re-voiced narrator lines (`ink/m02_npc_gary_whitlock.ink:80` and `:764`), two text edits, and protection 2 on the mission's most important NPC, and would have shown a man walking to a kettle on his own, which tells the player nothing. His stillness is part of the scene: a man who has not moved since half ten while the building he warned about falls over. The V2 positive case on a story NPC comes up in m05 (Lisa, confined to the break room) and m08 (the off-duty agent), where the text allows movement.

### 6.3 People

| NPC | Class | Post | Leash | Needs (source) | Groups and avoids | Habits | Beats protected by | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Gary Whitlock | story-critical | `gary_mug` | `needsRooms: ["it_department"]` | caffeine (`gary_mug`) | none | command print | protection 1 in effect | never walks, so a knock-out drops the keycard and lanyard at his post, inside his own scenario room, which the server accepts today |
| Night porter, Ernie Bautista (`night_porter`, new, approved) | ambient | tile north of the east table's north chair (`hospital_chair_south`, sprite anchor 6.72, 5.78), starting value (6.97, 4.85), facing south | `needsRooms: ["staff_room"]` | caffeine (boiler, shared), thirst (cooler, shared), hunger (microwave, solo) | group `night_staff` | none | no story duty | holds nothing; `globalVarOnKO: "night_porter_ko"`; E1 confirms the chase, calm-down and walk home |
| Night domestic, Hodan Warsame (`night_domestic`, new, approved) | ambient | tile east of the centre table's south chair (`hospital_chair_north`, sprite anchor 3.41, 6.25), starting value (4.2, 6.1), facing north | `needsRooms: ["staff_room"]` | caffeine (boiler, shared), thirst (cooler, shared) | group `night_staff` | none | no story duty | holds nothing; `globalVarOnKO: "night_domestic_ko"` |
| Bernie, Kim, Reeves, Doyle | as today | unchanged | none | none | none | none | protection 1: stationary | unchanged |
| Val, Nurse Raval | patrolling | unchanged | none | never (a patrol excludes needs) | none | none | unchanged | unchanged |
| Three patients, phone contacts, cutscene records | never | unchanged | none | never | none | none | unchanged | unchanged |

**Roles and the ward.** Sister Doyle's "Two of us" is about nurses on three wards. A porter and a domestic are non-clinical, so they add no clinician to her numbers, and their talk supports her line instead of draining it: tonight the porter is the hospital's network, walking bloods and results between the lab and the wards because nothing else moves them, and the domestic turns round beds the wards release by hand. Neither is ever seen on Ward 3 in the game.

**Why they are sitting there, and what they know.** They are not on a break that never ends. With the systems down, work reaches them only by two-way radio (hospital porters and domestics carry them; a radio is not a phone, so Bernie's count of internal phones stands), and the staff room is where they wait to be called: the porter between lab runs, the domestic between bed turnarounds. Their lines are about waiting for the radio, never about a break that is nearly over. Reeves arrived at 03:20 (the visitor log, `scenario.json.erb:1481`, and Val's night log, `:3332`), and the Boardroom's only door opens off the staff room, so the pair were out on runs and rounds for most of the night and came in from the corridor not long before the player. No line pins a clock time (the dialogue review checks this), and no line implies they saw or heard anything at the Boardroom door. Of the night's events they know only what the handover board on their own wall says (there was a drill, nobody told the ward), and they add nothing to it.

**No radio run.** A visible run (the radio sending one of them out of the south door and back) is not in the pilot, by the user's decision. It would need its own V2, E1 and reload checks, and can be proposed for a later pass.

**Cast (approved).** m02's speaking cast spans Nigerian-British, Irish, South Asian, Korean and white British characters, mostly middle-aged. The porter is Ernesto "Ernie" Bautista, a man in his early sixties of Filipino heritage, thirty years at St Catherine's; the domestic is Hodan Warsame, a woman in her early twenties, British-Somali, from Birmingham. Each gets a sprite key of their own and goes through the character pipeline (stage 6): concept, bust, visemes from a talk run with four talk inits for the user to pick from first, walk, and seated frames, since both sit. **The art is a separate spend and is not yet approved:** the concepts through agy cost nothing, but no PixelLab generation starts until the user has confirmed the scope and count for the two characters.

**Voice styles (approved).** Porter: "Hospital night porter, early sixties, Filipino-British, thirty years in the job. Warm and unhurried, dry humour, a soft Filipino lilt over a Midlands base. Never raises his voice." Domestic: "Night domestic, early twenties, British-Somali, Birmingham accent. Quick, wry and chatty, tired but sharp; drops her voice for gossip."

**Their conversations.** Each has a short ink story (a greeting, two or three choices, a parting line) so that talking to them works. They take the player for whatever the player says they are ("You with IT?"); they know nothing of the booking, Reeves, badges or the override, and of the drill only what the board says; they give no clue, set no task and complete nothing. Each conversation has one line on the paper night, so the player hears what they are doing for the ward.

**No story items.** Neither carries anything or leaves anything behind. A badge of theirs on a table would be a second source for `staff_lanyard_obtained`, a route past Val, which rule 2 forbids.

**The free items in the room.** The laptop sits on the centre table across from the domestic, and the lanyard on the west table. The staff do not stop the player taking them: people on a break do not challenge a confident visitor, which is the Human Factors point, and the staff-room lanyard's own text already makes it ("Nobody questions one, which is exactly what Gary's been writing emails about."). The warm mug on the east table is the porter's tea, in front of him, and stays a free drink for the player; taking it is the player's choice and nothing reacts, for the same reason. No bark is added for either: an eventMapping bark is voiced live, outside the batch and V6 (section 10).

**Knock-outs.** Each new NPC has a KO global, a credits line (text, not voiced; for example "NIGHT PORTER: Assaulted in the staff room" and "NIGHT DOMESTIC: Assaulted in the staff room", style `warning`, conditioned on the global), and a one-off HaX text through a `global_variable_changed` mapping (text, not voiced). Neither global is exported.

### 6.4 The staff-room pair: posts, needs and breaks

Figures marked "measured" come from live prototypes on throwaway copies of m02 (2026-11-14, headless, `setFPS(20)` with fixed steps, 2 to 8 runs a beat), not from the committed scenario. They were taken on the engine before E7 to E9; those three change which lines are spent and when an exchange starts, not walking or break timing, so the walking and timing figures stand. Stage 4 measures again on the engine with E7 to E9.

- **Posts.** Neither chair has a usable cell "in front": the porter's chair faces south into the east table, and the west table sits 9 px behind the domestic's chair. The porter's post is the cell north of his chair, starting value (6.97, 4.85); the domestic's is the cell east of hers, starting value (4.2, 6.1). Measured: from these posts both returned home (`npc_returned_post`) and sat (`npc_sat`) after every break; a post at (3.66, 6.6) lay inside the west table and the domestic never got home. Only `hospital_chair_south`, `hospital_chair_north` and `hospital_chair_north2` are in seating's `STATIC_SEATS` (`seating.js`); the east table's side chairs (`hospital_chair1`, `hospital_chair2`) are not, so the domestic sits at the centre table, not across from the porter. The user kept this (2026-11-14): two night workers each at their own table, meeting at the counter, reads as a staff room at four in the morning, and seating's data is not changed. Neither has sight (`los`). Both sit with their backs or sides to the IT door, and stage 5 checks that no approach or second-user cell at the boiler or cooler faces the east door either, so the walkthrough's IT door pick reads as two tired people with their backs turned.
- **They exist once the staff room loads.** NPCs and their mappings register when their room loads, and the staff room loads as the player approaches it from the corridor (measured: both seated about 3 s after the player entered the corridor). The pair's first meeting is therefore on the player's first entry to the staff room (walkthrough step 10, where the player stops for the board, the laptop and the lanyard).
- **Needs (starting values; the stage 4 T1/P report confirms them).** The boiler and the cooler restore 40 (hand-written, below the presets' 70), so each main need comes back about eight minutes after it is met. Porter: caffeine `{ initial: 45, decayPerMin: 5, urgentAt: 35, jitterPct: 10 }` (first break at about two minutes), thirst `{ initial: 95, decayPerMin: 3, urgentAt: 30 }`, hunger `{ initial: 70, decayPerMin: 2, urgentAt: 30 }`. Domestic: caffeine `{ initial: 65, decayPerMin: 5, urgentAt: 35, jitterPct: 10 }` (first break at about six minutes, four minutes out of phase with the porter's), thirst `{ initial: 95, decayPerMin: 3, urgentAt: 30 }`. Aim: a shared break at the boiler about every four minutes, started by whichever of the two is due, and a shared break at the cooler about every thirteen minutes once thirst falls (the first at about twenty-two minutes). Hunger is a solo trip to the microwave.
- **Chatter cooldown: 2 minutes, 4 lines a pool.** With E7, a pool line is taken from the bag, and the speaker's cooldown started, only on a turn where the player can hear that speaker; a turn out of earshot shows picture chat and spends nothing. A break that starts before the player arrives therefore still has a line ready for each speaker when the player walks in. The overlap at the boiler is about 28 s, so each speaker says at most one pool line a break, with picture chat between, unless an exchange is due. The first turn of the first meeting is a pool line, because the exchange story is still loading; the exchange starts on the next turn. Each `coffee` and `cooler` pool has 4 lines. A player who stays in the room hears a coffee line again only after about four heard boiler breaks, about 16 minutes; stage 5's dialogue check counts repeats over a 20-minute walkthrough, since the player's crossings, not the natural rhythm, set most of the cadence.
- **What starts a boiler break.** All four mappings set the porter's caffeine to 20; the coupling below brings the domestic. Mapping cooldowns are in milliseconds of wall time (`npc-manager.js:1223`).
  1. Staff-room entry, on the porter: `{ "eventPattern": "room_entered:staff_room", "cooldown": 120000, "delayMs": 2000, "needs": { "set": { "caffeine": 20 } } }`. The delay keeps the pair from standing the moment the door opens (measured without it: `npc_stood` 0.1 to 0.4 s after entry, which reads as a reaction to the player). It fires on every entry two minutes after the last, not only the first. Measured: the pair stood 2.1 to 2.3 s after entry and met 3.9 to 4.3 s after it; on the first visit the paper exchange then played to a player doing step 10 in 5 of 5 runs (all lines heard in 4, four of five in 1).
  2. The burn, on the porter: `{ "eventPattern": "conversation_closed:gary_whitlock", "condition": "globalVars.cover_burned === true", "onceOnly": true, "needs": { "set": { "caffeine": 20 } } }`. No delay: measured, the pair meet 4.2 to 4.4 s after the close, while a player walking straight out is in the staff room from about 2.2 s to 4.5 s after it, so line 1 was heard on 2 of 5 straight walks. With E9 the burn exchange starts only if its first speaker is in earshot at that turn; a player who has already left misses nothing, because the exchange stays unplayed and is the first one offered at the next meeting the player can hear. A player who stops in the room hears it in full; HaX's text 1.5 s after the first staff-room entry after the burn (`scenario.json.erb:944`) gives a reason to stop, and stage 5 records whether players do. A Kim break still running when Gary's conversation closes delays this one by up to its 30 s.
  3. Leaving Kim's office, on the porter: `{ "eventPattern": "conversation_closed:dr_sarah_kim", "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }`. The boiler is within earshot of the route from Kim's door to the IT door and the corridor door; the cooler is not (170 to 181 px from it). Measured: the pair met 3.9 s after the close and three lines were heard at 92 to 119 px.
  4. Arriving from the ward, on the porter: `{ "eventPattern": "room_entered:office_corridor", "condition": "data.previousRoom === 'ward_hall'", "fireOnlyWhenLoaded": true, "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }`. The condition stops it firing as the player walks out of the staff room, which would start a break behind them. The corridor's ward door is about 260 px from the staff-room door, so the head start is about 2.5 s; measured, the pair met 0.2 to 2.0 s after the player entered the staff room.
  `room_entered` mappings on IT, Kim's office and the Boardroom are not used: they fire as the player arrives somewhere they stay for a conversation, and measured, the 30 s break was over before the player left. Only mapping 2 is `onceOnly`; the others write nothing, and `room_entered` and `conversation_closed` are not office-life events.
- **Coupled breaks, at the boiler and at the cooler.** Boiler, on the domestic: `{ "eventPattern": "npc_use_started:staff_boiler", "condition": "data.npcId === 'night_porter'", "needs": { "set": { "caffeine": 20 } } }`; on the porter, the same with `data.npcId === 'night_domestic'`. Cooler, on the domestic: `{ "eventPattern": "npc_use_started:staff_cooler", "condition": "data.npcId === 'night_porter'", "needs": { "set": { "thirst": 20 } } }`; on the porter, the same with `data.npcId === 'night_domestic'`. Measured at the boiler: the partner stood 0.06 to 0.3 s after the first user's `npc_use_started`, and the boiler paired in 7 of 7 runs. `npc_use_started` fires on every use, from the post or straight from another job; with `npc_left_post` instead, a break that followed a break, or a leave while still walking home, brought no partner. None of the four is `onceOnly` (mappings without a `cooldown` carry the engine's default 5 s, which is harmless here), a set on a need already in hand is harmless, and the object in each pattern keeps the microwave solo and keeps a boiler break from pulling the partner to the cooler. These mappings read office-life events and complete nothing, so V5 has nothing to report.
- **Long enough to talk.** The boiler's `useSeconds` is 30 (tea, brewed) and the cooler's 25. Measured at the boiler with `npc_use_started` coupling: overlaps of 27.8, 28.5 and 28.2 s. The paper exchange's five lines end about 26 s in, because the first turn is a pool line. An exchange holds the overlap for its remaining lines, up to the 60 s cap. The cooler is shared again because E8 lands first: its second user's cell must then be reachable from the partner, or the partner's job fails at once with `no_beside_cell`. On the engine before E8, the preset's second-user cell at this cooler was unreachable, and with a hand-written cell the partner still timed out on 1 of 3 breaks; stage 4 therefore sets the cooler's `useFrom` so that one side cell is reachable from both posts, and checks it live (6.5).
- **Crossings.** Measured with the test bridge's `enterRoom`, which lines up at each door first: 4.5 s from the corridor to Kim's office, 2.5 s back, 3.25 s from IT to the corridor. A person may be about a second quicker. A crossing therefore hears one or two lines at most, which is why the exchanges that play on crossings are short (6.8).
- **Cooldowns, honestly.** The mapping cooldowns run on wall time and `chatterCooldownMin` on the needs clock, which pauses while the VM is open. Some crossings meet the pair at their tables or show picture chat. That is accepted: the aim is a room that is alive, not a line on every pass.
- **Exit test (stage 4, then stage 5), five tries each at walking speed:**
  - first visit, standing 10 s near the boiler: the paper exchange plays in full on 5 of 5;
  - walking straight out of IT after the keycard conversation: the burn exchange's first line is heard in the staff room on at least 2 of 5, and in full on 5 of 5 when the player stops 3 s in the room; on every try where it was not heard, `heard_night_watch_burned` is still false and the exchange plays at the next meeting the player hears;
  - walking out of Kim's office after a conversation: the pair are at the boiler as the player crosses on 4 of 5, and a pool or exchange line is heard on at least 2;
  - a break left to run with the player outside the staff room: no pool line taken (`npc_chatted` shows only `picture:` line ids, and the bag position is unchanged), then the player walks in and hears a pool line on the next turn;
  - after every break, both NPCs return home and sit;
  - both NPCs are `using` the boiler at once on every coupled boiler break, and the cooler at once on every coupled cooler break, with no `timeout` and no `no_beside_cell`;
  - every exchange's `heardLines` is logged, and none is marked heard with 0 lines.
- **If the engine item slips.** The pilot's stage 4 waits for E7 to E9, which are small. If the user would rather not wait, the pilot falls back to settings measured on today's engine, and the plan's numbers change with it: `chatterCooldownMin: 0.25` with 6-line `coffee` pools (so a player who lingers hears a line again after about 12 minutes, because lines are spent unheard), the cooler solo (`capacity: 1`, no `cooler` pools, no cooler coupling), and `night_watch_cleared` gated on `cover_restored` alone. That shape is about 49 clips and was measured in full on the prototype.
- **No phone.** m02 cannot have a working phone in the staff room. The mission's turn is an anonymous call to security "from an internal extension" (HaX, `scenario.json.erb:936`), and Bernie's deduction rests on there being only four internal phones not behind a locked door tonight, three on his desk and one in the Boardroom (`ink/m02_npc_receptionist.ink:282-284`). A fifth phone in an unlocked room next to the Boardroom would make his clue false and hand the player an innocent suspect. The desk-phone call is proved in m06.

### 6.5 Rooms and objects

| Object | Room | How | Preset or affordance |
|---|---|---|---|
| `staff_boiler` (the drawn `hot_water_boiler1`) | staff_room | declare with `type: "hot_water_boiler"` at its drawn position, so it claims the sprite | `officeType: "kettle"`, with `capacity: 2`, `chatter: "coffee"`, `queue: false`, `useSeconds: 30`, `restores: 40` and a hand-written `useFrom` on the floor in front of the sink counter (the default cell below a wall-mounted boiler falls inside the counter). Starting value `{ dx: 0, dy: 2.5 }`: measured approach (164, 124) px, second user (196, 124), both reached in every run |
| `staff_cooler` (the drawn `water_cooler1`) | staff_room | declare with `type: "water_cooler"` | cooler preset (`capacity: 2`, `chatter: "cooler"`) with `queue: false`, `useSeconds: 25`, `restores: 40` and a hand-written `useFrom` set in stage 4 so that one side of the approach cell is reachable from both posts (6.4); with E8 the engine takes only a reachable side for the second user |
| `staff_microwave` (the drawn `microwave1`, `table_items`) | staff_room | declare with `type: "microwave"`, so it claims the sprite | `officeType: "microwave"` (the preset lists only `microwave1`, so the type alone would not get it), with a hand-written `useFrom` in front of the counter, a tile east of the boiler's second-user cell (measured with `dy: 1.5` alone the cell was (212, 124), 16 px from it); stage 4 checks the microwave and the boiler in use together |
| `it_photocopier` (the drawn `photocopier1`) | it_department | declare with `type: "photocopier"` | copier preset (its run sound plays for the command print) |
| `it_copier_page` | it_department | new slot object on the copier's tray | `type: "notes"` sprite, `takeable: true`, `readable: true`, `outputOf: "it_photocopier"`, `revealOnGlobal: "it_copier_page_shown"` (engine-owned), the page text (6.6). Declared last in IT's object list, with an explicit `position` on the copier's tray (the copier is drawn at about (6.31, 7.88)), since a fourth `notes` object finds no Tiled sprite and would otherwise be placed at random, because a declared `notes` object takes the first unreserved `notes` sprite of the room (`core/rooms.js` `findMatchFor`) and IT's three are claimed by existing notes |
| `gary_mug` | it_department | new catalogue cup on Gary's desk | 6.2 |
| `it_department_kettle` | it_department | already declared | `affordance: false` (no other caffeine source in IT, so Gary never walks) |
| `conference_water_cooler` | conference_room | already declared | `affordance: false` (no leash reaches the Boardroom; keeps the preset list clean) |

Not declared: the undercounter fridge (it sits in the Tiled `tables` layer, which the claim pool does not index, so a declaration would draw a second sprite; the microwave meets hunger), the shredder (Gary feeding a shredder during an investigation into him reads as destroying evidence), the IT desk phone, the sink counter, the dishwasher and the lockers. The ransomware PCs and Gary's workstation have a `lockType`, and the portable workstations are takeable, so none gains a preset. Stage 4 checks the validator's preset list against this table.

Dressing checks for stage 4:

- Queue and approach cells stay out of all four staff-room doorways, and the posts leave the path from the corridor door to the CTO door clear.
- At the boiler and at the cooler, the second user's cell (`window.npcNeedsSystem.world.besideCell` on the approach cell, given each partner's position as `from`) is reachable by a path search from both posts, and a live run has both NPCs `using` each object at once with no `no_beside_cell` failure.
- `water_cooler1` appears in two rooms and `microwave1`, `photocopier1` and the boiler are drawn once each. `tools/playtest/room-snapshot.mjs` before and after confirms that each declaration hides no other sprite.
- No prop is added to the staff room, so its background stays. Gary's mug is a small desk prop in IT; the IT background is checked in stage 6 and redone only if the mug shows in its strip.

### 6.6 Paper, not screens

- **No screen habits.** Every hospital PC shows the ransomware screen, and Gary's workstation is a password puzzle the server checks. An unlocked session on it would be a second way past a lock (rule 2).
- **The printout.** One page on the IT copier tray, printed by Gary (6.2). Gary has been printing his seven warning emails all night, so the page belongs with them without repeating them: the Board Secretariat's automatic reply to his seventh email, printed for the stack. Its header is the secretariat's own ("Your message to the Board Secretariat"), never his subject line, which names the backup server's software and would repeat a clue; its body says only that the message was received and will be considered at the next scheduled meeting, and nothing about what the board later did. No new fact, nothing handwritten (it has just left the copier), and no mention of the drill. Its rules:
  - it carries no PIN, password, key, card, flag, server address or account detail;
  - it is a `notes` item, never a type an existing lock or ink check reads;
  - it sets only its own engine-owned reveal global and gives no new route to an existing story global;
  - it repeats no existing clue word for word and contradicts none: it does not quote the warning emails, and it says nothing about the drill, the doors or the override.
- **The lesson.** When the IT fails, staff fall back to paper, and paper ends up on trays and desks and in people's hands. This sits in CyBOK Human Factors and Security Operations; stage 8 flags it for the lab sheet.
- **Reload.** A reload files every revealed slot nobody holds, and the print mapping is `onceOnly` and saved, so a player who reloads before taking the page loses it. The page is optional flavour, and this is accepted; 6.11 checks it.
- **No left-behind items** in the pilot.

### 6.7 Levers

m02 has no player lever with a payoff that respects rule 2:

- **A magnet** (a tin of chocolates from a patient's family would fit) in the staff room would draw the pair to it, but nothing they guard opens as a result: the free items are free anyway. Drawing Gary out of IT to make the cabinet pick safe would take a fixed NPC out of his room.
- **A phone** cannot be added (6.4).
- **A power switch** (`offWhen` on the boiler) has nothing to open.

The pilot records "no lever" with these reasons. m06 proves the magnet.

### 6.8 Spoken lines

| Speaker | Pool or knot | Lines | Notes |
|---|---|---|---|
| Porter | own `coffee` pool | 4 | the paper night, the lab runs, thirty years of nights, the next run due; 40 characters at most; no `hush` (their own staff room, on their break) |
| Porter | own `cooler` pool | 4 | short asides over water: the cold, the walk, the radio; same rules |
| Domestic | own `coffee` pool | 4 | same rules |
| Domestic | own `cooler` pool | 4 | same rules |
| Porter and domestic | three exchange knots on the domestic's story (the pair's lower id, whose `exchanges` list the engine reads first), at the boiler or the cooler, whichever meeting the player hears first | 3 lines each for the burn pair, up to 5 for the paper night | see the gates below |
| Porter, domestic | conversation knots | about 14 and 12 | optional, no clue |
| Gary | none | 0 | he is still and alone in IT, so a pool would never play |

**Exchange gates and order.** The domestic's `exchanges` list (each entry `with: "night_porter"`) is read in order, and the first unheard exchange whose `requireGlobal` holds plays:

1. `night_watch_burned`, `requireGlobal: { "cover_burned": true }`, started by the break on the close of the keycard conversation (6.4): security have put out on the radio that a visitor is not on the list; they agree, in so many words, that the visitor standing there is not their business. The source is the porter's radio, never anything heard from the Boardroom. It names no extension, no Reeves and no badge, and holds whoever made the call. It is news from earlier in the night, so it still reads true if the player first hears it after Val has cleared them (a player who lingers in IT misses the burn break and meets the exchange at the next meeting they can hear; with E9 it is never used up unheard).
2. `night_watch_cleared`, `requireGlobal: { "cover_restored": true, "heard_night_watch_burned": true }`: word on the radio that the visitor checks out; the domestic is not convinced. With E9, `heard_night_watch_burned` means the player heard at least one line of the burn exchange, so the cleared exchange always follows news the player heard, and it may refer back to it. Listed after the burn exchange, it plays after it whenever both are due.
3. `night_watch_paper`, no gate: the paper night from the pair's own side: bloods on foot, results carried by hand, the lab run counted in trips. It does not restate Doyle's "Two of us ... and a biro". It must hold before and after the burn, because a player who rushes may first hear it late. It is the first-visit exchange, where the player stands still, so it can run to five lines.

Anything the player should not miss goes in an exchange's first line. A crossing hears one or two lines; a cut after one overheard line counts the exchange as heard, and the rest plays to an empty room.

**Totals.** About 53 new clips: 16 pool lines (two `coffee` and two `cooler` pools of 4), about 11 exchange lines and about 26 conversation lines. That is within the Tier 2 range of section 10, priced as Tier 2 with two Tier 3 people. With E7, each speaker says at most one pool line per heard break and none while nobody is in earshot, so a player who stays in the room hears a coffee line again after about four heard boiler breaks (about 16 minutes); stage 5's count over a 20-minute walkthrough decides whether the pools need more lines. If the live check in 6.5 cannot make the cooler a working pair, the two `cooler` pools (8 clips) are dropped before voicing, and the total is about 45. V6 gives the exact count per voice. Existing lines changed: none.

### 6.9 Sync budget

| Piece | m02 count |
|---|---|
| `heard_<knot>` (three exchanges) | 3 |
| Reveal global for the printout slot | 1 |
| KO globals for the two new NPCs | 2 |
| New `onceOnly` mappings (the print, the burn break, two HaX KO texts) | 4 |
| Printout in the inventory echo | 1 item |
| Workstation, frustration, workaround, servings, Friendface, capture or card records | 0 |

At most 10 small keys and one inventory item. Each new global (`heard_night_watch_burned`, `heard_night_watch_cleared`, `heard_night_watch_paper`, `night_porter_ko`, `night_domestic_ko`, `it_copier_page_shown`) is declared `false` in `globalVariables`, or the validator warns. The coupling mappings and the other break starts are not `onceOnly` and write nothing. Nothing grows with play time.

### 6.10 Validator expectations

- V1: three lines change (Gary, the porter, the domestic).
- V2: Gary passes: his only need target is his own post object, in IT. The pair have no story duty.
- V3: nothing.
- V4: a warning on all three until E1 passes, then an info line listing `gary_ko`, `taskOnKO: talk_to_gary`, his held keycard and lanyard, `night_porter_ko` and `night_domestic_ko`.
- V5: 0 errors.
- V7: each pool line checked against the speaker's ink and barks.
- V8: at most 10 keys.
- V9: an empty lock and key diff. The two NPCs and Gary's mug add nodes with no lock, key, door or gate.
- V10: passes. Every `coffee` pool has a pair at the boiler and every `cooler` pool a pair at the cooler, and every exchange has both speakers at both. V10 is static and cannot see the walk grid, so the live check in 6.5 (the second user's cell reachable, both `using` at once) is the real test that the pools are heard.
- Existing checks: the preset list matches 6.5; no queue cell in a doorway; chatter rules; the three exchange knots exist and both speakers have voices; no knot runs past 60 s; Gary's los with needs carries `swivel: false`.
- The aim chain stays at 4 hops.

### 6.11 The attack probe for m02

E1 (section 9) runs first, in the showcase. Then, live in m02:

1. Attack the porter on his walk to the cooler. He turns hostile, chases, calms down and walks back to his post. Reload: he is at his post.
2. Knock the domestic out mid-walk: `night_domestic_ko` is set once, the credits line shows, nothing drops (she holds nothing), and the porter's next coupled break goes ahead alone. Reload: she stays down.
3. Gary, as today: knock him out at his desk; the keycard and lanyard drop once; `gary_ko` is set; `talk_to_gary` and `obtain_password_hints` complete once; no page prints. Reload: he stays down and nothing drops twice.
4. Reload before taking the printout: the tray is empty afterwards and nothing prints again (accepted, 6.6).
5. Regression: Val's `lockpick_used_in_view` catch and Gary's `on_cabinet_picked` fire as the walkthrough describes.

### 6.12 Atmosphere and documents

- **Presets.** `officePresets: true` for m02. Every preset in 6.5 (the boiler's `officeType`, the cooler, the microwave, the copier's run sound) and the `affordance: false` opt-outs depend on it.
- **Room tone.** `roomTone: true`, with `roomToneTypes` mapping `room_hospital_staff` to `kitchen` and `room_hospital_office_it` to `quiet_office`. Reception, the ward and the halls stay unmapped and quiet, so the noir playlist carries them. A listen check confirms it in stage 5. `roomTone` also gates the boiler's kettle sound and the copier's run sound.
- **Lighting.** The staff room is `mode: "motion"`. A motion room with an NPC in it starts lit and stays lit (`systems/lighting.js` 655, 729), so the room's dark-until-entered beat goes: night staff on a break have the light on. The lighting loop of stage 4, slice 5, runs on the staff room because it is now lit from load (`lighting.js:655`), although no prop there changes.
- **Walkthrough.** `TESTING_WALKTHROUGH.md` step 10 ("no NPC") and step 12 ("Nobody watches" the IT door pick) are updated: two staff on a short break, backs to the IT door, who do not react. This is intended: people on a break do not challenge a visitor who looks as if he belongs. Stage 8's close list carries both.

### 6.13 Approvals for m02's stage 3

Decided by the user on 2026-11-14:

1. Gary: he stays where he is, sips his cold mug and prints by command after the keycard conversation (6.2). No line changes.
2. The night porter, Ernie Bautista, and the night domestic, Hodan Warsame, with the cast, looks and voice styles in 6.3.
3. Seating: the pair keep two tables; seating's data is not changed (6.4).
4. No radio run in the pilot (6.3).
5. E7, E8 and E9 land together as their own engine item before the pilot's stage 4 (section 9.1), so the pilot uses a 2-minute chatter cooldown, 4-line pools and a shared cooler.

Still open, each asked when its step comes:

1. **The porter's and the domestic's art.** The concepts through agy cost nothing. The PixelLab steps (bust, four talk inits for each to choose from, visemes from a talk run, walk with the standard animations, seated frames) are a separate spend: the scope and count go to the user, and nothing is generated until they confirm. Each character's four talk inits then go to the user to pick from.
2. **The voicing spend,** priced by V6 at sign-off (section 10).
3. **The dialogue sample:** a few chatter lines and one exchange go to the user before the dialogue cycles continue (section 12).

Decided by the orchestrator and logged: room tone as in 6.12; the lit staff room; the printout's wording; the exchange topics and gates; the KO credits wording; the cooler coupling.

### 6.14 Rollout

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

**What m06 adds.** Screen habits on Dani's and Priya's own PCs (the first openings), a seen-only cake magnet that draws one of them from a desk and opens a screen-habit window (the first lever with a payoff), print-and-forget with fetch errands from real desks, a pair whose chatter happens in a working office, and the split POV background that follows an NPC's position.

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

The worst case at these caps is 64 small keys (workstation 24, frustration 6, workaround and `onUse` globals 8, `heard_` 8, servings 2, reveals 6, `onceOnly` 10) and about 3 KB of server records. None of it grows with play time: each piece has a fixed authored ceiling, and each change sends one key. The workstation globals change most often, but each change is one boolean. A scenario that gates a conclusion on a global flushes pending globals before its task-completion and skip POSTs (`ObjectivesManager.flushPendingGlobals()`, two delta-only `stateSync.sync()` calls, `objectives-manager.js:605-612`); that sends the same delta a little earlier, not new traffic, and office-life tasks never gate a conclusion, so they do not trigger it. A plan that needs more than a cap must say why, and the reviewer checks the sums against V8.

## 8. Field names and the format hardening steps

Scenario-format hardening steps 8a, 8b and 8c are on main (`FormatUpgrade::STEPS` holds all three; the current format is 3). They are specified in `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`. Every office-life pass writes format 3 names:

| Retired name | Format 3 name |
|---|---|
| `screenOwner` on a workstation | `owner` |
| `phoneOwner` on a desk phone | `owner`, plus `deskPhone: true` |
| `affordance.owners` | `owner` (a list on a private object) |
| `affordance.private` | object-level `private` |
| `phoneOf` on an item | `owner` |
| `leftBehindBy` (with optional `leftBehindChance`) | `owner`, with `leftBehindChance` |
| `screenHabit`, `printHabit`, `usbHabit` | `habits.screen`, `habits.print`, `habits.usb` |

`needsHome` no longer implies an owner, so ownership is always written explicitly: an `owner` on every owned workstation, desk phone and private object.

The schema is closed and the validator's retired-key check reports any old name as an error, so a pass cannot merge format 1 or 2 keys. `tools/format/rewrite_templates.rb` rewrites only pure-JSON templates; every campaign mission is an ERB template, so if a later format step lands while a mission's branch is open, the implementer edits the renamed keys by hand (about 2 to 6 in a pass) and proves the edit the way the step proves its own corpus: the step's `scenario` transform applied to the old render equals the new render. The implementer then re-runs the validator and V9 and logs the diff as mechanical. A key rename changes no spoken text, so it re-keys no audio and needs no new dialogue review. No renamable key is placed inside an ERB loop or tag, so each maps to a single span.

The branch also rebases over the other hardening steps that touch the mission while it is open (step 3's clue markers where they touch the mission, and steps 6a and 6b, which mark NPC fields client-visible or server-only), re-running the validator and V9 each time. Before the pilot's stage 4, the orchestrator asks the hardening session to confirm its 6a-1 client-visible list includes NPC `needs`, `chatter` and `exchanges`, which the client reads.

**m01 is a deployed scenario.** The hardening plan keeps its alias list empty because none of the four deployed scenarios uses a renamable office-life key, and a test fails if one starts to use a retired key (`SCENARIO_FORMAT_HARDENING_PLAN.md:27`). m01's pass writes format 3 names like every other, which that test accepts.

## 9. Engine gaps

The pilot needs **one runtime engine change**: E7, E8 and E9 together, approved by the user on 2026-11-14 and specified in 9.1. It touches only chatter pairs and exchanges, which m01, sis01, sis02 and lab_social_engineering do not have, so it does not by itself require fresh gate playtests of the deployed scenarios. The other items below are probes, tooling or later work. Every runtime or shared-data change goes to the user for approval and comes with unit tests, a focused test scenario and live proof.

| Id | Gap | Needed by | Proposal |
|---|---|---|---|
| E1 | Unproved live: a needs NPC attacked mid-walk outside its post room, and one knocked out there. Does it chase, calm down and walk back? Do `globalVarOnKO`, `taskOnKO` and the KO item drops fire once? Is a knocked-out NPC's job dropped cleanly? Also one NPC with `behavior.hostile` from the start. It also covers protection 3: an NPC in another room when the preceding event fires walks back and the beat opens. The server accepts a defeated NPC's drop outside its scenario room only once the defeat is recorded, so the probe includes an NPC holding an item, knocked out outside its post room, then a reload: the item must drop once, where the NPC fell, and the NPC must stay down. | every mission without `disableAttacks` | A live probe run in the showcase as slice SIMS-1, in its own `test_needs_attack` scenario, **before the pilot's design closes**, because the result decides which NPCs may move. If it fails, those NPCs keep needs inside their own room only, and the fix goes to the user as an engine item. Status, 2026-11-14: SIMS-1 is built on `build/ol-sims`, not yet on main. |
| E2 | No vending preset (the sprites exist) and no toilet. | optional, all missions | A vending entry in `office-presets.json` (hunger and thirst, a short use, a coin sound). Only test scenarios set `officePresets` today, so it changes no deployed game, but it is shared data and an approval item. It lands straight after the pilot, as its own item (the user's decision). Toilets: not planned. |
| E3 | Performance with more than 6 needs NPCs is unmeasured. The 6-NPC showcase has a mean tick of 0.19 ms. | m05, m08, any Tier 3 | Measure frame time with all of the pilot's needs NPCs active, at normal frame rate, before review. Measure first for any mission that would have more than 8. |
| E4 | Lazy room loading: a kitchen behind an unopened door is never used. | all | A design rule, not engine work. Need targets sit in rooms that load with the NPC's own room, or the plan accepts that the kitchen comes alive once the player opens it. |
| E5 | No guarantee that an NPC is at its post for a beat. | all with story NPCs | A design rule plus V2: the three protections in section 2. A "summon to post" helper is backlog only. |
| E6 | An arrival can be taken where the NPC is not. The showcase's baseline run caught an NPC entering `using` for an object in another room while it stood at its own desk; the suspected cause is that `_advanceJob` accepts any `npc_arrived:<id>` as arrival without checking where the NPC is. | every mission with walking needs NPCs, the pilot's pair first | Fixed in the showcase stream (slice SIMS-2 of `OFFICE_LIFE_SIMS_BUILD_PLAN.md`, move ids for arrivals, about 50 lines) before the pilot's stage 5 playtests. Not a pilot change: it lands on main through the integrator with its own tests, and the pilot rebases over it. Status, 2026-11-14: SIMS-2 is built on `build/ol-sims`, not yet on main. |
| E7 | A pool line is spent unheard. At pairing, `_pickBark` takes a line and starts the speaker's chatter cooldown whether or not anyone is in earshot; only an exchange waits for an audience. A coupled pair whose breaks start before the player arrives spends its lines on an empty room. | every mission with paired talk, the pilot first (6.4) | **Approved, scheduled before the pilot's stage 4** (9.1): a chat turn out of the player's earshot shows a picture and spends nothing. With it the pilot's cooldown is 2 minutes and its pools 4 lines. |
| E8 | The second user's cell is not checked for reachability. `besideCell` takes the first walkable cell right, left, below or above the first user's, without a path check (the object itself is route-checked when chosen, in `reachable()`), so a chatter object near a wall can send the partner walking until the 20 s job timeout, and the object is then skipped for 60 s. | every mission with a capacity-2 object near a wall; the pilot's cooler (6.4, 6.5) | **Approved, scheduled before the pilot's stage 4** (9.1): `besideCell` makes the route check `cellBeside` already makes, and a partner with no reachable side fails at once with `no_beside_cell`. With it the pilot's cooler is shared again. |
| E9 | An exchange can be marked heard with no line heard. It starts when either of the pair is in earshot, each line is marked overheard by its own speaker's distance, and `_finishExchange` counts an exchange that played to the end as heard whatever `heardLines` is, setting `heard_<knot>` and never offering it again. | every mission with exchanges, above all chained ones; the pilot's burn and cleared exchanges (6.8) | **Approved, scheduled before the pilot's stage 4** (9.1): an exchange starts only when its first speaker is in earshot, and counts as heard only when `heardLines > 0`. With it the cleared exchange is gated on the burn exchange being heard. |

**Alignment with the showcase.** A parallel stream is building `scenarios/test_needs_sims` into a full office day, where behaviour is proved before a mission uses it (branch `build/ol-sims`, plan `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` on that branch). The pilot depends on it as follows:

- **Before the pilot's design closes:** SIMS-1, the E1 probe, in its own `test_needs_attack` scenario. The pair never leave the staff room, so E1 does not decide their walks; it confirms that an attacked NPC chases, calms and walks home, and that KO globals fire once, which 6.11 then checks in m02.
- **Before the pilot's stage 4:** E7 to E9 (9.1), which also add a coupled pair with a 2-minute cooldown to the showcase.
- **Before the pilot's stage 5:** SIMS-2, the arrival check (E6).
- **Patterns the pilot uses that the showcase should show first** (scenario work, no engine change): an NPC whose only need is met by its own post object, so it takes part without moving, and which prints through the `needs: { print: { producer, forget: true } }` command from a mapping (Gary); a coupled break, where a mapping on `npc_use_started:<object>` with an `npcId` condition sets `<b>`'s matching need low so the two meet at one capacity-2 chatter object; and breaks started from `room_entered` and `conversation_closed` mappings with a 120 s cooldown. SIMS-3 on `build/ol-sims` adds the first of these (Neil, the still NPC who prints by command); the coupled break with a 2-minute cooldown comes with E7 to E9.
- **Not needed by the pilot:** SIMS-4 (E3, vending and Keith; vending is E2 and lands after the pilot), SIMS-5 (the leftover pizza, for m06), and the backlog SIMS-6 to SIMS-8.
- **Showcase rows to retire.** The showcase plan's m02 rows (its section on what each mission needs) describe an earlier pilot: Gary walking to a kettle and copier, `officeType: "fridge"` on the undercounter fridge, `hush` pools, and a second NPC reaching IT through a door. This pilot uses none of these, so the showcase need not prove them for m02; later missions whose text lets a story NPC walk can still draw on the showcase's walking staff.

The orchestrator sends the showcase owner these points, so SIMS-3 adds the patterns and the stale m02 rows are retired.

### 9.1 E7 to E9: build spec

Approved by the user on 2026-11-14 as one engine item, to land on main before the pilot's stage 4, so the m02 build uses it. All three stop chatter being spent on an empty room, and all three are in one file.

**Scope.**

- Engine: `public/break_escape/js/systems/npc-needs.js` only (the needs system and its live world adapter). No new import, so no JS test-harness copy list changes. No server, schema, validator or sync change: nothing new is saved, and `heard_<knot>` is still written once per knot.
- Branch `build/office-life-e7-e9`, in its own worktree. The showcase stream's `build/ol-sims` (SIMS-1 to SIMS-3, not yet on main on 2026-11-14) also edits `npc-needs.js` and `scenarios/test_needs_sims`, so the build branches from `build/ol-sims` if that has not reached main when it starts, and from main otherwise.
- Who it affects: every scenario where two needs NPCs pair at a chatter object or play an exchange. On 2026-11-14 that is `test_needs_sims` and `lab_physical_pentest` (chatter pools, and an exchange in each); `test_needs_leash` has needs NPCs but no chatter and is run as a walking regression. m01, sis01, sis02 and lab_social_engineering have no needs NPCs, chatter pools or exchanges, so the change does not require their gate playtests again.
- Out of scope, unchanged: one-off grumbles and turn-back lines, word-of-mouth announces (`ignoreCooldown`), the printer-off grumble, desk-phone calls and their heard rule (`_finishCall`), and the speech lock's rules for lines that are spoken.

**E7: a pool line is spent only when heard.**

- `_pickBark(s, topic, opts)`: a new option `unheard` (default `false`). When `true`, the bark branch is skipped as if the speaker were on cooldown: no line is taken from the bag (`_bagNext` is not called), `chatterQuietUntil` is not set, no `{ wait: true }` is returned, and the result is a picture, or `null` when the pool has `pictures: false`.
- `_tickChats`, the bark branch (after the exchange branch and the `chattiness` roll): before calling `_pickBark`, read the speaker's pool with `chatterPool(c.topic, this._scenarioChatter(), this._rec(sp).chatter)`, work out the radius as today (`c.overhearRadius || pool.overhearRadius || OVERHEAR_RADIUS`) and call `this.world.playerHears(c.speaker, radius)` once. Pass `unheard: typeof this.world.playerHears === 'function' && !h.overheard`, and reuse the same `h` for the `overheard` flag, `playerDistance` and the `npc_overheard` event further down, so the hearing check runs once a turn. A world with no `playerHears` (unit stubs) keeps today's behaviour.
- Side effects to keep: the `chattiness` roll and its salt are unchanged, so seeded runs stay deterministic; a picture turn calls no `_speak`, so a pair nobody hears no longer holds the global speech lock against a pair the player can hear; `npc_chatted:<object>` still fires for a picture turn, with a `picture:<icon>` line id and `overheard: false`.
- Unit tests, `test/js/npc-voiced-chatter.test.mjs`:
  - an unheard turn gives a picture, leaves the bag position and `chatterQuietUntil` as they were, and calls no `speak`; the first heard turn then takes the bag's next line and starts the cooldown;
  - with `chatterCooldownMin: 2`, over a 28 s overlap heard throughout, each speaker says exactly one line and then shows pictures;
  - a pair nobody hears does not take the speech lock: a heard pair at a second cooler speaks on its first turn;
  - the determinism test ("a whole chatter run with Math.random set to throw") passes unchanged.
- Existing tests: `test/js/npc-social-pairing.test.mjs` builds its world with `overheard: false` by default. Every test there that asserts a spoken line ("two at a chatter cooler take turns", "a short overlap gives fewer lines", "chattiness 0", "groups", "hush", "overheard and npc_overheard") gets an audience (`hears: () => ({ overheard: true, distance: 50 })`), or its assertion is changed to pictures where the test is about not hearing. Each changed assertion is listed in the build log with the reason.
- Showcase: in `test_needs_sims`, the pair that shares the coffee point gets `chatterCooldownMin: 2`, 4-line `coffee` pools and the coupling on `npc_use_started:<coffee point>` with an `npcId` condition, both ways (the m02 pattern), with a row in the showcase README's live-proof table. If SIMS-3 has already added such a pair, the build uses it.
- Live proof: a keyless server from the build's worktree, headless, `setFPS(20)` with fixed steps on, games started with `bootstrap {"tutorial":"decline","resume":"new"}`. Start a coupled break with the player in another room and read `window.__test.needs`: every `npc_chatted` for that break has a `picture:` line id and the bag position is unchanged. Then walk the player in during a break: the next turn speaks a bag line with `overheard: true`, and a screenshot shows the bubble. Three runs each, screenshots in the session scratchpad.

**E8: the second user's cell must be reachable.**

- The live adapter's `besideCell(cell, taken, opts = {})` (near the end of `npc-needs.js`, beside `cellBeside`): with `opts.from`, a side cell (right, left, below, above, as today) that is walkable and not taken must also pass `this.routeLength(opts.from, c, { avoidRooms: opts.avoidRooms })`, which returns `null` when there is no route; the first side that passes wins, and with none it returns `null`. Without `opts.from`, today's behaviour. This is the check `cellBeside` already makes for visits, without its fallback to the first walkable side.
- `_moveForPhase`, the capacity-2 block that picks a second user's cell: pass `{ from: this.world.npcPos(id), avoidRooms: this._avoidRooms(s) }`. When the default cell is taken and `besideCell` returns `null`, call `this._failJob(s, 'no_beside_cell')` and return, the same path as `no_approach`: `npc_job_failed:<npcId>` with that reason, the object on the NPC's `FAIL_COOLDOWN_MS` cooldown, and the walk home. Today such a partner stands on the first user's cell, or walks to an unreachable cell until its 20 s deadline. The new reason needs no V5 change, because `npc_job_failed` is already listed by name.
- Cost: `routeLength` runs synchronously, and only when a second user of a capacity-2 object finds the default cell taken, so at most four path searches per job start.
- Unit tests:
  - `test/js/npc-needs-cell-beside.test.mjs`, with the same pathfinding stubs as the `cellBeside` tests: with `from`, a walkable side the NPC cannot reach is passed over; with `from` and no reachable side, `null`; without `from`, the first free walkable side as today; a taken side is still skipped;
  - core, in `test/js/npc-social-pairing.test.mjs`: a world whose `besideCell` returns `null` for the second user gives `npc_job_failed` with reason `no_beside_cell` on the same tick, the NPC goes home, and the object is skipped for `FAIL_COOLDOWN_MS`; with a reachable side, the two pair as before;
  - `test/js/npc-needs-tick-cost.test.mjs` passes unchanged.
- Showcase: a neutral capacity-2 chatter object in `test_needs_sims` with one side cut off (behind furniture or in a nook), shared by a pair; if no existing object fits, a cooler in a corner of an existing room, declared from the catalogue.
- Live proof: five coupled breaks there; on each, the second user stands on a reachable side, both are `using` at once, and there is no `timeout`. Then a placement with every side cut off (a throwaway copy, not committed) gives `no_beside_cell` within one tick, and the NPC walks home. Screenshots of both users at the object.

**E9: an exchange needs a heard first line.**

- `_tickChats`, where an exchange starts: replace `this._audience(c, c.overhearRadius || OVERHEAR_RADIUS)` with `this.playerHears(ex.lines[0].speakerId, c.overhearRadius || OVERHEAR_RADIUS)`, the system's existing public method, which also returns `false` for a world with no `playerHears`, as `_audience` does. The exchange then starts only when the player can hear its first speaker; hearing the partner alone gives a bark or picture turn instead. `_audience` is left with no caller and is removed.
- `_finishExchange`: `const heard = ex.heardLines > 0;` in place of `complete || ex.heardLines > 0`. An exchange that played to the end with no line overheard is logged as `exchange_unheard { knot, of }`; it is not added to `_exPlayed`, `heard_<knot>` is not set and `npc_exchange_heard` does not fire. `c.exDone` stays `true`, so it does not restart in the same meeting, and a later meeting in earshot plays it from the start. The cut path keeps its rule (heard when a line was overheard), and `npc_exchange_heard` keeps its payload, `complete` included. With the start gate, the first line is heard whenever it starts on the same tick; the unheard case arises when that line waits for the speech lock and the player leaves in the meantime.
- The rule, as `NPC_NEEDS_SYSTEM.md` 5.6a will state it: an exchange counts as heard when the player overheard at least one of its lines, whether it played to the end or was cut. This replaces the rule recorded in `docs/achitechture/EXCHANGE_HEARD_FIX_LOG.md` ("played to the end, or cut after a heard line"), whose stated reason, that the start already needed the player in earshot, held only for either speaker and not for the lines.
- Unit tests, `test/js/npc-exchange-heard.test.mjs`:
  - the player hears only the second speaker: no `exchange_started`, and that turn is a bark or picture;
  - played to the end with no line overheard (the first line waits for the speech lock and the player leaves): `exchange_unheard`, no `heard_<knot>`, no `npc_exchange_heard`, and the next meeting in earshot plays it from line 1;
  - a chained gate, an exchange with `requireGlobal: { "heard_<first>": true }`, opens only after a line of the first was heard;
  - the existing tests pass, "completed" and "room change" included; any whose assertion relied on `complete` alone is listed in the build log with the reason.
- Showcase: `test_needs_sims`'s `hear_parcel_exchange` task still completes on a heard exchange.
- Live proof: with the player placed in earshot of the second speaker only as a pair meets, no exchange starts (decision log); with the player in earshot of the first speaker, it starts and is marked heard with `heardLines` of 1 or more. Screenshots of both.

**Checks for the whole item.**

- Commit each step before running tests or live checks, with explicit paths; fixes are follow-up commits.
- `bin/test-js -j 3` in full; `ruby scripts/validate_scenario.rb` on `test_needs_sims`, `test_needs_leash` and `lab_physical_pentest`, 0 errors.
- Live regressions on the build's keyless server: `test_needs_leash` passes, and `lab_physical_pentest` scores 100 on `verify-run.rb` (it has chatter pools and an exchange); a line in the lab's `IMPROVEMENT_LOOP_LOG.md` office-life slices note.
- Docs: `NPC_NEEDS_SYSTEM.md` 5.6 (pairing) and 5.6a (cooldown, order, the heard rule); the showcase README live-proof rows; a build log, `docs/achitechture/OFFICE_LIFE_E7_E9_BUILD_LOG.md`, with every changed test assertion and the live game ids.
- Implementation review: at least 2 rounds and at most 5, each by a fresh reviewer with live proof, stopping at a round with 0 blockers and 0 majors.
- Merge: through the integrator, on the batch tip with the full suites. The pilot's branch rebases over it before stage 4 starts.

## 10. Voicing

The user decided on 2026-11-14 that each mission is voiced after its reviews and playtests close, and then merged. The pilot counts as a proper office-life scenario.

- **During development**, the branch lives in its own worktree, and every stage 5 and stage 6 run uses a keyless server started from that worktree on a port in the running session's own range (3002 if the session has no range):

  ```
  env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<main repo>/vendor/bundle \
    bundle exec rails server -b 127.0.0.1 -p <port>
  ```

  Games are created with `bundle exec rails runner tools/playtest/new-game.rb` from the worktree (a worktree has no `.bundle/config`; `PLAYTEST_PORT` only changes the printed URL). The suite runner assumes :3001, which serves the main checkout, so the branch's regression playtests are driven by hand. No audio is generated, and new lines show as text and speech bubbles. The worktree shares the development database (AGENTS.md, "The dev database is shared"): seeding is allowed, and `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop` and `db:setup` are never run. Only the batch-tip checks after the merge run on :3001. Nobody plays a pass branch on :3000 or any other keyed server, which would generate clips on first play. If that happens anyway, `tts:wasted` and the tts-audio pruning step clear the stray clips before commit.
- **Voice before merge.** Missions ship together in the gem, and releases are cut as branches from main. Reverting one mission's commits from a release branch would conflict with later work, so office-life content reaches main only once it is voiced. Voicing runs straight after the reviews and playtests close, so a branch waits days, not weeks.
- **Merge rule.** One integrator session moves main for every work stream. The pass hands the voiced `build/office-life-<m>` branch to the integrator with its check list, and it goes into the current merge batch like any other build branch. The mission's own checks run on the batch tip next to the full suites (`bin/rails test`, `bin/test-js -j 3`): the validator, the route suite, V9, V6 (0 uncached office-life clips) and a short scripted regression playtest. The integrator fast-forwards main to exactly the hash those runs used. A voice-style change on main re-keys clips, so V6 runs on every batch tip that carries the mission.
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
  - about 4 to 8 lines per topic per NPC, with `chatterCooldownMin` at its default of 5 minutes or more, so a line rarely repeats in a session; a coupled pair whose breaks come every few minutes may go down to 2 minutes with 4 lines per topic, because with E7 a line is spent only when the player hears it, as long as a player who stays in the room hears no line again within about 15 minutes;
  - no change to existing voiced lines without listing it.
- **Budget guide per mission, in clips:**
  - Tier 1: about 20 to 40 clips;
  - Tier 2: about 40 to 80;
  - Tier 3: about 80 to 140.

  Office-life speech in a campaign mission uses NPC chatter pools, exchange knots and call knots only, which the line extractor, V6 and the batch all cover. EventMapping `bark` lines are voiced live on first play and are outside the extractor, V6 and the batch (`tts_line_extractor.rb`, its header), so the merge gate could not see one; a pass adds none until V6 and the batch are extended to cover them, which would be an approval item. Campaign missions use **NPC-own chatter pools only**, with no scenario-level `chatter`. The line extractor voices every shared pool line for every voiced room NPC (in m02, every voiced person record in a room, briefing and debrief records included), and the waste report treats those clips as expected, so shared pools would voice lines nobody speaks. If shared pools are wanted later, narrowing the extractor to NPCs with needs or chatter is an engine item for approval. V6 gives the exact figure.

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
| Engine or shared data | section 9 | for the pilot, E7 to E9 (approved, 9.1) | user |
| Review and playtest time | section 12 | 3 to 5 plan rounds, 2 to 5 implementation-review rounds, 2 to 5 design-review rounds, about 5 dialogue cycles, up to 3 playtest rounds | orchestrator |

All of a mission's approvals go to the user on one review page in stage 3, with the plan's recommendation marked for each.

## 12. Review loop for each mission

Round rules, from the standing rules for built missions:

- **Plan review** runs 3 to 5 rounds and stops at a round with 0 blockers and 0 majors after round 3. This is stricter than the AGENTS.md minimum of 2, because the plan changes finished missions.
- **Built-mission phases** (implementation review, scenario design, dialogue) follow AGENTS.md: at least 2 rounds and at most 5, stopping after round 2 or later once a round finds no blockers or majors. Dialogue aims for about five cycles, as a design-heavy stage.
- **Room dressing and lighting** (stage 4, slice 5) are design-heavy: about five cycles each, up to ten while they keep improving, stopping when a cycle finds nothing above minor.

Each round is a fresh read-only reviewer on the planning tier, with findings tagged blocker, major or minor and cited by file:line. A resumed fixer acts on them: the implementation tier for mechanical findings, the planning tier for findings that need a design call. Every finding gets an outcome: fixed, withdrawn with the reason, or deferred with the reason.

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
   - A scripted regression run (scripted-playtest tier) of the mission's existing walkthrough with office life on. Every step must pass, and nothing mapped to NPC position may fire early or twice.
   - A persona run (persona tier) of 10 to 15 minutes. It uses the mission's levers, if any (for m02: the IT door pick with the pair present, a knock-out of each, and a reload), watches the office day, tries each opening, attacks one moving NPC, and reloads once mid-mission.
   - A check through the `window.__test.needs` bridge that posts, leashes and privacy hold.
   - A frame-time reading (E3).
   - Where the mission sets `roomTone`, a listen through a north or south door as well as an east or west one.

   At most 3 rounds, then a short confirmation run. A run counts only when `tools/playtest/verify-run.rb` shows progress. Any "stuck" claim from a scripted run is checked by a persona-tier run before it counts. The blind playtest that ends AGENTS.md's phase 5 waits for the lab-sheet update, which the user has written last.
6. **Art follow-ups** (stage 6) and their closing check, then **voice** (stage 7), then **close and merge** (stage 8).

## 13. Building the skill itself

1. Write `.claude/skills/mission-office-life/SKILL.md` and the four reference files from this plan. A planning-tier writer does this, followed by one review round by a fresh planning-tier reviewer against the showcase scenarios.
2. Build the tooling: V9 (the lock and key diff), V6 (the voice report task), and `scripts/validate_office_life.rb` with V1 to V5, V7, V8 and V10 and the campaign-mission scope for V2, V4 and V5, all with fixture tests. After committing, run `bin/test-js -j 3` and the validator tests in full, since the labs and test scenarios must stay at 0 errors; any fix is a follow-up commit. Write the V6 stop for the bump-version skill, to be added through the integrator with the first office-life merge (section 10), and add a short office-life section to the tts-audio skill (V6, `ttsPregenerateChatter: true`, voice before merge, the branch worktree's keyless server for drafts), whose current note says chatter is generated on first play. An implementation-tier implementer works from a short spec, followed by one planning-tier code review.
3. Run the E1 probe (the showcase's SIMS-1) and take the arrival check (SIMS-2) through the integrator.
4. Build E7 to E9 to the spec in 9.1 and take them through the integrator. This runs alongside steps 1 to 3 and must be on main before step 6.
5. Run the pilot's stages 0 to 3 on m02. Stage 3's picks are already in for Gary, the new people, seating, the radio run and E7 to E9 (6.13); the review page carries only what is still open.
6. Run the pilot's stages 4 to 8.
7. Revise the skill from the pilot's log, then continue the rollout (section 6).

## 14. Decisions taken and what waits on the user

The user's decisions of 2026-11-14, which this plan follows:

1. **Pilot:** m02 ransomed_trust (section 6). m06 is the second mission.
2. **m01:** in its normal rollout slot (section 6.14), with the m01, sis01 and sis02 gate playtests run again when it lands.
3. **Format steps:** write the names current at stage 4 (format 3 today) and rename by hand on rebase if a later step lands (section 8).
4. **Voicing:** each mission is voiced after its reviews and playtests, then merged (section 10).
5. **New rooms and NPCs:** Tier 3 is allowed, and each new room or NPC needs the user's approval on the mission's review page.
6. **Openings:** optional content only. A bypass of a required lock is not offered.
7. **Vending preset (E2):** added straight after the pilot as its own item.
8. **m09 and m10:** analysis only, Tier 0 expected.

9. **m02 Gary:** he stays where he is, sips his cold mug and prints by command after the keycard conversation; no lines change (6.2).
10. **m02 new people:** the night porter Ernie Bautista and the night domestic Hodan Warsame, with the recommended cast and voice styles (6.3). Their art is a separate spend, still to be confirmed.
11. **m02 seating:** two tables, no seating data change (6.4).
12. **m02 radio run:** not in the pilot (6.3).
13. **E7, E8 and E9:** one engine item, landing before the pilot's stage 4, so m02 uses a 2-minute cooldown, 4-line pools and a shared cooler (9.1).

Also: no production release until office life has settled across the rollout.

Waiting on the user, each when its step comes:

- the PixelLab spend for the porter's and the domestic's art (scope and count confirmed before any generation; concepts through agy need no approval), and then the pick from four talk inits for each;
- the voicing spend for m02, priced by V6 at sign-off (about 53 new clips);
- the dialogue sample on the pilot (section 12), before the dialogue cycles continue;
- for each later mission, its own stage 3 review page.

Not waiting on the user, but outstanding elsewhere: SIMS-1 (E1) and SIMS-2 (E6) are built on `build/ol-sims` and still need to reach main through the integrator; the hardening session's confirmation that its 6a-1 client-visible list covers NPC `needs`, `chatter` and `exchanges` (section 8).

## Appendix: handover

State on 2026-11-14 (draft 15): plan only, nothing built. The pilot is m02. It rests on two new non-clinical night staff in the Night Handover room, the porter Ernie Bautista and the domestic Hodan Warsame (approved), who wait there for radio calls between runs, because every existing m02 NPC is fixed by a beat or by its text and talk needs a pair. Gary stays still, sips his cold mug and prints by command after the keycard conversation, with no line changed. The pair's posts and break timings in 6.4 were measured on a live prototype: shared breaks at the boiler, started by either NPC's caffeine, by entering the staff room, by the close of the keycard conversation (the burn exchange) and of Kim's conversation, and by arriving in the corridor from the ward; shared breaks at the cooler when thirst falls; both coupled on `npc_use_started`; the microwave is solo. The engine item E7 to E9 (lines spent only when heard, a reachable second-user cell, an exchange heard only when a line was) is approved and specified in 9.1, and lands before the pilot's stage 4, so the pilot uses a 2-minute cooldown, 4-line pools, a shared cooler and a cleared exchange gated on the burn exchange being heard; 6.4 records the fallback if it slips. About 53 new clips. There is no staff-room phone (it would break Bernie's count of internal phones). Format steps 8a to 8c are on main, so every pass writes format 3 names (section 8).

Requests to other sessions: the E7 to E9 build starts from 9.1; the integrator adds the V6 release stop with the first office-life merge (section 10) and takes SIMS-1, SIMS-2 and E7 to E9 to main; the hardening session confirms its 6a-1 client-visible list covers NPC `needs`, `chatter` and `exchanges` (section 8); the showcase stream takes the alignment points in section 9.

The next step is section 13 in order: write the skill, build the tooling with the V5 lists in section 4, run E1 in the showcase, build E7 to E9, then m02's stages 0 to 3, whose review page carries only the items still open in 6.13.
