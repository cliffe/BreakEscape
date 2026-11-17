B 0 / M 2 / m 18

Slices 1 to 5 alone: B 0 / M 2 / m 13

# Office life sims build plan: review round 4 (design, UX and engine)

Plan: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` at 866546a86 (branch `build/ol-sims`, merged with main 1f3ac1f0b). Plan line numbers are given as `plan:<line>`. Engine paths are under `public/break_escape/js/`. Every claim below was checked against the code at that commit; nothing was run live, except `scripts/check_door_alignment.py` on a scratch copy of the showcase with the planned connections (all six door pairs align, exit 0).

Verdict: the m02 patterns are mostly placed on real code. The coupling payload (`npc_left_post` with `targetId`, npc-needs.js:2964), `needs.set` and `needs.print` through `control` (949, 968, 983), `delayMs` with its re-check (npc-manager.js:915), per-handler wall-clock cooldowns (npc-manager.js:1204-1225), `requireGlobal` in object form with strict `=== false` (npc-needs.js:266-271), the lower-id exchange order (2681-2683), `seat: "stand"` (seating.js:1796), the presets and `officeType` (office-presets.js:49-60), the static seats (seating.js:207-210) and the SIMS-2 anchors (npc-behavior.js 255, 1620, 2980, 3038, 3064; stub world 27-29) are where the plan says. Two things stop SIMS-4 proving what it claims: the cooler's room-before trigger cannot fire without the boiler's firing first in this map, and the scenario's shared `coffee` and `cooler` pools merge into the pair's own.

---

## Majors

### M1. SIMS-4: every cooler entry also starts a boiler break, so the pair split

`plan:226`, `plan:364`, `plan:546`.

The private office is reached only through IT, and Keith's boiler trigger is `room_entered:it_room`. `room_entered:<room>` is emitted on every change of room, not only the first (core/rooms.js:3177-3209), and each mapping handler has its own 120 s wall-clock cooldown (npc-manager.js:1204-1225). So a cooler run (office, IT, private office, IT, staff room) goes like this:

1. Entering IT sets Keith's caffeine to 20 (unless that handler fired in the last 120 s).
2. Entering the private office sets Jodie's thirst to 20.
3. Whichever leaves first decides the object. With both needs at 20, Keith's selector picks caffeine, because the score is `weight * (urgentAt - level) / urgentAt` (npc-needs.js:1508): (35 - 20) / 35 for caffeine beats (30 - 20) / 30 for thirst. Keith leaves for the boiler and the coupling sets Jodie's caffeine; Jodie is already on her way to the cooler, or leaves for it a moment later.
4. `npc_left_post` fires only from `atPost` (npc-needs.js:2959). An NPC that finishes one use and starts the next before it is home emits nothing, so the later couplings never fire.

The pair end up at different objects and nothing is said. Proof 2 ("ten cooler entries the same way from the private office through IT") and tour step 7 fail as written. m02 does not have this problem: its cooler triggers (Kim's office, the Boardroom) open off the staff room itself (OLMP section 6, room table), so the showcase does not reproduce the pilot's geometry here.

**Fix.** Keep the data and set the route in the plan, the proof and the tour: enter IT from the office, wait in IT until the boiler break it starts is over (about a minute), then go into the private office and come straight back through IT and into the staff room, all within 120 s of that IT entry. Keith's IT handler is still on cooldown on the way back, so only Jodie's trigger counts. Proof 2 then records, for each run, the time since the last IT trigger, and a run where both triggers fired counts as a setup failure, not a fail. An alternative is a condition on Keith's IT mapping, `data.previousRoom !== 'manager_office'`. Only adopt it after step 1 shows `previousRoom` is reliable: it is `currentPlayerRoom` before the update (rooms.js:3153), and that variable is set to null while the player stands in a wall or doorway gap (rooms.js:3181-3190), so it may often be null. Say in 2.2 and the README that the showcase route is stricter than m02's because IT lies between the private office and the staff room.

### M2. SIMS-4: the scenario's shared `coffee` and `cooler` pools merge into Keith's and Jodie's

`plan:212-213`, `plan:358`.

`chatterPool` concatenates the scenario-level pool with the NPC's own (npc-needs.js:242-251). test_needs_sims has top-level `chatter.coffee` (6 office lines) and `chatter.cooler` (8 lines, such as "Did you see the car park email?", "Train was late again.", "That printer jammed again."). Keith's and Jodie's 4-line `coffee` and `cooler` pools at the staff boiler and cooler become 10 and 12 lines each, mostly office small talk that does not fit two facilities staff waiting for radio jobs. That has three effects:

- The 51-line count in `plan:358` is wrong. Each shared line is also voiced in the two new voices, which is 28 more clips.
- Each speaker's bag lasts about three times longer than the pilot's, so the "one line per break, a bag lasts 15 to 30 minutes" rhythm OLMP 6 wants confirmed is not what the showcase shows.
- m02 has no top-level `chatter` block (checked), so the showcase would be proving a different mix from the pilot's.

**Fix.** Give the staff room's chatter objects their own topics in their affordances, for example `"chatter": "staff_tea"` on `staff_boiler` and `"chatter": "staff_water"` on `staff_cooler` (the affordance wins over the cooler preset's `"cooler"`; office-presets.js:73-74), and name the pair's pools after them. Picture chat falls back to `PICTURE_DEFAULT` for a topic not in `PICTURE_CHATTER` (npc-needs.js:115, 213-214), which is acceptable. Alternatively, move the shared pools onto the office NPCs. Either way, V10's fixture list (SIMS-5) gains a case: a shared pool that merges into a pair the author did not mean it for is not V10's concern, but the README's annotated example should say that scenario pools merge.

---

## Minors, slices 1 to 5

### m1. SIMS-4 tour steps 5 and 6 use a route that misses the room-before trigger

`plan:544-545`. "Go back to IT, wait two minutes, then walk straight back": entering IT from the staff room fires Keith's IT trigger at once, so the break runs while the player waits in IT. On the way back the player does not re-enter IT, and only the staff-room fallback fires, which by the plan's own account (`plan:92`) starts as the player arrives. The beat still comes, but as the pair getting up, not as a break already running. **Fix:** "go back through IT to the office, wait two minutes there, then walk straight through IT into the staff room". The same for step 6.

### m2. SIMS-4: the first pool line of an entry break is usually spent before the player is in earshot

`plan:363`. A pair starts talking as soon as the second NPC enters `using` (`nextAt = clockMs`, npc-needs.js:3871). `_pickBark` has no audience check, and the cooldown starts when the line is taken (2639-2643). For an IT entry: about 0.25 s tick, 0.7 s wind-up (`npcWindupMs` 700) and about 1 s walk for Keith; the same again for Jodie after the coupling. That puts the first line at about 3 s. The player needs about 3 s to cross IT (about 10 tiles at 150 px/s) and reach the five-tile earshot. With `chatterCooldownMin: 2` that line's speaker shows pictures for the rest of the break, so the heard voiced line is usually the partner's second turn. The pass threshold (five in ten) probably still holds, but nothing in the plan predicts it. **Fix:** proof 1 logs each line's clock time against the player's staff-room entry and its `overheard` flag, and the README tells facilitators to expect one voiced line and pictures per entry break.

### m3. SIMS-4: `job_board` with type `notes6` claims nothing

`plan:180`. The item pool indexes drawn sprites by base type: the image name has no `.png` (rooms.js:510-514) and trailing digits are stripped (rooms.js:190), so both conditional `notes6` sprites index as `notes`. `findMatchFor` looks up the declared `type` as given (rooms.js:261-279), so `"type": "notes6"` finds nothing and the note lands wherever unclaimed objects land. m02 claims the same sprites with `"type": "notes"` (m02 scenario.json.erb:1476, 1490, 1504). **Fix:** `"type": "notes"`. In pool order it claims the conditional `notes6` at (7.38, 1.12) first, which is the one the plan wants.

### m4. SIMS-3: the IT room's scenario type is `room_it`, not `room_IT`

`plan:144`, `plan:155`. The tilemap key is `room_it` (core/game.js:121, loading `rooms/room_IT.json`), every scenario that uses it writes `"type": "room_it"` (m01, lockpick_gauntlet, test_access_signin and others), and room-tones.json maps `room_it` to `it`. A `"type": "room_IT"` would not load, and `check_door_alignment.py` would fail on it (its `TMAP` is read from game.js). **Fix:** give the type `room_it` in the 3.2 table and the room-tone line, with the file name in brackets.

### m5. SIMS-3: `neil_mug` at about (5.0, 8.4) sits on top of drawn decor

`plan:169`. smalldesk2 (4.64 to 5.64) already carries `office-misc-hdd6` at (4.98, 8.34), 12 by 18 px, and `office-misc-camera` at (4.71, 8.44); a 16 by 14 px mug at (5.0, 8.4) overlaps both. **Fix:** claim the drawn `office-misc-cup` on the east bench. Declare `neil_mug` with `"type": "office-misc-cup"` and no position; the first `office-misc-cup` in pool order is the table item at (6.69, 8.15). That keeps the art existing, removes one drinkable decor cup from under his hand, and moves Neil to about (6.9, 7.6). Step 1 then checks his cell against the copier's `useFrom` cell. Otherwise, pick a free spot on a bench and say which.

### m6. SIMS-3: `get_neils_page` ticks when the page lands, not when the player takes it

`plan:347`, `plan:542`. `object_revealed:*` fires on the reveal (npc-needs.js:5204). The tour says "take the page (`get_neils_page`)". A forgotten command print is deleted from `_prints` silently when it leaves the tray (3673), so `npc_print_gone` never fires for it. **Fix:** either rename the task "Neil's page lands on the tray", or add a take task on the pickup event with `data.itemId.includes('it_out_')` (the evaluator supports `.includes`, npc-manager.js:94-100).

### m7. SIMS-3: `needsPrivateTo` naming NPCs not yet in the scenario is a validator error

`plan:144-145`. `validate_npc_needs.rb:1057-1058` raises an error for a `needsPrivateTo` entry naming an unknown NPC. In SIMS-3, IT's list names Leila and Nisha (added in SIMS-6) and the private office names Siân (added in SIMS-9), so the slice cannot reach 0 errors as written. **Fix:** in 3.2, give each room's list per slice: IT `["neil"]` from SIMS-3 and `["neil", "leila", "nisha"]` from SIMS-6; the private office has no `needsPrivateTo` until SIMS-9.

### m8. SIMS-4: the microwave's use cell may be the boiler's second-user cell

`plan:179`, `plan:356`. Both cells are "in front of the counter". `besideCell` puts the second boiler user one tile right of the first, or left if right is blocked (npc-needs.js:5020-5028). The fridge and microwave stand one tile right of the sink (6.16 to 7.53). **Fix:** step 1 reads both cells and moves the microwave's `useFrom` one cell further east if they coincide, so Keith's 8:00 trip never stands where Jodie is.

### m9. SIMS-4: proof step 3 and tour step 8 depend on when the room first loaded

`plan:365`, `plan:547`. The microwave trip is at 8:00 after the staff room loads, and the next one is about 30 minutes later (46 to 30 at 2 a minute, then a restore of 60, the preset's value). Steps 1 and 2 take more than 40 minutes of entries, so step 3 must run in a fresh game. Tour steps 5 to 7 take about six or seven minutes, so a slow facilitator misses 8:00. `npc_used` ticks `see_microwave` whether or not the player is there. **Fix:** say that proof 3 runs in its own game. In the tour, say the task ticks even if the trip is missed, and that the next trip comes about half an hour later.

### m10. SIMS-4: the speech-lock regression compares two noisy runs

`plan:370`. `_chatSeq` salts every chat's first speaker and chattiness rolls (npc-needs.js:3867-3868), so the doors-shut and doors-open runs differ by chance. A threshold of one fifth on a 15-minute sample (perhaps 10 to 20 office lines) mostly measures that noise. **Fix:** measure the cause directly. With the staff-room door open, count office `_pickBark` calls that return a picture or `wait` while `_speechUntil` is held by an unheard staff-room line (the `_speak` info carries `overheard`, 2653-2656). Raise the engine item if that count is above zero more than occasionally.

### m11. SIMS-5: the V10 test pins live scenarios other sessions edit

`plan:381`. It asserts that `lab_physical_pentest` and `test_access_work`, which other sessions own, "give the warnings step 1 recorded and no others". AGENTS.md:231 says not to compare live content with what it is now; test against fixtures. **Fix:** assert exact warnings only on fixtures and on the showcase (which this branch owns). For the other scenarios, assert only "no V10 error" and list their warnings in the slice report.

### m12. SIMS-5: the warning fixture cannot be loaded as a game as described

`plan:384`. `tools/playtest/new-game.rb` takes a scenario name from `scenarios/`, and a fixture under `test/` is not one. **Fix:** say how. Either use a scratch scenario folder (not committed) for the lone-cooler case, or swap a game's stored scenario as AGENTS.md:221 describes. Use the session's assigned keyless port, not :3001. While editing V10's rule, write "capacity 2 or more": `_maybePair` takes any capacity from 2 up (npc-needs.js:3862), and the cake has capacity 3.

### m13. SIMS-2: what a far arrival does while returning is not specified; 1.4 omits step 8a

`plan:329`, `plan:71-80`. "The returning branch gets the same distance check" says what does not happen (`atPost` is not set) but not what does: re-issue at once, or wait for `_watchReturn` (3787-3797, which re-issues only after the NPC has stood still for `RETURN_YIELD_MS`). **Fix:** re-issue once at once, as for a job phase, then leave it to `_watchReturn`; add a node test for it. Separately, the format 3 table in 1.4 lists steps 8b and 8c only. Add 8a (`downIf` becomes `offWhen` on networks and resources; `affordance.offWhen` moves up to the object, format_upgrade.rb:52-56), since SIMS-9 relies on it.

---

## Minors, the rest

### m14. Casting: the facilities roles do not match the costumes

`plan:199-200`, `plan:204`, `plan:212-213`. `security_guard` (Keith, "caretaker") and `female_security_guard_v2` (Siân, "head of facilities") are security uniforms, and `female_telecom_v2` (Jodie, "cleaner") is an orange telecoms high-visibility vest (its concept prompt). The heritage choices fit the art well: `hashchain_guard` is British-Colombian, about 45 (Andrés); `offduty_agent` is a white Geordie, about 46 (Neil); `junior_analyst` is British-Indian, about 25 (Nisha). The facilities roles do not. **Fix:** fit the roles to the clothes, since 3.4 says names and roles change without touching ids. Keith becomes the night security officer waiting on the radio, and Jodie a maintenance or facilities assistant. That still matches the pilot's pattern (two non-clinical workers waiting for calls).

### m15. Casting: the existing showcase cast already wears named m01 characters' sheets

`plan:194`. Tom wears `male_office_worker_v2` (Derek Lawson, who recurs in m09 and m10), Amara `female_office_worker_v2` (Sarah O'Brien), Sanjay `male_nerd_v2` (Kevin Park) and Rosa `female_scientist_v2` (Maya Chen). 3.4 lists these as not free, which is right, but does not record that the showcase breaks the rule itself. **Fix:** a line in 3.4 and a row in 6.4 (bespoke office sheets for at least Tom), so the owner can decide. No id changes.

### m16. SIMS-6: Nisha's PC and the IT kettle overlap drawn items

`plan:186`. The PC at about (3.7, 2.9) starts west of `desk1`'s left edge (3.84), so part of it hangs off the desk. The kettle at about (3.2, 8.3), 15 by 18 px, overlaps the drawn `office-misc-speakers2` (2.74, 8.14), `office-misc-speakers` (3.05, 8.55) and `office-misc-hdd2` (3.43, 8.15) on smalldesk1. **Fix:** put the PC at x 3.9 or more, and pick the kettle's spot from step 1's render (or claim a cleared bench end), as m5 does for the mug.

### m17. SIMS-6: Leila and Nisha show the object setting, not a screen habit

`plan:186`, `plan:214-215`. `lockChance` and `autoLockSeconds` are object fields, and an object `lockChance` wins over the owner's `habits.screen` (workstation-state.js:128-152). So SIMS-6's "screen habits on owned desk PCs" for m06 shows the PC's setting, and only Siân (SIMS-9) exercises `habits.screen`. **Fix:** either say so in 1.1 row 15 to 17 and in SIMS-6's purpose, or give one of the two (Leila) `habits.screen: { lockChance: 1 }` and no object `lockChance`, so m06's habit form is proved in IT.

### m18. The staff room's drawn drinkables are listed short

`plan:278`. The staff room also has `mugs_tray1` ("Tray of coffee", consumables.js:85) on the west table, next to Jodie's home. **Fix:** list it, and check in SIMS-4 step 1 that the player taking it does not leave a gap the pair's seats or walks depend on.

---

## Checked and found sound

- Door alignment: with the north, south, east and west connections of 3.2, all six pairs align (`check_door_alignment.py` on a scratch copy). The staff room's bottom two rows lie over the lounge's back wall, and the private office's over the kitchen's: the usual stacking.
- Neil's numbers: caffeine 60, 6 a minute, urgent at 45, restore 30 with no jitter gives sips at 2:30 and 7:30; the own-post use never moves him (npc-needs.js:3110, 2959) and `seat: "stand"` keeps seating away (seating.js:1796).
- The pair's rhythm: boiler about 2:00 (1:06 to 2:54), cooler 6:00, microwave 8:00, then alternating every four minutes; each partner's own need is reset by the coupling before it falls due on its own.
- The print command: `forget: true` reserves no fetch (npc-needs.js:3618-3623); a reload stows unheld revealed slots (1124, 5263); the `onceOnly` delayed mapping is saved when it fires.
- Tile homes: all seven new sheets have south and north sit frames, so the pair sit (seating.js:269-271).
- Format 3: every field in slices 1 to 5 is a format 3 name, and each exists in `scripts/scenario-schema.json` (`seat`, `queue: false`, `needsCompany.groups`, `roomToneTypes`, `chatterCooldownMin`, `officeType`, `uncollectedAfterSeconds`).
