# m04 Critical Failure — Pass 2 improvements

> The m02-standard pass. Sources: `scenario.json.erb`, the ten `.ink` files, the
> engine (`public/`, `app/`), m02/m03 as worked examples, and the escalated
> universe bible. Nothing was committed. Everything is derived from the `.erb`
> and the engine, not the hand-written docs.

## Review round 3 (browser playtest 1161/1162) — fixes, re-verified live in 1163/1164

The playtest reached `status=completed`, but only by teleporting past a door. Every
defect it found is fixed. D1, D2, D4, D8 and D9 were re-checked in two fresh live
games (logs `tools/playtest/m04-pass2-r3-session.jsonl` and `-g2.jsonl`,
screenshots `m04-pass2-r3-shot-*.png`).

- **D1 (blocker): the SCADA → hall 1 doorway opened onto a solid wall.** Cause:
  for a single north/south connection between rooms of different widths, the
  engine places the new room using the parity of the *current room's origin*
  (`rooms.js` positionSouthSingle/positionNorthSingle, :1317/:1222). It places each
  room's door using the parity of the *shared wall*
  (`doors.js` placeSouthDoorSingle/placeNorthDoorSingle, :150/:66). The control
  room is `room_control_1x2gu` (10×6), with a stacking height of one grid unit, so
  the two parities disagree and the doors land 320px apart. The validator checks
  room overlap, not door alignment, so it passed. Fix: hall 1 now hangs **east**
  of the control room. E/W pairs are top-aligned and both doors sit at top + 2.5
  tiles, so they always line up. No text depended on "south". I checked every m04
  connection with a port of the engine's BFS and door placement: all 8 align, no
  overlaps. The same model reports m01–m03 all aligned, which is how I trusted it.
  Live: plain pathfinding now walks ops → SCADA → hall 1 → hall 2 → plant room.
- **D2: Vance's keycard never arrived.** Live, the m02 selector form
  `#give_item:keycard:vance_level1_keycard` gives the card on both the cover and
  the ally route (`giveItem` → success, card in inventory). The card has an `id`,
  and `chen_provided_keycard` is set **only** by an `item_picked_up:keycard`
  mapping conditioned on `data.itemId`. If a give ever fails, the hub's "I still
  need a facility keycard" safety net stays available. *Not isolated:* why the
  playtest build's give never reached `giveItem`. That build set the flag in ink
  just before the tag and used the selector-less form. Both are gone, and the
  path works live. `processGameActionTags` needs `currentConversationNPCId` for
  `give_item`/`remove_npc` but not for `complete_task`, which matches the split
  the playtest saw.
- **D4: the escaped Voltage stayed in the room.** Found live: `#remove_npc`
  *does* run and returns success, but `removeNpcFromScene` destroys
  `npc._sprite`, which is unset for NPCs in rooms loaded later. `registerNPC`
  rebuilds the registry entry after the sprite exists (engine; logged with
  evidence). Vance and the guard (early-loaded rooms) keep the reference. Voltage,
  Static and Relay don't. Fix: a `setVisible:false` mapping on Voltage (the
  behaviour manager holds its own sprite). He's then invisible, his body is
  disabled, the interact scan skips him, and the punch cone ignores him
  (`player-combat.js:293`). A `room_entered:plant_room` re-hide covers reloads.
  His KO global is now `voltage_ko`: `globalVarOnKO` writes inside the engine, so
  no mapping condition could have stopped `voltage_captured` being set. Live: after
  the escape stance, a forced KO leaves `voltage_captured=false`.
- **D3:** HaX's relay lines now read true whether or not the physical card drops.
  The `_sprite` gap above means hostile NPCs in later rooms can't drop at all, so
  the relay is the dependable route.
- **D5:** the `unlockCondition` was right. The engine auto-reveals a locked aim when
  any of its tasks completes (`objectives-manager.js:414-419`).
  `neutralize_operative_relay` and `confront_voltage` can finish before any flag,
  so they moved to a new aim, `take_back_the_plant` (revealed after
  `confirm_the_lie`). `stop_the_runaway` keeps only tasks that can't complete before
  `map_the_attack`.
