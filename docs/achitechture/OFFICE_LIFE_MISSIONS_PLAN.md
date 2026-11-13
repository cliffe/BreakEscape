# Office life in the campaign missions: plan for a reusable skill

Status: plan only, nothing built. Written 2026-11-13, after the user's go-ahead that day.

This plan covers a new skill, `mission-office-life`, which brings the office-life engine (NPC needs, habits, chatter, exchanges, levers, the physical-pentest mechanics) into the SAFETYNET campaign missions m01 to m10. Each mission is handled in its own extra pass with four steps: analyse, design, implement, review. The plan sets out the skill's stages, the validator support it needs, how well each mission fits, a pilot and a rollout order, the engine gaps, the costs, and the review loop for each mission.

## 1. Aims and limits

What the user asked for (2026-11-06):

- The skill recommends rooms and items (kitchen, vending, coffee, printers) and proposes new rooms and NPCs where a mission lacks them.
- It adds needs behaviour, and the physical-pentest mechanics where they fit.
- Staff grumbles and chat move into scenario files (NPC JSON chatter pools and ink exchange knots), with no large rewrites.
- The validator gives the skill useful checks.
- The player directs events through existing systems (delivering a cake draws people to the kitchen; throwing a breaker empties a desk).

Rules that bind every mission pass:

1. **Office life never gates the critical path or a VM flag.** The campaign missions are a spy thriller with required VM flags. Office life adds atmosphere and optional levers: an easier or alternative route, intel, an optional task. A required step never depends on an NPC's needs timing or on a client-writable workaround global.
2. **Canon and the lock and key structure stay as they are.** No lock, key, PIN, password, flag or objective is moved or removed. New rooms connect off existing rooms, behind existing doors or as dead ends, and never sit between the player and a required step. The dungeon graph's critical path is diffed before and after: it must stay the same.
3. **No large rewrites.** Existing knots, barks and eventMappings stay. New spoken material goes into new chatter pools and new exchange knots. An existing line changes only to fix a contradiction the change creates, and every such change is listed (it costs re-voicing).
4. **Social compatibility.** NPCs chat only with people they plausibly get on with. Distrusted or suspect NPCs carry `needsCompany.avoids` entries (the user's own example: nobody joins m01's Derek at the cooler).
5. **Room leash and private objects.** Every needs NPC has a post (`needsHome`), a leash (`needsRooms` or `needsAvoidRooms`) and stays out of other people's private rooms (room-level `needsPrivateTo`). Private things (an owner's PC, their kettle) are marked private with an owner.
6. **Voiceable speech.** Every spoken line lives in a scenario file: NPC `chatter` pools, scenario-level `chatter` pools, eventMapping `bark` fields or ink. Nothing is spoken from engine text. Chatter lines are one line, 40 characters at most, with no `{ }` variables and no speaker prefix. Exchanges are heard once.
7. **Cast.** A new NPC brings variety in ethnicity and age to that mission's cast (the concept prompt says what was chosen). A recurring named character uses their own sprite key, never a generic one.
8. **Props are square to the walls** (one or two angled props per room at most), placed through the mission-room-dressing rules.
9. **Sync stays small.** No new state grows in player_state. Each new piece is a bounded global sent as a per-key delta (section 7).
10. **Students' missions are protected.** m01, sis01 and sis02 are played by students on Hacktivity and sit behind the production deploy gate. m01 is not touched until the user says so (section 9). sis01 and sis02 are not campaign missions and are out of scope.

## 2. What the engine offers today

Everything below is built and merged. The field names are today's names (section 8 covers the coming renames). The detailed author references are `docs/achitechture/NPC_NEEDS_SYSTEM.md` (sections 3 and 5), the slice sections of `docs/achitechture/OFFICE_LIFE_PLAN.md`, `README_scenario_design.md` (access, work needs, workarounds, feeds), and `scripts/scenario-schema.json` for every field.

| Area | Fields and events | Showcase |
|---|---|---|
| Needs and posts | `needs.<name>{decayPerMin, urgentAt, initial, weight, maxUnmetMin, jitterPct, deferrable}`, `needsHome`, `needsSpeed`, `interests`, `onUse` | test_needs_sims |
| Presets | scenario `officePresets: true`; office-presets.json gives a default `affordance` for desk PCs, coffee, kettle, cooler, fridge, microwave, sofa, copier, shredder, filing, post tray, desk phone | test_needs_sims |
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

