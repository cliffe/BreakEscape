Counts: 0 blockers, 2 majors, 4 minors, 6 nits.

# Unlock gaps code review R1 (2026-11-12)

Reviewed `git diff main..build/unlock-gaps` (commits ae926a3f9, 6b4e6bc7a, 141b3646a, b49a09189) against docs/achitechture/UNLOCK_GAPS_BUILD_LOG.md and the two backlog entries it closes.

## What holds

- **Secrets.** No combination or cryptex answer reaches the client through the engine.
  - Both filters strip `requires`, `combination` and `cryptexConfig.answer`: the model filter (room payloads, NPC `itemsHeld`, container contents, the canonical inventory copy) and the controller filter (bootstrap).
  - The bootstrap room allowlist (game.rb:1122) never carried `combination` or `cryptexConfig`, and the controller filter then drops `requires`.
  - KO drops: the dropped copy is built from the filtered NPC payload. The server's `objects_added` copy holds the answer, but the room payload filters it (checked live, below).
  - The dungeon graph output lives under `scenarios/`, which is not served (StaticFilesController serves `public/break_escape` only). Its `.md` does print authored answers, which is fine for an authoring artefact.
  - Client grep: nothing in `public/break_escape/js` reads `.combination` or `cryptexConfig.answer` any more.
- **Server matching** (`Game.lock_answer_matches?`, game.rb:2546). It agrees with what the minigames send: dials joined as `"12-30-5"`, wheels joined as the shown letters.
  - Blank, missing and partial answers fail. Live: `""`, `"7-21"` and the right answer under method `pin` all gave 422; `"7-21-39"` opened.
  - Extra numbers fail. A non-string cryptex secret fails closed.
- **Gap 2.** It meets the cheat policy.
  - Release reads only the server's give record or a KO the server already trusts (`npc_defeated?` → `npc_ko_claimable?`: a met, room-standing, not koImmune, non-phone NPC). A forged inventory copy or an invented id resolves to nothing (npc_container_unlock_test).
  - The container's own lockType and answer are still checked.
  - Contents are taken through a `container` location, so the container must be in `unlockedObjects` first (games_controller.rb:2353).
- **Sync size (q77).** Nothing is added to player_state. The lookup is a read, bounded by the scenario's NPC-held items, and it short-circuits on `npc_container_item?` before any record lookup.
- **Validator and schema.** test_unlock_gaps gives 0 ❌ with `--no-graph`. Both `lockType` enums take the two new types.
- **Tests (affected files only, no lock).**
  - Rails: combination_cryptex_unlock_test, npc_container_unlock_test, unlock_response_filter_test and forged_ko_drop_test gave 32 runs, 193 assertions, 0 failures.
  - JS: the 87 test/js files that import the two minigames, minigame-starters.js, unlock-system.js or run the validator all pass.

## Live proof (done in this review)

The builder said a Mission row needs db:seed. It does not. `tools/playtest/swap-scenario-game.rb` makes one game of an existing mission and swaps that row's scenario. It checks the Mission count before and after and aborts if it changed (173 before and after here).

- Game **1736** (host mission test_seating, scenario test_unlock_gaps).
- Keyless server on :3053 from the worktree. Headless session via session-start.sh, with `smoothStep=false`, `minFps=1`, `setFPS(20)` and fixed steps on.
- The server and the session were stopped afterwards.

Results:

1. **Combination padlock.** Driven by clicking the real dial buttons.
   - 39-0-0 was refused (422) with "✗ Incorrect combination. 2 attempts remaining.", no toast and no generic error.
   - 12-30-5 opened: "✓ Combination Correct!", then the container opened.
2. **Cryptex** (6 wheels).
   - CIPHEX and CIPHES were refused with "✗ Incorrect. N attempts remaining.".
   - CIPHER opened.
