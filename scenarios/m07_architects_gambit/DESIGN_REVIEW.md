# m07 The Architect's Gambit — design review (pass 4)

Reviewer: design-review agent, 2026-10-02. Read-only review; nothing in the mission was edited.
Inputs: `scenario.json.erb`, all eight ink files, `PUZZLE_CHAINS_PLAN.md`, `dungeon_graph.md`,
`SOLUTION_GUIDE.md`, `TESTING_WALKTHROUGH.md`, `mission.json`, the SecGen scenario
(`SecGen/scenarios/break_escape/safetynet/m07_architects_gambit.xml`), the lab sheets in
`HacktivityLabSheets/_labs/safetynet/`, m06's and m08's ink for continuity, and the engine where a
claim needed checking. Line numbers are `erb:N` for `scenario.json.erb` and `<file>.ink:N` for ink.

## Phase 1 — validator

`ruby scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb`: schema, ERB,
unknown fields, ink files, room geometry and door alignment all pass. No ❌ INVALID.

**⚠️ WARNING (8)**

1. `shut_down_the_cascade` is `unlock_object` on a `flag`-locked object (`erb:521-532`, `:1477-1504`).
   **False positive.** Flag 4's `unlock_object` reward only clears `locked`
   (`apply-actions.js:58-70` → `interactions.js:28-47`). When the player then clicks the console,
   the container branch calls `handleUnlock` (`interactions.js:1291-1300`), which goes to
   `unlockTarget` (`unlock-system.js:74-80`), and that emits `item_unlocked` because the object has
   `contents` (`unlock-system.js:683-708`). The comment at `erb:1477` is right. The pass-3 log
   records concluded games (`PASS3_APPROVAL_LOG.md:150`).
2–8. Seven "several onceOnly handlers on one (NPC, event) pair" warnings, all on `agent_0x99`:
   - `flag3_submitted` (indices 12, 13, 28): 12 and 13 are disjoint on `team_assigned`
     (`erb:769`, `:777`); 28 is the privesc-guide latch (`erb:878-881`), meant to fire alongside them.
   - `room_entered:server_room` (16, 25, 26, 34), `generator_room` (17, 36), `cable_vault`
     (18, 37), `operations_floor` (19, 24, 33): each pairs a latch with a guide offer or the
     debrief backstop. They are meant to fire together. But see Beyond §1: server-room entry sends
     two barks (recon at 2.5 s, lockpicking at 9 s).
   - `grid_saved` (29, 30, 31): the three "submit the rest" nags share one latch
     (`erb:887-895`). The handlers run in turn and each sets `flags_nag_sent` as it fires
     (`npc-manager.js:564-640`), so a player with two flags missing should get one message. To
     silence the warning, collapse them into one mapping with a combined condition, or leave them.

**✅ GOOD PRACTICE.** Event-driven cutscenes, `globalVarOnKO` on all four people,
`skipIfGlobal` on the briefing, a full music beat map, and full `puzzle_graph_*` metadata.

**💡 SUGGESTION (relevant ones only)**
- "Mission-ending phone NPC with sendTimedMessage" at `security_checkpoint/npcs[3]` is
  **misclassified**: that's `the_architect` (`erb:1035-1107`), not the ending. The real ending is
  the hidden `closing_debrief` person NPC (`erb:1108-1142`), already on the m01 pattern.
- "No timedMessages on HaX or the Architect": not needed. Both are driven by event mappings,
  which suits a mission whose beats are progress-gated rather than time-gated.
- "Add a hostile NPC": Hollis, Park and Mercer each go hostile from dialogue (`#hostile`,
  `m07_npc_ray_hollis.ink:215`, `m07_npc_thomas_park.ink:105`, `m07_npc_james_mercer.ink:376`).
  Nobody should start hostile in this building.

**Dungeon graph summary.** Puzzle 40 nodes / 44 edges; Story 6 / 5; Integrated 46 / 60.
Critical path (3 hops): Commit The Team And Get Inside → Get Into The Control Room → Take The
Attack Host Off The Board → Stop The Sequence And Report. The path leaves out "Get Onto The
Control Network", even though its two flag tasks are in `concludeRequires` (`erb:510-517`). See §2e.

## Phase 2 — design review

### 2a. Solvability trace — OK

Start (checkpoint) → ops floor (open) → server hall (RFID) → VM flags 1–2 → control room
(password) → flags 3–4 → console (flag 4 reward) → debrief. Every lock has a source the player
can reach before it, and each source has a backup:

| Lock | Primary | Backup | Reachable before the lock? |
|---|---|---|---|
| Server hall RFID (`erb:1265-1269`) | Hollis's badge: talk (`m07_npc_ray_hollis.ink:168`) or KO drop (`erb:1022-1033`) | Badge station, PIN 0616 from the handover sheet on the ops floor (`erb:1146-1171`, `:1240-1253`) | Yes |
| Generator hall key (`erb:1535-1541`) | Plant key on the ops floor (`erb:1206-1218`) | Lockpick in the start kit (`erb:236-244`) | Yes |
| Cable vault PIN 4703 (`erb:1590-1595`) | Rule (flag-1 decode `erb:1391`, or Hollis `m07_npc_ray_hollis.ink:177`) + ATS-1 plate in the same room (`erb:1569-1570`) | Elena says the number (`m07_npc_elena_rodriguez.ink:283`) | Yes. The plate serial is in plain sight, so the code can be worked out even without the rule |
| Control room password (`erb:1429-1434`) | Elena (`m07_npc_elena_rodriguez.ink:281`) | Flag-2 capture (`erb:1396-1407`) | Yes |
| Console (`erb:1477-1504`) | Flag-4 `unlock_object` (`erb:1373-1376`) | none needed | Yes |

- No circular dependencies. No soft locks found. The win (`grid_saved`, `mission_complete`) is set
  by the console task's `onComplete` (`erb:526-531`), never by a conversation.
- VM wiring: all four `submit_flags` tasks have `targetFlags`/`targetCount` (`erb:362-381`,
  `:476-495`). Every `flagN_submitted` is `setGlobal`-ed from an `objective_task_completed`
  mapping or a `set_global` reward (`erb:690-693`, `:753-757`, `:1366-1371`, `:782-787`).
- **Dialogue promises.** Elena's laptop ("It's on that laptop", `m07_npc_elena_rodriguez.ink:136`)
  is not an object. That's harmless, because nobody asks the player to fetch it. Nothing on the
  critical path is promised and missing.

### 2b. Clue distribution — OK

Clues are spread across all six rooms: visitor log and evacuation board (checkpoint), handover
sheet, situation board and map (ops floor), cabling note (server hall), projection and countdown
display (control room), maintenance log and ATS-1 plate (generator hall), splice and two lore
drops (vault). Codes come before their locks. The handover → badge station route deliberately
sends the player back a room.

- No navigation-only notes. The cabling note (`erb:1417-1425`) sends the player to the
  maintenance log, which says the old code is void (`erb:1558`). That's a breadcrumb, and a good one.
- Flavour-only readables that earn their place: the evacuation board ("SECURITY 5/6",
  "CONTRACTORS UNKNOWN", `erb:1192`) quietly points at Hollis, Elena and Park; the situation board
  lists the four cascade steps that the debrief and the abort printout then read back.
- **CONCERN (minor):** `ops_floor_workstation` (`erb:1254-1260`) is a `pc` with no text, contents
  or lock. It looks interactive and gives nothing. Give it one line of read-only grid view, or
  make it scenery.
- **CONCERN (major), see Beyond §2:** the decode asks the player to compare the Austin row "against
  what the Director read you" (`erb:1390`, HaX `erb:700`). The briefing is a one-off cutscene,
  so the player has no copy of "ninety days, no fatalities" to compare against.