No m01 to m10 mission uses any of this yet. All ten missions validate with 0 errors, all have lighting and POV backgrounds, and all are finished (m09 and m10 included).

Limits that shape the design:

- **Only loaded rooms exist.** The needs system sees objects in rooms the player has opened. A kitchen behind an unopened door is never used, and an NPC in an unloaded room is not simulated. Each NPC's post and need objects belong in its own room or in a room that is always loaded with it.
- **Scripts win over needs.** A scripted walk (`goToAndStay`, a patrolOverride, a walk home after a conversation) suspends needs. An eventMapping can set `"needs": "suspend"` or `"resume"`. A needs NPC may not also have `behavior.patrol`.
- **There is no "be at your post for this beat" guarantee.** A story-critical conversation needs the NPC reachable: the NPC stays stationary, or keeps needs only inside its own room, or the beat suspends needs first.
- **Reload resets needs.** Need levels, queues and positions live in the browser and restart at the posts on reload. Only scalar globals are saved.
- **A mission's old `npc_arrived:<id>` mappings now also see needs arrivals.** Any such mapping on an NPC given needs must be checked.
- **Workaround `setGlobal`s are client-writable.** Tasks and objectives gate on the workaround's event, never on its global.

## 3. The skill: `mission-office-life`

Layout: `.claude/skills/mission-office-life/SKILL.md` (frontmatter `name` and `description`, like the other mission skills) with a `references/` folder:

- `references/field-map.md`: today's field names beside their format 2 and format 3 names (section 8), with the rule for which to write.
- `references/patterns.md`: one minimal authoring pattern per feature, each copied from the showcase scenarios with file:line (post and leash, private office, cooler chat with avoids, a cake lever, print and forget, a screen-lock habit, a desk-phone call, an exchange knot, a frustration workaround, a reactive post).
- `references/fit-checklist.md`: the analysis checklist from stage 1.
- `references/costs.md`: how to price art, voice and approvals (section 11).

Triggers: "bring office life into m0X", "add office life", "make the staff feel alive", "add a kitchen and coffee to the mission", "add needs to the NPCs", "add physical-pentest openings to m0X".

The skill is a plan-then-build skill. Stages 1 and 2 produce a plan in the mission folder. Stage 3 settles approvals with the user. Stages 4 to 7 build, review and voice it. Each stage has inputs, outputs and an exit test.

### Stage 0: preconditions

