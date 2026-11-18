# Office-life demo audit and showcase proposal

Read-only audit, 2026-11-17, checkout on train/148. Nothing run, no servers started. Paths are relative to the repo root. "Unchecked" marks what I did not verify.

## 0. Recommendation (10 lines)

1. Build a dedicated showcase scenario (working name `office_life_showcase`). Leave `test_needs_sims` as the regression fixture and lever playground.
2. Reason: `test_needs_sims` has 47 tasks across 3 aims (`scenarios/test_needs_sims/scenario.json.erb`, count of `"taskId"`), a debug overlay switched on (line 7), 15 numbered levers plus a staff-room tour, a "do rows 1 to 3 before you open any door" ordering rule (README.md:13), and a V8 budget about 5x over the caps (README.md:11). Extending it adds noise to a thing that already has too much.
3. The showcase has 2 rooms plus one optional third, a host NPC (reception, no needs) who runs the tour through ink choices, and 5 staff.
4. Three short acts on one clock: Morning (coffee queue, pair chat, exchange), Midday (a security window, a tidy, a phone), Evening (one goes home, one stays late, trouble reaction). About 8 minutes.
5. Every beat is labelled by the host (a bark or a short ink knot), and by a "Tour" objective list of 8 tasks, not 47.
6. Levers stay few and physical: one noticeboard, one wall socket, one drop item, one open PC. No Activity Board readout needed.
7. Budget: stays under V8 caps (6 reveal/left-behind globals, 10 onceOnly mappings, 4 items), or says why in the plan. Realistic target in section 5.5.
8. Only existing engine features. Optional extras flagged in section 6.
9. Four user decisions are listed in section 7.
10. About AC4's gap list: five of seven are right, two are wrong or half wrong (details in section 2.1). m05 has no office life at all and `qdc_staff_upset` is m03, not m05.

## 1. Feature inventory

Keys are the ones scenarios use (grep-able). Sources: `docs/achitechture/NPC_NEEDS_SYSTEM.md` (sections 3, 5.6 to 5.10), `NPC_POSES.md`, `.claude/skills/mission-office-life/SKILL.md` and `references/mapping-patterns.md`, `test_needs_sims/README.md`. I did not read the engine JS line by line; engine file names come from the docs. Mark: S = shown in test_needs_sims.

### Needs and affordances
- `needs` per NPC: `decayPerMin`, `urgentAt`, `initial`, `weight`, `maxUnmetMin`, `jitterPct`, `deferrable` (NEEDS 3.1). S.
- `needsHome` (object id or tile), `needsSpeed`, `npcNeedsSeed`, `npcWindupMs`. S (scenario.json.erb:5-6, 20).
- `affordance`: `satisfies`, `restores`, `useSeconds`, `useFrom`, `capacity`, `accepts`, `private`/`owners`, `useSound`, `chatter`, `seat`, `pose`, `machine`, `onDeliver`, `placeAt`, `placeSeconds` (NEEDS 3.2). S except `pose`/`machine` overrides.
- `officePresets: true`, `officeType`, `"affordance": false`, `decor` (NEEDS 3.2; preset table `public/break_escape/js/data/office-presets.json`). S (lines 10, `officeType` x4).
- Judged work: `resources`, `social_media`, station failures, frustration, workarounds, outage kick, visits (NEEDS 5.9, 5.10; `npc-work.js`, `npc-workarounds.js`). Not in sims (no `resources`). Belongs to the access model, not the showcase.

### Queues, capacity, avoidance
- `affordance.queue` `{cells,maxWaitSeconds}`, `maxQueue`. S (queue x5, `maxQueue` line 723).
- `needsCompany` `{groups, avoids, avoidRadius, requireGlobal}`, turn-back, parked needs with `closed`/`queue`/storm-cloud badges, `needsDeferMin`. S for avoids (lines 721, 752); groups and `requireGlobal` on needsCompany not seen in sims.
- `needsRooms`, `needsAvoidRooms`, room `needsPrivateTo`, `leashed` log. S (needsRooms x3, needsPrivateTo x3).
- Off switches: object `offWhen` plus a wall socket. S (offWhen x6).