### 2c. Educational coverage — OK

Lock types: rfid, key (+ lockpick), pin ×2, password, flag. For a critical-infrastructure
mission they hang together better than usual, because each one is a believable failure in a real
control centre:

- a badge station left logged in, with an audit-date PIN (`erb:1248`): unattended credential issuing, guessable PINs;
- a guard bought to renew a contractor's credentials (visitor log, handover sheet): insider threat at the physical layer;
- a keypad code made from a serial number riveted beside the door (`erb:1569`): a derivable "secret" is not one;
- a control-room password sent in clear over a listener (`erb:1404`);
- the VM: NFS exported to everyone, a chatty listener, a sudo rule that escapes to root
  (SecGen `m07_architects_gambit.xml`: `nfs_overshare`, `nc_message`, `parameterised_accounts`, `sudo_root_awk`).

The weak spot is that none of these lessons is ever *said*. Only the field guides spell them out.
See Beyond §3.

### 2c′. Field guides — CONCERN (one broken link)

Six guides in HaX's `itemsHeld` (`erb:919-963`). Each is offered by an exposure-gated mapping
(`erb:845-882`) and delivered by an ink hub choice behind `<x>_guide_offered and not
<x>_guide_hint_given` (`m07_phone_agent_0x99.ink:233-244`). Every `#give_item` id matches an
`itemsHeld` id, and every offered/given global is declared (`erb:1766-1778`). That's the m01/m02
pattern, done properly.

**L2 check (as asked):**
- **NFS guide → `nfs-and-netcat-leaks`** (`erb:941-948`). ✅ The right sheet: it covers showmount,
  mount, nc on an odd port, and putting the two halves of a login together, and its Mission
  Application section describes m07's host exactly (`nfs-and-netcat-leaks.md:65-67`).
  ❌ **It is not live.** The sheet is committed in HacktivityLabSheets as `38f5d96` but not pushed
  (`main` is "ahead 1" of `origin/main`), and the URL returned **404** on 2026-10-02. The other five
  return 200. The `_comment` at `erb:942` already admits this.
- **SSH guide → `ssh-access-and-bruteforce`** (`erb:950-955`). ✅ Correct per L2 (not
  `ssh-access-and-linux-basics`, which is a Hydra-plus-navigation sheet adapted from m01).
  Steps 1, 2 and 4 fit m07, where the player already holds the credential. Steps 3 and the closing
  lesson are about Hydra and m02's hospital. HaX warns about this
  (`m07_phone_agent_0x99.ink:502`: "Worked example's the hospital job -- skip the Hydra half").
  Two leftovers belong to the sheet:
  - its worked example hard-codes `192.168.100.50`, Gary and the hospital (`ssh-access-and-bruteforce.md:13`, `:34-42`);
  - `192.168.100.50` is also the address m07's standalone `vm_object` gives the player's own Kali box (`erb:1329`).
  A player who copies the sheet's command could SSH into their own attack box. HacktivityLabSheets edit, needs approval.
- **Coverage.** Recon, NFS/netcat, SSH and privesc map one-to-one onto the four flags. The RFID
  guide teaches cloning, but m07 never uses the cloner (`PUZZLE_CHAINS_PLAN.md` W7); the badge is
  handed over or printed. HaX's delivery line (`m07_phone_agent_0x99.ink:445`) teaches the right
  idea anyway. The lockpicking guide is a refresher in mission 7. Both are harmless.
- **Overlap.** The recon guide (server-hall entry, `erb:862-867`) and the NFS guide (first VM use,
  `erb:868-875`) are offered minutes apart, and the NFS sheet's first step is "scan the host".
  See Proposed fix 9.
- The privesc guide is offered silently (`erb:877-882` has no message). The flag-3 barks
  (`erb:772`, `:780`) say "Get root" but don't mention it.

### 2d. Narrative structure — OK

- **Opening.** The briefing cutscene (`erb:633-659`) has `skipIfGlobal` and
  `setGlobalOnStart: briefing_played`. It sets out the role, the stakes and the decision. HaX's
  first call (`m07_phone_agent_0x99.ink:86-116`) gives the layout and the one planning rule
  (open the control-room door before logging in).
- **Closing.** A hidden debrief NPC opens on a UI close or a room entry, once the grid is saved
  and all four flags are in (`erb:1127-1141`). The win condition is clear.
- **Event mappings spot-checked:** the flag-3 arm (`erb:766-781`, two disjoint rows), the verdict
  rows (`erb:703-751`), and the Architect's sign-off on the console close (`erb:1089-1098`).
  All read and route correctly.

### 2d′. Ink conventions — mostly OK

- A narrator voice is defined (`erb:83-91`). All scene-setting is `Narrator:`.
- No in-ink combat. Every fight hands over to the engine with `#hostile` + `#exit_conversation`.
- Choice brackets are first-person speech throughout.
- Several choices are followed by `You:` lines that carry on the speech rather than echo it:
  - `m07_npc_james_mercer.ink:234`, `:238`, `:308`, `:342`, `:364`, `:387`, `:394-396`
  - `m07_npc_ray_hollis.ink:139`, `:142`, `:181`
  - `m07_npc_thomas_park.ink:72`

  The pass-4 rule is to fold these into the bracket. **Left for the dialogue stage.** The two
  `You: ...` lines after silent choices (`m07_npc_elena_rodriguez.ink:333`,
  `m07_npc_james_mercer.ink:102`) are the allowed exception.

### 2d″. Patrol guard — N/A (by design)

Hollis patrols with `los` but `visualize: false` (`erb:1016-1021`). Park's cone is the same
(`erb:1634-1639`). The plan hid them on purpose because the engine checks nothing against them
(`PUZZLE_CHAINS_PLAN.md:138-142`, `:225-226`). Evading Hollis is a dialogue choice, and the
"evaded" outcome is recorded when the player reaches the server hall (`erb:796-802`). The two
`los` blocks are now dead config. Remove them or leave them, it makes no difference.

### 2e. Dungeon graph metadata — CONCERN (minor)

- Lock–key edges are dense and correct for the badge, key, picks, plate and password routes.
  Starting items are present.
- **The win lock is disconnected:** nothing points at `lock_crisis_control_system`. Flag 4's
  reward unlocks it (`erb:1373-1376`), but `terminate_cascade_scripts` (`erb:486-495`) carries no
  `puzzle_graph_unlocks: "crisis_control_system"`.
- **The vault rule has no edge.** Only the plate points at the vault door. The coordination
  extract (`erb:1393-1394`) and Hollis carry the rule but no `puzzle_graph_unlocks:
  "cable_vault"`.
- The Story graph's critical path skips "Get Onto The Control Network" because
  `take_the_attack_host` unlocks on `reach_the_control_room` alone (`erb:469`). That's cosmetic,
  since aim locks are presentation-only (`erb:287-289`).
- No backward edges.

### 2f. Room layout — OK

Six rooms, none empty. Geometry is clean (validator). Room types fit the building, with two small
mismatches: `room_battery_hall` for a diesel genset hall (`erb:1536`) and `room_archive_1x2gu` for
an underground cable vault (`erb:1591`). Those are art notes for the backlog. The plant branch
runs away from the critical path, so there's no forced backtrack. The printer route's return to
the checkpoint is the one deliberate backtrack.

