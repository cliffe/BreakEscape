# Office life in the campaign missions: plan for a reusable skill

Status: plan only, nothing built. Written 2026-11-13, after the user's go-ahead that day.

This plan covers a new skill, `mission-office-life`, which brings the office-life engine (NPC needs, habits, chatter, exchanges, levers, the physical-pentest mechanics) into the SAFETYNET campaign missions m01 to m10. Each mission is handled in its own extra pass with four steps: analyse, design, implement, review. The plan sets out:

- the skill's stages;
- the validator and report support it needs;
- how well each mission fits;
- a pilot and a rollout order;
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

1. **Office life never gates the critical path or a VM flag.** The campaign missions are a spy thriller with required VM flags. Office life adds atmosphere and optional content: intel, an optional task, a side room, an optional conversation. No required task, objective, `concludeRequires` or required lock depends on an NPC's needs timing, on an office-life event, or on a global that office life writes.
2. **Canon and the lock and key structure stay as they are.** No lock, key, PIN, password, card, gate or flag is moved, removed or given a second way past it. A physical-pentest opening opens **optional content only**: a side room, a drawer of intel, an optional task. An opening that would bypass a lock the critical path uses counts as a lock and key change. It needs the user's approval on the mission's review page, the plan names the server-side check that still guards that lock, and the lock and key diff lists it. New rooms join off existing rooms and never sit between the player and a required step. Section 3, stage 0 defines the lock and key baseline that proves this.
3. **No large rewrites.** Existing knots, barks and eventMappings stay. New spoken material goes into new chatter pools and new exchange knots. An existing line changes only to fix a contradiction the change creates, and every such change is listed, because it costs re-voicing.
4. **Social compatibility.** NPCs chat only with people they plausibly get on with. Distrusted or suspect NPCs carry `needsCompany.avoids` entries (the user's own example: nobody joins m01's Derek at the cooler).
5. **Room leash and private objects.** Every needs NPC has a post (`needsHome`), a leash (`needsRooms` or `needsAvoidRooms`) and stays out of other people's private rooms (room-level `needsPrivateTo`). Private things (an owner's PC, their kettle) carry an explicit owner and are marked private.
6. **Voiceable speech.** Every spoken line lives in a scenario file: NPC `chatter` pools, scenario-level `chatter` pools, eventMapping `bark` fields or ink. Nothing is spoken from engine text. Chatter lines are one line, 40 characters at most, with no `{ }` variables and no speaker prefix. Exchanges are heard once.
7. **Cast.** A new NPC brings variety in ethnicity and age to that mission's cast, and the concept prompt says what was chosen. A recurring named character uses their own sprite key, never a generic one.
8. **Props are square to the walls**, with one or two angled props per room at most, placed through the mission-room-dressing rules.
9. **Sync stays small.** No new state grows in player_state. Each new piece is a bounded value sent as a per-key delta (section 7).
10. **Students' missions are protected.** m01, sis01 and sis02 are played by students on Hacktivity and sit behind the production deploy gate. m01 is not touched until the user says so (section 6). sis01 and sis02 are not campaign missions and are out of scope. A mission's office-life work stays on its own branch until it is reviewed and voiced (section 10), so no release ever carries half-done office life.

## 2. What the engine offers today

Everything below is built and merged. The field names are today's names; section 8 covers the coming renames. The author references are:

- `docs/achitechture/NPC_NEEDS_SYSTEM.md`, sections 3 and 5;
- the slice sections of `docs/achitechture/OFFICE_LIFE_PLAN.md`, and its section 12.11, written for this skill;
- `README_scenario_design.md` for access, work needs, workarounds and feeds;
- `scripts/scenario-schema.json` for every field.

