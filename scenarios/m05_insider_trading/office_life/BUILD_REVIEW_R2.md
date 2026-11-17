# m05 office life: build review, round 2

Build: branch `plan/ol-m05`, HEAD `f3c7e0f4e`. Scope: the fixes for round 1, slice 5 (conversations, pools, day exchanges) and slice 6 (Bernadette Lyons, bins, `ex_late_again`, `"seated": false`, KO and trouble, debrief). Static review against the diff from `d199f05a5`, the three new ink files and the engine; no live run (a live-check agent is running in the same tree). Line numbers are in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named; engine paths are under `public/break_escape/js/`.

This round stopped at the reviewer's context limit after the static pass. The items under "Not reviewed this round" are carried to R3.

## Static checks run this round

| Check | Result |
|---|---|
| Validator (`--no-graph`) | 0 errors, 29 warnings. Office-life warnings: Bernadette's two `room_entered:break_room` mappings (indices 1 and 4, intended), the two cooler-in-another-room warnings, and the four V4 attack warnings (the global `E1_PROBE_PASSED` flag in `scripts/validate_office_life.rb`, not a data fault) |
| Plot safety | No extra holds an item, key, PIN, code or clue. Every new line was read: none names a suspect, Torres' family, a badge, a door log or recruiting. `ex_collection` ("Nobody will say who it's for") repeats the flyer's "Please be discreet" (`:1745`); `ex_whispering` repeats Lisa's "Everyone's been whispering" (`m05_npc_lisa_park.ink:59`). Owen, Lisa's ink and the pamphlet are untouched |
| VM flags | No task, objective, `concludeRequires` or lock reads an office-life global; the diff touches no flag task |
| Spoken lines | Pools are NPC `chatter` data, exchanges and conversations are ink knots; every pool line is 40 characters or fewer. No engine text is spoken |
| Debrief | `m05_closing_debrief.ink`: three VARs, three `friendly_kos()` blocks and three -10 penalties, same shape as Lisa's. Credits: both "Nobody ... hurt" conditions gain all three KO globals; the new line reads `thandiwe_ko || niamh_ko || bernadette_ko` |
| Sync | All new globals are declared booleans. Saved once keys are `npcId:eventPattern:index` (`systems/npc-manager.js:1262`); none sits in an ERB loop; validator V8 reports heard_ 4/8 and small keys 7/64 |
| Art paths | `bernadette_lyons.png/.json`, `_visemes.png/.json`, `_headshot.png` and `_talk_init.png` exist. The talk image is a 128 px single frame, which `_isTalkSheet` treats as a static portrait (`minigames/person-chat/person-chat-portraits.js:518`); visemes drive the mouth |

## Findings

Counts: B 0, M 1, m 3, n 3.

### M1. Bernadette's walk to the espresso is predicted to run up the aisle past Lisa, and L1a was never measured for her

`:1899` (`needsHome` (5,7)) with the evening break at `:1918` and `npc_use_started` couplings. PLAN 2.3 rules out any post at the west end of table 2 because "the shortest route to the espresso [goes] up that aisle, through or beside her". Bernadette stands at feet (170,225) (handover, game 7298), directly under table 2's west end (table x 159 to 210, aisle x 134 to 159). From there the aisle route to the first espresso cell (5,3) is about 133 px and the east-edge route about 164 px, so the pathfinder should take the aisle and pass within about 10 px of Lisa's body centre (144,144), on every evening entry (the break fires on each `room_entered:break_room` after the 150 s cooldown) and on the walk back. Failure: the cleaner brushes through or stalls against Lisa each time the player walks in, and Lisa may be blocked or nudged mid-conversation. PLAN 10.2 L1a lists Bernadette from (5,7), but no session recorded it (the bins route note covers a different walk).
Fix: run L1a for Bernadette, five tries, out and back, with Lisa at her post. If the route enters the aisle, move her post east: `position` and `needsHome` to (6,7) standing beside the vacated chair (she cannot sit with `seated: false`), or the nearest walkable cell east of x 210; re-run E5, E7 and the bins use cell. Record the result in BUILD_REPORT.

### m1. A KO'd Bernadette is re-shown on the skip route