3. **KO-dropped bag.** The courier was met, then knocked out with debugKO. The bag dropped with `hasContents`, and the client copy had no `requires`.
   - A wrong password gave 422; Satchel42 gave 200.
   - GET /container/test_courier_bag gave 200, and taking Delivery Memo was accepted (server inventory now holds `test_delivery_memo`).
   - Final `unlockedObjects`: locker, cryptex box, courier bag.
4. **Combination door** (vault). Checked through the real `/unlock` from the page, not the UI: blank, partial and wrong-method attempts were refused and the right one opened.
5. **Payload scan.** The bootstrap and the lobby and vault room payloads were fetched after the KO. Answer strings appear only in authored text (the scenario brief and the Codes note), never in a lock field.

## Majors

### M1. The padlock is easy to overshoot, and the natural correction silently wipes all three dials

combination-minigame.js:146-150 and 209-225.

**Failure scenario.** The dials used to stop by themselves at the right number (the auto-advance), so a player could not overshoot. That is gone, and nothing replaced it.
- A player counting clicks to 12 who lands on 11 has two options: go round another 39 clicks, or press the other arrow.
- Pressing the other arrow is the "wrong direction" path. It sets "Wrong direction on dial N", then calls `_handleReset()`, which runs `_setStatus('')` straight away.
- So all three dials go back to 00 with no message at all. Seen live: status `""`, dials `[0,0,0]`.
- Dial 1 runs LEFT (counting down), so reaching 12 from 00 takes 28 clicks, which makes an overshoot likely.

The padlock is still solvable but feels broken: progress vanishes with no reason given.

**Fix.**
- At least: call `_handleReset()` first and set the message after it, so the player is told why the dials reset.
- Better: let the opposite arrow on the current dial step back one number without a reset. The L-R-L order still holds, because only moving to the next dial is direction-checked.
- Add a JS test that a wrong direction leaves a visible message.

### M2. A cryptex door can be authored, documented and validated, but in the game it shows the default 5 A-to-Z wheels

game.rb:1122, doors.js:518-549, README_scenario_design.md:643.

**Failure scenario.**
- The README table "applies to both rooms and objects", and the room `lockType` enum now takes `cryptex`.
- A room with `lockType: "cryptex"`, `requires: "CIPHER"` and `cryptexConfig: { "wheelCount": 6 }` passes the new check, which reads the room's `wheelCount`.
- But the bootstrap allowlist drops `cryptexConfig` from rooms, and `doorProperties` has no `cryptexConfig`. `handleUnlock` passes `{}`, so the door shows 5 wheels of A to Z.
- A 6-letter word can never be spelt, and the door never opens. `hintStrip`, `wornRings`, `alphabets` and `maxAttempts` are lost the same way.
- The validator does print "Room 'vault' has unknown field 'cryptexConfig', this field will be ignored by the game engine", which contradicts its own wheel check and gives 0 ❌.

**Fix**, either of:
- Add `cryptexConfig` to the bootstrap room fields (minus `answer`: the controller filter strips it after) and to `doorProperties` (`cryptexConfig: lockProps.cryptexConfig ?? connectedRoomData?.cryptexConfig ?? null`), and add `cryptexConfig` to the validator's known room fields. Then add a cryptex door to test_unlock_gaps and a Rails test that the bootstrap carries the config but not the answer.
- Or make a room cryptex lock a validator ❌ and say "objects only" in the README.

The first is better, since combination doors already work.

## Minors

### m1. The README's array form of a combination fails the schema

README_scenario_design.md:642 and scripts/scenario-schema.json:4048 and 5044.

**Failure scenario.** The README offers `[12, 30, 5]`. Both `requires` schemas accept only a string or an array of strings, so a scenario written that way gets "Schema validation failed ... of type integer did not match" (checked on a scratch copy). The server and the new check accept it.

**Fix.** Either allow integer items in the `requires` array schema, or change the README example to `"12-30-5"` and drop the array form.