- **D6:** the ESD minigame has one static `unauthorizedText`
  (`esd-pushbutton-minigame.js:122`). It's now a state-neutral checklist that is
  accurate in every state and no longer assumes Voltage is present.
- **D7:** `scan_scada_network`, `investigate_compromised_services` and
  `exploit_distcc_vulnerability` complete on flags 1, 2 and 4.
- **D8:** the BESS diagram had no template slot and fell back to a random spot in
  hall 1's east doorway. It's pinned at hall-local (18, 8). The SCADA HMI also
  fell back into the new east doorway, but it has no physics body, so it doesn't
  block.
- **D9:** Relay's patrol used `patrol.route`, which the engine reads only for
  multi-room `{room, waypoints}` segments (`npc-behavior.js:321,353`). With no
  waypoints she random-walked into the gaps between the racks. The patrol now
  uses `waypoints` on the service aisle. Live: 4 waypoints validated, and she moves
  along y≈6.4.
- **Also:** HaX's RFID bark no longer promises card cloning (m04 has no cloner).

### The door-alignment rule (for the m05–m08 brief)

> **A single north/south connection between rooms of different widths can put the
> two doors in different places.** The engine positions the new room from the parity
> of the *already-placed* room's origin, but each door from the parity of the
> *shared wall*. They agree only when (a) the room that is placed first, if it's the
> northern one, has an **even stacking height in grid units** (stack = height − 2
> tiles; 1 GU = 4 tiles), and (b) when the rooms end up right-aligned, the **width
> difference is an even number of GUs** (1 GU = 5 tiles). Equal-width N/S pairs and
> all E/W pairs always line up. The common trap is any 10×6 `*_1x2gu` template
> (1 GU stack) with a room of a different width directly north or south of it. The
> validator's geometry check tests overlap only, so check doors with the engine
> port (`door_align.py`, see the approval log) or walk every doorway in a playtest.

### Verification after round 3
- validator: schema passes, no unknown fields, geometry OK, 0 errors. Two intended
  wiring warnings (the disjoint `operatives_defeated` pair plus the KO-card relay on
  each `npc_ko` pattern).
- compile: 10/10. inkcheck 10/10 at the declared knots, plus re-entry states;
  loopcheck clean on every hub (21/21 total).
- Door check: 8/8 connections aligned (m01–m03 also all aligned under the same
  model).
- Live (1163/1164): D1, D2 (both routes), D4, D8 and D9 as above. The Relay KO
  relay-copy handover worked again.
- Not re-verified live: D5 (the aim reveal order), D6 text, D7 ticks, and the
  fight stance through real combat.

## Review round 2 (adversarial reviewer + orchestrator) — corrections and new fixes

A reviewer pass found that several round-1 claims were wrong, and several real
faults survived. All are now fixed; the wrong claims are corrected here:

- **"Clean spine" was overstated.** The ESD could be pressed with *no VM work
  done* — `esd_authorized` needed only `anomaly_detected` + `voltage_neutralised`,
  and Battery Hall 2 → plant room needs only the Level 1 card. The flag work the
  `concludeRequires` depends on was skippable up to the button. Fixed (M1): the
  ESD now also requires `attack_mechanism_known`, keyed on the `map_the_attack`
  aim completing.
- **"Vance hands a Level 1 keycard" was false on 15 of 39 paths**, including all
  12 ally paths (they reach `chen_commits_to_helping`, which bypassed the
  cover-story knot where the card was given). Fixed (M3): the card is handed over
  in `chen_commits_to_helping` and offered again as a sticky `vance_hub` choice,
  both guarded on a now-global `chen_provided_keycard`.
