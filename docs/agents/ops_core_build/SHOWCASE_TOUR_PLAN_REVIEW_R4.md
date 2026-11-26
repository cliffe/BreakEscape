# Showcase tour plan: review R4

Reviewer: design review round 4. Plan: `SHOWCASE_TOUR_PLAN.md` at `fadefac4e`, checked against main (`b97e2f9c0`, gem 1.0.25). Every engine file cited below is the same on main as at the plan's base `537dbd52c` (`git diff 537dbd52c main` is empty for `public/break_escape/js`, `credential_keyring.rb`, `network_access.rb`, `db/seeds.rb` and the three showcases' scenario and ink files) except `games_controller.rb` (see n2). No SecGen XML, realism catalog file or field guide was opened.

The only edit made to the plan is section 5: the owner's answers of 2026-11-25 are recorded there as decided (yes to `demo_ops_terminal` and the freeze; yes to Mission rows, re-seeding dev, standalone and Hacktivity's seed all fine; yes to the voice spend after the dialogue sign-off; yes to the phone call and callback unit, last).

**Verdict: clean.** No blocker, no major. 4 minors, each a wording or brief detail the reviser or the U4 builder folds in; none changes the design.

## R3 findings

| R3 | Status | Evidence on main |
|---|---|---|
| B1 greyed token row | **Closed** | The plan drops the `pc_signin_failed` mapping and ticks T10 on Ama's self-report (plan 2.4 lines 206, 210, 212, 223). The code agrees that nothing else could tick it: an expired token's row is `expired: true` with no routes (`credential_keyring.rb:497-504`); the sign-in screen returns on `cred.expired === true` before any request (`password-minigame.js:2577-2581`). The held-session path stays: the client timer calls `linkDropped([pcId], 'token_expired')` (`pc-sessions.js:448-452`). The gate (`sweep_done`, while `not token_ran_out` and not both T3 and T11 done; again after T9b while `not token_expired_done`) covers every case R3 listed: stuck at T3 or T11, signed out after T11, still signed in. The `sweep_done` gate instead of `scan_check_done` is right (a player whose token lapsed at T3 never reaches T4). U4's test row names the greyed-row check (4.1 line 407); 4.2 and 5 name the self-report limit. |
| M1 `relay_ended` | **Closed** | The lever is offered only once `relay_seen` and while `not shared_screen_done`, with "Connect to his screen first." before (2.4 line 191); its knot sets `graham_assist_ended`, ticks `shared_screen` and says T9b; no `relay_ended` mapping (line 222). This removes the dependence on `_relayEnded`, which skips a PC with no held session (`pc-sessions.js:1148-1153`). Ending from ink works: `endsOnGlobal` is read from the scenario (`lib/break_escape/credential_model.rb:118-130`) and `test_access_keyring` ends its invite the same way from ink (`ink/jake.ink:48`, global declared at `scenario.json.erb:33`). A held relay session still closes with "... ended the remote assist." (`pc-sessions.js:1156-1160`). |
| m1 lunch before the temper note | Closed | `lever_lunch` gains the "Not yet. Watch Darren's temper first." check after the kitchen one (2.6 line 274). Cited lines hold: `[Send them to lunch.]` at `demo_ops_second_step/ink/ama_owusu.ink:62`, `lever_lunch` at `:210-215`, the 300 s re-hunger mapping at `scenario.json.erb:796`. |
| m2 two ports | Closed | `spare_jack` carries `revealOnGlobal: "spare_port_offered"`, set by the T3r knot (2.4 lines 187, 207). Code support: see "The hidden port" below. |
| m3 `box_at_kitchen` | Closed | Two appended mappings with no once limit, declared in `globalVariables` (`demo_ops_recon/scenario.json.erb:171`) and the ink (2.3 line 177). The `onceOnly` plug-in mappings at `:485`, `:499` and the unplug bark at `:494` are as cited. |
| m4 dropped borrow | Closed | Added to the passwords probe with the way back into PLAYTEST (2.5 line 265; `npc-workarounds.js:26-28` cited). |
| m5 text | Closed | Line 189 split ("The third credential is `graham_assist` ..."); the T10 tick line (223) and the R2 m4 outcome (479) rewritten. |

## The hidden port: does the code support "a hidden port cannot be plugged into"?

**Yes, for a player; no, as a server rule.** The plan leaves it as a probe (line 496), which is fine, but the answer is already in the code:

- Client, ordinary play: when the room reveals, an object whose `revealOnGlobal` is not true goes through `hideUntilReveal`, which sets it invisible, `interactable = false` and calls `disableInteractive()` (`core/rooms.js:3162-3165`, `:3079-3082`). Both ways to act on a jack need `interactable`: a click takes "the first interactable sprite" (`interaction-reach.js:238`), and E's `pickInteractable` skips any object that is not active, interactable and visible (`interaction-reach.js:632`). The only plant entry points are `interactJack` from the click (`interactions.js:1017-1018`) and the patch panel (`patch-panel-minigame.js:259`); `demo_ops_terminal` has no patch panel. So a player cannot plant at `spare_jack` until it shows.
- The reveal: a one-time listener on `global_variable_changed:spare_port_offered` with `value === true` shows it (`rooms.js:3085-3087`), and a reload after the reveal shows it at once (`isGlobalTrue`, `:3072-3074`). An ink write emits that event (`npc-conversation-state.js:629-632`), but only for a declared global (n1).
- Server: `plant_device!` checks only that the jack exists, its room and containers are reachable and port security (`network_access.rb:239-249`, `object_reachable?` `:127-133`); nothing reads `revealOnGlobal` (the only server mention is `game.rb:1401`, the carry rule). A hand-made POST (or a harness call) could plant there and start the spare clock. That is not a player path and costs only the way back, so no change is needed; the probe should record it as "client-only" rather than "cannot".
- Related probe, also answered: the spare token's row appears only while `spare_jack` is held, because a foothold proof holds only for a held foothold (`credential_keyring.rb:21-32`, rows listed at `:417-423`), and its clock starts only on that jack's first gain (`start_token_clocks!` `:218-229`, called from `plant_device!` `network_access.rb:284`). One consequence for PLAYTEST: once the box moves to the spare port, the first token's greyed row leaves the keyring too (its proof no longer holds), so the T3r line "move the box" is also the moment the greyed row goes.

## Findings

### Minor

**n1. Terminal: the globals the ink writes must be declared scenario globals, and 2.4 does not list them.**
- Ink reaches `window.gameState`, the other stories and the event bus only for a declared global: `isGlobalVariable` checks `globalVariables` (`npc-conversation-state.js:466-477`), and the observer returns for anything else (`:595`, emit at `:629-632`).
- If `spare_port_offered` is only an ink `VAR`, the T3r knot sets it locally, no `global_variable_changed` fires, and the spare port never shows: the way back is dead. The same goes for `graham_assist_ended` (the server ends the invite from the synced global), `token_ran_out`, `relay_seen` (written by a mapping, read by the ink), and the `<task>_done` and `t6_<finding>_seen` globals the ink and conditions read.
- Fix: in 2.4, name the globals to declare in `globalVariables` and as ink `VAR`s, as 2.3 does for `box_at_kitchen`; U4's Rails test asserts `spare_port_offered` is declared.

**n2. Citations to correct.**
- `isGlobalVariable` is at `npc-conversation-state.js:466-477`; the plan's `:157`, `:258`, `:336` (2.3 line 177) are restore sites that skip globals.
- `_remoteOf` is at `pc-sessions.js:1196-1203`; `:267` (2.4 line 222) is `relayFields`. The claim holds: a relay session's `pc_signed_in` carries `relay: true` (`:1005`).
- `games_controller.rb` changed on main: four lines were added at `:619-623`, so the plan's `:761`, `:779-780` and `:791-799` (2.7, 4.5) are `:765`, `:783-784` and `:793-803` on main. The header's "The code and scenario files cited are unchanged since `537dbd52c`" is not true of that file; the claims themselves still hold (the cache folder is `@game.mission&.name`, `:765`, `:784`; a cached clip is served before any key check, `:795-803`).

**n3. Text still waiting on answers that are now given.**
- With section 5 decided, the conditionals elsewhere should be read as met: U3b "only on the owner's yes" (4.1 line 406), U4 "Starts only on the owner's yes" (line 407), U6 "only on the owner's yes" and the "separate yes" for `hacktivity_db` (2.7 line 318, 4.1 line 409), 3.5 step 4.
- The owner also accepted a full re-seed, so U6 is no longer the only route to the rows. The seed is safe to run in dev: it creates or updates by name, and deletes rows for missing folders only after a typed "delete" at a terminal or with `BREAK_ESCAPE_PRUNE=1` (`db/seeds.rb:58-75`, `:110-139`); Hacktivity's button only `load`s it (`/home/deploy/Hacktivity/app/controllers/admin_actions_controller.rb:114-116`), with no terminal and no prune variable, so it deletes nothing. 2.7's "offers to delete rows for missing folders" overstates that for the button. The orchestrator may keep U6 (four rows, nothing else touched) or replace its run with `bin/rails db:seed` standalone and the Hacktivity button after the gem bump; either is within the owner's answer.

**n4. The hidden-port probe wording.** Line 496's "a `revealOnGlobal` network port cannot be plugged into while hidden" is true for a player and not enforced by the server (above). Record it in BUILD_REPORT as client-only, and add the PLAYTEST note that moving the box also takes the first token's greyed row away.

## Holds (checked this round)

- T3 and T11 timing: the token's foothold-route session answers `needs_console` only while live, and the client timer ends a held session on expiry (`pc-sessions.js:441-452`); the clock starts at the plug-in, never restarts (`credential_keyring.rb:218-229`).
- T12 cannot tick on the T3r move: both unplug mappings carry `token_expired_done && shared_screen_done` (2.4 line 225); on the T3r path `shared_screen_done` is still false when the box moves.
- T10's mapping path and its self-report cannot both fire for one expiry: the self-report is offered only while `not token_ran_out` (first offer) or `not token_expired_done` (second), and the mapping sets both.
- An ink-set global emits with no `oldValue` (`npc-conversation-state.js:629-632`), so the plan's bark conditions `data.oldValue !== true` pass on an ink write as on a mapping write.