### m2. An NPC-held container with no `id` passes the validator but can never be opened

`Game.npc_container_item?` (game.rb, beside `released_npc_containers`).

**Failure scenario.** `npc_container_item?` requires an `id`, so a bag with `contents` and no `id` in `itemsHeld` is never released. After a give or KO the player gets "Access denied", which is exactly the backlog bug for that container. The README says "Give it an `id`", but the validator is silent (checked by removing the id on a scratch copy).

**Fix.** Add a validator ❌ for an NPC `itemsHeld` item with `contents`, `locked: true` or a container type (`suitcase`, `briefcase`, `bag1`, `bin1`) and no `id`. That is the check the backlog entry offered as the alternative.

### m3. Start-inventory items are served raw, so a locked one would ship its answer

games_controller.rb:408 and game.rb:4948. This is older than this branch and latent.

**Failure scenario.**
- `initialize_player_state` copies `startItemsInInventory` into `player_state['inventory']` with a plain `dup`.
- The GET /scenario `playerInventory` is set after `filter_requires_recursive` has run, and the inventory action replies with `player_state['inventory']` unfiltered.
- So a starting cryptex, padlocked case or PIN box would send `requires`, `combination` and `cryptexConfig.answer` to the browser.
- No shipped scenario has a locked start item today (0 of all scenarios checked).

**Fix.** Run `filter_requires_and_contents_recursive` (or the controller filter) over a deep copy of each inventory item before it is served, or store start items filtered as `canonical_inventory_item` does. Add a Rails test with a locked cryptex start item. If this is out of scope here, add it to the backlog.

### m4. After a wrong combination the player is not told how to try again

combination-minigame.js:341-347.

**Failure scenario.**
- `_handleFailure` calls `_handleReset()`, which returns early because `isSubmitting` is still true, so the dials stay put.
- Unlock is disabled, and dials 1 and 2 answer "Dial N is set. Press Reset to start again." only when touched.
- The status reads "✗ Incorrect combination. 2 attempts remaining." and nothing more. Seen live: dials `[39,0,0]`, Unlock disabled.
- A player who wants to change dial 1 has to find Reset by trial.

**Fix.** Either reset the dials after the failure (clear `isSubmitting` before the reset, then set the message), or append "Press Reset to try another combination." to the failure message.

## Nits

- **n1** scripts/generate_dungeon_graph.rb:31-42. `LOCK_TYPE_LABELS` has no `combination` or `cryptex`, so both draw as a bare "Lock" (checked on a scratch copy: "Locker / Lock", "Cryptex / Lock", "Vault / Lock"). The graph runs cleanly and the lock and contents edges are right, so this is a label gap only. Add `'combination' => 'Combination padlock'` and `'cryptex' => 'Cryptex'`.
- **n2** scripts/validate_scenario.rb:2143. `wheels = config['wheelCount'] || 5` takes a string `"6"` as is, so every word fails the length check with a confusing message. Use `Integer(config['wheelCount'], exception: false) || 5`, or add a type error.
- **n3** Neither lock type has a server-side attempt limit. The minigame's limit of 3 resets each time it reopens, and a script can try all 64,000 combinations or any word through `/unlock`. This matches PIN and password locks today, so it is consistent, not new. Note it beside the PIN residual if a limit is ever added.
- **n4** combination-minigame.js:127-135. The first press on the next dial sets the current one and does not turn the new dial, and it plays no click sound. The status line explains it, but a sound would make the "set" feel deliberate.
- **n5** cryptex-minigame.js `_checkCompletion`. Submit starts disabled and is enabled only by a turn, so a word that matches the opening position (all first letters) needs a turn away and back. Enable Submit from the start, since any word can be tried now.
- **n6** Build log, "Live proof". The route that needs no seed existed: `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb <host_mission> <scenario_dir>`. Worth one line in the builder rules, so the next build of a test scenario does not skip its live proof.