### 2g. Objectives scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Bark/conversation at transition |
|---|---|---|---|---|
| Commit The Team And Get Inside (`erb:299-333`) | 2 (assign, reach ops) | 2/2 (briefing; HaX first call) | Low | Architect bark + HaX RFID bark on ops-floor entry (`erb:1053-1058`, `:846-852`) |
| Get Onto The Control Network (`erb:334-383`) | 3 (badge, flag 1, flag 2) | 3/3 (RFID bark; VM bark `erb:874`; hub hints `m07_phone_agent_0x99.ink:223-226`) | Low | Server-hall barks; flag-1 nudge (`erb:696-701`) |
| Trace How They Got In (`erb:389-438`) | 2 non-optional (generator hall, vault code) in an aim that is really a side branch | 2/2 (lockpick bark `erb:859`; vault hint `m07_phone_agent_0x99.ink:423-434`) | **Medium:** reads as mandatory, never closes if skipped, and the auto-debrief closes it for good after the abort (Beyond §1) | None |
| Get Into The Control Room (`erb:439-462`) | 2 (enter, Mercer) | 2/2 (HaX first call; flag-2 bark `erb:765`) | Low | Flag-2 bark |
| Take The Attack Host Off The Board (`erb:463-497`) | 2 (flags 3, 4) | 2/2 (hub hints; flag-3 bark) | Low | Flag-3 bark arms the clock (`erb:766-781`) |
| Stop The Sequence And Report (`erb:498-545`) | 2 (console, debrief) | 2/2 (flag-4 bark "Go and give it one", `erb:787`) | Low | Architect sign-off, then the debrief |

