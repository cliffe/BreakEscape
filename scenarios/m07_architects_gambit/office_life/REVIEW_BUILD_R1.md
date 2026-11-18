# m07 office life: build review R1

Counts: B0 M1 m8

Reviewed: branch build/ol-m07 at 323b5e234 (main merged at 56930fb23), build commits 6cee2d4e3..HEAD first parent, no merges. Fresh reviewer, read only apart from this file. One live run (game 8170, keyless server on :3098, PID stopped, port closed; headless, setFPS(20), fixed steps on, no globals or needs set in the page).

## Checks that pass

- Lock and key diff: empty (scripts/lock_key_diff.rb against office_life/baseline_locks.json).
- Validator: 0 errors, 31 warnings. The only new warnings are V4 for the two operators; they cannot clear by data, since `E1_PROBE_PASSED` is a constant false in scripts/validate_office_life.rb:42. Justified in BUILD_LOG.
- `--office-summary` against v1_summary_base.txt: only the adaeze_okafor and gwen_pritchard rows and the NPC count (8 to 10) differ.
- Positions (recipe section 9) against positions_base.txt: only `ops_cooler` added. Tiled: only the chair at (60, 258) moved to x 32, in room_pnw_ops.json:237 and room_pnw_ops.tmj:521 (PLAN 3 fallback 1).
- No existing NPC, line, mapping, lock or object changed apart from `ops_floor_workstation` gaining `"affordance": false` (scenario.json.erb:2004).
- V5: no required content reads `ops_staff_upset`, `adaeze_ko`, `gwen_ko` or the `heard_` keys; only credits (:284, :285), the new rows, the cooler `offWhen` and the operator ink read them.
- Trouble rows sit on agent_0x99 (:1416 to :1432), after every existing mapping and outside every ERB loop; the hands-down text matches :1261 word for word.
- Hides: `room_entered:server_room` with `<id>_ko !== true`, plus the reload pair on `room_entered:operations_floor` and `door_opened`, all onceOnly, on both NPCs (:1897 to :1899, :1928 to :1930). Live evidence for L6, 10.3 (a), 10.3 (b) and the KO body staying (LIVE_SLICE3 part 4) reads correctly.
- Talk breaks, coupled row, cooldowns and conditions match PLAN 2.5. Exchange `requireGlobal` gating matches PLAN 2.9. `server_hall_reached` is the existing HaX global (:1136).
- Ink: hub shape with `met` and `hub_quiet`, upset line once per talk, exits through `#exit_conversation` and `-> hub`, exchange knots end `-> DONE`, no globals set. Nothing offered: no key, PIN, password, route or whereabouts.
- Sync budget matches PLAN 7: 2 heard, 1 trouble, 2 KO, 3 cooldown rows, 10 onceOnly rows (6 hides, 2 attack, 2 hands-down). All new globals bounded booleans.
- Story: the pair leave on the first server room entry, so Park's "Empty, they said" (m07_npc_thomas_park.ink:107) holds. The muster board fits ("still has us missing").
- Pool and exchange lines all 40 characters or fewer (the validator errors above 40 and passed); no credentials.
- Voice blocks: `en-US` with General American styles, as D113 asks.
- Live, game 8170: natural trip, Adaeze `using` at (403, 244) about 84 s after entry, Gwen `using` at (451, 241) 6 s later, `no_beside_cell` 0, pool line heard ("Cooler's the only thing working.").

## Findings

### M1 (major): Gwen's `mount_stuck` is the engine rolling the supervisor's swivel chair to her cooler cell

scenario.json.erb:2023 (`ops_cooler` affordance).

Game 8170 needs log: Gwen `using` at t393, then `seat_move_end reason mount_stuck stage mount` at (451, 240) at t396. That is a seat move at the cooler, not on the way home. The cooler stop is not a post and has no `work` use, so `seatPreference` returns `near` (seating.js:2106 to :2115), and the nearest free chair within reach of Gwen's east cell is the supervisor's swivel chair beside the key desk. A seat move goes walk, pull, contact, then mount (seating.js:1535 to :1567): by the time it reports `mount_stuck` it has already pulled that chair out towards her. This is reported item (3). It breaks PLAN 2.2 and 3 ("the supervisor's chair ... stay[s] empty, keeping the cooler corner clear"; "the desk front where the key lies must stay clear") on every trip, and if a mount ever succeeds she sits in the supervisor's chair at the key desk. Where the chair ends after each trip was not measured in this review.

Fix: add `"seat": "stand"` to the cooler affordance, a field the schema allows (scripts/scenario-schema.json:3984) and the engine reads first (seating.js:2107 to :2108):
`"affordance": { "useFrom": { "dx": 0, "dy": -1 }, "useSeconds": 22, "overhearRadius": 360, "seat": "stand" }`.
Then rerun the validator, the lock and key diff and `--office-summary` (the preset line will list `seat` as own), and one natural trip on a fresh game: no `seat_move*` line for either operator, and the supervisor's chair at the same position before and after. Gwen's long walk home (5.5 to 17.25 s, BUILD_LOG) may shorten as a side effect; record it.