- **"No contradiction with m03" was wrong.** m03's debrief already delivers the
  Architect directive ("Zero Day supplies, Critical Mass executes, grid storage,
  winter"), but m04's briefing and debrief spoke as if the coordination were a
  fresh discovery ("we need proof", "a level we've never seen before"). Rewritten
  (M6) so m04 pays off m03: this is the attack m03 warned of. Also fixed the false
  "your first mission with hostile operatives" (m01 has hostiles).
- **"In-room hostiles have sprites at KO" was an unproven assumption.**
  `dropNPCItems` returns early without `npc._sprite` (`npc-hostile.js:257-261`),
  and m03's live D3 saw `_sprite` unset for an NPC KO'd in her own room. The Level
  2 and Master cards came *only* from Cipher/Relay KO drops, so a failed drop was
  a soft-lock. Fixed (B1): HaX now relays a copy of each card by phone on
  `npc_ko:operative_cipher` / `npc_ko:operative_relay`, the m03 fallback pattern;
  the physical drop is kept (a duplicate is harmless — the RFID lock matches on
  `opens_lock`).
- **B2 (verified by the orchestrator): the privesc flag could not exist.**
  `sudo_baron` conflicts with every base except Debian 10 Buster, and the VM is
  Debian 12 — so the sudo Baron module would be disabled and flag3 (which
  `concludeRequires` needs) would never generate. Swapped the mission-local
  `secgen/m04_critical_failure.xml` to `.*/sudoedit` (CVE-2023-22809), and updated
  the docs, `mission.json`, and player/HaX text from Baron/CVE-2021-3156 to
  sudoedit. (m04 still has no published SecGen scenario under
  `SecGen/scenarios/break_escape/…` — logged for approval.)
- **M2: the thermal timers ran through the whole VM stage** (started on
  `anomaly_detected`), making COSTLY SUCCESS the default. They now start on
  `attack_mechanism_known` and are tightened to 6 min (advisory) / 12 min (vent),
  so the countdown is the final act, not background noise during enumeration.
- **M4: the escape stance left Voltage standing and talkable** — punching him
  afterwards gave both CAPTURED and ESCAPED. Added `#remove_npc` on the button
  path, a global-keyed `{voltage_escaped: -> voltage_escape_success}` guard in
  `start`, and `voltage_escaped !== true` on the `npc_ko:voltage` mapping. Vance's
  re-entry guard was likewise moved onto a global (`vance_met`).
- **M5: stale directions and dead state.** "Server room" replaced with
  "engineering workshop" in 7 player lines; HaX no longer says Vance can grant
  Level 2 (that card is Cipher's); the never-written `flags_submitted` count is
  rewritten off real progress globals; Vance's "pull the hardware, mind the order"
  and "a hard shutdown might do their job" lines (which contradicted the one-ESD
  design) are rewritten; the orphaned `chen_emergency_call` knot was cut.
- **Dead content removed.** A KO'd NPC is non-interactable (`interactions.js:1690`)
  and there is no subdue mechanic, so the operatives' post-KO surrender/
  interrogation hubs could never be reached — they are removed from all three
  operative files (the intel they carried survives in item notes and Voltage's
  dialogue). Also removed: the unreachable `voltage_no_leverage_combat`, the
  unreachable "CATASTROPHIC FAILURE" credit (the debrief only fires on
  `attack_prevented`), and stale PHASE-3 header comments.
- **Minor sweep:** author-note brackets in object text made in-world; SecGen web
  temps aligned to the HMI's 28°C; "47 operators"→skeleton crew; unreachable
  `operatives_defeated >= 3` branches and "all three operatives" corrected to the
  real count (max 2 + Voltage); UK English (flying colours, discreetly, Analogue,
  Mr, "Bit early"); operative `#hostile` handoffs no longer fall through into
  standoff prose; action tags moved above their lines; the two workshop-entry HaX
  barks merged; `find_infiltration_evidence` given its two redundant sources
  (lesson 8); the Vance "on comms" phone text moved to fire on the in-person
  conversation *closing* (lesson 20); the debrief's design-doc "Consequences:"
  bullet lists rewritten as spoken lines, and "Attack fully prevented" is no
  longer offered after Bank B burns.

The round-1 sections below are kept for the record; where they conflict with the
above, the above is current.

---

## Headline

m04's ink already ran clean at runtime (Phase 1a did that job), but two
player-visible faults remained that a static pass would not have caught:

1. **The ending could not be reached in the real engine.** The four flag tasks
   that gate the mission-conclusion aim (`concludeRequires`) targeted flags in
   the **dead reference form** (`bms_jump_server:flag_1`). The engine matches
   only the **display form** (`game.rb:1108`), so those tasks silently never
   completed and the mission could never conclude. (Approval-log item 3 flagged
   this from m03's pass; confirmed and fixed.)

2. **The primary combat ending soft-locked the shutdown.** Voltage's
   `globalVarOnKO: voltage_captured` sets the global but does **not** emit
   `global_variable_changed` (`npc-hostile.js:159-166`, lesson 18). The ESD
   authorisation chain (`voltage_neutralised` → `esd_authorized`) was wired on
   `global_variable_changed:voltage_captured`, so on the **fight** ending —
   knocking Voltage out — `voltage_neutralised` never set, `esd_authorized`
   never set, and the player could not press the Emergency Shutdown. The mission
   has three endings and the most obvious one was a dead end.

Both are fixed, plus NPC positions that put five NPCs on walls or racks, a
re-talk pass, a kill-chain reorder, and a UK-English / dialogue pass.

---

## Bugs and soft-locks (fixed)

1. **Ending blocker — flag tasks used the dead reference form.** The four
   `submit_flags` tasks targeted `"bms_jump_server:flag_1".."flag_4"`. Retargeted
   to the station-qualified display form
   `"flag_station_dropsite:bms_jump_server-flag1".."flag4"` (m02/m03 fix
   `4a099837`). Verified against `generate_flag_identifiers`
   (`games_controller.rb:2182`): station id `flag_station_dropsite`, legacy
   `bms_jump_server-flagN` where N is 1-indexed into the `flags` array. Rendered
   the ERB and confirmed each task's `targetFlags` and the `concludeRequires`
   list.

2. **Fight-ending soft-lock — ESD authorisation keyed on a KO global that emits
   no event.** Added an `npc_ko:voltage` eventMapping (the m01/m03 pattern) that
   sets `voltage_neutralised` + `voltage_captured`; `npc_ko:<id>` *is* emitted by
   the engine. The arrest and escape endings already set their globals from ink
   (`~ voltage_captured` / `~ voltage_escaped`), which the variable observer does
   emit, so those two paths were fine; only the KO path was broken. Now all three
   endings reach `esd_authorized`.

3. **`operatives_defeated` counter stuck at 0.** Same lesson-18 class: it was
   driven by `global_variable_changed:operative_cipher_defeated` /
   `operative_relay_defeated`, which `globalVarOnKO` never emits. The counter
   gates HaX's "one of their people down" hint and flavours Voltage's opening
   line. Re-keyed onto `npc_ko:operative_cipher` / `npc_ko:operative_relay`, with
   conditions on the *other* operative's `_defeated` global so the running total
   is right in either KO order (the KO'd NPC's own global is written *after*
   `npc_ko` fires; the other was set on its earlier KO).

4. **Five NPCs spawned on walls or racks (lesson 11).** Room geometry comes from
   the **tilemap**, not the scenario `dimensions` (`rooms.js:560-578`), so
   `operations_office` and `plant_room` are the 10×10 `room_office` / `room_it`
   templates (interior x 1–8), not the 15-wide sizes the scenario declares.
   - **Robert Vance** `{10,5}` → `{5,7}`: x=10 was the east wall / void. Now a
     clear interior tile.
   - **Voltage** `{10,6}` → `{7,7}` and **Static** `{8,6}` → `{4,7}`: both were on
     or beyond the plant-room wall; now on the clear bottom aisle (row 7,
     `#........#`), with Static between the north entrance and Voltage.
   - **Cipher** `{12,6}` → `{12,7}` and **Relay** `{7,5}` → `{7,7}` (patrol route
     `y5` → `y7`): both sat on collidable battery-rack tiles in the 20×10 battery
     halls; now on the clear service aisle so they can actually chase the player.

## Re-talk pass (lesson 21 — person-chat conversations must never reach DONE/END)

- **Security guard** was a cutscene ending at `-> END`; re-approaching him showed
  "(End of conversation)". Rewritten to the m02 hub shape: a sticky `guard_idle`
  resting knot, entered via a `guard_admitted` guard, so re-talk re-enters the
  hub. The failed-stealth "alarm raised" dead end is gone — every branch now
  recovers to a credentials check or the hub.
- **Robert Vance** replayed his entire intro (and re-fired
  `#complete_task:meet_robert_vance`) on every re-talk, because his exits diverted
  back to `initial_meeting`. Added a `vance_met` guard at the top of
  `initial_meeting` that routes re-talk to a new state-aware `vance_hub` (ally vs
  cover), and pointed all four exits at it.
- **Voltage** ended the **arrest** and **escape** paths at `-> END` while leaving
  him an interactable person NPC (arrested in cuffs / the escape narration). Both
  now route into sticky resting knots (`voltage_captured_end`,
  `voltage_escape_success`) so the story stays live and re-talk is coherent. The
  fight/last-chance branches keep `#hostile -> END` because a hostile/KO'd NPC is
  struck, not talked to (KO'd NPCs are non-interactable — `interactions.js:1690`).

## Puzzle chain (improved)

- **Kill-chain order corrected.** The SecGen jump server exposes, in document
  order, flag1 web status page, flag2 ProFTPD, flag3 sudo Baron (root), flag4
  distcc (foothold). The real attack path is scan → enumerate → **distcc
  foothold → privesc to root**, so root is the *last* step. The mislabelled
  "HTTP analysis" task (`submit_http_analysis_flag`, flag3) was renamed to
  `submit_privesc_flag` and its title/reward re-described as "became root", and
  the task order now places distcc before privesc. The "you've mapped the whole
  attack" beat (`attack_mechanism_known` + HaX's confirmation message) moved from
  the distcc submission to the **final** privesc submission, where the cell's
  control of the telemetry is actually proven. The distcc field-guide offer moved
  to the FTP-enumeration completion (you learn about the legacy daemon while
  enumerating, before you exploit it).
- **The chain is a clean spine with no key-before-lock or clue-in-lock-room
  faults** (verified with `room_depth.py`): Level 1 (Vance, depth 1, with a
  lockpickable spare in the security office) → battery_hall_2; Level 2 (Cipher,
  depth 3) → workshop; Master (Relay, depth 4) → plant room. No empty rooms.
- **Encodings have an in-world author.** The one encoded artefact (the Social
  Fabric safehouse card, Base64) is the cell's own kit in their abandoned
  extraction go-bag — the antagonist encoding their own address, not a facility
  ROT13-ing its own noticeboard. Decode chain verified end-to-end (renders to the
  Salford safehouse, "ask for Loom").

## Choices that matter

- **Voltage's three stances** (Fight / Arrest / Go for the button) now all reach
  a real, distinct end-state and all authorise the ESD:
  - Fight → KO → captured (credits: CAPTURED).
  - Arrest → taken alive (credits: CAPTURED), a distinct resting knot.
  - Button → he escapes through the dock (credits: ESCAPED; the go-bag and escape
    plan in the loading dock pay this off). Before this pass the escape path
    reached the ESD by the same broken chain as the fight; now each writes its
    own global cleanly.
- The **disclosure** decision (full / quiet / partial) and **Vance as ally** both
  carry through to the debrief branches and credits, unchanged and intact.
- **Costly-success** timer ending is preserved: the racks can vent before the
  shutdown, the run still concludes, and the debrief and credits acknowledge the
  Hall 2 casualties.

## Dialogue pass

- **UK English throughout** (the draft was heavily US-spelled): neutralise,
  prioritise, weaponise, specialise, rationalise, analyse, synchronise,
  optimisation, authorise, judgement, sceptical, centre, honour, apologise.
  Knot names, task ids and tags were left untouched.
- Cleaned a clumsy debrief status line
  (`{voltage_captured: captured | neutralised. He escaped.}` → a clean
  captured/escaped branch).
- Casualty and scale figures are internally consistent (11 on site = 9 Hall 2 + 2
  gatehouse; 40–60 on the feed; 0800 trigger; 240,000 on the grid), and align
  with m03's debrief seeding (Critical Mass → grid storage, winter) and the
  escalated bible (Blackout = Dr James Mercer; Voltage his on-site lieutenant;
  Loom for Social Fabric).

## Continuity check (m03 → m04 → m05)

- m03's closing debrief (just changed) names **Critical Mass** as the cell that
  "hits the grid", seeds the Architect's directive ("Zero Day supplies, Critical
  Mass executes"), winter, within weeks. m04 is exactly that operation. No
  contradiction.
- m05's opening briefing (Insider Trading, Quantum Dynamics) starts a fresh
  thread and does not reference m04, so nothing there is contradicted. m04's
  debrief hook "Task Force Null" is a forward-looking assignment that m05 neither
  uses nor denies — logged for the user, not changed.

## Verification (actual results)

- `validate_scenario.rb` → schema passes, geometry OK, 0 errors, 0 soft-locks.
  Two objective-wiring warnings remain, both **intended**: on `agent_0x99`, the
  two handlers for `room_entered:engineering_workshop` and the two for
  `objective_task_completed:submit_privesc_flag` are meant to fire together (one
  sets globals, the other sends a timed message) — the same benign pattern m02/m03
  carry.
- `compile-ink.sh m04_critical_failure` → **10 compiled, 0 failed**.
- `inkcheck.js <file> <declared knot>` → **10/10 clean** (800/800 on the branchy
  files). Re-entry states also clean: guard `guard_idle` (admitted), Vance
  `vance_hub` (ally and non-ally), Voltage `start` with `voltage_captured=true`
  and with `voltage_escaped=true`, and the two new resting knots.
- `loopcheck.js` on every hub / re-enterable knot (guard start + `guard_idle`,
  `vance_hub`, `initial_meeting`, `voltage_captured_end`,
  `voltage_escape_success`, HaX `support_hub`, Vance phone `support_hub`) →
  **no runtime errors, 200 steps × 6 strategies, "never ended"** on all (the
  property re-talk needs).
- Rendered the ERB: JSON parses; the four `targetFlags` are the station-qualified
  display form with the correct 1-indexed mapping; `concludeRequires` lists the
  four flag tasks; the go-bag Base64 decodes to the Social Fabric safehouse.
- `room_depth.py` → 9 rooms, 0 empty, linear lock spine, no key-before-lock.
- Dungeon graph regenerated by the validator (critical path 4 hops).

### Not verified (needs a browser playtest)
- The flag round-trip in the live engine (and the **SecGen build**, still
  outstanding — flag order/count on `bms_jump_server` is inferred from document
  order; the two field guides `distcc-exploitation` / `rfid-cloning` 404 until
  HacktivityLabSheets is rebuilt).
- **Keycard drops from KO'd Cipher/Relay.** Both are single points of failure on
  the critical path (Level 2 and Master). They are in-room hostile NPCs whose
  sprites exist during combat, so `dropNPCItems` should work (unlike m03's
  stationary person-NPC case, engine gap D3). Not add-a-spare'd, because a spare
  would let the player skip the combat the mission is built around — flagged as a
  playtest check instead (approval log).
- The `esd_authorized` chain firing on the KO path (fix 2), the new NPC positions
  and pathing, and the re-talk behaviour in the live engine.

## Capability arc

**m04 grants / makes the player fluent in:** working an OT/ICS network under a
countdown — nmap recon → service enumeration → a legacy-daemon foothold (distcc,
CVE-2004-2687) → local privilege escalation to root (sudo Baron, CVE-2021-3156) —
and the discipline of trusting a physical instrument over falsified telemetry.
Physically: RFID keycard gating up three clearance levels, lockpicking a spare
route, and combat against hostile operatives who must be dealt with *before* the
objective, not after. The recon-and-exploit muscles from m03 now run against a
live thermal-runaway clock, so the "come back later, take the stealth bonus"
luxury of m03's quiet building is gone.

**What m05 should make the player feel the absence of:** the physical plant and
the crowd of hostiles. m04 is a building full of people you fight your way past to
a hardwired button. m05 (Insider Trading) is a single mole inside a trusted
organisation — no one to knock out, no countdown you can see, just the quiet
pattern of an insider whose behaviour stopped matching their story. The player
carries forward the enumeration and privilege-escalation habits, but the adversary
is now one trusted person, not a cell holding a room.

## Orchestrator follow-up (from m07 review)

- `h2_advisory` timer gained `"condition": "!globalVars.attack_prevented"`. The HUD countdown (`ui/scenario-timer.js`) ignores `cancelOnGlobal` and only hides a timer whose `condition` fails (`:140-149`), so before this the six-minute advisory clock kept counting on screen after the ESD was pressed. `racks_vent` already carried the condition. The engine gap is logged under m07 in `scenarios/PASS2_APPROVAL_LOG.md`.