- Inputs: the mission name.
- Checks:
  - the mission kind, from AGENTS.md "Kinds of game" (campaign missions only; any other kind needs the user's say-so);
  - whether the mission is behind the production deploy gate (m01; the skill stops and asks);
  - the current format version and whether steps 8b and 8c have landed (`lib/break_escape/format_upgrade.rb`, `STEPS`);
  - the cached audio count in `tts_cache/<mission>/`;
  - a clean validator baseline.
- Outputs:
  - `scenarios/<m>/office_life/BASELINE.md`: the validator summary, the dungeon graph's critical path as a list, the walkthrough reference and the cached line count;
  - a saved copy of the validator's `ℹ️` lines and of the `--office-summary` output (section 4) for later diffs.
- Exit: the baseline is written and the validator has 0 errors.

### Stage 1: analyse

An Opus analyst reads the scenario, its ink, the dungeon graph and the walkthrough, and fills `fit-checklist.md`.

- Rooms: each room's type and whether it is office-like. Any kitchen, break room, coffee point, cooler, vending, printer or toilet. Which rooms load together. Spare space for a kitchenette.
- NPCs, classified one by one:
  - story-critical (holds a task, a conversation the critical path needs, or a cutscene role);
  - suspect or plot-located (the deduction relies on where they are);
  - hostile or fightable (`behavior.hostile`, KO tasks and globals);
  - patrolling;
  - ambient (no story duty);
  - phone or cutscene only (never given needs).
- Beats keyed on NPC position or presence: `npc_arrived`, conversation-reachable knots, sight and line-of-sight challenges, KO tasks, `initiallyHidden` reveals.
- Tone and time of day: crisis, night shift, hostile building. Office life suits a working day. A night or hostile mission gets the light tier at most.
- Physical-security mechanics already present (RFID, keypads, PCs with sign-in, guards), and where a physical-pentest opening could sit as an optional route.
- Existing barks and timed messages, and any ambient grumbles stuck in eventMappings that would read better as chatter pools.
- Output: `scenarios/<m>/office_life/ANALYSIS.md` with a recommended tier:
  - **Tier 0, none.** The mission is left alone (stated with the reason).
  - **Tier 1, ambient.** Office presets on existing desks and kitchen objects, new kitchen props in an existing room, chatter pools, an exchange or two, room tone. Existing NPCs keep their positions or get needs confined to their own room.
  - **Tier 2, routines and habits.** Needs with posts and leashes for ambient and light-duty staff, screen-lock and print habits, desk phones, one or two player levers (cake, breaker, desk-phone ring), Friendface posts where the mission already has a social feed.
  - **Tier 3, extensions.** A new room (kitchen, break room, print room) and up to two new ambient NPCs, plus physical-pentest openings (an unlocked session while the owner is at the coffee machine, a sticky note, a propped door, a tailgate gate) wired as optional routes, intel or optional tasks.
- Exit: every NPC is classified, every position-keyed beat is listed with file:line, and the tier is justified in one paragraph.

### Stage 2: design

An Opus planner writes `scenarios/<m>/office_life/PLAN.md` from the analysis. The plan has these sections, in this order:

1. Aim and tier.
2. People table, one row per NPC that gets anything:

   | NPC | class | post | leash | needs | company groups and avoids | habits | beats protected by |
   |---|---|---|---|---|---|---|---|

   The last column names how each story beat stays safe: stationary, needs confined to its own room, `deferrable: false`, or a `needs: suspend` mapping before the beat.
3. Rooms and objects: each new or changed object with room, position, sprite key, preset or hand-written affordance, and the dressing note (square to the walls). New rooms come with the door that joins them and a statement that the critical path is unchanged.
4. Levers: what the player can do to move people (deliver the cake, ring a desk phone, throw a breaker, jam the printer) and what each lever opens (an open screen, a printed document, an empty corridor). Every lever is optional.
5. Physical-pentest openings: each opening, its lesson, and what it rewards. Rewards are optional tasks, intel or an alternative route. Never a required flag.
6. Spoken lines: every new chatter pool, exchange, phone call and bark, as a table of speaker, pool or knot, the line, and the character count. Plus the list of existing lines changed (old to new), which should be empty or near it.
7. Sync budget (section 7 template).
8. Field names to write (section 8).
9. Costs and approvals (section 11 template).
10. Test plan: the walkthrough steps that must still pass, the office-life checks to make live, and the reload checks.

Then come 3 to 5 adversarial review rounds by fresh Opus reviewers (section 12). After each round the planner rewrites the plan as a standalone document.

- Exit: a round with 0 blockers and 0 majors, after at least 3 rounds.

### Stage 3: approvals

The orchestrator gathers every item in the plan's approvals section into one review page (artifact) with a "Copy picks" box, following AGENTS.md "Asking the user for input". Typical items:

- new rooms;
- new NPCs, with the cast choice for each;
- new art;
- any engine or tooling change;
- the voicing spend and when it happens;
- any change to an existing spoken line.

Paid steps wait for the picks. Mission-local work that needs no approval carries on.

### Stage 4: implement

A Sonnet implementer works from the approved plan, in slices, one commit per slice, with explicit paths. An Opus writer handles the ink exchanges and phone-call knots. Order:

1. New rooms and objects (through mission-room-dressing for placement), then presets and needs, posts, leashes and privacy.
2. Workstation habits (screen, print, USB) and awareness.
3. Chatter pools and exchange knots.
4. Levers and physical-pentest openings.
5. Room tone, last, because it follows the final layout and dressing.

After each slice the implementer runs:

- the ink compile;
- `ruby scripts/validate_scenario.rb` (0 errors; every new warning cleared or justified);
- the `--office-summary` diff against the baseline;
- the critical-path diff from the dungeon graph (it must be the same);
- `dialoguelint.mjs` on changed ink;
- `tagdiff.mjs` against the last commit for any existing ink touched.

- Exit: all slices committed, static checks clean, `scenarios/<m>/office_life/BUILD_LOG.md` written.

### Stage 5: review

The per-mission review loop is in section 12.

### Stage 6: art follow-ups

These run only when the plan added rooms or NPCs, in the order AGENTS.md sets:

1. mission-room-dressing for the new room;
2. mission-room-lighting for that room;
3. room-pov-background for any room where an NPC can be talked to;
4. pixellab-character-pipeline for any new NPC: concept through agy, walk atlas, bust, visemes from a talk run, seated frames if they sit.

### Stage 7: voice

The tts-audio skill runs after the mission's words are signed off (section 10).

## 4. Validator support

The skill relies on the checks that already exist in `scripts/validate_npc_needs.rb`, `scripts/validate_access_work.rb` and `scripts/validate_npc_habits.rb`:

- the T1/P timing report per need;
- needs that cannot be met under the leash, and targets reachable only through a forbidden room;
- private objects with no owner;
- the list of objects that gained a preset. This catches puzzle terminals: a `pc` with no `lockType` gains a desk preset, so the planner checks every listed object;
- queue cells in doorways or forbidden rooms;
- chatter line rules;
- exchange and call knots that exist, with speakers who have voices;
- workstation owners and habit bounds;
- `offWhen` globals that nothing sets;
- print habits, magnets, desk phones, room tone and swivel;
- the workaround and frustration checks, and the feed checks.

New tooling for the skill. All of it is validator and report code; none changes the game at runtime.

| Id | Check or tool | Kind | Why the missions need it |
|---|---|---|---|
| V1 | `--office-summary`: one line per NPC with class hints (has knots with tasks, has `behavior.hostile`, patrols, `initiallyHidden`), post, leash, needs, groups and avoids, habits, and the number of chatter lines and exchanges. Stable ordering so it diffs. | info flag | Stage 0 baseline and every slice diff. OFFICE_LIFE_PLAN.md 12.11 already asks for it. |
| V2 | A needs NPC who owns a knot that sets a task or objective, or is the target of a conversation-mode mapping, and whose needs can take it out of its own room without `deferrable: false` or a `needs: suspend` mapping before the beat. | warning | Story NPCs must stay reachable. |
| V3 | An `npc_arrived:<id>` mapping on an NPC that has `needs`. | warning | Needs arrivals now fire these mappings, which can fire a beat early or twice. |
| V4 | A needs NPC with `behavior.hostile`. Warns until the hostile-with-needs probe (section 9, gap E1) has passed, then becomes an info line. | warning, then info | m01, m05 and m08 staff are fightable. |
| V5 | An objective, task, `concludeRequires` or required lock that reads a global written only by office life (a workaround `setGlobal`, an `onUse.setGlobal`, a magnet servings global, a `heard_<knot>`). | error | Office life never gates the critical path. Extends the existing workaround-global rule to every office-life global. |
| V6 | `--spoken-lines`: lists every chatter pool line, exchange line, call line and bark in the scenario, marks each as cached or uncached for the current voice and model (using the tts-audio tooling's cache key), and gives totals. | report flag | Prices the voice cost in stage 2 and drives stage 7. |
| V7 | A chatter pool line that repeats another pool line or an existing bark word for word, or that matches the first line of the same NPC's ink opener. | warning | The npc-dialog-review rule "same fact twice", made mechanical. |
| V8 | Sync budget: counts the globals office life can write (per workaround, per `onUse.setGlobal`, per magnet, per exchange, `<npc>_frustration` per NPC with work needs) and prints the total. Warns above 40. | info, warning above 40 | Keeps the sync size rule visible (section 7). |
| V9 | A new object that sits in a room absent from every critical-path room list and is joined by a door with a lock the critical path does not open. | info | Shows that an added room stays off the critical path. |

V1, V3, V5, V6 and V8 are wanted for the pilot. V2, V4, V7 and V9 can follow during the pilot if time runs short, because the reviewers check those by hand meanwhile. Each check gets fixture tests under `test/` and a line in `README_scenario_design.md`. The validator change is tooling: it ships with the pilot's first commit batch and needs no game deploy.

## 5. Per-mission fit

From the survey of the ten scenario files on 2026-11-13. "Cached" is the number of voiced clips already in `tts_cache/<m>/`.

| Mission | Setting | Office-like rooms and kit today | Suggested tier and features | Main risk |
|---|---|---|---|---|
| m01 first_contact | Media and PR office | 13 rooms incl. break room (notes only), open office, meeting room; 4 stationary staff, all fightable; 3 PCs; cached 1365 | Tier 2: coffee and cooler in the break room, needs for Sarah, Kevin and Maya inside their own rooms, Derek isolated by `avoids`, screen-lock habits, a cake lever | Played by students and behind the production deploy gate; large audio cache; KO globals and tasks on every staff NPC. Last, and only with the user's go-ahead. |
| m02 ransomed_trust | Hospital at night, ransomware crisis | Staff room, kettle in IT, cooler in the conference room; 2 patrollers; cached 1113 | Tier 1: kettle and cooler presets, short grumble pools in crisis voice, one exchange in the staff room; no wandering in the ward | Casual chat clashes with an urgent crisis; ward patients and patrols must not change. |
| m03 ghost_in_the_machine | Pentest firm, night infiltration | 7 rooms, no kitchen; few staff; cached 643 | Tier 0 or a small Tier 1: a coffee point and an exchange at reception before the night transition | Night premise; the night transition is a story beat. |
| m04 critical_failure | Battery storage plant | Ops office and reception only; hostile operatives; timed; cached 525 | Tier 1: an ops-office kettle, desk presets for Robert Vance confined to his room, a little shift chatter | Live threat and a timer; hostile NPCs must never get needs. |
| m05 insider_trading | Quantum crypto company hunting an insider | Break room (leaflet note), open office, mug in Torres's office; 4 stationary staff; RFID and PC sign-in; cached 725 | Tier 3: kitchen kit in the break room, needs for Lisa and Owen with leashes, Halloran confined to the lab, screen-lock and print habits, a cake or desk-phone lever, an optional unlocked-session and shoulder-surf opening, one or two ambient staff on the open floor | Suspects' locations matter to the deduction; Torres and Patricia stay put. |
| m06 follow_the_money | Crypto exchange; the player poses as a visiting supervisor | Trading floor, checkpoint with guard patrol; no kitchen; cached 566 | Tier 2 or 3: a kitchenette off the trading floor, trader and analyst needs, screen habits on trading desks, a print-and-forget opening, a tailgate gate at the checkpoint as an optional route | The visitor cover story means staff react to the player; the existing checkpoint patrol must not be replaced. |
| m07 architects_gambit | Grid control facility | 6 rooms; badge station, handover sheet, abandoned workstation; staff mostly hostile; timed; cached 629 | Tier 1: an ops-floor kettle, Elena's desk presets confined to the server room, shift-handover chatter | Crisis timer; few friendly NPCs. |
| m08 the_mole | SAFETYNET HQ | Break room with a coffee-machine note, visitor badge printer, operations floor; 8 colleagues, all fightable suspects or allies; cached 39 | Tier 2: a real coffee machine in the break room, the off-duty agent and junior analyst with needs, the suspects stationary, exchanges that add colour to the mole hunt without new clues | Every NPC matters to the deduction; exchanges must not leak or contradict clues. |
| m09 digital_archaeology | Records archive after hours (finale) | No break room; hostile staff; heavily scripted; cached 137 | Tier 0, or Tier 1 limited to a front-desk kettle and a short pool for Jesse Tran | Scripted finale with hostile staff. |
| m10 full_disclosure | Cold War bunker (finale) | No office; about 30 characters duplicated per beat; patrolling hostile guards; countdown | Tier 0 | Nothing office-like to add; risk to a finished finale. |

## 6. Pilot and rollout

**Pilot: m05 insider_trading.**

- It is a real office with a break room, an open office and four stationary staff, so every tier can be tried.
- The insider-threat premise suits the lessons office life teaches: unlocked screens, shoulder surfing, badge cloning, printed documents left behind.
- It is not behind the production deploy gate. Since q83 only m01, sis01, sis02 and lab_social_engineering count as deployed games, and the pilot needs no runtime engine change (section 9), so it cannot affect the deploy gate's three missions.
- Its audio cache is middling (725 clips). New lines are additions; no existing clip needs re-voicing.
- Its main risk (suspects' locations matter) is the risk every later mission has, so the pilot proves the protections (section 2 limits, checks V2 and V3) where it counts.

Alternatives considered:

- m08: the cheapest audio, but every NPC is a fightable suspect. It is a harder first case and a good second proof of the protections.
- m06: a good fit, but its visitor cover story adds reaction work that is better done once the pattern is proved.

**Rollout order after the pilot:**

1. m05 (pilot)
2. m06
3. m08
4. m02
5. m07
6. m04
7. m03
8. m01, last and only with the user's go-ahead, after the production deploy has gone out and the gate's playtests pass with the new content. Its large cache and KO-bound staff make it the costliest to change.
9. m09 and m10: the analysis stage runs and is expected to recommend Tier 0. The skill records that and stops.

One mission is in implementation at a time. The next mission's analysis and design can run while the previous one is in review, as AGENTS.md's mission loop allows. Lessons from each mission go into the skill's `references/patterns.md` before the next one starts.

## 7. Sync size

Needs state (levels, positions, queues, cooldowns, chatter bags) lives in the browser and is never synced. Office life reaches the server and player_state only in the forms below. Each mission plan fills in this table with its own numbers, and check V8 prints the global count.

| Piece | Where it lives | How it is sent | Bound per mission |
|---|---|---|---|
| `<npc>_frustration` | globalVariables (engine-owned) and the server's `npcFrustration` record | one key, as a delta on the 30-second sync; frustration reports batched, at most 20 per batch | one integer per NPC with work needs; at most 6 per mission; server record about 450 bytes per NPC |
| Workaround fired flags (`done`, `handed`) | server `npcFrustration` | never re-sent whole; a short answer per report | one entry per authored workaround slot; at most 4 per mission |
| Workaround and `onUse` `setGlobal`s | globalVariables | one key each, as a delta | one boolean per authored workaround or `onUse`; at most 8 |
| `heard_<knot>` | globalVariables | one key each, set once | one boolean per exchange; at most 6 |
| `<magnet>_servings` | globalVariables | one integer, changes a few times | one per magnet item; at most 2 |
| Reveal and left-behind globals | globalVariables (engine-owned) | one key each, set once | one per slot or left-behind item; at most 6 |
| Friendface reveals | server `feedRevealed` | delta through `/feed_post`; bootstrap once per load | bounded by authored posts; at most 10 posts per mission |

Bound for a Tier 3 mission: at most 40 new office-life globals (V8 warns above that) and about 3 KB of server records. None of it grows with play time. Each piece has a fixed authored ceiling, and globals change one key at a time. A plan that needs more must say why, and the reviewer checks the sums.

## 8. Field names and the format hardening steps

Scenario-format hardening step 8a (format 1, `offWhen` everywhere) is built. Steps 8b and 8c are planned in `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md` and are being built in another session:

| Today (format 1) | After 8b (format 2) | After 8c (format 3) |
|---|---|---|
| `screenOwner` on a workstation | `owner` | `owner` |
| `phoneOwner` on a desk phone | `owner`, plus `deskPhone: true` | same |
| `affordance.owners` | `owner` (a list on a private object) | same |
| `affordance.private` | object-level `private` | same |
| `phoneOf` on an item | `owner` | same |
| `leftBehindBy` (and optional `leftBehindChance`) | `owner`, with `leftBehindChance` required | same |
| `needsHome` implies an owner | `needsHome` no longer implies one; write `owner` | same |
| `screenHabit`, `printHabit`, `usbHabit` | unchanged | `habits.screen`, `habits.print`, `habits.usb` |

The schema is closed: each step swaps the old key for the new one in the same commit, so the validator and loader accept only one set of names at any time. The template rewrite tool (`tools/format/rewrite_templates.rb`) renames every scenario mechanically when a step lands, and stored games upgrade on load. m05 has no alias rule (aliases are kept only for m01, sis01, sis02 and lab_social_engineering), so it simply gets the new names.

Rule for the skill:

1. Stages 0 to 3 (analyse, design, approvals) do not depend on field names and run now. The plan writes fields by meaning (owner, private, screen habit) and names the exact key in `references/field-map.md`.
2. Stage 4 writes whatever names the schema accepts at the time. The implementer checks `STEPS` in `lib/break_escape/format_upgrade.rb` before the first slice, and again before each commit.
3. Mission edits do not land while a hardening step's template rewrite is in flight. The orchestrator asks the hardening session for its merge window and starts stage 4 after it. If 8b or 8c is still more than a week away when stage 4 is ready, the implementer writes today's names and lets the rewrite tool rename them. The rename is mechanical and covered by that step's tests.
4. Write the ownership keys explicitly even where `needsHome` implies them today (`screenOwner` on each owned workstation, `affordance.owners` on private objects). The 8b rewrite then maps them one to one, and the 8b validator warning ("needsHome no longer sets an owner") never fires on these missions.

For the pilot this means: design now, and implement after 8b and 8c land if the timing allows. Most office-life keys that 8b and 8c rename (owners, habits) are exactly what a pilot writes, so waiting avoids a second rename diff in a freshly reviewed mission.

## 9. Engine gaps

The pilot is planned so that it needs **no runtime engine change**. That keeps it clear of the production deploy gate, where any runtime engine change would require fresh end-to-end playtests of m01, sis01 and sis02. The items below are probes, data additions or later work. Every runtime change goes to the user for approval and comes with unit tests, a focused test scenario and live proof.

| Id | Gap | Needed by | Proposal |
|---|---|---|---|
| E1 | Untested: an NPC with both `needs` and `behavior.hostile`. Is it fightable mid-walk? Does a knocked-out NPC stay down, its needs stopped and its KO task intact? Does `globalVarOnKO` fire once? | m01, m05, m08 | A probe in `test_needs_sims` (or a small `test_needs_hostile` scenario) before the pilot's stage 4. If it fails, the pilot keeps fightable NPCs stationary (Tier 1 treatment for them), and a fix goes to the user as an engine item. |
| E2 | No vending machine preset and no toilet. | optional, all missions | Vending: a data-only entry in `office-presets.json` (hunger and thirst, a short use, a coin sound) if a vending sprite exists in the object catalogue. Data in a shared file is an engine change for approval. Toilets: not planned. They add little and need art. |
| E3 | Performance with more than 6 needs NPCs is unmeasured (6 NPCs on the showcase: mean tick 0.19 ms). | m05 Tier 3, m08 | Measure the pilot's frame time with all its needs NPCs active, at normal frame rate, before review. If a mission would need more than 8 needs NPCs, measure first. |
| E4 | Lazy room loading: a kitchen behind an unopened door is never used. | all | A design rule, not engine work. Needs targets sit in rooms that load with the NPC's own room, or the plan accepts that the kitchen comes alive only once the player has opened it. |
| E5 | No guarantee that an NPC is at its post for a beat. | all with story NPCs | Design rule plus V2: story NPCs stay stationary, keep needs inside their own room, or the mission suspends needs before the beat with an existing eventMapping (`"needs": "suspend"`). A "summon to post" helper is backlog only. |
| E6 | `references/patterns.md` will need a mission-scale example of a cake lever with a reveal (owner leaves, screen opens). | pilot | Built in the pilot itself from existing features. |

## 10. Voicing

The user has deferred voicing the office-life chatter pools until the proper office-life scenarios exist. The pilot is the first of them, so the voicing question comes back to the user when the pilot is signed off.

- **During development:** all office-life playtests run on the keyless server on :3001, so no audio is generated. New lines show as text and speech bubbles.
- **Before any deploy that carries new lines:** a server with a key generates an uncached line on first play. That costs money in an uncontrolled way and adds a lag before the voice. So a mission with new office-life lines is not deployed unvoiced. Either its lines are voiced in one batch first, or the deploy waits.
- **How, at sign-off:**
  1. V6 lists every new line with its character count and cached state.
  2. The tts-audio skill prices the batch, and the user approves the spend.
  3. The pass sets `"ttsPregenerateChatter": true` for the mission so the batch includes chatter pools. Exchange and call knots are ordinary ink lines and are included already.
  4. The batch is generated, checked by ear on a sample, pruned and committed as tts-audio says.
- **When:** last, after the mission's dialogue review and playtests have closed, never part-way.
- **Rules carried into design:** no printed variables; 40 characters at most for chatter; exchanges heard once; pools sized so a line does not repeat within a normal play session (about 4 to 8 lines per topic per NPC, with `chatterCooldownMin` at its default of 5 minutes or more); no change to existing voiced lines without listing it.
- **Budget guide per mission:**
  - Tier 1: about 15 to 30 short lines plus one exchange (about 6 lines).
  - Tier 2: about 30 to 50 lines plus two or three exchanges.
  - Tier 3: about 50 to 80 lines plus three to five exchanges and any desk-phone calls.

  V6 gives the exact figure for each plan.

## 11. Art, voice and approval costs

Each mission plan carries a costs table:

| Cost | Source | Typical per mission | Who approves |
|---|---|---|---|
| Kitchen and office props | existing object catalogue first (coffee station, fridge, microwave, cooler, kettle, copier, desk phone are in use in the showcase scenarios) | 0 new images for Tier 1 and 2 | none if from the catalogue |
| New props | PixelLab map objects at the target size, one at a time, never downscaled | 0 to 3 | user (image generation) |
| New room | Tiled map from the existing room set plus dressing and lighting; a POV background only if someone can be talked to there | 0 or 1 | user |
| New NPC | concept via agy (free), then the PixelLab pipeline: bust, visemes from a talk run, 8-direction walk with the standard animations, seated frames if they sit | 0 to 2 | user (cast and image generation) |
| Voice | Gemini TTS through tts-audio, priced from V6 | section 10 ranges | user |
| Engine or shared data | section 9 | none for the pilot; E1 fix or E2 data only if needed | user |
| Reviewer and playtest time | section 12 | about 3 to 5 design rounds, 2 to 5 review rounds per stage, 3 playtest rounds | orchestrator |

All of a mission's approvals go to the user on one review page in stage 3, with the plan's recommendation marked for each.

## 12. Review loop for each mission

1. **Plan review.** 3 to 5 adversarial rounds by fresh Opus reviewers, read-only, findings tagged blocker, major or minor with file:line. Each reviewer checks:
   - the critical path is unchanged;
   - V2-class risks to story NPCs;
   - social compatibility and leashes;
   - spoken-line rules;
   - the sync sums;
   - field names;
   - cast diversity;
   - that no opening became required.

   The plan is rewritten standalone after each round. Stop at 0 blockers and 0 majors after round 3, or at round 5 with the rest listed as open.
2. **scenario-design-review** of the built mission. Findings go to the same Sonnet fixer, with design questions sent to an Opus fixer, for 2 to 5 rounds. The reviewer also confirms:
   - the walkthrough and dungeon graph are unchanged;
   - every new physical-pentest opening teaches what the plan says;
   - the "does the player always know what to do next?" test still holds with NPCs moving.
3. **npc-dialog-review** of the new pools and knots, for 2 to 5 rounds. It checks voice against the spy-thriller aim, social compatibility in each exchange, that no exchange leaks or contradicts a clue, the 40-character rule, and repetition (V7).
4. **Playtests** (playtest-scenario), on :3001:
   - a Haiku regression run of the mission's existing walkthrough with office life on, checking that every step passes and that nothing mapped to NPC position fires early or twice;
   - a Sonnet persona run of 10 to 15 minutes that uses the levers (cake, desk phone, breaker), watches the office day, tries each physical-pentest opening and reloads once mid-mission;
   - a check through the `window.__test.needs` bridge that posts, leashes and privacy hold.

   At most 3 rounds, then a short confirmation run. `tools/playtest/verify-run.rb` must show progress for any run to count.
5. **Art follow-ups** if any (section 3, stage 6), then the **voice** stage (section 10).
6. **Close:** the mission's `office_life/LOG.md` records each round's severity table and every finding's outcome. The mission is committed, and its lessons are folded into the skill's references.

## 13. Building the skill itself

1. Write `.claude/skills/mission-office-life/SKILL.md` and the four reference files from this plan (Opus writer, one review round by a fresh Opus reviewer against the showcase scenarios).
2. Build V1, V3, V5, V6 and V8, with fixture tests (Sonnet implementer from a short spec; one Opus code review).
3. Run the E1 probe.
4. Run the skill on m05 as the pilot, all stages.
5. Revise the skill from the pilot's log, then build V2, V4, V7 and V9 if the pilot showed they are needed.
6. Continue the rollout (section 6).

Every brief for multi-step work in this programme carries the handover rule: at about 150k tokens or 80 tool calls, finish the step, commit, write a handover note, report and stop.

## 14. Decisions for the user

1. **Pilot mission.** (a) m05 insider_trading, recommended; (b) m08 the_mole, cheapest audio but every NPC is a suspect; (c) m06 follow_the_money.
2. **m01.** (a) Leave m01 until after the production deploy and its gate playtests, then do it last, recommended; (b) never add office life to m01; (c) do it in the normal order and re-run the gate playtests.
3. **Waiting for format steps 8b and 8c.** (a) Design now, implement after both land if they come within a week, otherwise write today's names and let the rewrite tool rename them, recommended; (b) always wait; (c) never wait.
4. **Voicing.** (a) Voice each mission's new lines in one batch at its sign-off, priced by V6, and never deploy new lines unvoiced, recommended; (b) defer voicing until several missions are done and voice them together, holding their deploy; (c) ship unvoiced and let first play generate audio.
5. **New rooms and NPCs.** (a) Allow Tier 3 extensions (at most one new room and two ambient NPCs per mission), each approved on the mission's review page, recommended; (b) no new rooms or NPCs, so existing space and cast only.
6. **E2 vending preset.** (a) Add it as shared data if a vending sprite exists, recommended; (b) skip vending.
7. **m09 and m10.** (a) Run the analysis only and expect Tier 0, recommended; (b) skip them entirely.