### Carry, tidy, interests
- Item `needsTag`, `droppable`; NPC `interests` `{weight, noticeRooms, noticeRadius}`. S (parcel, mugs, cake).
- `usePayload`, `onUse` `{setGlobal, emitEvent, revealOutput}`. S (`onUse` for parcel/board).
- Reveal slots `outputOf` + `revealOnGlobal` (printouts). S (outputOf x13).
- Left-behind items `leftBehindBy`/`leftBehindChance` (Tom's badge). S (line 669 region).
- `grumble_*` pools, cake servings. S. (Word of mouth / `news_cake` dropped in S3: a single-room drop is seen by sight, so nobody is ever told.)

### Routines, schedules, movement outside needs
- `behavior.patrol`, `patrolOverride` mappings, `waypoints`, per-room routes. Not in sims (patrol x0). Shown in `test_npc_avoidance/scenario.json.erb:24,45,66`, `test_npc_patrol_override`, m02 (1755, 3367), m03 (1915). Validator forbids patrol plus needs on one NPC (NEEDS 3.1).
- `setVisible` mappings for night hides (`mapping-patterns.md:50-74`). Not in sims. Used in m03.
- Visits, `enqueueVisit`. Engine API; no scenario field (NEEDS 5.9).
- `gameClock`: not used in sims (grep 0). I did not check what other scenarios do with it.

### Seating and poses
- `seat` on affordance (`"stand"`), chair fetch, swivel, `swivel:false`, `facePlayer`. S for Marek's chair fetch (README.md:33) and Neil standing (line 986). Seating mechanics proper are in `test_seating` (seat x20) and `test_desk_seating`.
- Poses: NPC `poses` list, `affordance.pose` (drink/use/phone), `officeVisuals:false`; art needed per sprite (`NPC_POSES.md`). The three atlas poses exist only on test sprites ("test only, not approved to merge", NPC_POSES.md:41 region). Player poses `systems/player-poses.js`. Breathing idle.

### Speech
- Scenario and NPC `chatter` pools (`{lines, hush, overhearRadius}`), `chattiness`, `chatter:false`. S (scenario.json.erb:14-23, per-NPC).
- Paired chatter at capacity-2 objects, echo window, 15 s cooldown, `chatterCooldownMin`. S (cooler, boiler).
- `exchanges` `{with, knot, requireGlobal, skipIfGlobal}`, once-only, `heard_exchange_*`. S (3 exchanges).
- Faint chatter and distance falloff, `faintChatter`, "Background voices" switch (README.md:272-287). S (default on).
- Barks: eventMapping `bark`, `barkDelay`, `cooldown`, `onceOnly`, `skipIfGlobal`, `interrupt`; phone-style barks. See 2.1.
- Desk phone: `answersPhones`, `phoneCalls`, phone presets. S (22 `phone` hits).
- Thought bubbles: `showPressingNeeds`, `actionIcons`, `npcThoughts` (default true; false kills icons and picture chat). S: `showPressingNeeds` line 8, `actionIcons` line 25, `npcThoughts` key absent (so on).

### Player levers
- Readable notes with `eventMappings` on `object_interacted` (memo, rota, notice, print queue). S.
- Wall sockets (`offWhen`), spare phone, drop item, using an open PC (`use_open_screen`, `send_print_job`), standing in a path (yield), talking (freeze), conversation mute. S.

### Security windows
- `habits.screen` `{lockIfAwayOverSeconds, lockChance}`, `habits.print`, `_owner_away` descriptions, workstation open/locked dot (breathing white vs steady blue), lock chime, `npc_caught_at_post`. S (lines 204, 221, 290, 565-711).
- Owner away leaves PC unlocked: S for Amara, Tom, Sanjay.
- Tailgating, hi-vis, keylogger: `lab_physical_pentest`, not sims.

### Environment
- `roomTone`/`roomToneTypes`, lighting modes (`on`, `motion`, `flicker` object form with photosensitivity clamps, `variants`), door hearing / chatter through open doors. S for tone and flicker (staff room, line 1136). Motion sensors: shown in m02 (2375, 2821), m03, m08; in sims only the word "motion" once, in a comment (unchecked whether it is live there).

### V tools and validator
- `scripts/validate_office_life.rb` (V1 to V11), `--office-summary`, `lock_key_diff.rb`, `window.__test.needs.state/log/overlay`, `needsDebugOverlay`. Console tools only; V tools branch docs `OFFICE_LIFE_VTOOLS_*.md` (I did not open them, so unchecked what the "V tools" menu items are beyond the validator).

## 2. Coverage matrix

Counts are `grep -c` on each scenario.json.erb. "Hit" means the key is present, not that it works live. Files `scenarios/<name>/scenario.json.erb`.

| Feature | needs_sims | npc_needs | needs_leash | needs_attack | seating | desk_seating | npc_avoidance | thoughts_off | bark_bubbles | exercise | patrol_override | m02 | m03 | m08 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| needs / needsHome | 33/12 | 1/2 | 1/1 | 14/7 | 3/3 | - | - | 2/2 | - | - | - | 16/1 | 6/2 | - |
| interests / needsTag | 2/16 | 1/1 | - | 1/1 | - | - | - | - | - | - | - | - | - | - |
| queue / maxQueue | 5/1 | - | - | 2/- | - | - | - | - | - | - | - | 2/- | - | - |
| needsCompany | 4 | - | - | - | - | - | - | - | - | - | - | 2 | 2 | - |
| needsRooms / PrivateTo | 3/3 | - | -/1 | 5/- | - | - | - | - | - | - | - | 3/- | 2/- | - |
| chatter pools | 12 | - | - | 3 | - | - | - | 2 | - | - | - | 4 | 3 | - |
| exchanges | 3 | - | - | - | - | - | - | - | - | 1 | - | 1 | 1 | - |
| bark | 2 | - | - | - | - | - | - | - | 6 | - | 1 | 13 | 3 | 1 |
| habits.screen (lockIfAway) | 1 (+2 habits) | - | - | - | - | - | - | - | - | - | - | - | 1 | - |
| `_owner_away` text | 3 | 2 | - | - | - | - | - | - | - | - | - | - | 1 | - |
| patrol | 0 | - | - | - | - | - | 3 | - | - | - | 1 | 2 | 1 | - |
| seat | 1 | - | - | 2 | 20 | - | - | - | - | - | - | 1 | - | - |
| officePresets | 2 | - | - | 1 | - | - | - | - | - | - | - | 1 | 1 | - |
| roomTone | 2 | - | - | - | - | - | - | - | - | - | - | 2 | - | 2 |
| lighting / flicker / motion | 2/3/1 | - | - | - | - | - | - | - | 1/-/- | - | - | 9/3/9 | 8/-/3 | 10/4/5 |
| npcThoughts key | 0 (on) | - | - | - | - | - | - | 3 | - | - | - | 1 | 1 | 1 |
| outputOf / offWhen | 13/6 | - | - | 1/- | - | - | - | - | - | - | - | 1/4 | -/3 | - |
| skipIfGlobal / interrupt | -/1 | - | - | - | - | - | - | - | - | - | - | 4/6 | 3/2 | 3/1 |
| debug overlay | yes | - | yes | yes | - | - | - | - | - | - | - | - | - | - |

Notes:
- `test_desk_seating` (35 lines) has no office-life keys in the file; it is a seat fixture only (unchecked how it is driven).
- m08 has no needs and no NPC office life. It has room tone, lighting (10 hits, motion x5, flicker x4) and one bark. The task brief lists it as having office life; the file does not (grep `needsHome` = 0, `scenarios/m08_the_mole/scenario.json.erb`, bark at line 1730 comment).
- m05 (`m05_insider_trading`) has `needsHome` = 0 as well.
- m02's office life is mostly in `scenarios/m02_ransomed_trust/office_life/PLAN.md` and the scenario; it has queue x2, `skipIfGlobal` x4, `interrupt` x6, patrol x2 (lines 1755, 3367), barks at 1724 and 1731 (`bark` plus `barkDelay`).
- m03: `lockIfAway` line 830, `_owner_away` line 675, patrol 1915, `skipIfGlobal` 1935, `wh_staff_upset` (`offWhen` 651, trouble text 673, exchange gate 840).

### 2.1 AC4's seven gaps, checked

1. "No picture-chat pair ever seen in sims; capacity-2 chatter point exists as data." Mostly right. Picture chat needs `npcThoughts` on and a pair at a capacity-2 chatter object. The cooler is both (preset `chatter: "cooler"`, capacity 2) and the README claims "pictures between" lines (README.md:56, 198-199), and PROOF_HISTORY lists "picture chat" under Slice 15 (README.md:223). So a pair of pictures is claimed. I did not find a dated proof row that names two pictures from a pair in a single game; treat it as UNCONFIRMED, plausible. Not refuted.
2. "No barks at all." Wrong as stated: two exist, `scenario.json.erb:667` (`npc_caught_at_post:tom`, `cooldown 30000`, `bark`, `completeTask`) and `:669` (`npc_left_item_gone:tom`, `onceOnly`, `cooldown 0`). Right in spirit: there is no `barkDelay`, no `skipIfGlobal` bark, no suppression after KO or reveal, no `interrupt` use of consequence (`interrupt` x1 at line 1219 is not a bark). Neil's `neil_ko` global is set (line 1110) but nothing shows suppression.
3. "lockIfAwayOverSeconds used once, nothing shows it on screen, no m03-style workstation-open-while-away lever." Half wrong. `lockIfAwayOverSeconds` is used once (line 567, Amara; Sanjay and Tom use `lockChance`/`fetchAfterSeconds` habits at 658 and 711). But the screen state is on screen: the white-dot-versus-blue-dot indicator (task `spot_open_screen`, scenario.json.erb:108+), `hear_screen_lock` chime, `see_auto_lock`, and `_owner_away` description variants (lines 204, 221, 290). Row 8 is a working lever (`send_print_job`) and `use_open_screen` lets the player use a PC while the owner is away. The m03 equivalent (a readable laptop whose text changes when the owner is away, m03:675) is the same `_owner_away` idea, which sims also has. The real gap is that the lever is a task buried among 47 and the viewer would not know to look for a dot.
4. "Poses only from defaults, no phone pose, no seated-chat facing." Cannot confirm from the scenario: `poses` x0 in the scenario, so poses are engine-default from the sprite atlas. NPC_POSES.md says the live proof for the phone pose was on test_needs_sims with Tom (NPC_POSES.md lines about "Live proof (test_needs_sims, Tom): the desk phone rings ... the phone pose shows from pickup"), so a phone pose exists in sims for Tom. Pose art is "test only, not approved to merge". Seated-chat facing: not examined. Treat claim 4 as partly wrong (phone pose is there for Tom) and the art as unapproved.
5. "No patrol, no short routine, no trip to another room, no evening/night act turn, no door_opened hide." Patrol: right (x0), and the validator forbids patrol plus needs. Trip to another room: wrong, sims does it all the time (Tom/Amara to the kitchen, Rosa through the office; README.md:86). Act turn and night hide: right, none in sims (`setVisible` x0). `door_opened`: x0 in sims.
6. "No trouble reactions (m05 qdc_staff_upset machines off...)." The key is in m03, not m05: `m03_ghost_in_the_machine/scenario.json.erb:651` (`offWhen: wh_staff_upset`), `:673`, `:840`. m05 has no office life. In sims, machines going off through sockets and the NPCs' turn-back reaction exist (rows 3 and 9), but there is no "struck NPC stays hostile" or debrief staff line.
7. "npcThoughts key absent (on, right), no side-by-side off toggle." Right. `test_npc_thoughts_off` carries `npcThoughts` x3 with 2 NPCs and chatter x2; it is the A/B fixture. For a showcase a runtime toggle is not needed; a note is enough.

AC4's "Present" list: roomTone x2, lighting, officePresets x2, avoids (lines 721, 752 plus README), chatter 12 hits (AC4 says 16), exchanges 3. `useFrom` count not re-counted.

## 3. Judgement: test_needs_sims as a first-time demo

Evidence base: README.md, PROOF_HISTORY.md (887 lines, not read past line 80; the rest unchecked), scenario file, mission.json.

What works
- The beats are real and proven many times (README results appendix, README.md:211-235).
- The environment is rich: office, kitchen, lounge, IT room, staff room, Neil, a faulty light, room tone, voiced chatter. The staff room pair break and the light job (README.md:143-205) is a good self-contained story.
- Levers are physical objects with in-world text (memo, rota, notice, clipboard). README.md:68 already says copy the idea, not the demo-text.

Problems for someone seeing it first time
1. No guide. The brief (scenario.json.erb:2) is one 1,500-character paragraph and the objectives panel holds 47 tasks in aim 1 alone. The viewer is not told which three things to try. The first thing the README itself says is "do rows 1 to 3 before you open any door" (README.md:13): a rule the viewer cannot know. Open the kitchen first and rows 1 to 3 are gone for the game (README.md:43).
2. Time to first interesting thing: roughly 55 to 60 s (Amara caffeine urgent about 0:55, README.md:79) of watching an office with nobody moving. Debug overlay bars are present from second zero (scenario line 7), which helps readers who know what they mean and looks like a debugging screen to colleagues and students.
3. Hidden levers. The Activity Board is the key to rows 1, 5, 6, 13 and is a demo-only readout (README.md:73). The Coffee Notice is placed so that "Not mid-office" is a stand-here rule (README.md:48). Row 6 (the outcast) needs Sanjay's social need to line up with Marek's thirst and may never happen (README.md:57). Row 11 and 12 need exact standing places. 15 levers plus 6 staff-room steps is a lab manual, not a tour.
4. Test-only noise: 47 plus 2 + 7 tasks (`taskId` count 47; the three aims) mix "watch" tasks with instructions ("read the Activity Board and Sanjay and Rosa both want a chat"); the debug overlay; "Dirty Mugs" renamed "Abandoned Mugs" because of an engine bug (README.md:265); reload replays (README.md:7). The V8 budget is 14 reveal globals vs 6, 57 onceOnly vs 10, 9 items vs 4, 89 small keys vs 64 (README.md:11).
5. Dependent on rooms loading lazily: nothing in kitchen or lounge happens until the doors open (README.md:80). For a first-time viewer this looks like the system being asleep.
6. Not shown or weak: a pair with a real exchange in the first minute, a bark moment, a time-of-day turn, a short routine, a patrol guard, a trouble reaction (see 2.1), seated-chat, a clear security-window moment (the dot is tiny).
7. Art and dressing: I cannot see art from files. Facts from files: lever papers were checked to be distinguishable at game zoom (README.md:243); the kitchen, office and lounge are built from preset object sprites; the staff room is m02's Night Handover map "used plainly"; IT room is "empty Manager's Office" for the player to pass through (README.md:99); `dungeon_graph.html` exists but I did not render it. Dressing quality: UNCHECKED, a screenshot review is needed.
8. Positive: a Sims fan reading the README gets the "Sims-style office day" idea at once (README.md:1-3); the key sentence "Nothing is lost or duplicated" for reload replay is honest.

Verdict: strong as a regression bed (I would keep it exactly as is), weak as a first-time tour. A newcomer needs a guided 8-minute path, not a menu of 20 levers.

## 4. Extend, or make a new scenario?

Recommend: new scenario. Compare:

| | Extend test_needs_sims | New showcase |
|---|---|---|
| Noise | Adds more beats to 47 tasks and 59 onceOnly mappings | Starts clean, 8 tasks |
| Budget | Already about 5x over V8 | Can stay inside it, which makes it a copyable pattern for missions (README.md:9-11) |
| Regression safety | The `needs-sims-world` golden log and many proof games depend on it (NEEDS 5.9 "byte for byte") | Untouched |
| Ordering | Inherits "before any door" rule | Can design lazy loading away (host sends the viewer through the kitchen as step 1, and the queue beat is staged for the office, not the kitchen being closed) |
| Cost | Cheaper only for the first edit | One new scenario folder; reuse cast sprites, objects, ink knots, chatter lines by copying |
| Risk | Breaks README claims, PROOF_HISTORY | None for the old one |

Tradeoff: a new scenario means two places to maintain office-life data. Mitigation: the showcase is a pure consumer; features move into it by copying JSON, and the fixture remains the place new mechanics are proven first (consistent with memory note "Mechanics before polish").

## 5. Proposed showcase design

Working name `office_life_showcase`, mission display name "Office Life: A Day at Bluebell Works" (placeholder). Collection `test_scenarios` like sims; `estimated_duration_minutes` 8.

### 5.1 Layout (3 rooms, 2 required)

- Office (start). Reception desk with the host at the front left, four desks (one empty), coffee station with wall socket, copier with print queue clipboard, a noticeboard, spare phone. Lit `on`.
- Kitchen (west). Cooler (capacity 2, `chatter: cooler`), fridge, microwave, washing-up tray, one extra coffee point. Same lazy-load rule: the host walks the viewer in on step 2.
- Back room "Server cupboard / IT corner" (optional, can be cut): a motion-sensor light room for the evening act. If cut, the evening act uses the office lights dimming via `lighting` variants on a global (existing `variants` field, scenario line 1136).

Reuse existing maps and objects: office and kitchen from sims, staff-room map only if the third room is kept.

### 5.2 Cast (6, vary ethnicity and age per memory note)

| Who | Role in the tour | Features it carries |
|---|---|---|
| Host: a receptionist ("Dee", new sprite key not needed; reuse an existing sprite unless the user wants a new one) | No needs. Stays at reception. Ink hub: "What am I looking at?", "Show me the next thing", "Why is that happening?". `facePlayer`. Barks on act turns | ink hub, barks with `barkDelay`, `skipIfGlobal`, `onceOnly` |
| Amara | Morning coffee, work, parcel opener, answers phone | needs, queue, pair chat, exchange with Tom, `habits.screen.lockIfAwayOverSeconds` |
| Tom | Coffee, print forgetter, badge | `habits.print`, `leftBehindBy`, desk phone call, `maxQueue` |
| Sanjay | Never locks his PC; avoids Marek | `needsCompany.avoids`, auto-lock, turn-back, parked need |
| Grace | Tidy and rest | `interests` + `needsTag`, mugs, word of mouth |
| Marek | The contractor nobody talks to; also the "stays late" person at evening | `needsCompany.avoids ["*"]`, chair fetch, evening act |

Cut: Rosa, Neil, Keith, Jodie (kept in the fixture). The pair break scene (Keith/Jodie) is the best self-contained pair demo, so if the user wants it, bring it as the optional third room, not as more staff.

### 5.3 A 5 to 10 minute guided tour (what the viewer does, what they see)

The host is the guide. The Tour objective list has 8 tasks in 3 aims. The debug overlay is off; `showPressingNeeds` and `actionIcons` on (so the viewer sees thoughts, which is the showcase); `npcThoughts` left at default true. Each step is labelled by the host in a line the viewer hears (voiceable ink or bark).

Act 1, Morning (0:00 to 3:00)
1. 0:00 Viewer spawns at reception. Host barks: "Morning. Have a look round. Coffee first, I'd say." (`onceOnly` bark on `room_entered`.) The Tour list shows only task 1: "Watch the office wake up".
2. 0:00 to 0:45 Amara and Tom already have caffeine pre-set to be urgent at 0:20 (use `initial` low), so the queue forms at the office coffee within 30 s, not 55 s (cheap: change numbers, no new feature). Marek queues behind Tom. The viewer sees the hourglass icon, the pour, a chat from the `coffee` pool, and Marek ignored. Task 1 ticks on `npc_queued:`; task 2 "They chat. Marek gets nothing" ticks on the pair chat.
3. 0:45 Host (ink: "What's that?") explains in two lines: "Everyone has needs that run down. When one is low they go to whatever fixes it." Choice leads to step 4.
4. 1:15 Lever 1, the wall socket: the host says "Try the socket by the coffee machine." Viewer switches it off while Tom and Marek are in line. They turn back with a grumble from `grumble_off`; greyed cup with a closed-door badge. Host line on next step: "They'll sort it out when the kitchen's open." Task 3 ticks on `see_coffee_off`.
5. 2:00 Host walks the viewer to the kitchen door by a bark: "Kitchen's through the west door." (This replaces README's "open doors first" rule: the first lever is done while the kitchen is shut by construction, because the kitchen is not opened until after step 4.) Entering ticks task 4 "Open the kitchen". Marek goes for his coffee there; Sanjay turns back from him (avoid) (task 5).
6. 2:45 Cooler pair: Grace and Sanjay meet at the cooler. They trade `cooler` pool lines and pictures. The first time, the rota exchange plays (once only) with a label from the host: "That bit is a scripted exchange. They only do it once." (This is the only pair beat that needs the viewer to be standing close; place the viewer's spawn point at the kitchen door and the cooler within 160 px of it. Check with the README.md:193-201 earshot table.) Task 6 ticks on `heard_exchange_*`.

Act 2, Midday (3:00 to 6:00)
7. 3:00 Host bark: "Right, lunch." The host sets a global (existing `setGlobal` via ink `#set_global`), which sets Tom's and Amara's hunger low (`needs: {set}`) so they leave their desks. Amara walks off with her screen open for a short trip and locks it with a chime (`hear_screen_lock`); Tom leaves his PC open (his habit `lockChance` low). The host says: "Notice the dot over a PC. White and breathing means open. Blue means locked." This is the security window moment, with a label.
8. 3:30 Viewer uses Tom's open PC (or Amara's) while the owner is away. The PC text changes on `_owner_away` ("He has left it unlocked, his inbox open"). Tom comes back and catches the viewer (`npc_caught_at_post:tom` bark, line 667). Task 7 ticks on `see_caught`. This is the same logic as README rows 8 and 12, in one place and with a label. Optional second variation: send a print from the PC and watch Tom fetch it.
9. 4:30 Drop the cake (the one inventory item; also the parcel if the user wants two, V8 item cap is 4). Hungry staff walk over, two eat, one says "Missed it." (`grumble_gone`). Task 8 ticks on `see_cake_eaten`.
10. 5:30 The desk phone rings (the host's ink or an `eventMapping` on a timer); Tom answers while seated and has the phone pose; if he is out, Amara answers. Optional.

Act 3, Evening (6:00 to 8:00)
11. 6:00 The host bark: "Right, that's the day. Go and see who stays." A global turns on `evening` (the lights drop by a `lighting.variants` entry, room tone stays). `setVisible: false` mappings send Amara, Tom, Grace and Sanjay home (mapping pattern `mapping-patterns.md:50-74`, 3 plain mappings per NPC at most). Marek stays, working at his desk with a lamp. A trouble reaction: when the viewer switches the office coffee off now, Marek mutters ("Typical.") from a pool. Task: "Notice who stays late".

Finish: host ink: "That's the lot. Want the short version?" with a recap choice that lists the features in the order they were seen. The "recap" is the only place that names engine concepts.

Time estimate: 8 minutes of guided play; free play afterwards. The host's "Show me the next thing" menu allows skipping steps.

### 5.4 In-game guidance

- The host NPC with an ink hub (existing: NPC ink, `facePlayer`, `#set_global`, `#exit_conversation`; the Neil pattern at README.md:97-141 is the same idea). Host's lines are scenario ink, voiceable by TTS.
- A bark per act turn (existing: `bark`, `barkDelay`, `onceOnly`, `skipIfGlobal`, `interrupt`). The bark is the "label" for what just happened: one sentence per beat.
- The Tour objective list: 8 tasks, written as in-world observations ("Marek gets no conversation"), not as instructions. The long how-to text in task titles in sims is replaced by the host's lines.
- A noticeboard with the full list of what to try (a readable note): "Things to try", for the viewer who ignores the host. Not an Activity Board.
- No debug overlay by default; the host can offer "Show me the needs bars" via an ink choice that sets a global which turns the overlay on if the engine can do that (it can via `window.__test.needs.overlay(true)`, but a scenario global to drive it: UNCHECKED; if not, leave it on the README as a console tip, optional extra in 6).

### 5.5 Sync budget

README.md:9-11 caps: reveal and left-behind globals 6, onceOnly mappings 10, items 4. Plan:
- Reveal and left-behind: Tom's badge (1), copier output slots 2 (print beat optional) = 3 globals plus `coffee_off`, `evening`, `lunch` act globals (not reveal globals; count them as small keys). Under 6.
- onceOnly: host act-turn barks 3, Marek's bark 1, rota exchange mapping 1, hide mappings 4 NPCs x 1 once-only room re-hide = 4, cake 1 = 10. At the limit; drop the optional print or phone to keep room. If it goes over, the plan says why, as the README requires.
- Items: cake, parcel, (mugs optional). 2 or 3. Under 4.
- Small keys: 89 vs 64 today (sims); the showcase with 6 NPCs should come out below 64 since the Neil/Keith/Jodie/Rosa data is gone. Unchecked, measure with `scripts/validate_scenario.rb` V8.
- No state grows on player_state; every global is a bounded boolean (per memory note "Player state delta sync").

### 5.6 What stays in fixtures only

Staff-room pair break and light job; Neil print by command; lounge private room; queue `maxQueue`/`parked` details; `leashed` long-way coffee (needs the lounge kettle); word-of-mouth variants; the deadline memo; copier power; printout reveal slots beyond one; judged work and outage kick; tailgating (lab_physical_pentest); `test_needs_attack`, `test_needs_leash`, seating variants; `npcThoughts` A/B (`test_npc_thoughts_off`). Keep every one; just not in the showcase.

### 5.7 Features the showcase would show that sims does not

- A guide: host NPC and a short objective list.
- Act turn with `setVisible` and lighting variant (day to evening).
- A barked label for each beat, with `barkDelay`, `onceOnly`, `skipIfGlobal` combinations (a bark that does not play after a KO, if the host can be KO'd: set `disableAttacks` instead; unchecked).
- A trouble reaction at evening (coffee off, someone mutters).
- A clear pair: coffee queue pair at start, cooler pair later.
- Security window with a spoken label.
- NOT included: patrol, a Maya-style routine (see 6).

## 6. Optional extras (flagged, not required)

1. A scenario-level `needsDebugOverlay` toggle driven by a global (so the host can show the bars on request). Engine change; today it is a flag plus a console call.
2. A patrol or short routine as a visible guard: the validator forbids patrol plus needs on one NPC (NEEDS 3.1), so a guard would be a no-needs NPC. Shown today in `test_npc_avoidance`; can be added as a 7th cast member if the user wants it. No engine change.
3. A "day clock" HUD for the acts. Engine feature, not required; the host's barks do the job.
4. A "tour skip" that resets the world. Reload is documented to replay carries (README.md:7); a reset button is new.

## 7. Decisions for the user

1. New showcase scenario (recommended) versus extending test_needs_sims. Option C: both, i.e. first trim sims' task list to the 12 best, then build the showcase.
2. Keep the Keith/Jodie pair in the showcase as a third room (best pair demo, but a third room costs load time and more sync keys), or leave it in the fixture.
3. Acts: three (morning, midday, evening) or two (day, evening). The evening act needs `setVisible` hides, a lighting variant and a bark set; it is the biggest build item.
4. Host art: reuse an existing sprite (free) or ask for a new character (needs a yes under the art rule, memory "Art needs a yes").
5. Whether the host's lines are voiced (TTS spend and the dialogue-review gate before voicing), or text-only for the first pass.
6. Audience pitch: colleagues who know Break Escape versus students new to it. This changes how much engine vocabulary the host uses.

## 8. Unchecked / limits

- Engine JS was not read; behaviours come from docs and the README. The line numbers are from `scenario.json.erb` and docs only.
- PROOF_HISTORY.md read to line 80 of the chunk; the full 887 lines and the 14 handover files in `docs/achitechture/HANDOVER_OFFICE_*.md` not read.
- Whether `needsDebugOverlay` can be driven by a global: unchecked.
- Whether the host can be protected from KO suppression by `disableAttacks`: unchecked.
- Art and room dressing: no screenshots viewed.
- `test_desk_seating` mechanism and what `test_exercise_station` exchanges show: unchecked.
- m01 Maya routine (AC4): m01 has `maya_chen` NPC (m01 scenario lines 138 to 231) but I did not find a patrol/routine key in a quick grep; AC4's claim is unverified.
- m05 "server_room_entered, one goes home, one stays late" (AC4): `server_room_entered` is a flag set at m05 line 1187 and in m01 (806) and m06 (835); m05 has no needs data. I could not find the evening-turn pattern there. The pattern I did find is the m03 night hide (`mapping-patterns.md:50-74`).
- Counts via `grep -c` count lines containing the string, not objects.

## Addendum (AC0, from AC4, 2026-11-17)

- m05 office life is on branch plan/ol-m05, not main. There: qdc_staff_upset (QDC global, machines off on trouble), the evening turn on server_room_entered (Thandiwe Moyo goes home, Niamh Doherty stays late, D82a) and Thandiwe's door_opened hide. Cite these as patterns only once m05 lands. m03's night hide is the separate, earlier pattern.
- m08 has no needs by design (D76): room tone and one bark.
- AC4 agrees: new office_life_showcase, test_needs_sims kept unchanged as the fixture (Hacktivity tests load test_* scenarios, so changing sims is riskier).