| Area | Fields and events | Showcase |
|---|---|---|
| Needs and posts | `needs.<name>{decayPerMin, urgentAt, initial, weight, maxUnmetMin, jitterPct, deferrable}`, `needsHome`, `needsSpeed`, `interests`, `onUse` | test_needs_sims |
| Presets | scenario `officePresets: true`; `office-presets.json` gives a default `affordance` for desk PCs, coffee, kettle, cooler, fridge, microwave, sofa, copier, shredder, filing, post tray, desk phone | test_needs_sims |
| Leash and privacy | `needsRooms`, `needsAvoidRooms`, room `needsPrivateTo`, `affordance.private`, `affordance.owners` | test_needs_leash |
| Social | `needsCompany{groups, avoids, avoidRadius}`, `maxQueue`, `needsDeferMin` | test_needs_sims, lab_physical_pentest |
| Talk | NPC and scenario `chatter` pools, `chattiness`, `chatterCooldownMin`, `exchanges[{with, knot, requireGlobal}]`, `answersPhones`, `phoneCalls` | test_needs_sims |
| Levers | magnet items (`affordance.magnet`, the cake), `offWhen` outages with switch objects, `desk_phone_ring:<id>`, droppable items with `interests` | test_needs_sims, test_access_work |
| Workstation habits | `screenHabit`, `printHabit`, `usbHabit`, `workstation`, `lockChance`, `autoLockSeconds`, `screenOwner`, `leftBehindBy`, `leftBehindChance`, `outputOf`, `revealOnGlobal` | test_needs_sims, test_access_social |
| Awareness | `awareness` low, medium or high; `habits.{locksScreen, writesDown, password, passwordPattern, holdsDoors}` | test_access_habits |
| Work and frustration | top-level `roles`, `resources{kind, access, object, offWhen}`, NPC `workNeeds`, `frustration`, `workarounds` (`writes_down`, `prop_door`, `emit`, `borrow_session`, `share_login`) | test_access_work, lab_physical_pentest (Kieran Doyle's wedged door) |
| Friendface | `feed{site, person, posts}`, reactive posts, replies, reactions, the `phoneOf` phone item | test_access_social |
| Physical pentest | `rfid` doors with `access`, `# clone_keycard` in ink, door `gate` (tailgating), `wearable` disguises, keypad shoulder-surf windows, USB drops, network jacks and drop boxes, capture log | lab_physical_pentest, test_gate_tailgate |
| Atmosphere | `roomTone`, `swivelChance`, `lockCues`, `showPressingNeeds` | test_needs_sims |

No m01 to m10 mission uses any of this yet. All ten validate with 0 errors, all have lighting and POV backgrounds, and all are finished (m09 and m10 included). Vending sprites exist (`assets/objects/vending_machine1.png`, `drinks_vending1.png`) but have no preset. There is no toilet object.

Limits that shape the design:

- **Only loaded rooms exist.** The needs system sees objects only in rooms the player has opened. A kitchen behind an unopened door is never used, and an NPC in an unloaded room is not simulated. Each NPC's post and need objects belong in its own room, or in a room that is always loaded with it.
- **Scripts win over needs.** A scripted walk (`goToAndStay`, a patrolOverride, a walk home after a conversation) suspends needs. An eventMapping can set `"needs": "suspend"` or `"resume"`. A needs NPC may not also have `behavior.patrol`.
- **There is no "be at your post for this beat" guarantee.** A story-critical conversation needs the NPC to be reachable. Either the NPC stays stationary, or it keeps needs only inside its own room, or the beat suspends needs first.
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
- `references/fit-checklist.md`: the analysis checklist from stage 1.
- `references/costs.md`: how to price art, voice and approvals (section 11).

Triggers: "bring office life into m0X", "add office life", "make the staff feel alive", "add a kitchen and coffee to the mission", "add needs to the NPCs", "add physical-pentest openings to m0X".

The skill plans first, then builds. Stages 1 and 2 produce a plan in the mission folder. Stage 3 settles approvals with the user. Stages 4 to 8 build, review, dress, voice and close it. Each stage has inputs, outputs and an exit test.

Agent routing, from AGENTS.md "Choosing a model":

- Planning, review and dialogue writing go to Opus.
- Mechanical implementation from an approved plan goes to Sonnet.
- Physical-pentest openings and any text naming security techniques go to the security-writing agent type that AGENTS.md names for VM and technical material. If a safety classifier stops that agent, follow AGENTS.md's stop procedure.
- Every multi-step brief carries the handover rule: at about 150k tokens or 80 tool calls, finish the step, commit, write a handover note, report and stop.

### Stage 0: preconditions and baseline

Inputs: the mission name.

Checks:

- the mission kind, from AGENTS.md "Kinds of game" (campaign missions only; any other kind needs the user's say-so);
- whether the mission is behind the production deploy gate (m01: the skill stops and asks);
- the format version and whether steps 8b and 8c have merged (`STEPS` in `lib/break_escape/format_upgrade.rb`);
- the cached clip count in `tts_cache/<mission>/`;
- a clean validator run.

Outputs, in `scenarios/<m>/office_life/`:

- `BASELINE.md`, holding:
  - the validator summary;
  - the aim chain's critical path from the dungeon graph;
  - the `gameClock` start and rate, if any;
  - the cached clip count;
  - the walkthrough file it was checked against.
- `baseline_locks.json`, the **lock and key baseline**, written by a small extractor (`scripts/extract_lock_key.rb`). It records:
  - every door and object lock (kind, room, what opens it);
  - every key, card, code and password source;
  - every `gate`, `access` list and `wearable`;
  - every task, objective and `concludeRequires` with its trigger.
- Saved copies of the validator's `ℹ️` lines and of the `--office-summary` output (section 4), for later diffs.

Exit: the baseline is written and the validator shows 0 errors.

### Stage 1: analyse

An Opus analyst reads the scenario, its ink, the dungeon graph, the walkthrough and the mission's logs, and fills in `fit-checklist.md`:

- **Rooms.** Each room's type and whether it is office-like. Any kitchen, break room, coffee point, cooler, vending, printer or toilet. Which rooms load together. Spare space for a kitchenette. Which rooms have a `chatBackground`.
- **NPCs, classified one by one:**
  - story-critical: holds a required task, a conversation the critical path needs, a key or card source, or a cutscene role;
  - suspect or plot-located: the deduction relies on where they are;
  - optional flavour: an optional conversation only;
  - ambient: no story duty;
  - hostile from the start, or patrolling;
  - several records of one character (one person written once per beat or room);
  - non-human (an AI receptionist, a hologram);
  - phone or cutscene only.

  The last four classes never get needs. Every NPC in a mission without `disableAttacks` is marked "can be attacked".
- **Beats keyed on NPC position or presence:** `npc_arrived`, conversation-reachable knots, sight and line-of-sight challenges, KO tasks and globals, `initiallyHidden` reveals.
- **Tone and time of day.** Crisis, night shift, a hostile building, the game clock. Office life suits a working day. Evening or night missions get a thinning office (staff working late, a cleaner, a security round) or the light tier.
- **Physical security already present** (RFID, keypads, PCs with sign-in, guards), and where an opening could reward optional content.
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

   "Beats protected by" names how each story beat stays safe: the NPC is stationary, keeps needs inside its own room, uses `deferrable: false`, or a `needs: suspend` mapping runs before the beat. The last column says what the E1 probe result means for this NPC.
3. Rooms and objects: each new or changed object, with its room, position, sprite key, preset or hand-written affordance, and a dressing note (square to the walls). A new room comes with the door that joins it and the lock it uses.
4. Levers: what the player can do to move people (deliver the cake, ring a desk phone, throw a breaker, jam the printer) and what each lever opens. Every lever is optional.
5. Physical-pentest openings: each opening, the cyber security lesson it carries, the optional content it rewards, and the CyBOK area if it adds one. Any opening that touches a critical-path lock is listed separately as an approval item (rule 2).
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

The orchestrator gathers every approval item in the plan into one review page (artifact) with a "Copy picks" box, as AGENTS.md "Asking the user for input" describes. Typical items:

- new rooms;
- new NPCs, with the cast choice for each;
- new art;
- any opening that touches a critical-path lock;
- any engine or shared-data change;
- the voicing spend;
- any change to an existing spoken line.

Paid steps wait for the picks. Mission-local work that needs no approval carries on.

### Stage 4: implement

Work happens on a branch, `build/office-life-<m>`. A Sonnet implementer works from the approved plan in slices, one commit per slice, with explicit paths. An Opus writer handles the exchange and phone-call knots. The security-writing agent type handles the pentest openings' text. The slices, in order:

1. New rooms and objects (placed with mission-room-dressing), then presets, needs, posts, leashes and privacy.
2. Workstation habits (screen, print, USB) and awareness.
3. Chatter pools and exchange knots.
4. Levers and physical-pentest openings.
5. Room tone, last, because it follows the final layout and dressing.

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

Renamable office-life keys are never written inside an ERB loop or tag, so a format rewrite can map each one to a single span.

Exit: all slices committed on the branch, static checks clean, and `scenarios/<m>/office_life/BUILD_LOG.md` written.

### Stage 5: review

The per-mission review loop is in section 12.

### Stage 6: art follow-ups

This stage runs for **every room the pass changed**, not only new ones. It follows the order AGENTS.md sets:

1. mission-room-dressing for each changed room;
2. mission-room-lighting, to check new screens, machine glow and dark corners;
3. room-pov-background, redone for each changed room that has a `chatBackground`, because the background copies the final layout;
4. pixellab-character-pipeline for any new NPC: a concept through agy, the walk atlas, the bust, visemes from a talk run, and seated frames if they sit.

### Stage 7: voice

The tts-audio skill runs once the mission's words are signed off (section 10).

### Stage 8: close

- Record each round's severity table and every finding's outcome in `scenarios/<m>/office_life/LOG.md`.
- Flag the lab-sheet impact for the user: new optional routes and openings change what a student can do, and lab sheets are written last, by the user's rule.
- Update `CYBOK_MAPPING.md` if an opening teaches something new.
- Merge the branch only after stages 5 to 7 have closed. Fold the lessons into the skill's references.

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
| V2 | A needs NPC who owns a knot that sets a required task, or is the target of a conversation-mode mapping, or is a key or card source, and whose needs can take it out of its own room without `deferrable: false` or a `needs: suspend` mapping before the beat. | warning | Story NPCs must stay reachable. |
| V3 | An `npc_arrived:<id>` mapping on an NPC that has `needs`. | warning | Needs arrivals fire these mappings. Nothing to catch today; cheap insurance. |
| V4 | A needs NPC in a scenario without `disableAttacks`, until the E1 probe has passed. After that it becomes an info line that lists the NPC's KO globals and tasks for the reviewer. | warning, then info | Any NPC can be attacked mid-walk. |
| V5 | A required task, objective, `concludeRequires`, required lock, or mapping that completes a required task, whose trigger is a global written only by office life or an office-life event. The globals are a workaround `setGlobal`, an `onUse.setGlobal`, a magnet servings global, `heard_<knot>`, the workstation globals and the reveal globals. The events are `npc_exchange_heard`, `npc_chatted`, `npc_used`, `npc_queued`, `desk_phone_answered`, `workstation_screen_changed`, `npc_left_post`, `object_revealed`, `magnet_placed`, `npc_workaround` and `npc_print_*`. | error | Rule 1. Extends the existing workaround-global rule to every office-life global and event. |
| V6 | `rails break_escape:tts_office_lines[<mission>]`, a rake task beside `tts:wasted` that uses `TtsLineExtractor` with `chatter: true`. It lists every chatter, exchange, call and bark clip **per voice** (a shared pool line counts once for each voiced NPC who can say it), marks each as cached or uncached under the current cache key, and totals characters and clips. | report task | Prices the voice cost in stage 2 and drives stage 7. It has to live in Rails, because the cache key and line extractor do. |
| V7 | A chatter pool line that repeats another pool line or an existing bark word for word, or matches the first line of the same NPC's ink opener. | warning | npc-dialog-review's "same fact twice" rule, made mechanical. |
| V8 | Sync budget: counts, by kind, the globals office life can write (the same kinds as section 7) and prints each kind's total and the sum. Warns when a kind passes its cap in section 7. | info, warning above a cap | Keeps the sync size rule visible. |
| V9 | `scripts/extract_lock_key.rb --diff <baseline>`: the lock and key extractor used for the stage 0 baseline. Diffs doors, locks, key and code sources, gates, access lists, wearables, and task and objective triggers. It also flags any new door or gate whose far side holds a required task or a critical-path lock. | report tool | Rule 2. The aim-chain critical path shows only the order of objectives, not which locks open which doors. |

All nine are built before the pilot's stage 4. Each gets fixture tests under `test/` and a line in `README_scenario_design.md`.

Format steps 8b and 8c rewrite the owner and habit readers in the same validator files and rename keys that V1 reads. So the tooling is built **after 8b and 8c have merged**, on the format 3 names (section 8). The extractor (V9) and the rake task (V6) touch no renamed key and can be built earlier.

## 5. Per-mission fit

This table comes from a survey of the ten scenario files on 2026-11-13. "Cached" is the number of voiced clips already in `tts_cache/<m>/`. Stage 1 checks each row again before a pass starts.

| Mission | Setting | Office-like rooms and kit today | Suggested tier and features | Main risk |
|---|---|---|---|---|
| m01 first_contact | Media and PR office | 13 rooms including a break room (notes only), open office and meeting room. 4 stationary staff, each with KO globals and tasks. 3 PCs. Cached 1365. | Tier 2. Coffee and cooler in the break room. Needs for Sarah, Kevin and Maya inside their own rooms. Derek isolated with `avoids`. Screen-lock habits. A cake lever. | Played by students, behind the deploy gate, large audio cache. Last, and only with the user's go-ahead. |
| m02 ransomed_trust | Hospital at night, ransomware crisis | Staff room, kettle in IT, cooler in the conference room. 2 patrollers. Cached 1113. | Tier 1. Kettle and cooler presets, short grumble pools in a crisis voice, one exchange in the staff room. No wandering on the ward. | Casual chat clashes with an urgent crisis. Ward patients and patrols must not change. |
| m03 ghost_in_the_machine | Pentest firm, night infiltration | 7 rooms, no kitchen, few staff. Cached 643. | Tier 0, or a small Tier 1: a coffee point and an exchange at reception before the night transition. | Night premise. The night transition is a story beat. |
| m04 critical_failure | Battery storage plant | Ops office and reception only. Hostile operatives. Timed. Cached 525. | Tier 1. An ops-office kettle, and desk presets for Robert Vance confined to his room. A little shift chatter. | Live threat and a timer. Hostile NPCs never get needs. |
| m05 insider_trading | Quantum crypto company hunting an insider, from 16:30 | Break room (leaflet note) and an open office with no declared objects. Every staff NPC is story-critical: Owen (required talk, RFID clone source), Patricia (keycard), Halloran (badge in the flag deduction), Lisa (talk task, KO task). Cached 725. | Tier 2 or 3. Kitchen kit in the break room, with Lisa's needs confined to it. A thinning evening office with one or two new ambient staff at new desks. Screen-lock and print habits on those new desks. Story staff stationary. | Every existing NPC carries a beat. The visible life needs new NPCs and desks, so art and approvals come first. |
| m06 follow_the_money | Crypto exchange; the player poses as a visiting supervisor | Trading floor with a trading workstation. Optional flavour conversations with Dani (trader) and Priya (analyst), each with a `taskOnKO` fallback. Checkpoint guard on patrol. No kitchen. Cached 566. | Tier 2 or 3. A kitchenette off the trading floor. Needs for Dani and Priya, leashed to the floor, kitchenette and lab. Screen habits on trading desks. A print-and-forget printout of optional intel. A cake or desk-phone lever. Openings into optional content. The checkpoint patrol is left as it is. | The visitor cover story means staff react to the player. Irina and Satoshi carry the story and stay stationary. |
| m07 architects_gambit | Grid control facility | 6 rooms. Badge station, handover sheet, abandoned workstation. Elena is the only friendly staff member; the rest are hostile. Timed. Cached 629. | Tier 1. Elena gets desk presets and needs confined to the server room, with a kettle there. Shift-handover chatter. | Crisis timer, and only one friendly NPC. |
| m08 the_mole | SAFETYNET HQ | Break room with a coffee-machine note, visitor badge printer, operations floor. Colleagues are suspects or allies; ATHENA is an AI receptionist; Nightshade has two records. Cached 39. | Tier 2. A real coffee machine in the break room. Needs for the off-duty agent and the junior analyst. Suspects stationary. Exchanges that add colour without new clues. | Every named NPC matters to the deduction, and exchanges must not leak or contradict clues. |
| m09 digital_archaeology | Records archive after hours (finale) | No break room. Hostile staff. Sorensen has three records. Heavily scripted. Cached 137. | Tier 0, or Tier 1 limited to a front-desk kettle and a short pool for Jesse Tran. | Scripted finale with hostile staff. |
| m10 full_disclosure | Cold War bunker (finale) | No office. About 30 characters written as many per-beat records. Hostile patrolling guards. Countdown. | Tier 0. | Nothing office-like to add, and a finished finale to protect. |

## 6. Pilot and rollout

**Pilot: m06 follow_the_money.** The reasons:

- **It has a real working floor.** The trading floor already has a trading workstation and two staff whose conversations are optional flavour with `taskOnKO` fallbacks (TESTING_WALKTHROUGH.md:62). They can walk to a kitchenette and back without touching a required beat. That is the case Tier 2 is built for.
- **It fits the lessons.** A visiting supervisor walking a busy floor suits office life: unlocked trading screens while their owners are at the coffee machine, printouts on the tray, a checkpoint the staff pass through.
- **It is off the deploy gate.** It is not one of the scenarios students play (the deployed list is in `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md:27`), and the pilot needs no runtime engine change (section 9). Its work stays on its branch until reviewed and voiced, so it cannot affect the gated release.
- **Its risks are the general ones.** Irina and Satoshi carry the story and stay stationary, and the visitor cover story needs staff reactions. Proving the protections here (V2, V5, V9, the E1 probe) carries over to later missions.

Alternatives considered:

- **m05.** Every existing staff NPC carries a required or deduction beat. Its visible office life would come almost entirely from new NPCs and desks, so the pilot's cost would be mostly art. It goes second, with the protections already proved.
- **m08.** The cheapest audio, but every named NPC is a suspect. A good third mission.

**Rollout order:**

1. m06 (pilot)
2. m05
3. m08
4. m02
5. m07
6. m04
7. m03
8. m01: last, and only with the user's go-ahead, after the production deploy and its gate playtests.
9. m09 and m10: the analysis stage runs, is expected to recommend Tier 0, records that and stops.

One mission is in implementation at a time. The next mission's analysis and design can run while the previous one is in review, as AGENTS.md's mission loop allows. Lessons from each mission go into the skill's references before the next one starts.

## 7. Sync size

Needs state lives in the browser and is never synced: levels, positions, queues, cooldowns and chatter bags. Office life reaches the server and player_state only in the forms below. Each mission plan fills in this table with its own numbers, and V8 prints the counts.

| Piece | Where it lives | How it is sent | Cap per mission |
|---|---|---|---|
| Workstation globals: `<pc>_screen_locked`, `<pc>_owner_away`, `<pc>_accessed` | globalVariables (engine-owned) | one key each, as a delta when it changes (on each leave and return); after a load, only when changed | 3 booleans per owned workstation; at most 8 owned workstations (24 keys) |
| `<npc>_frustration` | globalVariables (engine-owned) and the server's `npcFrustration` record | one key, as a delta on the 30-second sync; frustration reports batched, at most 20 per batch | one integer per NPC with work needs; at most 6. Server record about 450 bytes per NPC |
| Workaround fired flags (`done`, `handed`) | server `npcFrustration` | never re-sent whole; a short answer per report | one entry per authored workaround slot; at most 4 |
| Workaround and `onUse` `setGlobal`s | globalVariables | one key each, as a delta | one boolean each; at most 8 |
| `heard_<knot>` | globalVariables | one key each, set once | one boolean per exchange; at most 6 |
| `<magnet>_servings` | globalVariables | one integer that changes a few times | one per magnet item; at most 2 |
| Reveal and left-behind globals | globalVariables (engine-owned) | one key each, set once | one per slot or left-behind item; at most 6 |
| Friendface reveals | server `feedRevealed` | delta through `/feed_post`; the bootstrap once per load | bounded by authored posts; at most 10 posts |

The worst case at these caps is 56 small keys and about 3 KB of server records. None of it grows with play time: each piece has a fixed authored ceiling, and each change sends one key. The workstation globals change most often, but each change is one boolean. A plan that needs more than a cap must say why, and the reviewer checks the sums against V8.

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

The schema is closed. Each step swaps the old key for the new one in the same commit, so the validator and loader accept only one set of names at any time. The template rewrite tool (`tools/format/rewrite_templates.rb`) arrives with 8b. 8b's scope, proofs and counts are fixed to the scenarios that hold retired keys when it is built.

The order is:

1. Stages 0 to 3 (analyse, design, approvals) do not depend on field names, so they run now. Plans name fields by meaning (owner, private, screen habit), and `references/field-map.md` gives the exact key.
2. 8b and 8c merge.
3. The validator tooling (V1 to V5, V7, V8) is built on the format 3 names.
4. The pilot's stage 4 starts.

If the pilot is ready before 8b and 8c have merged, it waits. Writing today's names would quietly widen 8b's scope, add m06 to its proofs, and give a freshly reviewed mission a second rename diff. If the wait turns long (8c not merged within three weeks of the pilot's approvals), the orchestrator asks the hardening session to add the pilot to its scope first, then writes today's names. It never places a renamable key inside an ERB loop or tag.

Ownership is always written explicitly (an owner on every owned workstation, desk phone and private object), never left to `needsHome`. That keeps the 8b warning "needsHome no longer sets an owner" from firing.

## 9. Engine gaps

The pilot needs **no runtime engine change**. That keeps it clear of the production deploy gate, where a runtime engine change would require fresh end-to-end playtests of m01, sis01 and sis02. The items below are probes, tooling, or later work. Every runtime or shared-data change goes to the user for approval and comes with unit tests, a focused test scenario and live proof.

| Id | Gap | Needed by | Proposal |
|---|---|---|---|
| E1 | Unproved live: a needs NPC attacked mid-walk outside its post room, and one knocked out there. Does it chase, calm down and walk back? Do `globalVarOnKO`, `taskOnKO` and the KO item drops fire once? Is a knocked-out NPC's job dropped cleanly? Also one NPC with `behavior.hostile` from the start. | every mission without `disableAttacks` | A live probe in a small `test_needs_attack` scenario, run **before the pilot's design closes**, because the result decides which NPCs may move. If it fails, those NPCs keep needs inside their own room only, and the fix goes to the user as an engine item. |
| E2 | No vending preset (the sprites exist) and no toilet. | optional, all missions | A vending entry in `office-presets.json` (hunger and thirst, a short use, a coin sound). Only test scenarios set `officePresets` today, so it changes no deployed game, but it is shared data and an approval item. It lands after the pilot, as its own item. Toilets: not planned. |
| E3 | Performance with more than 6 needs NPCs is unmeasured. The 6-NPC showcase has a mean tick of 0.19 ms. | m05, m08, any Tier 3 | Measure frame time with all of the pilot's needs NPCs active, at normal frame rate, before review. Measure first for any mission that would have more than 8. |
| E4 | Lazy room loading: a kitchen behind an unopened door is never used. | all | A design rule, not engine work. Need targets sit in rooms that load with the NPC's own room, or the plan accepts that the kitchen comes alive once the player opens it. |
| E5 | No guarantee that an NPC is at its post for a beat. | all with story NPCs | A design rule plus V2. Story NPCs stay stationary, keep needs inside their own room, or the beat suspends needs first through an existing eventMapping. A "summon to post" helper is backlog only. |

## 10. Voicing

The user deferred voicing the office-life chatter pools until the proper office-life scenarios exist. Whether the pilot counts as one is the user's call (decision 4). The plan below fits either answer.

- **During development**, all office-life playtests run on the keyless server on :3001, so no audio is generated. New lines show as text and speech bubbles. Nobody plays a pass branch on :3000 or any other keyed server, which would generate clips on first play. If that happens anyway, `tts:wasted` and the tts-audio pruning step clear the stray clips before commit.
- **No release carries unvoiced office-life lines.** Missions ship together in the gem, so a mission's office-life work stays on its `build/office-life-<m>` branch until its lines are voiced. Merging only then means the gated release (m01, sis01, sis02) is never held up by office life, and production never generates office-life audio on first play.
- **At sign-off:**
  1. V6 lists every new clip per voice, with characters and cached state.
  2. The tts-audio skill prices the batch, and the user approves the spend.
  3. The pass sets `"ttsPregenerateChatter": true` for the mission so the batch includes chatter pools. Exchange and call knots are ordinary ink lines and are included already.
  4. The batch is generated, a sample is checked by ear, then it is pruned and committed as tts-audio says.
- **When:** last, after the mission's dialogue review and playtests have closed, never part-way.
- **If the user keeps voicing deferred past the pilot,** the pilot's branch waits unmerged with its lines listed. Several missions can then be voiced in one batch later.
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

  A shared scenario pool line costs one clip per voiced NPC who can say it, so the plan prefers NPC-own pools for anything with more than three speakers. V6 gives the exact figure.

## 11. Art, voice and approval costs

Each mission plan carries a costs table:

| Cost | Source | Typical per mission | Who approves |
|---|---|---|---|
| Kitchen and office props | The object catalogue first. Coffee station, fridge, microwave, cooler, kettle, copier, desk phone and vending sprites exist. | 0 new images for Tier 1 and 2 | none, if taken from the catalogue |
| New props | PixelLab map objects at the target size, one at a time, never downscaled | 0 to 3 | user (image generation) |
| Changed room | re-dress, lighting check, and a POV background redo if the room has a `chatBackground` | 1 to 3 rooms; a POV redo is one Gemini concept (free through agy) plus one PixelLab conversion each | user, for the PixelLab conversion |
| New room | Tiled map from the existing room set, dressing, lighting; a POV background only if someone can be talked to there | 0 or 1 | user |
| New NPC | concept through agy (free), then the PixelLab pipeline: bust, visemes from a talk run, 8-direction walk with the standard animations, seated frames if they sit | 0 to 2 | user (cast and image generation) |
| Voice | Gemini TTS through tts-audio, priced in clips by V6 | section 10 ranges | user |
| Engine or shared data | section 9 | none for the pilot | user |
| Review and playtest time | section 12 | 3 to 5 design rounds, about 5 dialogue cycles, 2 to 5 design-review rounds, up to 3 playtest rounds | orchestrator |

All of a mission's approvals go to the user on one review page in stage 3, with the plan's recommendation marked for each.

## 12. Review loop for each mission

1. **Plan review.** 3 to 5 adversarial rounds by fresh Opus reviewers, read-only, with findings tagged blocker, major or minor and cited by file:line. Each reviewer checks:
   - the lock and key diff and the aim chain are as planned;
   - that no opening became required;
   - V2 and V5 risks;
   - each NPC's class and what an attack mid-walk would do;
   - social compatibility and leashes;
   - spoken-line rules;
   - the sync sums;
   - field names;
   - cast diversity.

   The plan is rewritten standalone after each round. Stop at 0 blockers and 0 majors after round 3, or at round 5 with the rest listed as open.
2. **scenario-design-review** of the built mission, for 2 to 5 rounds. The same Sonnet fixer acts on findings; design questions go to an Opus fixer. The reviewer also confirms:
   - the walkthrough, the aim chain and the lock and key diff;
   - that each opening teaches what the plan says;
   - that "does the player always know what to do next?" still holds with NPCs moving.
3. **npc-dialog-review** of the new pools and knots, for about five cycles: the design-heavy standard. It checks:
   - the voice against the spy-thriller aim;
   - social compatibility in each exchange;
   - that no exchange leaks or contradicts a clue;
   - the 40-character rule;
   - repetition (V7).
4. **Playtests** (playtest-scenario), on :3001:
   - A Haiku regression run of the mission's existing walkthrough with office life on. Every step must pass, and nothing mapped to NPC position may fire early or twice.
   - A Sonnet persona run of 10 to 15 minutes. It uses the levers (cake, desk phone, breaker), watches the office day, tries each opening, attacks one moving NPC, and reloads once mid-mission.
   - A check through the `window.__test.needs` bridge that posts, leashes and privacy hold.
   - A frame-time reading (E3).

   At most 3 rounds, then a short confirmation run. A run counts only when `tools/playtest/verify-run.rb` shows progress.
5. **Art follow-ups** (stage 6), then **voice** (stage 7), then **close** (stage 8).

## 13. Building the skill itself

1. Write `.claude/skills/mission-office-life/SKILL.md` and the four reference files from this plan. An Opus writer does this, followed by one review round by a fresh Opus reviewer against the showcase scenarios.
2. Build V9 (the lock and key extractor) and V6 (the voice report task), with fixture tests. A Sonnet implementer works from a short spec, followed by one Opus code review.
3. Run the E1 probe.
4. Run the pilot's stages 0 to 3 on m06.
5. Once 8b and 8c have merged, build V1 to V5, V7 and V8 on the format 3 names, with fixture tests and one Opus code review.
6. Run the pilot's stages 4 to 8.
7. Revise the skill from the pilot's log, then continue the rollout (section 6).

## 14. Decisions for the user

1. **Pilot mission.**
   - (a) m06 follow_the_money: optional-flavour staff on a working floor. Recommended.
   - (b) m05 insider_trading: every staff NPC carries a beat, so most of the life would be new NPCs.
   - (c) m08 the_mole: the cheapest audio, but every NPC is a suspect.
2. **m01.**
   - (a) Leave it until after the production deploy and its gate playtests, then do it last. Recommended.
   - (b) Never add office life to m01.
   - (c) Do it in the normal order and re-run the gate playtests.
3. **Format steps 8b and 8c.**
   - (a) Design now; build the tooling and implement after both have merged; if 8c slips more than three weeks, add the pilot to the hardening scope and write today's names. Recommended.
   - (b) Implement now on today's names and let the rewrite tool rename them.
4. **Voicing.**
   - (a) The pilot counts as a proper office-life scenario: voice each mission's new lines in one batch at its sign-off, and merge only after. Recommended.
   - (b) Keep voicing deferred: finished missions wait unmerged until several can be voiced together.
5. **New rooms and NPCs.**
   - (a) Allow Tier 3 extensions (at most one new room and two ambient NPCs per mission), each approved on the mission's review page. Recommended.
   - (b) No new rooms or NPCs: existing space and cast only.
6. **Openings and critical-path locks.**
   - (a) Openings reward optional content only, with any bypass of a required lock as a separate approval item. Recommended.
   - (b) Allow alternative routes past required locks wherever the server still checks the lock.
7. **Vending preset (E2).**
   - (a) Add it after the pilot as its own approved item. Recommended.
   - (b) Skip vending.
8. **m09 and m10.**
   - (a) Run the analysis only and expect Tier 0. Recommended.
   - (b) Skip them entirely.
