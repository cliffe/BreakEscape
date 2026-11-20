# SIMS-1 review, round 2: design and engine view, with live proof

Reviewed: branch `build/ol-sims` at b3cf58f9b (worktree p-ol-sims). Plan section 5.1, round 1's
design and server reviews with the fixer's notes, `scenarios/test_needs_attack/`,
`tools/playtest/needs-attack-probe.mjs`, the SIMS-1 build log section and its owner-items table,
and the fixer's reports and screenshots in the session scratchpad `officelife-sims/s1-fix-r1/`.

Live runs: keyless worktree server on :3093, every game fresh from
`swap-scenario-game.rb test_needs_sims test_needs_attack --unlock-all`, headless and throttled as
the brief says. Reports and screenshots are in the session scratchpad
`officelife-sims/s1-review-r2-design/`. The extra beats (`cx`, `f2`, `i2r`) are in
`review-probe.mjs` there: the probe as committed plus three beats at the end. Server state was read
with a read-only `rails runner` (`dump.rb` in the same folder).

| game | what | result |
|------|------|--------|
| 4228 | beat b, probe as committed | Reproduces the fixer's 4184 exactly: KO'd carrying in the kitchen (in the doorway), `check_ko_drop` ticks, folder and mugs on the kitchen floor; after the reload the mugs are back at office (5,4) and Ava's body lies by the filing cabinet in the office |
| 4230 | beat i2, probe as committed | Pass: schedule seen 97 ms before the close returned, reload 2598 ms after the schedule, nothing revealed, no tick |
| 4229, 4233 | beat f, probe as committed | **Fail twice**: `dee never walked to the coffee`. Dee's log: `windup` at tick 15/16, `using office_coffee` at 23; the probe was still walking the player to the drawer (F1) |
| 4234 | `f2`: player at the drawer first, then caffeine, 120 ms polling | Pass: Dee `goto_target` at speed 85 at the moment of the pick, PersonChat opens ("Oi. That's a locked cabinet..."), `frozen` 47, `unfrozen` 52, `using` 53. After the reload a second pick logs `mapping won't fire now`, `Restored 1 fired onceOnly` and opens the lockpicking minigame: the onceOnly proof is real |
| 4231 | `cx`: the kitchen cooler's approach cell and a 60 s trace of Ben | Approach cell (-276,276) is on the walk grid (`findNearestWalkableStartCell` returns it unchanged). Ben stalls at about (-106,161), speed 0, beside Fran and Gil at the kitchen table, then `job_failed water_cooler` (timeout) and walks home (F2) |
| 4235 | `i2r`: i2, then a second real conversation after the reload | The page prints and `check_eli_page` ticks on the second close. The lost delay is recoverable by talking to Eli again |

Read-only checks on the fixer's games: 4184 (`office.objects_removed` = [], kitchen `ava_folder`),
4208 (`office.objects_removed` = [`office_mugs`], kitchen `ben_notebook`), 4212
(`triggeredEvents` = `dee:lockpick_used_in_view:0`), 4217 (`eli:conversation_closed:eli:0` and
`eli:object_revealed:eli_page:1`, `eli_page_shown` **false**), 4220 (no keys). All match the README
table except the `eli_page_shown` wording (F6).

Node tests `npc-needs.test.mjs` and `npc-needs-attack-scenario.test.mjs` pass. Validator
(`--skip-ink --no-graph`): 0 errors, 4 warnings, as the README says.

## Round 1 findings: fixed or not