`:1916` (her `room_entered:main_corridor` show, `onceOnly`, no KO guard). `fireOnlyWhenLoaded` is read only by the validator (`scripts/validate_scenario.rb:4737`); the engine simply has no listener until the break room loads. On the skip route the player passes the corridor before the break room has loaded, so this `onceOnly` is not spent. The `door_opened` and `room_entered:break_room` shows then reveal her. If the player knocks her out and walks back into the corridor, this mapping fires: `needs.set` runs and `setNPCVisible(true)` sets `sprite.body.enable = true` on the KO'd body (`systems/npc-behavior.js:436` to `:440`), which the KO had switched off after the death animation (`systems/npc-hostile.js:410` to `:415`), and posts another visibility update. Collisions stay off, so the player is not blocked; the fault is the inconsistency the plan's own KO guard (PLAN 2.13) was written to stop.
Fix: add `&& globalVars.bernadette_ko !== true` to the corridor show at `:1916`, and for symmetry to the `room_entered:break_room` show at `:1915`. Conditions change only, no index moves.

### m2. Slice 6's live checks are not all run, and BUILD_REPORT has no slice 6 section

`tmp/handover/M05_BUILD_HANDOVER.md`, "Slice 6 session 2", NOT DONE list. Open: reload in the evening and at night with the player in the break room (no pop of Bernadette or Thandiwe in the first frames); the reception-start reading of Bernadette at (-160,65) 2.5 s after entry (check she starts at her post and is walking to the espresso, not placed at a room origin); the results of the diplomatic debrief runs `d4ko.log` and `d4no.log` (R1 n3: trust 10 lower and the "put people in it on the floor" line); the E3 ten-minute night rerun on the final build; `bin/test-js` after the slice 6 data, read to its last line; validator and lock and key diff after the `seated` change (the validator now shows 0 errors, see above; the lock and key diff was not rerun here). Failure: the branch goes to a train with slice 6's reload and night behaviour unproved.
Fix: finish the list (the live-check agent now running may cover it), copy the `s6-*` screenshots, write the BUILD_REPORT "Slice 6" section including the accepted 25 px short park after a trip and the `/tts` 503 note.

### m3. Every server-room entry resets Bernadette's needs

`:1914`. The plain show carries `needs.set { caffeine: 60, tidy: 50 }` and fires on each server-room entry while the break room is loaded. The reset was meant for the reveal (PLAN 2.13, m1). Later entries cancel an urgent bins or coffee need in progress and restart her timing; a player who goes back and forth between the server room and the data centre keeps her from ever tidying while away. Cosmetic, since the evening break mapping still sends her for coffee on each break-room entry.
Fix: move the `needs.set` off the plain mapping (keep `setVisible: true` and the KO guard there), and rely on the three `onceOnly` shows for the reset; or accept and say so in PLAN 2.13.

### n1. Trouble mapping inserted mid-block

`:1560`. `npc_attacked:bernadette_lyons` sits third in the trouble block on `agent_0x99_handler`, so the saved indices of the four mappings after it moved. All seven are new on this branch, so only dev games made from earlier builds of the branch are affected; no main-side index moved. Note it in BUILD_REPORT; no change needed.

### n2. Provisional voice on Bernadette

`:1886` to `:1887`. `Vindemiatrix` with a `_comment` marking it provisional. Correct as long as no clip is made before her own voicing yes; carry it to the voicing step.

### n3. Bernadette's coffee pool line "Still here? You'll wear that chair out." plays at the espresso

`:1904`. Said to Niamh, who is standing at the machine, not sitting. Minor dialogue fit; leave to the dialogue review owner.

## Round 1 findings

| R1 | Status |
|---|---|
| M1 skip-route Thandiwe pop | Fixed: `door_opened` hide at `:1832`, proved 0 visible frames in five tries (games 7229 to 7233) |
| M2 no `storyPath` on the newcomers | Fixed: slice 5 ink and `storyPath` on both; live chats open with no error (game 7241); Bernadette also has one (game 7307) |
| m1 Lisa short of post | Accepted as ruled; PLAN 2A and E-L1 corrected. Engine follow-up still to be logged in `docs/IDEAS_BACKLOG.md` (not seen in this diff) |
| m2 struck newcomer stays hostile | Fixed in PLAN 2.2, the people table and 10.4 |
| m3 relay warnings | Fixed: `fireOnlyWhenLoaded` on the five mappings; the warnings are gone |
| m4 ERB loop | Fixed: four literal mappings |
| m5 `positions_base.txt` | Fixed: committed |
| n1 stale kettle comment | Fixed |
| n2 chat background split | Checked live in slice 5: both seated chats show the same half |
| n3 diplomatic debrief | Not yet closed: runs started (`d4ko.log`, `d4no.log`), result unread (see m2) |

## Not reviewed this round (carried to R3)

- The R1 carry item on the corridor cooler's `useFrom` cells against the doors and the vending machine.
- Bernadette's bins use cell (7,6) against the vending collision was measured live (16 px clear, handover); not re-derived here.
- A full read of PLAN section 7's onceOnly count against the built data (Bernadette now has three `onceOnly` shows, so the total is 14, not 13).
