# m03 office life slices 3 to 5: review round 2

Range 0841f2789..41cc60e8a, read in the detached worktree `.claude/worktrees/p-ol-m03-r2` (removed at the end). Static review against engine code. A keyless server ran on :3095 (PID 1087300, stopped) and games 6600 and 6601 were made with new-game.rb, but the context limit hit before any probe ran, so no live claim below is mine: the live facts quoted come from the R1 fixer's log `scratchpad/r1fix/runH-6589.log` and are marked as such.

## Severity table

| # | Severity | Finding |
|---|---|---|
| 1 | major | Tip never run live: slice 5's live runs (6566, 6578) were on the pre-R1 lineage (random duplicate machines, old timings); R1's runs had no chatter or exchanges. Paired coffee with exchanges at 41cc60e8a is unmeasured |
| 2 | major | Send-home destinations are wrong: `targetTile` is used as the feet point with no centring, so both staff walk about 20 px north of their posts; Zainab ends up inside the sofa's footprint |
| 3 | minor | HaX's two texts (plan section 2, DIALOGUE_SAMPLE) are wired by neither R1 nor slice 5 |
| 4 | minor | Laptop text differs from the approved DIALOGUE_SAMPLE variants (calendar, lock-screen photo, draft message, attended line) |
| 5 | minor | Stale ERB comment above the NPC block describes the old four hide mappings |
| 6 | minor | Redundant hide writes: up to three `update_room` POSTs per NPC at the turn, two on the first night reload in reception |
| 7 | minor | `wh_staff_witnessed` is set even when the staff were not there to witness (both KO'd, or at the hallway cooler) |
| 8 | nit | Stray `}\n,` lines from the hand merge (valid JSON) |
| 9 | nit | Validator warnings 13 and 14 are a validator artefact; no runtime effect (detail below) |

## R1 findings

| R1 # | Status | Evidence |
|---|---|---|
| 1 blocker | closed | `scenario.json.erb:648` `"type": "coffee_station"`, `:1572` `"type": "water_cooler"`, neither with `position`. Fixer's two-load check (game 6561) not repeated by me. |
| 2 major | closed for the solo trips; see finding 1 for paired | Habit `:827` threshold 24, coffee use 16 (`:651`), cooler use 20 (`:1574`). Fixer's runH-6589: Zainab coffee `expectedAwayMs` 18626 open, cooler 28724 locked. |
| 3 major | closed | Six hide mappings per NPC (`:846-851`, `:890-895`): clone task, `mission_phase` act2, `clone_call_done` (plain), three `onceOnly` re-hides. runH-6589 C to F pass (hidden before any hallway entry, after reload, after night scene, after night reload). |
| 4 major | closed | Mapped breaks `:852-854` (Zainab), `:896-898` (Yusuf); runH-6589 A and B pass. |
| 5 major | closed | Placeholder ink gone; both ink files carry the approved lines. |
| 6 minor | closed | Re-hides are `onceOnly`. Residual double write, finding 6 below. |
| 7 minor | partly closed | Globals declared and set (`:1370-1375`, `:2245-2251`). HaX texts missing (finding 3). Send-home built but wrong spot (finding 2). |
| 8 minor | closed | `capacity 2` on `reception_coffee` (`:651`). |
| 9 minor | closed | `:229`. |
| 10 minor | closed | Observations `:860`, `:904` match plan section 2. |
| 11 minor | deferred, acceptable | Night and trouble text now say the screen is dark, which fits open-laptop art. |
| 12 minor | closed | Validator re-run: 0 errors. New objective-wiring warning for Yusuf `npc_ko:ffion_rees` indices 8 and 9 (send-home and bark), intended to fire together. |

## Findings

### 1. major: the merged tip has no live run

`git log` shows slice 5 (5be9d83b2) sits on 7ae250186, which still had `coffee_station1` (random duplicate machine), coffee use 19, cooler 18, threshold 23. SLICE5.md's "laptop stayed open on each paired coffee trip (about 26 s real)" was measured there. R1's runs (6583, 6589) were on the fix branch with no chatter and no exchanges. 41cc60e8a has never been played.

By the code, paired coffee trips should still leave the laptop open:

- The lock is decided once, at the leave: `workstation-state.js:404` calls `decideLocked` with the `expectedAwayMs` the leave carries; `:157` keeps it open when that is at or under 24000 ms. m03 has no `policies`, so no `lockAt` timer re-locks it later.
- `_expectedAwayMs` (`npc-needs.js:3326-3359`) is route plus `useSeconds` plus queue wait only when the job is `queued`. With capacity 2 and only two needs NPCs, Zainab never queues, so her estimate is the solo figure (18626 ms in runH-6589 A, where she followed Yusuf as she does in the mapped break).
- An exchange holds both uses for the knot's length (`npc-needs.js:3007-3026`), so real time away grows (about 16 s for `ex_open_door`), but that is after the decision. Real away about 22 s solo, about 35 to 40 s with an exchange: the open window gets longer, which the plan wants.

What needs proving live at the tip: (a) one mapped coffee break from closing Ffion's chat, both staff, an exchange played, laptop open, `heard_ex_*` set, real away recorded; (b) the cooler break from the hallway, laptop locked, pool lines heard through the door; (c) a reload after an exchange does not replay it. Games 6600 and 6601 exist for this. Script ready at `scratchpad/r2probe/lib.mjs` (port 3095, this worktree); reuse `r1fix/runH.mjs` steps A and B with the event regex widened to `npc_exchange_heard`.

### 2. major: send-home walks the staff to the wrong spot

`npc-manager.js:1622-1626` converts `targetTile` to `room.position + tile * 32` and hands it to `goToAndStay` as the feet point, with no half-tile offset. The mappings reuse the spawn tiles (`:857` Zainab 4.625,7.5; `:901` Yusuf 3.47,8.38), but spawn and the needs post put the sprite, not the feet, there. runH-6589 C shows the result: Zainab from (148,241) to (148,221), Yusuf from (111,268) to (106,249), both about 20 px north. Zainab's feet at y 240 fall inside `leather_sofa1` (top-left 129,228, 62x38), so she stands in the sofa; Yusuf leaves his chair for the floor north of it. The R1 fix log says the destination was not proved, and it is wrong.

Fix: give each mapping a tile whose world point is the post's feet point (for Zainab the `useFrom` post at about (148,253) gives 4.625, 7.9; for Yusuf the `needsHome` 3.3, 8.75, which is a different tile from his spawn anyway), then confirm on screen. `stopOnArrival` is not read by this code path (`goToAndStay` gets no opts), so it can go.

### 3. minor: HaX texts missing

Plan section 2 and DIALOGUE_SAMPLE.md list "Leave the staff alone. You're here to clone cards, not start fights." on `wh_staff_attacked` and "Reception had company. Get the badge and get out." on Ffion's KO with staff present. `grep` finds neither in the scenario. R1 left them to slice 5 and slice 5 did not list them. They are text, not clips, so no voicing cost. Append on `agent_0x99` after index 59.

### 4. minor: laptop text is not the approved text

DIALOGUE_SAMPLE.md shows the laptop `textVariants` the user saw (Yorkshire Dales lock screen, Newport to Cardiff Bay kit week, pizza-box message, "she tips the screen away"). The scenario (`:663-674`) has the slice 4 text (harbour, named clients, "lights on at eight", "Zainab's working on it."). SLICE5.md says this was left on instruction. Both pass the no-secrets check; the user should pick one. Not voiced either way.

### 5. minor: stale comment

ERB comment at the NPC block (`:808-811`) still says four hide mappings with `clone_call_done` `onceOnly` and plain room entries. It is now six, the other way round. Comment above `reception_coffee` (`:643-646`) says the laptop is "Zainab's seat object (no preset)", fine.

### 6. minor: double hide writes

`setNPCVisible` posts `update_room` on every call (`npc-behavior.js:450-457`), and mappings 1 to 3 are plain by design. At the clone, `objective_task_completed:clone_rfid_card` and `global_variable_changed:mission_phase` both fire, then `clone_call_done`: three POSTs per NPC, same key and value. On the first reload in reception at night, the `room_entered:reception_lobby` re-hide and the `previousRoom === null` one both match (if the first has not already fired), two more. Bounded (one key per NPC, `onceOnly` counters are one entry per handler), so no growth; just noise. No visible flash: saved visibility is applied when the NPC registers (`npc-manager.js:353-356`) and the sprite is created hidden (`npc-sprites.js:229`). The `previousRoom === null` mapping is now redundant with the plain-condition re-hide and could go.

### 7. minor: witnessed without witnesses

`:1375` sets `wh_staff_witnessed` on any day KO of Ffion. If both staff were already KO'd, or Zainab is at the hallway cooler, the credits line "WATCHED RECEPTION BEING KNOCKED OUT BY DAY" and Yusuf's send-home still follow. Add `!globalVars.zainab_ko || !globalVars.yusuf_ko` at least. Low stakes.

### 8. nit: merge formatting

Lines `:855` and `:899` are a lone `,` after a mapping, from the hand merge. Valid JSON; tidy when next touched.

### 9. nit: validator warnings 13 and 14

The validator places `reception_coffee`'s preset queue cells (-1,1), (-2,1) against a tile it cannot know (no `position`), giving tiles (-1,2) and (-2,2). The engine works them out from the real approach cell (`npc-needs.js:5603-5622`), snapping each to the nearest walkable cell, which puts them at about (243,278) and (211,278), inside reception. With capacity 2 and two needs NPCs nobody ever queues, so the cells are never used. Not a real problem. If the warnings are to go, hand-write `queue.cells` (plan section 3 says to) away from Ffion's approach.

## Checked and fine

- Merge resolution: fix-branch timings (16, 20, 24), capacity 2, six hide mappings, mapped breaks and send-homes kept; slice 5 `voice`, `chatterCooldownMin`, `chatter`, `exchanges`, both bark mappings appended after them, `overhearRadius` on both machines, `heard_ex_*` globals. Nothing from either side lost; no slice-4-era duplicate fields.
- Lines verbatim: a script compared all 49 clips in DIALOGUE_SAMPLE.md with the scenario and ink; all present unchanged.
- Exchanges heard once: `heard_<knot>` checked at `npc-needs.js:2954`, set at `:3062`; the three globals are declared. Gates match the sample, including `reception_badge_cloned` on `ex_client_sites`.
- Voices Achernar and Alnilam, en-GB, not among m03's existing eight.
- Barks: 48 on `npc_ko:ffion_rees`, day, `onceOnly`, neither staffer KO; 49 on `npc_caught_at_post:zainab_hussain` (emitted at `npc-needs.js:3377`), 30 s cooldown, not when upset. Both in scenario data, nothing spoken from engine text.
- Ink: start, hub with `hub_quiet`, one-off topics, sticky goodbye with `#exit_conversation`, re-entry through `met_player` to "Still about?" / "Still here."; `upset` exits at once and replays on re-entry. Exchange knots end in `-> DONE`. Pool and exchange lines carry no credential, code or route.
- Event names used by mappings exist: `npc_attacked:<id>` (`player-combat.js:461`), `npc_use_started:<obj>` with `npcId` (`npc-needs.js:3513`), `room_entered:<room>` with `previousRoom` (`rooms.js:3232`).
- player_state: new globals are bounded scalars; visibility one key per NPC; new `onceOnly` handlers add one trigger entry each. Nothing grows.
- Cheat resistance, lock and key: no new lock, key, item or server-read global; the laptop grants nothing.
- Critical path, night turn, music: staff hidden before the hallway night scene and after reloads (runH-6589); hidden staff cannot block the route. Music with a hostile staffer hidden not re-checked this round.

## Not done

All live probes at the tip (finding 1), the send-home screenshot, music with a hidden hostile staffer, the `ex_client_sites` exchange, reload after an exchange.

## Verdict

Not ready to merge. No blocker, but two majors: run the tip live (paired coffee with an exchange, cooler pair, reload), and fix the send-home tiles and prove them on screen. The minors are quick; finding 4 needs the user's pick.

## R2 fix log (partial; see R2_FIX_HANDOVER.md)

- Finding 2 (send-home): fixed in scenario, live-measured. The "20 px north" was the seated sprite offset: sprite y is about 20 px above where the seated sprite draws. Feet (body centre) after the old targets were already the post (148,252) and (106,280), both before and after goToAndStay (game 6606). Targets are now exactly those feet points (4.625,7.875 and 3.3125,8.75); `stopOnArrival` removed (patrolOverride ignores it). No engine change. Screenshot crop and an after-KO measurement from a mid-break start are still to do (p3.mjs).
- Finding 3 (HaX texts): fixed, verbatim from DIALOGUE_SAMPLE.md, appended after the existing last agent_0x99 mapping. Live delivery proof still to do (p2.mjs, p3.mjs).
- Finding 4 (laptop text): fixed, base text, variant order and wording as the approved sample; night variant replaces the dark-screen text.
- Finding 5 (stale comment): fixed (five hide mappings).
- Finding 6 (redundant hides): fixed by dropping the `previousRoom === null` mapping on both staff; saved visibility still applies on register.
- Finding 7 (witnessed): fixed. The existing KO mapping now sets only `wh_staff_upset`; two exclusive mappings set `wh_staff_witnessed` and send HaX's text (`!zainab_ko`, or `zainab_ko && !yusuf_ko`; the validator grammar has no `||`). The hallway-cooler case is not covered (deferred, low stakes).
- Finding 8 (lone commas): fixed.
- Finding 9 (validator warnings 13, 14): deferred, validator artefact as the review says.
- Finding 1 (live proof): game 6610, first pass. Coffee break from closing Ffion's chat: Yusuf used the machine at 4.8 s, Zainab at 10.3 s, laptop open at the leave, away 29.6 s, ex_open_door heard (PASS in substance; the script's own A1 check had a bug matching the event name). Cooler: Zainab used it, laptop locked; Yusuf's use fell outside the capture window (rerun with 22 s wait). Reload: heard_ex_* kept; later breaks played ex_tailgate then ex_client_sites (after an emitted `card_cloned` event, cloner minigame not played); no knot repeated. Music with a hostile staffer and the HaX/witness texts: not yet run.
