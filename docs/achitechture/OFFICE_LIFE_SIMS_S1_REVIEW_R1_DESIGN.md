# SIMS-1 review, round 1: design and engine view, with live proof

Reviewed: branch `build/ol-sims` at a734d5f57 (worktree p-ol-sims). Plan section 5.1,
`scenarios/test_needs_attack/` (scenario, ink, README), `tools/playtest/needs-attack-probe.mjs`,
the SIMS-1 build log section, and the builder's reports and screenshots in the session scratchpad
`officelife-sims/s1/`.

Live runs: keyless worktree server on :3093, every game from
`swap-scenario-game.rb test_needs_sims test_needs_attack --unlock-all`, headless, throttled as the
brief says. Reports and screenshots are in the session scratchpad
`officelife-sims/s1-review-r1-design/`. The variant beats (`vcarry`, `veko`, `vreprint`, `vi2`,
`vlog`) live in `review-probe.mjs` in that folder: a copy of the probe with extra beats.

| game | what | result |
|------|------|--------|
| 4157 | beat b, probe as built | KO mid-carry in the kitchen, `ava_ko` and `check_ko_drop` once, server `room_states.kitchen.objects_added` = `ava_folder` only. After the reload her body lies at her office spawn and the mugs are back on the office floor (`b-b-reload-4157.png`) |
| 4158 | beat i, probe as built, real conversation | page lands, `check_eli_page` completed on the server |
| 4173 | beat f, probe as built | catch fires, but Dee's log shows `using office_coffee` at tick 16, before the catch at 22: she was at the station, not walking |
| 4159, 4171 | `vcarry` (Ava's carry traced every 500 ms) | clean carry |
| 4167, 4169, 4172 | `vcarry` | E-carry reproduced 3 times: Ava leaves her post, then pushes against seated Ben for 20 s and times out in `goto_item` |
| 4168 | `vcarry` | probe-side: `enterRoom('kitchen')` failed (player stuck at 134,133), so there was no tray and no job; nothing flagged it |
| 4166 | `veko`: Eli KO'd about 1.5 s after a real close | no page, no reveal, no tick (client side). The README's re-check claim holds |
| 4162 | `vreprint`: page lands, reload, talk again and close | tray empty after the reload, no second print. Holds |
| 4160 | `vi2`: the probe's i2 timing, with console capture | the delayed mapping was **never scheduled** before the reload: the chat was still open |
| 4176 | `vlog`: when does the chat really close? | `conversation_closed:eli` fires about 3.0 s after `eliConversation()` returns; the page lands 6.0 s after that |

Node test `npc-needs-attack-scenario.test.mjs` passes. Validator: 0 errors, 5 warnings.

## Verdict per beat

| beat | proves what the plan says? |
|------|------------------------------|
| (a) | Partly. The carry, the abort and the mugs dropping are real. The attack is `setNPCHostile` and the calm-down is the probe calling `setNPCHostile(false)`. Nothing in this scenario can calm Ava in play (M3) |
| (b) | Yes for the KO, the tick and the server drop gate. The reload half is mis-stated: the mugs come back, and her body is in the wrong room (M1, M2) |
| (c) | Yes for the drop and the server record (KO'd walking in the kitchen, not at the cooler: m3). After the reload the body is in the wrong room (M2) |
| (d) | The tick and the suspend are real. "Walks him home from the cooler" is not shown: the note is read the moment Ben steps off his post, a tile from his desk (M5) |
| (e) | Yes |
| (f) | No. The catch lands on an NPC that is using the coffee station, not walking (M4) |
| (g) | Weakly. The task ticks on any leave by Gil. Nothing asserts `using` at the kettle, no pairing, or Fran `blocked`. The screenshot shows Gil using the kettle alone (m1) |
| (h) | By construction: no conversation means nothing can print, KO or not. `veko` (game 4166) is the case that tests the KO (m2) |
| (i) | Yes for the print. The plan's reload half is not in the probe; `vreprint` (game 4162) proves it holds (m4) |
| (i2) | By construction. The reload lands before the conversation has closed, so nothing was ever pending (M6) |

## Findings

### Blocker

None.

### Major

**M1. README (b) says "after a reload the folder is there once and the mugs are gone". The mugs come back on the office floor.**
`scenarios/test_needs_attack/README.md:56-58` and `:123`; plan 5.1 (b).
Evidence: `officelife-sims/s1/b-b-reload-4144.png` (the builder's own run) and
`s1-review-r1-design/b-b-reload-4157.png`. Both show the dirty mugs back at (5,7) in the office after
the reload. Server state for 4157: office `objects_removed` is `[]`, so the client rebuilds the
authored mugs. The probe never looks at the mugs after the reload; it only records the takeables
before it (`needs-attack-probe.mjs:276`).
Fix: say what happens. A carried world object that is not in `itemsHeld` goes back to its authored
spot on a reload; it is not lost and not duplicated. Add an after-reload `roomItems('office')` and
`roomItems('kitchen')` check to beat b. If the owner wants "gone", that is an engine or server item
(persisting a needs pickup as `objects_removed`), not a probe result.

**M2. A knocked-out NPC that fell outside its scenario room lies at its spawn after a reload, while its drop stays where it fell.** This is not recorded anywhere.
Evidence: 4157 (`b-b-reload-4157.png`, Ava down beside the filing cabinet at her office spawn, with
the folder in the kitchen on the server at 7.875,2.125); 4144 (same); 4120 (`c-c-reload-4120.png`,
Ben down at his office spawn, `ben_notebook` in `kitchen.objects_added`). Server state for 4157:
`room_states.office.npc_states.ava = {"isKO":true,"currentHP":0}`, with no position and keyed to
the scenario room, not the room she fell in.
Why it matters: plan (b) and (c) say the item drops "where she fell". After a reload the player
sees a body in one room and its folder in another. This is exactly the cross-room KO case that E1
exists to check.
Fix: record it in the README "Engine faults" as its own owner item (KO position and room not
persisted; the server keeps `npc_states` per scenario room). Until then, keep missions on the OLMP
in-room fallback for KO'able needs NPCs. Beat b and beat c should assert the body's room and
position after the reload.

**M3. (a)'s "she calms down, then on `unblocked` walks home and resumes" cannot happen in play in this scenario. The probe forces it.**
`needs-attack-probe.mjs:245-248`; `README.md:54-55`, `:122`, `:138`.
The probe sets hostility directly with `npcHostileSystem.setNPCHostile('ava', true)` and then
`false`. A real punch (`player-combat.js:453-461`) also emits `npc_attacked:ava` and deals damage.
The only in-game routes back to calm are an influence threshold (`npc-game-bridge.js:797-799`, which
needs `behavior.hostile.influenceThreshold` and ink influence), the ink hostile tag, or Restart
after a KO (`npc-hostile.js:103`). Ava has none of them (`scenario.json.erb:193`; `ava.ink` has no
hostile tag). So the README tour step 2 ("then stop ... she calms and walks home") describes
something a player cannot make happen.
Fix: either give Ava a real calm path (an influence threshold plus a calming choice in `ava.ink`, or
a lever the probe drives through a real interaction), or state in the README and the table that
the calm-down is forced through the hostile system and only the needs side (`unblocked` leading to
`_goHome`, `npc-needs.js:1278-1281`) is under test. The attack itself should go through the punch
path, or the probe should note that it skips `npc_attacked` and the damage.

**M4. (f) does not catch a walking NPC.** Both recorded runs caught Dee while she was using the coffee.
`needs-attack-probe.mjs:341-342`; `README.md:127`; plan 5.1 purpose ("a sight catch on a walking
NPC (Gary's option (b))") and (f).
Evidence: builder game 4121 log `22 dee using office_coffee`, `23 dee frozen`; my game 4173
`16 dee using office_coffee`, `22 dee frozen`. The probe's "walking" test is `atPost === false`,
which stays false through `using`. Her walk lasts about 8 ticks (2 s), and the probe spends longer
than that opening the drawer.
Fix: put the player at `dee_drawer` with the lock UI ready first, then set Dee's caffeine, poll for
`job.phase === 'goto_target'` with non-zero velocity, and pick at that moment. Assert the phase
recorded at the catch. Also assert the plan's tail: she freezes, then finishes or restarts her
coffee and returns to her post.

**M5. (d) never recalls Ben from the cooler.** The note is read the moment he steps off his post.
`needs-attack-probe.mjs:215-216`; `README.md:125`; plan 5.1 (d) ("Ben at the cooler when the Meeting
Note is read: the patrol override walks him home").
Evidence: `officelife-sims/s1/d-d-recalled-4131.png` shows Ben "suspended" beside his own desk.
`waitUntil(atPost === false)` fires as soon as the wind-up ends.
Fix: wait for `room === 'kitchen'` (ideally `phase === 'using'` at `water_cooler`), then read the
note. Assert that he arrives at (4,7) in the office within a bound and that `scriptSuspended` is
true there. That is the cross-room `patrolOverride` the plan asks about.

**M6. (i2) passes by construction: the reload happens before the conversation closes.**
`needs-attack-probe.mjs:369-373`, `:157-163`; `README.md:131`.
Evidence: game 4176 (`vlog`). `eliConversation()` returns while the person-chat is still open;
`📢 Emitted event: conversation_closed:eli` and `⏳ ... fires in 6000ms` come 2988 ms after it
returns. Game 4160 (`vi2`, the probe's exact timing with console capture): no `fires in` line
before the reload, and `chat_open_when_probe_returned: true`. Beat i passes only because it waits
10 s; `veko` (4166) hit `minigame-active` on its first KO attempt for the same reason.
Fix: in `eliConversation`, wait until `MinigameFramework.currentMinigame` is null (or capture the
`conversation_closed:eli` emit) before returning. In i2, reload a measured 2 to 3 s after the
schedule, and record that interval in the report.

**M7. The E-carry fault is real, but the README puts it in the wrong place and gives the wrong cause.** It is an in-office collision with seated Ben, not a cross-room limit.
`README.md:147-163`; `OFFICE_LIFE_SIMS_BUILD_LOG.md` SIMS-1 section.
- The suspect line cannot be the cause. `npc-needs.js:3110` short-circuits only when
  `_atOwnPost(s)` holds, and `_atOwnPost` (`npc-needs.js:2945-2948`) is true only for a `use` or
  `visit` of the own post object, never a `carry`. A short-circuit would also give an arrival, not
  a timeout.
- "She never leaves her post" is wrong: in every failing run `atPost` goes false and she walks
  about 40 px.
- The timeout comes from `_advanceJob` at `npc-needs.js:3149`, which calls `_failJob` (3490).
- What happens (games 4167, 4169, 4172): the mugs are at (5,7) and the straight path along row 7
  passes Ben's seat at (4,7). Ben sits down at about tick 18, just as Ava sets out. Her body
  (top 223) overlaps Ben's immovable body and chair (117-139, 218-229). She pushes right at
  vx 90 with no progress until the 20 s deadline. In the clean runs (4159, 4171) she happens to set
  out a few pixels lower (body top 229 or more) and slides under him. The stuck watch
  (`npc-behavior.js:1305-1335`) fires, but re-paths to the same target through the same cells,
  because seated NPCs and their chairs are not in the walk grid.
- It is not "game seeds": `npcNeedsSeed` is fixed (`scenario.json.erb:6`). The variation is timing:
  where Ava's idle shuffle leaves her when Ben sits down.
- The OLMP in-room fallback would not fix it, because it happens inside the office.

Fix: rewrite the E-carry entry with this cause and these game ids. Raise the engine item as
"needs moves re-path through a seated NPC's body; stuck recovery does not route round NPC bodies"
(`npc-behavior.js` `_checkPathStuck`/`_recoverFromStuck`, pathfinding grid). For the probe, move
`office_mugs` off Ben's row (for example to a free cell at y 4 or 5 that is not in line with a
seat) so beats a and b become deterministic, and drop the "retry until carrying" step (README
handover step 3).

### Minor

**m1. (g) asserts only the task tick and `mode: job`.** `needs-attack-probe.mjs:311-317`. The plan
asks the probe to show Gil `using` at the kettle within his walk time plus the wind-up, no pairing,
and Fran `blocked`. The builder's screenshot `g-g-gil-alone-4122.png` does show "gil: using 18s
kitchen_kettle". In the scenario's coupling, the partner's `use_started` sets a need, so nothing
could ever make Gil wait, and the tick holds by construction. Fix: assert `using`, the absence of
a `paired` log line, and Fran's `blocked`. A stronger version knocks Fran out mid-walk to the
capacity-2 **kettle**, so her stale `job.dest` would show up in `besideCell` (`npc-needs.js:3092-3101`)
if the abort left it set. Also visible in that screenshot: the knocked-out Fran still shows a
pressing-need water bubble. A KO'd NPC should not show a need bubble (owner visual item).

**m2. (h) is true whatever the engine does.** With no conversation, `conversation_closed:eli` never
fires. The re-check the README describes (`README.md:46-48`; `npc-manager.js:906-935`) is tested by
a KO inside the delay. Game 4166 (`veko`) shows it working on the client: no page, no tick. Fix:
add that as beat h2, with a reload so the server state is checked as well (4166 closed without a
navigation, so the server never got the KO).

**m3. (c) is KO'd walking, not "at the cooler".** Report 4120: `ben_phase_when_ko: goto_target`.
`README.md:124` says "KO'd there". Also, if the wait times out, `benWhen` falls back to wherever he
is (`needs-attack-probe.mjs:291`) and the beat still runs. Fix: wait for `phase === 'using'` and
fail the beat on timeout. The same goes for (a) and (b), where the second `waitUntil` accepts a
carry in any room (`:242-244`, `:270-272`).

**m4. The reload half of (i) is not in the probe.** Plan (i): reload before taking the page, the
tray is empty and nothing prints again. Game 4162 (`vreprint`) proves it: tray empty after the
reload, and a second real conversation and close prints nothing. Fix: add it to beat i.

**m5. `loadKitchen()` failures pass silently.** `needs-attack-probe.mjs:112-116`. Game 4168: the
player stuck at (134,133), the kitchen never loaded, and Ava had no target. The beats ignore
`kitchen_ok`. Fix: fail the beat when `kitchen_ok` is false.

**m6. (f) injects the lockpick with a raw `inventory.items.push`** (`needs-attack-probe.mjs:336-338`),
not through the real give/pickup path. The "Switch to Lockpicking" click never matched
(`switch_attempt: {tried: true}` in 4121 and 4173), so the catch came from the interaction itself.
Fix: give the lockpick through the normal item path (a takeable lockpick in the office picked up
with `interact`), and drop the dead switch code or fix its label.

**m7. The probe counts only `status === 'completed'`** (`needs-attack-probe.mjs:75`), so a task
in `completing` (`objectives-manager.js:680`) reads as not ticked. This is how the game-4014 miss
happened. Fix: report `completing` separately and confirm with the server's `objectivesState`.

**m8. README text is out of step with the scenario and probe:**
- the annotated example uses `object_revealed:*` with `data.objectId === 'eli_page'`
  (`README.md:41-42`), but the scenario uses `object_revealed:eli_page` with no condition
  (`scenario.json.erb:265`);
- the live-proof command uses `new-game.rb test_needs_attack` (`README.md:104`), which cannot make
  a game here (no Mission row); the probe header says the same (`needs-attack-probe.mjs:8`);
- `beat=all` is said to run `d e h` (`README.md:110`) and `d e f h` (`needs-attack-probe.mjs:9`),
  but the code runs only e, i and d;
- "Four warnings" (`README.md:77`): the validator now gives 5 (the fifth is the 8-finding dialogue lint).

**m9. The node test does not pin the scenario fix.** `test/js/npc-needs-attack-scenario.test.mjs:53`
checks the tray's room but not that the tray is the only object that accepts `dirty_mugs`. Fix:
assert that no office object accepts `dirty_mugs`, so the `ava_pc` regression cannot come back
quietly.

## On the specific questions

- **E-carry real and correctly placed?** Real (reproduced 3 times in 5 traced games). Placed and
  explained wrongly (M7): it is a path collision with seated Ben in the office, surfacing as the
  `goto_item` timeout at `npc-needs.js:3149`. `_moveForPhase` 3110 is not involved.
- **completeTask: probe timing, not engine?** Agreed. `completeTask` sets `completing` at once and
  `completed` only after the server round-trip (`objectives-manager.js:680-686`). A real
  interaction ticks it on the server (4157 `check_ko_drop`, 4158 and 4162 `check_eli_page`), and
  the builder's armed run 4070 ticked with a wait. The 4014 `check_called_home` miss was never
  re-run synthetically with a wait, so that half rests on the same mechanism, not a direct repeat
  (m7).
- **The `ava_pc` fix:** sound and minimal. `_carryCandidate` prefers the home object when it
  accepts the tag (`npc-needs.js:2809-2811`), so `affordance: {}` makes the tray the only target.
  Live runs confirm `job_start washing_up_tray`. Pin it in the test (m9).
- **README accuracy:** M1, M3, M4, M5, M6 and M7 overstate the table. The detail is in m8.

---

## Round-1 fix notes (builder)

- All majors (M1-M7) and minors (m1-m9, and the three server findings) are addressed: M1/M2/M7 as
  recorded owner engine/server items with file:line (build log + README), the rest by probe,
  scenario, node-test, README and plan edits. Beats re-run fresh, README live-proof table updated.
- Declined (engine visual, not mission-local): m1's "a KO'd Fran still shows a pressing-need water
  bubble". A knocked-out NPC should not render a need bubble; that is an engine visual change, raised
  for the owner, not fixable in the scenario or probe. Recorded here rather than acted on.
- Partly declined (engine/layout, out of scope): m3's strict "phase=using at the cooler" for beat (c).
  The cooler's authored corner cell (1,7) is not reachable by an NPC entering from the office door
  (the E8 arrival-cell limitation the plan flags in section 9 note 3), so `using` is unreachable
  there. Beat (c) now catches Ben on the cooler job at his closest kitchen approach (goto_target,
  speed 0), which still proves the cross-room KO drop. Beats (a)/(b) second waitUntil now require the
  carry in the kitchen; (c)/(d) poll real state. The "at the cooler" refinement waits on SIMS-2/E8.