| R1 | status | evidence |
|----|--------|----------|
| M1 mugs come back | Fixed in README and probe (after-reload `roomItems`). Plan 5.1 (b) still says "the mugs are gone" (F5) | 4228 |
| M2 KO body at spawn | Fixed: recorded as E-reload-ko-pos with correct lines | game.rb:974, :1177, :2145 checked |
| M3 calm path | Fixed: real `playerCombat.attack`, forced calm stated in README and probe header. `npc_attacked` itself is not shown (F7) | 4183 report |
| M4 (f) not walking | **Not reliably fixed** (F1) | 4229, 4233 fail; 4234 passes once reordered |
| M5 (d) recall from the cooler | Fixed for "from the kitchen"; Ben is on the cooler job in the kitchen, never at the cooler (F2) | 4211 report |
| M6 (i2) by construction | Fixed: `eliConversation` waits for the real close, reload measured 2.6 s after the schedule | 4220, 4230 |
| M7 E-carry placement | Fixed for Ava; the same fault now blocks Ben in the kitchen and was given the wrong cause (F2) | 4231, `c-c-down-4208.png` |
| m1 (g) assertions | Mostly fixed; `fran_state_blocked` also accepts `mode === 'idle'` (F8) | probe:411 |
| m2 h2 | Fixed: KO 84 ms after a real close, reload empty | 4215 |
| m3 (c) at the cooler | Declined on the wrong grounds (F2) | 4231 |
| m4 (i) reload half | Fixed; server keys confirmed | 4217 |
| m5 kitchen load | Fixed: `loadKitchen` throws | probe:127-133 |
| m6 real lockpick | Fixed: `office_lockpick` picked up, server `objects_removed` confirms | 4212 |
| m7 `completing` | Fixed | probe:85 |
| m8 README drift | Fixed except two new contradictions (F6) | |
| m9 node pin | Fixed | test passes |
| m1 KO need bubble | Declined as an owner item, but not recorded in any owner list (F4) | |

## Findings

### Blocker

None.

### Major

**F1. Beat (f) fails in fresh games: the probe sets Dee's caffeine before it walks the player to the
drawer, so her 2 s walk is over before polling starts.**
`tools/playtest/needs-attack-probe.mjs:465-471`.
Evidence: games 4229 and 4233, both `Error: dee never walked to the coffee`. Dee's log in both:
`windup office_coffee` at tick 15/16, `using office_coffee` at 23 (about 2 s), while
`moveToNear('dee_drawer')` (line 467, up to 15 s) was still running. Round 1's M4 asked for the
player to be at the drawer first and caffeine set after; the code does it the other way round. The
fixer's single pass (4212) was a fast walk. With the order swapped and polling at 120 ms (`f2`,
game 4234) the beat passes and shows everything the plan asks: phase `goto_target` at speed 85 at
the pick, PersonChat open, `frozen`/`unfrozen`, then `using`.
Fix: swap lines 465 and 467 (move to the drawer, then set caffeine), poll at about 120 ms, and record
Dee's state straight after `interact('dee_drawer')` rather than before it. Re-run (f) in at least two
fresh games and put both ids in the README table.