### m1: one British idiom left in Gwen's opener (D113)

ink/m07_npc_gwen_pritchard.ink:35: "if something's playing up" is British. Fix: "if something's acting up." Recompile the JSON, update SPOKEN_LINES.md, and run the new-lines dialogue review on that line before voicing.

### m2: reported item (1), chair hit box over a seated operator (engine; no data fix)

Engine, carried forward. Our data does not cause it beyond seating two NPCs on Tiled chairs, as every seated office NPC does. LIVE_SLICE3 measured Gwen's chair box centred about 19 px west of her sprite centre, so the centre aim lands on the chair. tap-pick.js:448 to :458 (`npcYieldTarget`) already drops seats when an NPC is under the tap, so the miss is likely in the in-reach pick or the bridge's `aimPointFor` reporting `clean: true` on a chair. There is no clean data-only mitigation: moving her position off the chair breaks the sit. Fix: no change in this build; record it in HANDOVER.md as an engine follow-up (seated NPC beats her own chair on a centre click) and send it to the engine owner with games 7779, 7789 and 7793.

### m3: reported item (2), one punch from the gap can turn both operators hostile (accept)

Engine geometry: seats 64 px apart, punch range 32 plus body width (LIVE_SLICE3 part 3, games 7889 and 7930, 2 of 7). Credits stay correct (`ops_staff_upset` and the KO globals are independent of how many turn hostile). Moving a seat would need another Tiled change and fresh seat measurements for a player-caused edge case. Fix: accept; add one line to BUILD_LOG under 10.4 saying it is accepted and why.

### m4: hostile leash reaches most of the room, the plan says "stays near post"

scenario.json.erb:1888 and :1924 (`behavior.hostile`). With no `chaseRange` the default 400 px applies (combat-config.js:74), so a struck operator chases across most of the ops floor (game 7880: 150 px from post). Fix: add `"chaseRange": 200` to both `behavior.hostile` blocks, or reword PLAN 2 and 2.7 to say she chases within the room. Either way rerun 10.4 for one operator.

### m5: L1 and 10.1 checked only through `enterRoom`, not the walkthrough route

office_life/LIVE_SLICE3.md (L1 "Limit"). The stacked first entry (HaX line, the Architect's call, RFID text) was not observed with the operators present, and the PLAN 10.1 critical path run with office life on is not recorded. The first trip at about 81 s makes a clash unlikely. Fix: one fresh game with seeded flags along TESTING_WALKTHROUGH.md through the ops floor and on to the end, recording both operators seated through the call and no chatter during it.

### m6: BUILD_LOG still carries resolved sections

office_life/BUILD_LOG.md: "Open conflict: exchanges not wired" and "Placeholders to measure" read as open, but the exchanges are wired (scenario.json.erb:1890 to :1893) and the seats were measured live (L1, 10.3 (a)). LIVE_SLICE3 part 4 also says "needs clock about 3.9 times wall" against the measured ratio of 1.0 in BUILD_LOG. Fix: mark both sections resolved with the commit that resolved them, and correct or remove the 3.9 note.

### m7: PLAN 2.4 still gives the old thirst initials

office_life/PLAN.md 2.4 and 2.9 say 45 and 60; the build uses 40 and 55 (scenario.json.erb:1889, :1925), justified in BUILD_LOG (first trip 114.9 s before, 81.7 s after). Fix: update PLAN 2.4 and 2.9 to 40 and 55 with a pointer to BUILD_LOG.

### m8: credits lines in full capitals, unlike their neighbours

scenario.json.erb:284 and :285. The lines above use a capital name then sentence case ("THOMAS PARK: Fought off, not stopped ..."). Fix: "OPERATIONS STAFF: Hurt on your way through" and "OPERATIONS STAFF: Struck, left the building".

## Reported items judged without a finding

- (4) First trip depends on a fixed seed: accepted. The scenario seed is constant, so the first trip is deterministic (about 81 s, confirmed at about 84 s in game 8170, inside 45 to 120 s); BUILD_LOG states the caveat (37 to 84 s range if the seed changed). No change.
- (5) Players far from the cooler never hear the exchanges: by design. `playerHears` needs the same room, distance within the cooler's 360 px, a lit room and a clear line from the speaker (npc-needs.js:5589 to :5605); game 8018's west-door player failed the room or line test, not the radius. Talking to either operator sends the pair to the cooler 2 to 4 s after the chat closes with the player close by, which is the reliable way to hear them. No change.

## Not checked in this round

- Voice style wording against m07's other American NPCs line by line, and DIALOGUE_REVIEW_OL.md and SPOKEN_LINES.md in full.
- Where the supervisor's chair ends after a trip (M1).
