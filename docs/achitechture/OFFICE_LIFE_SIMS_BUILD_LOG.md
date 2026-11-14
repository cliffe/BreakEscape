# Office life sims showcase: build log

One section per slice: commits, what was built, review rounds, proof games and screenshots.
Engine and server changes are listed together at the end, because each one is an approval item for
the owner even where the plan names it.

## SIMS-1: test_needs_attack (attack and knockout probe)

Commits 782381513, e93a7a70e, d01a0b218, fa140496e (build), probe rewrite + `ava_pc` fix (earlier
session), then round-1 review fixes (earlier session): mugs moved off Ben's row, a real `office_lockpick`
added, probe reworked to be deterministic and to poll for the right state before acting (real punch
path for (a), walking/using state for (d)/(f)/(c), real close for (i)/(i2)/(h2), reload-after-print
and KO-in-delay beats, kitchen-load and `completing` reporting), node-test pin, doc corrections.

Round-2 review fixes (this session): Fran and Gil moved from `(6,6)`/`(7,6)` to `(6,8)`/`(7,8)` so
Ben's cross-room cooler route is clear and beats (c)/(d) reach phase `using` (the earlier "unreachable
cooler corner / E8" was the E-carry fault, Ben pinched by the two seated residents); beat (f)
reordered (walk the player to the drawer first, set Dee's caffeine after, poll at 120 ms) so it passes
in fresh games; (c) tightened to hard `phase === 'using'`, (d) recalls from the cooler, the probe
parks the player off the office door for the cross-room Ben beats; (a) listens for `npc_attacked:ava`
on the dispatcher; (g) requires `blocked === true`; (b)/(c) reload the kitchen before counting
takeables; an `i2r` recovery beat added (a second conversation after the i2-lost page reprints); Dee's
catch line reworded ("try to pick it", the pick is stopped before the cabinet opens). Owner items
re-cited: E-carry widened to seated residents in any room, E-reload-mugs's cause moved to the client
`dropHeld`, and the KO need bubble added as a fourth. No engine or server change.

Status: **round-2 re-runs pass**, a fresh game per touched beat (a 4281, b 4282, c 4270, d 4271,
f 4278/4279/4280 three fresh games, g 4287, i2r 4288); the untouched beats keep round-1 proof
(e 4221, h 4222, h2 4215, i 4217, i2 4220). Beat (c)/(d) now reach phase `using` at the cooler, (f)
passes 3/3, (a) shows `npc_attacked:ava`, (g) proves Fran down (`isKO`/idle), and (i2r) shows the
i2-lost page is recoverable by a second conversation. Server keys dumped from `player_state`.
`test/js/npc-needs.test.mjs` and `test/js/npc-needs-attack-scenario.test.mjs` pass; validator 0
errors, 4 intended warnings (`--skip-ink --no-graph`; 5 with ink, the extra being the dialogue lint).
The `completeTask` question stays settled (a probe timing artifact, not an engine fault).

Four engine/server faults recorded (not fixed — owner items, see the table below and
`scenarios/test_needs_attack/README.md`): **E-carry** (a needs move re-paths through a seated NPC's
immovable body and the stuck watch does not route round it; hits Ava against seated Ben in the office
and Ben's cooler errand against seated Fran/Gil in the kitchen, not a `_moveForPhase` 3110
short-circuit); **E-reload-mugs** (an aborted carry's world object is rebuilt on its authored tile
after a reload because the client `dropHeld` records no removal); **E-reload-ko-pos** (a KO'd NPC that
fell outside its scenario room is restored at its spawn while its drop stays where it fell); and the
**KO need bubble** (a knocked-out needs NPC still shows its thought bubble). The OLMP in-room fallback
applies to KO-able needs NPCs until E-reload-ko-pos is fixed.

## SIMS-2: an arrival counts only where the NPC is (OLMP E6)

Branch `build/ol-sims-2` (from `build/ol-sims` a734d5f57). Commit 11b563d51 (engine + node tests),
then the live-proof tool and docs. Review R1 (design/engine 0B/2M/4m, server 0B/0M/2m) fixes in a
later commit: Design M1 (gate the arrival check to needs-issued moves), m1 (returning logs once per
return), m2 (far guard keyed by phase+cell), m3 (node tests, rewritten capacity-2 test), and the
corrected natural-run live evidence (Grace 16 of 20 real clock, game 4232; Tom's kitchen trips with
a working office-coffee switch-off). The earlier "30 natural runs did not repeat the baseline" claim
is dropped (no saved artefacts for 30 baseline runs).

Review R1b (owner item 6, offWhen) fixed in commit `4fcda935b`: the live needs-world `describe` was
dropping an object's top-level `offWhen` (broken in format step 8a, `33b3ea3bc`), so `_isOff` was
always false live and a switched-off source was never excluded from need-picks. The one-line copy in
`describe` restores it. Live proofs on the final tree (keyless :3094, headless, port games below):
Tom's 20 caffeine trips with the office coffee switched off (game 4290) now pick the office coffee 0
times and cross to the kitchen 14, `_isOff(office_coffee)` holds, every `using` within 7 px, zero
`arrival_far`. Design M1 chair-fetch (game 4293, seat_office) completes sam's use with zero
`arrival_far` and no mid-use re-issue. offWhen carried live across scenarios: `bench_pc` (networks,
game 4297) carries offWhen and flips but satisfies nothing (no needs change, device view only);
`l2_pc` (social, game 4316) and `ian_pc` (work, game 4317) carry offWhen, satisfy `work` and flip,
so each is now excluded from a work pick when off. lab_physical_pentest's three open-plan staff
(game 4295) each made 3 clean coffee trips, every `using` within 8 px, zero `arrival_far` /
`arrival_ignored`; the lab's `lw_post_printer` offWhen is a resource, not a scene object, so the
`describe` fix does not touch it. Full `bin/test-js` on the final tree: 649 files pass, 0 fail.

Fault reproduced on the build as it stands. The baseline (game 3537) arrival did not repeat in
natural play, so the stubbed short path is the reproduction, as the plan allows:
Grace's `_planMovePath` was stubbed through the test bridge to end ~35% along her office->lounge
route, and with the SIMS-2 distance check neutralised in-browser (the old "any arrival counts"
behaviour) the build enters `using lounge_sofa` 164 px from the sofa cell, out in the **office**
(`64 arrival  334`, `65 using lounge_sofa`; game 4178, `stub-legacy-4178.png`). With the real fix
and the same stubbed short path, the arrival is logged `arrival_far` and Grace does not use the
sofa there (`79 arrival 261`, `80 arrival_far lounge_sofa`; game 4178, `stub-fixed-4178.png`).

E-carry (SIMS-1's recorded fault): **different cause, left.** SIMS-1 recorded Ava's cross-room
carry failing in `goto_item`/`_failJob('timeout')` — she takes the job, never leaves her post and
times out after 20 s with no arrival ever firing. SIMS-2's fault is the opposite: an arrival that
*does* fire, at the wrong place, and is counted. The SIMS-2 fix guards arrivals that fire; it
cannot make a never-firing arrival fire, so it does not address E-carry. E-carry is a cross-room
path-planning failure (the goto-item move to the kitchen plans no usable path, so the behaviour
layer emits no `npc_arrived` and `_advanceJob`'s `goto_item` branch, npc-needs.js ~3225, hits its
`job.deadline` and `_failJob('timeout')`); left for its own slice, as the plan directs.

## SIMS-3: the IT room and Neil, the still NPC who prints by command (m02's Gary)

Branch `build/ol-sims` (from 32c87a72f, which carries SIMS-2's arrival check). Commit ebf7b1987
(data, ink, node tests, README annotated example + tour rows + proof tool), then the live-proof
rows and this log entry as a follow-up. No engine or server change (the Gary pattern is all data;
the print command, `forget`, the reveal slots and `delayMs` all already exist).

Built: `it_room` (`room_it`, private to Neil) off the office's new north door, and an empty
`manager_office` (`room_ceo`) passthrough off IT's west door (Siân fills it in SIMS-9). `neil_mug`
is a declared `office-misc-cup` that claims the drawn cup on the east bench (seat `stand`, own post,
`useFrom` aimed under Neil's body so a suspend/resume keeps him on his spawn). `it_copier`
(`photocopier1`, the copier preset by type) with six takeable `notes1` slots (`it_out_a` to `f`,
neutral IT text, no account/address/password/code). Neil: one caffeine need (60/6/45) met only by
his mug, leashed to `it_room`, `swivel: false`, `globalVarOnKO: neil_ko`, and a
`conversation_closed:neil` mapping (`onceOnly`, `delayMs: 6000`, `forget`) that reveals the change
log on `it_copier` when `neil_print_asked` holds and he is not KO. `neil.ink` is a Geordie hub whose
change-log choice sets `neil_print_asked` with `#set_global`. Aim `watch_it` (`see_neil_sip`,
`see_neils_page`) is wired on Amara's event mappings.

Validator: 0 errors (32 warnings, all pre-existing cross-room-source and habits notes; line 79
reports Neil's T1 2:30 / P 5:00 via `neil_mug`, line 82 `it_copier` with 1 printing NPC). Node: the
full standard set passes (25 files), plus `test/js/npc-needs-sims-validator.test.mjs` (new, 7 tests)
and three new `npc-needs.test.mjs` cases (a still own-post NPC never moves over 30 min; a `forget`
command print reveals a slot and schedules no fetch; a forgotten command print recycles the oldest
read-in-place slot once the tray is full). `validator-office-presets.test.mjs` gains `it_copier`.
`ruby` format corpus 8a/8b/8c pass.

Live proof (keyless :3093, headless, worktree p-ol-sims, `tools/playtest/needs-sims-neil.mjs`,
games from `new-game.rb`; scratchpad `officelife-sims/s3/`): every beat PASS, see the README's
SIMS-3 live-proof table. Step 1 placement (game 4289): the mug claim, Neil within HOME_EPS (7 px),
copier cells clear, both rooms load, doors align. still_ask (game 4299): 10 min on the manual needs
clock with 2 px max drift and 0 move events; natural sips at 2.70 and 7.76 needs-clock min;
suspend/resume drift 0; a no-ask conversation prints nothing; the asked conversation reveals
`it_room:it_out_a`, ticks `see_neils_page`, Neil's drift 0, no `print_fetched`; the page persists
over a room change. reload_after (game 4300): the tray files empty on reload and a second ask
reprints nothing (`onceOnly` saved). reload_during (game 4301): a reload 2.5 s after the close, in
the 6 s delay, loses the pending print and reveals nothing (expected). Standard live set regression
(office beats with every door open, incl. the new north door): all six core beats still tick
(`see_coffee`, `see_work`, `see_back_at_desk`, `see_meal`, `see_drink` on game 4302; `see_rest` on
game 4304, once Grace's full walk to the lounge sofa completes, `used lounge_sofa` with no
`arrival_far`), and **no office NPC enters IT** (`it_intruders: []`): the leash and room privacy hold
with the door open, so the office outcomes are unchanged.

### SIMS-3 R1 review fixes (2026-11-14, commits 510a2e99e + 279080517 + the live-proof follow-up)

Round-1 design review: 1 blocker, 4 major, 9 minor; server review: 3 minor. All fixed or reconciled.

- **B1 (blocker): the mug and bench drew under the office's back wall.** `neil_mug` had no position and
  claimed a drawn cup on a south bench; IT's bottom two rows (world y 0 to 64) overlap the office top
  wall (depth 64), so the mug and benches were hidden and Neil appeared to drink from nothing. Fix:
  `neil_mug` now has an explicit position on the lower IT desk, tile (6.2, 6.0) elevation 24, with
  `useFrom { dx: -0.4, dy: 1 }`; Neil spawns at (5.8, 7.0) on the approach cell. The six `it_out_*`
  slots moved from (8.2, 7.7) (straddling the wall line, m5) up to the west tray at (8.1, 7.2). Live
  render game 4326: a cover probe at the mug finds only Neil's sprite over it (no `walls`/`room`
  layer); home distance 5 px. Plan 3.3 gains a dated note that the IT south benches draw under the
  office wall, so SIMS-6's `it_kettle` avoids them.
- **M1/M2 (proof): the stillness check ran on the manual clock and four 5.3 checks were missing.** The
  proof tool now runs stillness on the **real** needs clock (sampling the sprite), reads the
  `drink_gulp`/`copier_run` sounds from `npcOfficeVisuals.playLog`, and adds the four checks: five
  opens incl. one mid-sip, leave-within-6 s with the page landing while away (sound suppressed outside
  IT), close-to-page timing with the run sound audible in IT, and the next-close-after-reload. Reproven
  on fresh games 4327 (still_ask: drift 0.4 px, sips 2.70/7.77 with gulp sound in IT, 6 opens incl
  mid-sip, suspend/resume drift 0, asked close reveals at 5857 ms with `copier_run` played:true in IT,
  `see_neils_page`, 0 fetch), 4328 (leave_after: page lands at 5888 ms while in the office,
  `copier_run` played:false), 4329 (reload_after), 4330 (reload_during).
- **M3 (reload during the delay): the next close prints.** `neil_print_asked` is saved at the close,
  before the delay, so after a reload during the 6 s the pending print is lost but a plain no-ask close
  prints the page (game 4330: `next_close_printed: true`). The README, this log and plan 5.3 are
  corrected (the earlier "nothing reprints" was wrong).
- **M4 (ink): the ask choice is gated.** `neil.ink` declares `VAR neil_print_asked` (synced from the
  global) and gates the change-log choice on `{not neil_print_asked}`; once asked it is replaced by an
  "Is that change log ready?" line pointing at the tray, so Neil no longer promises a second print that
  never comes. Recompiled `neil.json`.
- **Minors:** m1 (README cup sentence removed), m2 (mug observation reworded), m3 (`readDisplay:
  gameDisplay` on `it_out_a`, so all six match), m4 (the training printout is now fire-warden, no
  security note), m6 (ink dialect eased to plain spelling for TTS, keeping "Howay"/"pet"/"Aye"; grown
  from 5 to 7 NPC lines), m7 (the two node tests now assert per-condition true/false and run
  `presetIdFor` over every IT object, so they can fail), m8 (stale report rerun), m9 (SIMS-6 kettle
  note). Server m3: the `see_neils_page` condition gained `&& !data.cosmetic` so a full-tray cosmetic
  reveal does not tick it. Server m1/m2 are recorded as owner items above (print-reveal global not
  synced; pickup not reveal-gated); the docs and README are reconciled to the real client-only
  behaviour. No engine or server code changed in this slice.
- **Not fixed (not counted):** a "Neil Robson" hover name box lingers over the office copier after the
  bridge's chats; it looks like a bridge pointer label, not a player-visible artefact, and belongs to
  whoever owns the hover labels.
- Office-beats regression after the move (games 4331, 4333): five core beats tick in each and
  `it_intruders: []`; `see_rest` (Grace's lounge-sofa walk) did not complete inside the 180 s window in
  either run, a proof-window timing artefact, not a regression from the IT-only change.

New spoken lines: Neil's `neil.ink` conversation, now **7** single-speaker NPC lines (greeting + six
choice replies, up from 5: the change-log ask, the "ready" line, what-he-looks-after, the coffee, a
quiet-day line, and the exit). No pools (Neil is alone in IT in this slice, so a pool would never play).

## Engine and server changes (every slice)

| Slice | File | Function | Change | Why | Branch |
|---|---|---|---|---|---|
| SIMS-1 | none applied | | | | |
| SIMS-3 | none applied | | the Gary pattern is all scenario data (declared mug, print command, `forget`, reveal slots, `delayMs`) | nothing in the engine needed changing | build/ol-sims |
| SIMS-2 | public/break_escape/js/systems/npc-needs.js | `onArrived` | now takes the arrival payload; logs `arrival {pathLeft,dist}` for a real behaviour-layer arrival; stores `{x,y,moveId,pathLeft}` in the `_arrivals` Map | step 1 diagnostic + carry the position/id the tick needs | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_phaseDest`, `_nextMoveId`, `_acceptArrival` (new) | distance-first + move-id check; a far arrival re-issues once then fails the job (returning re-issues once, never fails); synthetic own-post/home arrivals bypass | the fix: an arrival counts only within 48 px of the move's cell, and only for the current move | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_tickNpc` | consumes the stored arrival through `_acceptArrival` instead of a boolean Set membership | route every arrival through the distance/id guard | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | `_moveForPhase`, `_goHome` | stamp each issued move with a `moveId` (own-post/home shortcuts store a synthetic arrival) | give every move an id the arrival echoes | build/ol-sims-2 |
| SIMS-2 | npc-needs.js | world `moveTo`, `installNpcNeeds` npc_arrived listener | pass `moveId` through; pass the whole payload to `onArrived` | wire the id and position end to end | build/ol-sims-2 |
| SIMS-2 | public/break_escape/js/systems/npc-behavior.js | `goToAndStay`, `_triggerGoToStayArrival`, `cancelMove` | store `opts.moveId`; add `moveId` and `pathLeft` to the `npc_arrived` payload; clear on cancel | the behaviour layer echoes the move id and the steps the path had left | build/ol-sims-2 |
| SIMS-2 | npc-behavior.js | `class NPCBehavior` | exported | reachable by the arrival unit test; the manager stays the only game constructor | build/ol-sims-2 |
| SIMS-2 R1 | npc-needs.js | `_acceptArrival` | gate the distance/id check to `returning`, `goto_item`, `goto_target`, `queued` only; an arrival in any other phase is dropped silently | review R1 Design M1: a seating chair fetch during `using` (owner needs, no move id) was going through the check and cutting the use short with a spurious `arrival_far` + mid-use re-issue at a non-own work object; drop it as before the slice | build/ol-sims-2 |
| SIMS-2 R1 | npc-needs.js | `_acceptArrival` | the job far guard is keyed by `${phase}:${dest cell}` (`job._farKey`), was `job._farPhase === phase` | review R1 m2 (both reviews): queue steps all share `queued`; a far arrival at a later queue cell (or after a freeze re-issue) was read as a repeat far arrival and failed the job on two different cells | build/ol-sims-2 |
| SIMS-2 R1 | npc-needs.js | `_tickNpc` (unfreeze), `_advanceQueued` (queue step) | clear `job._farKey` on the post-freeze re-issue and the step to a new queue cell | review R1 m2: a re-issue after a freeze or a queue-cell step is a fresh move, not a repeat far arrival | build/ol-sims-2 |
| SIMS-2 R1 | npc-needs.js | `_acceptArrival` (returning branch), `_watchReturn` | log `arrival_far` once per return (gated on `!returnFarReissued`); `_watchReturn` re-plans with `keepFarFlag: true` so the flag persists | review R1 Design m1 / server minor 2: an unreachable home logged `arrival_far` and re-issued twice per `_watchReturn` cycle; now once per return, re-planned quietly | build/ol-sims-2 |
| SIMS-2 R1b | npc-needs.js | `createEngineWorld` `describe` (~4780) | copy object-level `offWhen` onto the described needs object: `if (sd.offWhen !== undefined) out.offWhen = sd.offWhen;` | owner finding 6: format step 8a (`33b3ea3bc`) moved `affordance.offWhen` to object level and made `_isOff` read `o.offWhen`, but `describe` never copied it, so `_isOff` was always false live and no switched-off source was excluded (office coffee could not be switched off, game 4265). Commit `4fcda935b`; real-adapter node test `test/js/npc-needs-offwhen-adapter.test.mjs` (fails without the fix) | build/ol-sims-2 |

### SIMS-1 owner items (engine/server faults, not fixed here)

Raised with file:line for the owner. No edit applied; the probe measures each.

| Item | File:line | What | Owner fix |
|---|---|---|---|
| E-carry | `public/break_escape/js/systems/npc-behavior.js` `_checkPathStuck` (~1305), `_recoverFromStuck` (~1348); surfaces as the timeout in `npc-needs.js:3149` → `_failJob` 3490 | A needs move re-paths through a seated NPC's immovable body/chair (not in the walk grid); stuck recovery re-paths to the same cells and never routes round the body. It is wider than one room: besides Ava against seated Ben in the office, it stopped Ben's cross-room cooler errand when Fran and Gil sat in his path (beat c, game 4231: he wedges at ~(6,4.5) in the pinch between the east wall and the two residents, not an unreachable cooler corner). Mission-local sidesteps: mugs moved off Ben's row; Fran/Gil moved to `(6,8)`/`(7,8)` so (c)/(d) reach `using`. | Route stuck recovery round NPC bodies / add seated bodies to the grid. |
| E-reload-mugs | Cause: `public/break_escape/js/systems/npc-needs.js:5124-5140` (`world.dropHeld`, with `pickUp` at `:5094`); the rebuild is `app/models/break_escape/game.rb:2108-2111` (`apply_room_state_changes!`) | A world object an NPC was carrying when the carry **aborts** (a KO or any mid-carry block) is rebuilt on its authored tile after a reload. `dropHeld` moves the sprite client-side only and never records a removal, unlike `consumeHeld` (`:5115-5123`) on delivery. So only a delivered carry writes `objects_removed` (game 4208); any aborted carry (KO beat b game 4184, attack beat a game 4183) writes none, and the server correctly rebuilds the authored object. Not lost, not duplicated. | Record the pickup / drop refusal as `objects_removed` in `dropHeld` if "gone" is wanted after an aborted carry. |
| E-reload-ko-pos | `app/models/break_escape/game.rb:1176-1177` and `:974` (save), `:2145-2151` (restore) | A KO saves only `isKO`/`currentHP`, keyed to the NPC's scenario room, with no position; on reload the body is restored at its authored spawn while its drop stays where it fell (an `objects_added` record at `:2108`). A cross-room KO leaves body and item in different rooms. | Persist the KO position and the room the NPC fell in. |
| KO need bubble | `public/break_escape/js/systems/npc-action-icons.js` `thoughtBubble` `:218-222`, drawn from `update` `:563` | A knocked-out NPC still shows its pressing-need thought bubble: `thoughtBubble` checks `avoiding`/pressing/parked but not `isKO` or `blocked`, so a felled needs NPC keeps a need bubble over its body (`s1-fix-r1/c-c-down-4208.png`). | Guard `thoughtBubble` on `isKO`/`blocked`. |

### SIMS-3 owner items (engine/server faults, not fixed here)

Raised with file:line for the owner. No edit applied; the docs and proof are reconciled to the real behaviour (R1 server review).

| Item | File:line | What | Owner fix |
|---|---|---|---|
| Print-reveal global not synced | `public/break_escape/js/systems/npc-needs.js:5312` (`revealOutput` → `setGlobal` at `:5090`) | The print-reveal path mutates `gameState.globalVariables[name]` directly without calling `_worldChanged()`, so an `it_out_*_shown` slot global is set in the client runtime but never synced; the eventMapping `setGlobal` path (`:3450`) does call `_worldChanged()` and syncs. Harmless and conservative here (the tray files empty on reload by design), but the plan's 6.5/5.3 sync lines and the README are reconciled to say a print-revealed slot is client-transient. | If a printed page must survive a reload, call `_worldChanged()` from `revealOutput`'s `setGlobal`, or set the reveal global through an eventMapping `setGlobal`. |
| Pickup not reveal-gated on the server | `app/controllers/break_escape/games_controller.rb:3245` (`find_accessible_item`), `:2981` (`validate_item_collectible`) | Neither method consults `revealOnGlobal`, so a crafted `POST /inventory` for a takeable IT slot in the unlocked room is accepted before any reveal. Within cheat policy here (the pages carry no account, address, password or code; the slots tick only the optional `see_neils_page`). Recorded in the README. | Never place a gated or secret-bearing page on a `revealOnGlobal` slot expecting the server to withhold it; gate server-side if a future mission needs it. |

## Prototypes not merged

E7, E8 and E9 (missions plan section 9) are approval items. Any prototype lives on its own branch
and is listed here with its tests and proof; nothing here is on `build/ol-sims`.

## Merges of main

- 2026-11-14: main 9e23e384b merged into build/ol-sims as f8e23f7a2, and on into build/ol-sims-2
  (69aa3c8ae). No conflicts. Main brought held barks and HUD lanes (`npc-barks.js`, `ui/hud-lanes.js`,
  `hud.js`, `npc-barks.css`); none of it touches `npc-needs.js` or `npc-behavior.js`, and
  npc-manager.js gained 2 lines. Full `bin/test-js` on build/ol-sims-2 after the merge: 648 files
  pass, 0 fail. Needs chatter still reaches the screen through the bark system, so SIMS-4's
  staff-room proof watches for chatter being held or laned by the new HUD code.
- 2026-11-14: main cb6d7feb4 merged into build/ol-sims as 1bf6ad046. No conflicts. Main brought the
  sync-stale-ring work (`games_controller.rb`, `sync_ring.rb`, `state-sync.js`, capture/merge tests);
  none of it touches `npc-needs.js`, `npc-behavior.js` or `npc-action-icons.js`. Slice node tests
  `npc-needs.test.mjs` and `npc-needs-attack-scenario.test.mjs` pass after the merge.
- 2026-11-14: main `cb6d7feb4` merged into `build/ol-sims-2` as `5af54d887` before the review R1 fixes, to
  carry the latest shared-tree changes (sync-ring build review R3). No conflicts in the SIMS-2 files.
- 2026-11-14: main d69c29089 (sync-ring follow-up, keyring server half) merged into both branches, then
  build/ol-sims-2 merged into build/ol-sims so SIMS-3 builds on the arrival check. Only this log conflicted.