**F2. Beats (c) and (d) never reach the cooler because Ben is stopped by Fran and Gil's bodies at the
kitchen table. That is the E-carry fault, not "the cooler corner is unreachable (E8)".**
`needs-attack-probe.mjs:352-359` (comment), `:368-374`; `README.md:109-111` and the (c) table row;
the fixer's note declining round 1's m3.
Evidence: game 4231 (`cx`). The cooler's approach cell (1,8) at (-276,276) is on the walk grid:
`findNearestWalkableStartCell` returns the same cell. Ben's trace: kitchen, `goto_target`, stopped
at about (-106,161) at speed 0 (kitchen tile about (6.7,5), the table where Fran and Gil sit at
(6,6) and (7,6)), then `job_failed water_cooler` and `returned_post`. The fixer's own
`c-c-down-4208.png` shows Ben knocked out wedged between standing Fran and seated Gil, nowhere near
the cooler. Plan note 9.3 (E8) is about a *second* user whose beside cell has no route after E6
lands; it does not explain a first user on a free cell today. The probe's acceptance window
(`speed < 12 && d < 190`) and 4208's distance of exactly 190 px show the beat is tuned to the stall,
and 4203 caught him at 307 px.
Why it matters: (c) says "knocked out at the kitchen cooler" and (d) "at the cooler"; what is proved
is "knocked out while stuck on a cross-room errand". The E-carry owner item also understates its
reach: it is not only Ava against Ben in the office, it hits any needs move through a room where
NPCs sit, including the kitchen with its two resident NPCs.
Fix: mission-local, as for the mugs: move the cooler (or Fran and Gil's tile homes) so Ben's route
from the kitchen door to (1,8) does not pass the table, re-run (c) and (d) to phase `using`, and
tighten (c) back to `phase === 'using'` with a failure on timeout. Correct the README and probe
comment (drop the E8 claim), and add game 4231 and the kitchen case to the E-carry entry in the
README and build log.

### Minor

**F3. E-reload-mugs is located at the restore side, which works as designed; the cause is the
client's needs `dropHeld`, and it is not specific to a knock-out.**
Build log owner table and `README.md:234-242` cite `game.rb:2108-2111`. That code applies
`objects_removed` correctly. The gap is `npc-needs.js:5124-5140` (`world.dropHeld`), which moves the
sprite client-side only, against `consumeHeld` at `:5115-5123`, which calls
`RoomStateSync.removeItemFromRoom` (that is why 4208's delivered carry records the removal). Any
mid-carry abort drops the mugs the same way, so beat (a)'s attack (4183) has the same reload result.
Fix: re-point the owner item at `npc-needs.js` `dropHeld` (with `pickUp` at `:5094`), say it covers
every abort mid-carry, and keep the game.rb line only as where the authored object is rebuilt.

**F4. The knocked-out NPC's need bubble is in no owner list.** Round 1 m1 raised it and the fixer
declined it "for the owner", but it appears only in the fixer's notes in the round 1 review, not in
the build log's owner table or the README's "Engine faults". It is visible again in
`s1-fix-r1/c-c-down-4208.png`: Ben knocked out with a water bubble over him.
Location: `public/break_escape/js/systems/npc-action-icons.js:218-222` (`thoughtBubble` has no KO or
`blocked` check) called from `update()` at `:563`.
Fix: add it as a fourth row to the owner table and the README, with that location.

**F5. Plan 5.1 (b) and (a) still say what round 1 showed is false.**
`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` 5.1 (b): "after a reload the folder is there once
and the mugs are gone"; (a): "on `unblocked` walks home and resumes". Live (4183): after `unblocked`
Ava starts the carry again and finishes it at the tray, she does not walk home first. The README was
corrected; the plan was not.
Fix: align the plan's (a) and (b) text with the README and name the owner items.

**F6. Two README statements contradict the live table.**
- `README.md:109` (c): "in phase `using`"; the table row and every run say `goto_target` (see F2).
- `README.md:126-128` (i): "`eli_page_shown` persists"; the table row and server game 4217 say it is
  false after the reload (the slot is filed). The README could also note, from game 4235, that after
  an (i2) reload a second conversation prints the page, so the loss is not permanent.

**F7. "Emits `npc_attacked:ava`" in (a) is asserted but not shown.** The probe checks the needs log
for `/attack/` (`needs-attack-probe.mjs:302`), which never matches: `npc_attacked_logged` is false in
4183. Fix: listen for `npc_attacked:ava` on `window.eventDispatcher` (listening, not emitting) and
report it, or drop the claim from the README and the probe header.

**F8. Smaller probe assertions that pass loosely.**
- (g) `fran_state_blocked` is `blocked === true || mode === 'idle'` (`:411`); the plan asks for
  `blocked`. `franWalking` may be null and the KO still runs (`:397-398`).
- (f) `dee_resumed` (`:480`) is true for any job or idle state; the plan's tail is "returns to her
  post". In 4234 she had not reached her post 40 s after the close (she was still at the coffee), so
  wait for `returned_post` in her log with a longer bound.
- (b)/(c) `kitchen_takeables_after_reload` is always [] because the kitchen is not loaded after the
  reload; "the folder is still in the kitchen once" rests on the server record alone. Load the
  kitchen after the reload and count the item.

**F9. Dee's catch line says "I just watched you open it"**, but the catch stops the pick before the
cabinet opens (4234: the lockpicking minigame never starts on the first pick). Something like "I just
watched you try to pick it" fits. `scenarios/test_needs_attack/ink/dee.ink`.

## Owner items: real and correctly located?

| item | real? | located? |
|------|-------|----------|
| E-carry | Yes (Ava in round 1; Ben in the kitchen, 4231 and 4208) | `npc-behavior.js:1305` `_checkPathStuck`, `:1348` `_recoverFromStuck`; `npc-needs.js:3149` and `_failJob` `:3490`: correct. Scope too narrow (F2) |
| E-reload-mugs | Yes (4184, 4228) | Restore side only; the cause is `npc-needs.js:5124` `dropHeld` (F3) |
| E-reload-ko-pos | Yes (4184, 4208, 4228) | `game.rb:974`, `:1177`, `:2145`: correct |
| KO need bubble | Yes (4208 screenshot) | Not recorded; `npc-action-icons.js:218-222`, `:563` (F4) |

Counts: 0 blocker, 2 major, 7 minor.