Task titles are action-led throughout ("Mount the attack host's open NFS export and submit the
flag on it"). Aim descriptions match their tasks. One mismatch: `question_elena` completes on
meeting her (`m07_npc_elena_rodriguez.ink:66`), while its title promises an outcome ("Find out
what Elena Rodriguez was told…", `erb:351`).

### 2h. NPC knockout resilience — OK on completability, CONCERN on coherence

| Person NPC | Gates a required task/item? | `taskOnKO` | KO reflected in debrief/credits? | Verdict |
|---|---|---|---|---|
| Ray Hollis | Badge (also printer route) | `clear_the_checkpoint` (`erb:983`) | Yes (`m07_closing_debrief.ink:307-311`, `erb:200`) | OK |
| Elena Rodriguez | Nothing critical (password via flag 2, vault via the plate) | `question_elena` (`erb:1295`) | Yes (`m07_closing_debrief.ink:295-296`, `erb:197`) | OK |
| Dr James Mercer | `confront_mercer` (required, but aim locks are presentation-only) | `confront_mercer` (`erb:1458`) | Fate yes (`m07_closing_debrief.ink:270-271`). **The stance lines contradict a KO or an escape** (`:280-287`) | Should fix (Proposed fix 4) |
| Thomas Park | Nothing critical | `neutralise_park` (`erb:1619`) | Yes, six endings (`m07_closing_debrief.ink:325-345`) | OK |

The win condition needs no NPC: the console is opened by flag 4 and the debrief by room entry.

**Coherence gaps that are not about KOs** (same family; details in Proposed fixes):
- **Elena met but left unresolved.** The debrief says "No contact logged" (`m07_closing_debrief.ink:302-304`) and the credits say "Never spoken to" (`erb:198`). This happens on a common path: talk, hear the revision, "I need to keep moving".
- **Mercer never confronted, or left mid-conversation:** no credit line at all.

## Phase 3 — prioritised action list

**Must fix (blocks play):** none. The mission is completable from every state I traced, and no KO
strands the critical path.

**Should fix**
- The auto-debrief closes off the optional plant/vault branch (and Mercer's post-abort lines) the moment the grid is saved (fix 1).
- There's no re-readable copy of the briefing, so the decode's "compare the Austin row" has nothing to compare against (fix 2).
- The debrief and credits contradict a met-but-unresolved Elena (fix 3) and a KO'd or escaped Mercer's stance (fix 4).
- The NFS field guide URL is 404 until HacktivityLabSheets `38f5d96` is pushed (fix 18, needs approval).
- The "Trace How They Got In" aim reads as mandatory, and nobody says it has to be done before the abort (folded into fix 1).

**Worth considering:** fixes 5–17 (polish, graph metadata, bark timing, guide overlap, lore line, timeline wording).

## Beyond the checklist

### 1. Pacing and dead time

- **The front end is heavy.** Before the player moves, the briefing has four optional questions,
  three briefs, a comparison and a commit (`m07_opening_briefing.ink:47-292`). A thorough reader
  hears about 40 lines of Netherton and something like 30 separate figures (187 million records,
  43 states, 4–8 million victims, $12–24 bn…). The decision is the point of the mission, so the
  length is earned. The figures are not: most players will remember three numbers per brief at
  best, and the comparison knot (`:212-237`) already boils each brief down to harm, deaths and
  reversibility. Cutting each brief to the facts the decision turns on, and moving the rest into
  a readable document (fix 2), would make the choice sharper and shorten the dead time. Hand this
  to the dialogue stage.
- **The first ten minutes inside are brisk.** Checkpoint → handover sheet → back for the badge
  (or talk/KO) → server hall. The ops floor has three readables and a key. Nothing is wasted.
- **Bark pile-ups.**
  - Ops-floor entry fires the Architect's first contact at 3 s (`erb:1057`) and HaX's RFID offer at 8 s (`erb:851`).
  - Server-hall entry fires HaX's recon offer at 2.5 s and the lockpicking offer at 9 s (`erb:859`, `:866`), with Elena in the room waiting to be spoken to.
  - First use of the VM launcher adds the NFS offer (`erb:874`).

  That's three guide offers in roughly a minute, two of them about the same scan. Fix 9 folds
  recon into the NFS offer.
- **The VM stretch** is most of the play time (90 min estimated, `mission.json`). The world
  keeps it company: the Architect's timed taunts (`erb:567-622`), the verdict texts, and the
  redirect decision. That suits a long VM section.
- **The 15-minute armed clock** (`erb:611-621`) covers exactly the privesc step. It's fair,
  because the player was told to open the control room first (`m07_phone_agent_0x99.ink:111-112`,
  `:411`, `:511`) and the walk back is one door. Running out has a written consequence (Seattle)
  rather than a fail state. Good.
- **The end is abrupt in a way that costs content.** Once flag 4 is in and the console is opened,
  the Architect calls when the container closes (`erb:1089-1098`). The debrief then opens when
  that call closes, or on *any* room entry (`erb:1127-1141`). A player who left the optional plant
  for after the emergency, which is the natural instinct, never gets to go there. That means the
  mole intercept is gone (the mission's biggest reveal), and so are Tomb Gamma, Park, and Mercer's
  `grid_saved` lines (`m07_npc_james_mercer.ink:136-137`, `:266-268`), which are almost
  unreachable because the debrief fires in Mercer's own room. Nothing warns the player. This is
  the single most important design fix (fix 1).

### 2. Does the player always know what to do next?

Mostly yes. HaX's hub is progress-gated with a hint per VM stage
(`m07_phone_agent_0x99.ink:223-230`), there's a vault-code hint that names the source and never
the digits (`:218-220`, `:423-434`), and every lock gets a bark when the player first reaches it.
Gaps:

1. **The comparison the twist rests on has no reference.** HaX: "Read the Austin row against
   what Netherton read you" (`erb:700`). The extract: "Read the Austin row against what the
   Director read you" (`erb:1390`). The extract shows `DORMANCY: T+9` and an EHR/CAD manifest. The
   "ninety days, no fatalities" it contradicts exists only in a cutscene that can't be replayed
   (`m07_opening_briefing.ink:148-152`). HaX's verdict texts do the reasoning for the player
   (`erb:708`), so the plot survives, but the player is told the answer instead of working it out.
   Fix 2.
2. **When to do the plant.** The aim says "Follow it down through the plant" (`erb:392`), but
   nothing says it has to happen before the abort (fix 1).
3. **Park's talk-down needs the casualty projection** (`m07_npc_thomas_park.ink:46`), which sits
   in the control room (`erb:1518-1531`). No line ever suggests bringing it down to the vault, so
   a plant-first player meets Park with only fight, finish-it or leave. Hollis's tip warns that
   someone is down there (`m07_npc_ray_hollis.ink:179`). One added clause there, or in HaX's
   `topic_mercer`, would point at the page (fix 7).
4. **The privesc guide arrives silently** (2c′, fix 8).

### 3. How clearly each puzzle teaches its Cyber Security idea

| Puzzle | Idea | Where the lesson lands | Verdict |
|---|---|---|---|
| Badge station PIN = audit date (`erb:1248`) | Guessable PINs; unattended issuing stations | Handover sheet only | Implicit. One HaX line after the print ("a station nobody logged out of, PIN set to a date on the wall") would make it explicit |
| Hollis's leverage | Insider threat; audit trails catch the insider | Visitor log → handover print history (`erb:1180`, `:1248`) | Clear, and well taught: log asks, history answers |
| RFID door | Readers trust the card, not the holder | HaX `m07_phone_agent_0x99.ink:445` | Clear |
| Vault code from the ATS-1 plate | Derivable secrets aren't secrets; "don't write it down" moved the secret somewhere worse | Extract T.P. note (`erb:1391`), plate (`erb:1569`) | Clear as a puzzle, never stated as a lesson. HaX could say it once when the vault opens |
| Password in clear on the listener (`erb:1404`) | Cleartext credentials | Capture text says it outright | Clear |
| NFS export / netcat listener | Services that trust the network | NFS sheet's Wider Lesson (`nfs-and-netcat-leaks.md:52-63`); `scada_backup_server` observations (`erb:1415`) | Clear once the sheet is live |
| Login arms the cascade | Defenders see you; plan before you touch | HaX first call and hints | Clear, and the best-designed beat in the mission |
| sudo → root | Misconfigured sudo, GTFOBins-style escapes | HaX `:416`; privesc sheet §Method 4 | Clear |
| The triage itself | Decisions on adversary-supplied intelligence | Debrief `hardened` stance (`m07_closing_debrief.ink:483-488`) | Clear, but only for players who pick that stance. Netherton's "Every figure you were briefed with came from material we captured" is the mission's central lesson. Consider moving it into `revision_payoff`, which every player hears |

### 4. Fun

- The best moments are social and deductive: talking Hollis round with paperwork from another
  room, working out the vault code at the door, and choosing whether to move the team on new
  evidence. These are good puzzles.
- The physical locks are thin. The plant door has a key lying on a desk *and* picks in the kit
  (`erb:1206-1218`, `:236-244`), so it's a non-event either way. The plan accepts this
  (`PUZZLE_CHAINS_PLAN.md` §9). I'd leave it: m07 is a VM mission with a clock, and padding the
  physical side would slow the finale.
- The 15-minute armed window is spent entirely at the VM terminal. In-world, only the countdown
  display changes (`erb:1513-1516`). The plan considered and dropped a situation-board variant
  (`PUZZLE_CHAINS_PLAN.md` W8). A cheaper bit of drama: the server-hall lights or Elena's rack
  could react to `cascade_armed`. Backlog.

### 5. Stakes and the story's payoff

- The stakes are concrete, and the triage is cruel in the right way. The Architect's taunts read
  the player's choice back to them (`m07_architect_comms.ink:119-140`, `:212-230`), which is the
  mission's best writing.
- **The second twist is optional, and fragile.** The mole intercept (`erb:1668-1680`) is "the
  payload the whole third act turns on". It's in the deepest optional room, and the auto-debrief
  can lock it out (§1). `coda_thin` (`m07_closing_debrief.ink:379-386`) is a decent fallback, and
  m08 opens without assuming the player saw it ("somebody read the after-action report",
  `m08_opening_briefing.ink:19`). So the fix is about access, not about making it required.
  W5 in the plan stands.
- **The intercept explains itself.** Its observations end "The leak was not the timing. It was
  you." (`erb:1674`), so the player reads the conclusion before the evidence. Let the Date line
  and the 02:41 tasking time do the work, and leave the line to HaX (`m07_phone_agent_0x99.ink:375`)
  and the coda (fix 10).
- **The Architect's promised line is missing.** `mission.json` lists the philosophy line
  "Entropy is inevitable. Systems decay. I merely publish the schedule." as a lore reveal, but no
  ink file contains it. It fits the sign-off exactly, because the schedule is the thing the
  player found (fix 11).

### 6. Do the debrief and conclusion reflect what the player did?

Very well, and better than most of the season. The debrief branches on:
- team and redirect (`m07_closing_debrief.ink:103-155`);
- whether the revision was found or acted on (`:162-197`);
- all three unanswered operations, read by name (`:203-258`);
- every person's fate, including six Park states (`:265-345`);
- two levels of coda (`:353-400`);
- a stance the player chooses (`:456-488`).

The credits mirror all of it (`erb:167-221`). Contradictions found:

1. **Elena met but not turned and not pressured.** The opening completes `question_elena`
   (`m07_npc_elena_rodriguez.ink:66`) but sets no global; `elena_outcome` stays "". The debrief
   says "No contact logged… She is in the wind" (`m07_closing_debrief.ink:302-304`) and the credits
   say "Never spoken to" (`erb:198`). This is likely to be common: players who already have the
   flag-2 password can hear the revision and leave. Fix 3.
2. **Mercer's stance against his fate.** "He recorded it in his own statement" (`:282`) and "On
   the transcript" (`:284`) play for an escaped or concussed Mercer, after the debrief has said
   he left the country or "has not said a word since he came round" (`:271`, `:275`). Fix 4.
3. **Tomb Gamma is offered to a player who never heard the name** (`:417`, `* {not asked_tomb}`).
   The not-found reply even says "Log it… exactly as you heard it" (`:441`). Fix 5.
4. **The "PROJECTION UNCHALLENGED" credit** (`erb:184`) shows for a team sent to Trojan Horse,
   where the debrief deliberately says nothing (`m07_closing_debrief.ink:192`). Fix 6.
5. **Mercer never confronted, or left mid-hub,** gets no credit line (`erb:187-190` all need a
   fate or a KO). Fix 6.

### 7. Continuity

- **Kit.** Lockpick, RFID cloner and fingerprint kit, no PIN cracker (`erb:227-263`), named in
  the briefing (`m07_opening_briefing.ink:38`). That matches m06 (`m06…/scenario.json.erb:476-493`)
  and m08 (`m08…/scenario.json.erb:226-244`). ✅
- **From m06.** "Three days ago you followed one fund paying six cells on one seventy-two-hour
  clock" (`m07_opening_briefing.ink:27`) picks up m06's last beat ("Six cells, one fund, one
  seventy-two-hour clock… That's one schedule", `m06_closing_debrief.ink:469`). ✅
- **Into m08.**
  - "Two of ours… names withheld" (`m07_closing_debrief.ink:225`) → m08 "Two of ours are dead at the sites the team could not reach" (`m08_director_netherton.ink:61`). ✅
  - Tomb Gamma with no coordinates (`erb:1662`) → Nightshade gives the Montana coordinates (`m08_nightshade_confrontation.ink:144`). ✅
  - Netherton's "Somewhere without windows" (`m07_closing_debrief.ink:498`) → "an inner room with no windows at all" (`m08_director_netherton.ink:53`). ✅
- **Timing of the leak.** m07's evidence and dialogue say the message predates the tasking by 51
  minutes and that "they did it before we had decided to send them"
  (`erb:1674`, `m07_closing_debrief.ink:369`, `:502`). m08 says Nightshade was "on the Portland
  plan for forty-seven minutes, forty-eight hours before we deployed"
  (`m08_nightshade_confrontation.ink:67`; also `m08_background_agent.ink:27`). The two can be
  reconciled: a contingency plan named the agent two days before, and the mail went out 51
  minutes before the order. But m07's "before we had decided" contradicts a plan that existed.
  Fix 20.
- **Nine days.** m08 is set "nine days" after Portland (`m08_director_netherton.ink:55`), and
  m07's Trojan Horse wakes at T+9 (`erb:1391`, `m07_closing_debrief.ink:241-244`). Nothing in
  m08 uses this yet. For a player who didn't cover Austin, m08 is the day dispatch starts dropping
  calls. Backlog.
- **Elena's timeline wobbles.**
  - She was told "a Sunday, in April" (`m07_npc_elena_rodriguez.ink:128`), but tonight is winter (28 °F, `erb:1229`; "It is winter", briefing `:54`).
  - She "spent four months" on it (`:236`), but her survey was 15 June (`erb:1180`, `:1424`), and Hollis has had "six months" (`m07_npc_ray_hollis.ink:172`).
  - She "would rather have known this in March" (`:248`).

  Pick one calendar and hand it to the dialogue stage (fix 12).
- **Recurring characters.** Netherton, HaX and the Architect only. Netherton's debrief and
  HaX's hub match their established roles. The voice check belongs to the dialogue stage.

## Proposed fixes

1. **[major, mission-local] Don't let the abort close the optional branch.** Today the debrief
   opens when the Architect's sign-off closes, or on the next room entry (`erb:1127-1141`).
   Recommended change:
   - Add a `debrief_requested` global and require it in the `all_in` condition (`erb:1127`).
   - After `architect_signoff_done`, HaX texts something like: "Grid's held. Netherton wants you on the link. If there's anything down in the plant you want bagged, now's the time. Call me when you're ready."
   - Add a sticky hub choice `{grid_saved and not debrief_requested} [Bring me in.]` that sets `#set_global:debrief_requested:true` + `#exit_conversation`. The existing room-entry and minigame-close mappings then open the debrief on the next UI close or room entry.
   - Add a fallback timer: `startOnGlobal: architect_signoff_done`, about 5 minutes, which sets `debrief_requested`, so nobody waits forever.
   - Keep the `flags_nag` rows (`erb:887-895`) as they are.
   - Check: the bond visualiser and credits still follow the debrief's last line (lesson 46, `m07_closing_debrief.ink:516`); reopencheck on HaX; one reload playtest after the abort.

   *Minimal alternative:* one line in the flag-3 barks (`erb:772`, `:780`) and `vm_hint_4`
   (`m07_phone_agent_0x99.ink:418`): "Anything you want from the plant, get it before you abort.
   Once the grid holds, Netherton pulls you out." This is cheaper, but it lands while the clock is
   running.
2. **[major, mission-local] Give the player the briefing on paper.**
   - Add a start-inventory readable, "Threat Desk Summary — Tasking 02:41 PT", in the `text_file` shape that already works for inventory reads (`erb:1384-1395`).
   - It holds three rows (op, site, harm, projected deaths, horizon), Austin's included: "Dormancy 90 days. Projected fatalities: none. Graded strategic."
   - The decode then contradicts something the player is holding.
   - Point HaX's nudge (`erb:700`) and the extract's observations (`erb:1390`) at "your tasking summary".
   - Optional: trim the figure lists in the three brief knots (`m07_opening_briefing.ink:108-206`) now that the document carries them. That's a dialogue-stage job.
3. **[major, mission-local] Elena met but unresolved.**
   - Add `elena_met` (declared in `globalVariables`), set by `#set_global:elena_met:true` next to the `#complete_task` at `m07_npc_elena_rodriguez.ink:66`.
   - Debrief `the_people` (`m07_closing_debrief.ink:302-304`): new branch `elena_met and elena_outcome == ""`, e.g. "Elena Rodriguez talked to you and you left her at the rack. She was still there when the police came down, with the hospital column half put back."
   - Credits (`erb:198`): add `&& !globalVars.elena_met` to the "Never spoken to" line, and add a "Spoken to, left at the rack" entry.
4. **[major, mission-local] Mercer's stance lines must respect his fate** (`m07_closing_debrief.ink:280-287`).
   - Keep the statement/transcript wording only under `mercer_fate == "arrested"`.
   - For escaped, KO, or `mercer_fate == "ko"`, use fate-neutral lines: "You told him what he was. He took that with him." / "You argued with him. He'll remember being argued with." / "You gave him nothing. He'll have found that harder than anything you could have said."
5. **[minor, mission-local] Tomb Gamma question** (`m07_closing_debrief.ink:417`). Gate it on
   `found_tomb_gamma`, and drop the `else` reply at `:440-441`, or reword that choice for a player
   who has never heard the name.
6. **[minor, mission-local] Credits gaps.**
   - `erb:184`: add `&& globalVars.team_assignment !== 'trojan_horse'`, to match `m07_closing_debrief.ink:192`.
   - Add a Mercer line for `!globalVars.mercer_fate && !globalVars.mercer_ko`: "DR. JAMES MERCER (BLACKOUT): Left at the console — gone before the police reached the room". This matches the debrief's `else` at `m07_closing_debrief.ink:276-277`.
7. **[minor, mission-local] Point at the projection for Park.**
   - Add a clause to Hollis's tip (`m07_npc_ray_hollis.ink:179`), e.g. "…He hasn't come up. Whatever they told him, it wasn't the number."
   - Or add a HaX line when `vault_entered and not casualty_projection_found`.
   - While there: Park's "They said data centre" (`m07_npc_thomas_park.ink:76`) doesn't fit a grid control site. Dialogue stage.
8. **[minor, mission-local] Announce the privesc guide.** Append "Privilege escalation guide's
   yours if you want it." to the flag-3 barks (`erb:772`, `:780`).
9. **[minor, mission-local] One VM guide offer, not two.**
   - Drop the recon offer on server-hall entry (`erb:861-867`).
   - Set `recon_guide_offered` from the vm-launcher mapping (`erb:868-875`), and change its text to "Map the host first… Want the recon guide, or the NFS and netcat one?"
   - Both hub choices already exist (`m07_phone_agent_0x99.ink:237-240`).
   - This also removes the second server-hall bark.
10. **[minor, mission-local] Let the intercept be evidence.** Trim the mole intercept's
    observations (`erb:1674`) to the facts: "Check the Date line against your own tasking. The
    Director put you on Portland at 02:41 Pacific, 10:41 UTC." Drop "The leak was not the timing.
    It was you." and leave that line to HaX (`m07_phone_agent_0x99.ink:375`) and the coda.
11. **[minor, mission-local] Deliver the promised Architect line.** Add "Entropy is inevitable.
    Systems decay. I merely publish the schedule." to `signoff_close`
    (`m07_architect_comms.ink:335`), or remove it from `mission.json` `lore_reveals`. Adding it is
    better: the schedule is what the player found.
12. **[minor, mission-local] One calendar for Elena.** Reconcile "a Sunday, in April", "four
    months" and "in March" (`m07_npc_elena_rodriguez.ink:128`, `:236`, `:248`) with the June
    survey and a winter night. Dialogue stage.
13. **[minor, mission-local] Small wording and tidy-ups.**
    - HaX hub label "I'm on the attack host and I don't know where to start" (`m07_phone_agent_0x99.ink:223`): the player is on their own Kali box. Say "I'm on the Kali box. Where do I start on their host?"
    - The debrief header comment says it fires from `mission_complete` (`m07_closing_debrief.ink:5`). It doesn't.
    - `ops_floor_workstation` (`erb:1254-1260`): give it one line of text, or make it scenery.
    - `question_elena` title (`erb:351`): "Talk to Elena Rodriguez in the server hall" matches when it completes.
14. **[minor, mission-local] Graph metadata.**
    - `puzzle_graph_unlocks: "crisis_control_system"` on `terminate_cascade_scripts` (`erb:486-495`).
    - `puzzle_graph_unlocks: "cable_vault"` on `coordination_extract` (`erb:1384-1395`).
    - Re-run the validator to confirm the win lock is connected.
15. **[minor, mission-local] Dead LOS config.** Remove the `los` blocks on Hollis and Park
    (`erb:1016-1021`, `:1634-1639`), or leave a one-line comment that the engine checks nothing
    against them. Optional.
16. **[minor, mission-local] Say the lesson once.** HaX lines on the two derivable-code puzzles:
    - after the badge prints: "PIN set to the audit date. Anyone who reads the wall can print a badge.";
    - after the vault opens: "'Don't write it down', so they riveted it to the door."

    Consider moving Netherton's "Every figure you were briefed with came from material we
    captured…" (`m07_closing_debrief.ink:486`) into `revision_payoff`, so every player hears the
    mission's central lesson, not only the `hardened` stance.
17. **[minor, mission-local] Briefing figures.** Hand the number-density point (Beyond §1) to the
    dialogue stage, alongside fix 2.
18. **[major, needs approval — HacktivityLabSheets] Publish `nfs-and-netcat-leaks`.** Commit
    `38f5d96` is local only (`main` ahead 1 of `origin/main`). `…/labs/safetynet/nfs-and-netcat-leaks/`
    returned 404 on 2026-10-02. Push it, then re-check the URL. m07's item already points at the
    right path (`erb:947`).
19. **[minor, needs approval — HacktivityLabSheets] Make the SSH sheet mission-neutral.**
    `ssh-access-and-bruteforce.md:13`, `:34-42` hard-code m02's hospital, Gary and
    `192.168.100.50`, which is also m07's Kali stand-in address (`erb:1329`). Use `{TARGET_IP}`
    and a neutral example, as `nfs-and-netcat-leaks.md` does. HaX's caveat
    (`m07_phone_agent_0x99.ink:502`) can then lose "Worked example's the hospital job".
20. **[minor, mission-local, check against m08] When the leak happened.** m07 says the leak came
    "before we had decided to send them" (`m07_closing_debrief.ink:502`); m08 has the Portland
    plan read 48 hours earlier (`m08_nightshade_confrontation.ink:67`; m08's own timeline comment
    says "The plan was opened D-2 10:38-11:25 UTC", `m08…/scenario.json.erb:53`). Change m07's line to
    "before I had told you", or "before the order went out". That keeps the 51-minute intercept
    and is true under m08. If m08 is edited instead, that's another mission's file.
21. **[minor, needs approval — SecGen] `lab_sheet_url`.** `m07_architects_gambit.xml` (and m02's)
    have no `<lab_sheet_url>`; m01 and m03–m06 and m08 do. If the convention matters, point m07's
    at `nfs-and-netcat-leaks` once it's live.

## Ideas for the backlog

- **m08: day nine.** m08 is set nine days after Portland, and the Trojan Horse backdoor wakes at
  T+9 if the team didn't go to Austin. m08 could open on dispatch failures in eleven counties
  (`m07_closing_debrief.ink:244`) for those players and stay quiet for the others. Needs
  `team_assignment` / `team_redirected` carried across missions (see next item).
- **Carry m07's choices forward.** `mission.json` says `consequences_persist: true`, but a grep of
  `app/`, `lib/` and the client JS found no mechanism (and m08's erb reads none) that hands `team_assignment`, `elena_outcome`, `mercer_fate` or
  `found_mole_evidence` to m08. Engine/server feature: named cross-mission globals.
- **Engine: let a flag reward carry more than one action.** m07 derives `flag2_submitted` and
  `flag4_submitted` from `objective_task_completed` mappings because one reward slot holds one
  action (`erb:753-757`, `:782-787`). An array per flag would remove that bridge class.
- **Engine: emit `item_unlocked` on a remote `unlock_object`** (`interactions.js:28-47`), or teach
  the validator that a `contents` container completes on its first open. Either would stop the
  recurring false-positive warning, and it would complete the task even if the player never
  clicks the console. Today that last case is impossible only because the debrief waits for
  `grid_saved`.
- **Engine: guard LOS that does something.** Hollis's and Park's cones are decorative. A simple
  "spotted → conversation opens / guard turns hostile" hook would make evade a stealth play
  instead of a menu choice. m03, m06 and m07 all have guards that could use it.
- **UI: a re-readable cutscene log.** Briefings carry facts the player needs later (m07's figures,
  m06's fund). A "transcript" tab in the phone or notes, filled from cutscene text, would serve
  every mission. Fix 2 is the local workaround.
- **World reaction to the armed clock.** Lights in the server hall dimming, Elena's rack lighting
  up, or the situation board's step-one row turning red on `cascade_armed`. Small `textVariants`
  and tint actions, but a shared "alarm state" room effect would be reusable.
- **Art.** The genset hall uses `room_battery_hall` and the cable vault uses `room_archive_1x2gu`
  (`erb:1536`, `:1591`). A diesel-genset room and a below-ground cable vault (trays, trunk runs,
  splice boxes) would fit m07 and any later CNI mission. Image generation needs approval, one at a
  time.
- **Lab sheets.** The RFID-cloning and distcc sheets' Mission Application sections describe m03
  (already logged in `PASS3_APPROVAL_LOG.md:113`). The SSH sheet describes m02 (fix 19). One pass
  to make every SAFETYNET sheet mission-neutral would stop this recurring.

## Changes made (pass 4 design)

Implementer: design-fix agent, 2026-10-02. Mission-local only, apart from the universe-bible notes the
user asked for (P6) and four m07 globals added to the m07 block of
`scripts/ink_runtime_check/missions.json` so reopencheck exercises them. No commit.

### Fix by fix

1. **Done.** `debrief_requested` is now part of `all_in` on every `closing_debrief` trigger. After the
   Architect's sign-off (`architect_signoff_done`, all four flags in) HaX texts "Grid's held. Netherton
   wants you on the link. If there's anything down in the plant you want bagged, now's the time. Call
   me when you're ready to come in." A sticky hub choice `[Bring me in.]` (`bring_me_in`) sets
   `debrief_requested` and exits; the debrief then opens on the phone closing, or on the next room
   entry. If a flag is still missing it says so, and the debrief opens when the relay closes after the
   last one. **Changed detail:** the fallback timer (`debrief_fallback`) runs 8 minutes, not 5. Going
   down after the abort means walking two rooms, working out a keypad code and possibly talking Park
   round, and 5 minutes cut that short. The timer sets a separate latch (`debrief_timer_fired`), and a
   HaX mapping turns it into `debrief_requested` with a warning ("Next door you go through, he's on
   the link"), so the debrief never lands on an unwarned room entry. The flags nag now ends "then call
   me and I'll put you through". The optional aim is retitled "Trace How They Got In (Optional)" and
   its description says it can be done before or after the abort. Mercer's post-abort lines are now
   reachable because the debrief no longer fires on entering his room.
2. **Done.** Start item `threat_desk_summary`, "Threat Desk Summary -- Tasking 02:41 PT" (`text_file`):
   the three briefs plus Blackout, each with harm, projected deaths, horizon and grade. Trojan Horse
   reads "Dormancy: 90 days … Deaths: NONE PROJECTED … STRATEGIC". It also carries "Issued 02:41 PT /
   10:41 UTC", which is what the mole intercept's Date line is read against (fix 10). HaX's flag-1
   nudge and the decode's observations now say "against the threat desk summary in your kit".
   Trimming the brief knots is left to the dialogue stage (fix 17).
3. **Done.** `elena_met` is declared, set in Elena's `opening` beside `#complete_task`, and read by the
   debrief (new branch: "Elena Rodriguez talked to you and you left her at the rack. She was still
   there when the police came down, with the hospital column half put back.") and by the credits
   ("Never spoken to" now needs `!elena_met`; new entry "Spoken to, left at the rack").
4. **Done.** The statement and transcript wording plays only for `mercer_fate == "arrested"` and not
   KO'd; otherwise "He took that with him." / "He will remember being argued with." / "He will have
   found that harder than anything you could have said."
5. **Done.** The Tomb Gamma question needs `found_tomb_gamma`; the "name is new to me" reply is gone.
6. **Done.** "PROJECTION UNCHALLENGED" is hidden when the team went to Trojan Horse. New credit for a
   Mercer with no fate and no KO: "Left at the console — gone before the police reached the room".
7. **Changed approach.** A HaX text on vault entry (9 s), only while the projection is unread and Park
   is alive and not talked round: "That'll be their plant man. They brief people like him on a
   building, not a body count. The projection Mercer signed is on the console upstairs, if you want him
   to read it." Hollis's tip was the other option, but only players who talk him round hear it; the
   text reaches everyone who needs it. Park's "They said data centre" is left for the dialogue stage.
8. **Done.** Both flag-3 texts end "Privilege escalation guide's yours if you want it."
9. **Done.** The recon offer on server-hall entry is removed. The vm-launcher mapping sets
   `recon_guide_offered` with `nfs_guide_offered` and asks "Want the recon guide, or the NFS and netcat
   one?" Server-hall entry now sends one text (the lockpicking offer).
10. **Done.** The intercept's observations stop at "Check the Date line against your own tasking. The
    Director put you on Portland at 02:41 Pacific, 10:41 UTC." The conclusion is left to HaX and the coda.
11. **Changed approach.** The line is at the foot of the relay decode, above "-- A.": "Entropy is
    inevitable. Systems decay. I merely publish the schedule." The voice bible keeps his aphorisms for
    his writing and his spoken lines short, and the decode is literally the schedule, so the line lands
    where the player is reading his own table. `mission.json`'s lore reveal is now true. No TTS cost.
12. **Done.** One calendar: survey 15 June, tonight is December (28 °F). Elena was told "a Sunday, in
    September"; a new line follows it ("It's December. It's twenty-eight degrees outside."), so the gap
    becomes part of the lie rather than a wobble. "Four months" → "six months" (matches Hollis), "in
    March" → "in June".
13. **Done.** Hub label "I'm on the Kali box. Where do I start on their host?"; the debrief's header
    comment describes how it really opens; `ops_floor_workstation` is a read-only grid view
    (`readDisplay: gameDisplay`, not added to notes) with Halvorsen's sticky note; `question_elena` is
    "Talk to Elena Rodriguez in the server hall".
14. **Done.** `terminate_cascade_scripts` carries `puzzle_graph_unlocks: crisis_control_system` (the win
    lock is now connected: `vmfl_terminate_cascade_scripts --> lock_crisis_control_system`). The vault
    rule edge is drawn from `recover_coordination_traffic` (`vmfl_recover_coordination_traffic -->
    door_cable_vault`), because the graph generator reads unlocks off tasks, not off the relay's
    `itemsHeld`. Putting it on the decode item as well raised a "same unlock target" warning, so it's
    only on the task.
15. **Done (comment).** ERB comments mark both `los` blocks as decorative. Kept for a future guard-LOS hook.
16. **Done.** HaX texts when the printed badge is picked up ("PIN set to the audit date, and the date's
    on a sheet in the next room. Anyone who reads the paperwork can print themselves a badge.") and when
    the vault keypad opens ("'Don't write it down,' so they riveted it to the door. A code you can read
    off the room isn't a secret."). Netherton's "Every figure you were briefed with tonight came from
    material we captured…" moved into a new `revision_payoff.revision_lesson` stitch that every player
    hears; the `hardened` stance no longer repeats it.
17. **Not done.** Briefing figure density is a dialogue-stage job.
18. **Not done (needs approval).** HacktivityLabSheets push of `nfs-and-netcat-leaks`.
19. **Not done (needs approval).** SSH sheet's example host and hospital worked example.
20. **Done in m07; m08 untouched.** Netherton's handoff: "…and they did it before the order went out."
    HaX coda: "The message predates the deployment order by fifty-one minutes." / "He had the assignment
    before we gave it." HaX `topic_mole`: "He had your deployment before the order went out." All true
    under m08's timeline (plan finalised T-72h, opened at T-48h, intercept T-51m).
21. **Not done (needs approval).** SecGen `lab_sheet_url`.

Validator warning 2–8 (`grid_saved` nags): left as one latch across three rows.

### User decision P6: the Tesseract thread

- **The plant.** The Architect's first call (`t30_close`, heard by every player who answers it) now
  ends "Let it hurt afterwards, not during. I expect you've been told that." It is HaX's own line (she
  gives it in `moral_soundingboard`: "let it hurt afterwards and not during"). The tag
  `#set_global:architect_echo_heard:true` opens a HaX hub choice quoting it (`topic_teacher`). HaX:
  "...Say that again." She says it's something she tells every agent she runs, that somebody taught it
  to her "a long time ago. Somebody who taught a lot of us", and asks the player to keep it out of their
  notes for now. No name. A player who read m06's file (Tesseract trained half the field; HaX was his
  student) will connect it; one who didn't learns only that the Architect knows how SAFETYNET trains
  its people. m08 can build on it.
- **Canon.** `the_architect.md`: "Real Identity" now reads unknown to ENTROPY, with SAFETYNET's lead
  suspect named; a new section "Identity: what SAFETYNET suspects" (ENTROPY doesn't know; SAFETYNET
  has a lead, not a fact; m07 plants without naming; confirmation m08 or later, M9 in the season plan);
  "What Players Learn" notes the split. `agent_0x99_haxolottle.md`: a short "Dr. Adrian Tesseract
  (former teacher)" subsection. Voice bible, Architect: a "The teacher" habit line (once per mission at
  most, never explained, never names himself).

### Checks run (static only; no browser test yet)

- Ink recompiled with `bin/inklecate` (Elena, HaX, debrief, Architect); no .json older than its .ink.
- `ruby scripts/validate_scenario.rb`: 0 errors; schema, ink, geometry and doors pass. With the
  validator now in the tree, 6 wiring warnings, all co-firing `onceOnly` handlers on `agent_0x99` that
  are meant to fire together. Dungeon graph regenerated (Puzzle 41 nodes / 47 edges).
- `python3 scripts/check_door_alignment.py`: all doors OK.
- Render + assertions on the JSON: start item, timer, three new globals, eight debrief triggers all
  needing `debrief_requested`, the new HaX mappings, the vm-launcher setting `recon_guide_offered`,
  three server-hall mappings, credits, decode text, intercept text, workstation text, the win-lock edge.
- inkcheck + loopcheck, 15 states (HaX start/hub/bring_me_in/topic_teacher with flags full and partial,
  debrief requested or not; Architect after contact and after the win; Elena two states; debrief four
  fate/stance/team mixes): all clean, 0 runtime errors.
- `reopencheck.mjs … m07`: agent_0x99 1800 reopens, the_architect 1800 reopens, 0 problems.
- `tagdiff.mjs`: 47 structural differences, all intended (listed in the report): new VARs
  (`elena_met`, `debrief_requested`, `architect_echo_heard`, `teacher_discussed`), new knots
  `bring_me_in` and `topic_teacher`, new stitch `revision_lesson` with four diverts re-pointed to it,
  the Tomb Gamma choice condition, the Mercer-fate and Elena-met conditions, two new `set_global` tags
  and one `exit_conversation`. Mercer, Hollis, Park and briefing ink: no structural or prose change.
- TESTING_WALKTHROUGH.md updated (steps 1, 4–8, 13, 16–18, the optional branch, nine new variants).
- Playtest script: `PASS4_PLAYTEST.md`.

## Changes made (pass 4 design) — Round 2

Inputs: `DESIGN_REREVIEW_1.md` (F1–F8, F10, S1, S3; F9 left for the dialogue stage) and the browser
playtest `tools/playtest/m07-pass4-report.md`. No commit.

### Re-review findings

- **F1 + S1. Done.** HaX now says "Let it hurt afterwards, not during." in her first call
  (`first_call_committed`, a text knot, so re-navigation is safe), where every committed player hears it
  before the Architect echoes it. A local `hurt_line_said` is set there and in "How do you carry that?";
  `topic_teacher` branches on it, not on `moral_discussed`. Hub label: "He used your line. 'Let it hurt
  afterwards.'"
- **F2. Done.**
  - The warning comes first: the sign-off text now ends "Call me when you're ready. In eight minutes he
    comes on anyway."
  - `debrief_fallback` starts on `grid_saved` (9 min), so a reload during the sign-off can't strand it.
  - The fallback text no longer says "bag what you've got". When a flag is missing, three rows (the first
    to fire sets `debrief_requested` and closes the others) say "The moment the last of it is through the
    relay, he's on."
- **F3. Done.** Task-level `puzzle_graph_unlocks` removed. The ATS-1 switch carries
  `puzzle_graph_and_with: "SAFETYNET Relay Terminal"`; the graph shows `relay -.-> + <- switch`, then
  `+ --> door_cable_vault`. The decode itself can't be named because the generator doesn't walk the
  relay's `itemsHeld` (its node doesn't exist, so the tool edge was dropped).
- **F4. Done.** Park pointer: 4 s, `skipIfGlobal: park_resolved`, shorter text.
- **F5. Done.** `take_the_debrief` is titled "Call HaX when you're ready to be brought in".
- **F6. Done.** The sign-off text has a second, disjoint row for a player who already holds the
  intercept (no plant line).
- **F7. Done.** "MERCER ON RECORD" only for `arrested` and not KO'd; otherwise "MERCER, CONFRONTED: Told
  what he was / Argued with, to the end / Given nothing to answer". Gap: a Mercer both `arrested` and
  `mercer_ko` gets neither line. No current path leads there (arrest hides him).
- **F8. Done.** "Washington DC", "pushed to your handset".
- **F9. Not done** (dialogue stage). I did trim the three over-cap texts this pass had touched (vm
  offer, flags nag, sign-off) under 30 words. The flag-3 texts, the HaX/Netherton long lines and "he
  allowed it" are left.
- **F10. Done.** `architect_echo_heard` was already in CONTRACT.md's pass-4 list; the timer line is
  corrected and a round-2 line added. `notable_locations.md`: Marcus Tesseract, founder of the Tesseract
  Research Institute, is now Adrian's younger brother, "not known to be in contact"; any ENTROPY interest
  in the family is marked an open thread, not canon.
- **S3. Done.** "It's December. It's below freezing out there." now follows the September line; that
  line reads "when nobody needs the heating" ("load-bearing" gone).

### Playtest findings

1. **Credits per stance. Done.** `hardened` now reads "Wants the numbers before he writes them — no
   more briefing off his figures". The other three already matched.
2. **Plant key latch. Worked round; engine cause confirmed.** `addKeyToInventory`
   (`public/break_escape/js/systems/inventory.js`, the `item_picked_up:key` emit at about :671-680)
   emits the event but never applies `onPickup`. `onPickup.setVariable` is read only at
   `interactions.js:1377` (text_file), `:1455` (notes), `inventory.js:271` (reward notes) and
   `npc-game-bridge.js:30` (NPC gifts), so generic takeables and keys ignore it. Mission fix: an
   `item_picked_up:key` mapping with `data.itemId === 'generator_maintenance_key'` sets
   `maintenance_key_found`. The `onPickup` is left in place.
3. **Post-abort Mercer. Done.**
   - Opening, stance gate, `returning` and the numbers topic read `grid_saved`: "You took it off me at
     that console. I sat here and watched you do it.", "There's no clock now, so we can be honest…".
   - Choice labels are in the past tense via inline conditionals.
   - The KO text splits on `grid_saved`. Post-abort: "Mercer's on the floor. The grid held without him,
     and it'll hold with him asleep. The police can carry him down."
4. **Redirect after the abort. Reworded.** The choice still shows, which is a fair question, and HaX
   still refuses. The last line becomes "The team's where it is, and the part that was yours is finished."
5. **Player notes. Done.**
   - Park pointer: findable on HaX's hub as "The man in the vault won't stop. What would reach him?"
     (`topic_park`) while the projection is unread and Park is alive, not talked round, not hostile.
   - "DORMANCY: T+9 DAYS" (the twist still needs the summary's "90 days").
   - Threat Desk Summary: compact two- or three-line entries, Blackout then Trojan Horse first.

**Reload side effects (not fixed).**
- The Mission Brief reopening on load is the scenario's own `"show_scenario_brief": "on_resume"`
  (`erb:73`), working as configured. Change it to show only on first load if the user wants (mission-local,
  one line).
- The respawn at the checkpoint (position not persisted) and the missing door entity for a door unlocked
  before the reload look like engine. I didn't trace them.

### Checks (round 2, static)

Recompiled Mercer, Elena and HaX. Validator: 0 errors, 7 wiring warnings, all intended co-firing rows
(the new one is the four `debrief_timer_fired` rows). Doors OK. Render assertions pass for every round-2
change. Reopencheck m07: 0 problems (1800 + 1800 reopens). Tagdiff: 71 structural differences in total;
the round-2 additions are listed in the report. dialoguelint: no touched line over a cap except the
pre-existing long lines noted under F9. inkcheck + loopcheck over 14 states (HaX start/hub/bring_me_in/topic_teacher/topic_park/redirect_closed/first_call_committed; Mercer pre- and post-abort; Elena; Architect; debrief ×2): all clean. Playtest:
`PASS4_PLAYTEST.md`, "Round 2 confirmation run".

### Round 3 (confirmation run, step 1)

- **"Let it hurt afterwards, not during." moved out of `first_call_committed`.** The phone preload runs
  `start` before the briefing commit, so the thread holds `first_call_open`, and that knot was never
  reached (`phone-chat-minigame.js:284-305`, `:458-463`). The line is now a HaX text: on
  `global_variable_changed:team_assigned` ("Team's turned. Two of the three go unanswered tonight. Let it
  hurt afterwards, not during.", 2 s), or, for a player who reaches the ops floor uncommitted, on
  `room_entered:operations_floor` ("You're inside. Whatever you decide tonight, let it hurt afterwards,
  not during.", 1 s). Both latch on `hurt_line_said`, now a synced global, so only one fires.
- **The Architect can't come first.** His first contact is the 3 s ops-floor bark, and his echo is in
  `t30_close` only. A briefing or hub commit happens before the ops floor; an uncommitted player gets
  HaX's text at 1 s, the Architect's at 3 s.
- "How do you carry that?" still sets `hurt_line_said`, which now syncs out.
- **Checks:** HaX recompiled; validator 0 errors, 7 wiring warnings (`room_entered:operations_floor` now
  has four co-firing rows, intended); doors OK; render asserts (two latching rows, HaX 1 s before the
  Architect's 3 s); reopencheck 0 problems; loopcheck clean on HaX `start`, `first_call_committed`, `hub`,
  and `topic_teacher` both ways; tagdiff 70 structural differences (the `first_call_committed` assignment
  is gone; `hurt_line_said` is a VAR, assigned in `moral_soundingboard_choices`, read in `topic_teacher`).
- Playtest script step 1 and the walkthrough updated; the old "twenty-eight degrees" expectation in the
  script is replaced.
