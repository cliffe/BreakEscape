# Friendface reactions: merge into batch 27

Date: 2026-11-13. Branch `build/reactions` (tip b022a414b, based on b7d500ccf) merged into `train/27` (batch 26 tip 30f26061e). The user approved the four reaction icons, which was the last open item. Plan and build log: `FRIENDFACE_REACTIONS_PLAN.md`, `FRIENDFACE_REACTIONS_BUILD_LOG.md`.

## Commits

- a619b6081: merge commit, with the two conflicts resolved.
- 2409766b6: reactions unit test fixture renamed for format 1 (below).
- This file.

## Conflicts

1. `docs/IDEAS_BACKLOG.md`: both sides appended entries at the end. Kept both: batch 26's entries first, then the reactions entry (player reactions as a rapport lever, q79).
2. `scripts/scenario-schema.json`, NPC `feed`: batch 26 has step 2's closed block (`additionalProperties: false` with the `^_` note pattern on `feed` and on each post, and `"x-id-map": false` on `posts[].when` from step 2b). The branch had added `reacts` to the old open block. Resolved by taking batch 26's line and declaring `reacts` inside the closed `feed`. Each `reacts` entry is closed the same way as a post: `additionalProperties: false`, `patternProperties: { "^_": {} }`, and the properties `to`, `toComplaint`, `key`, `alongside` and `_comment`. The `reacts` array has an `items` schema, so step 2b's marks rule needs no `x-` mark on it. The schema walk tests (`scenario_schema_test.rb`, `validator-strict-keys.test.mjs`) pass.

## Checks against the later rules

- **Author notes (step 2b).** `reacts` and its fields are declared properties, so the resolver reads them as live data and never as notes. Only a `_`-prefixed key inside a `reacts` entry is a note, as in every other closed block. `reacts` is server-only: the scenario payload never carries it. The leak scanner's `feed_reacts_key` rule checks this live (below).
- **Sync size.** Reactions add no player_state key. The server derives them on each `/feed_post` answer and on `GET /scenario` `feedPosts` from the authored `reacts` and the existing `feedRevealed` record, so nothing new is stored or re-sent. The client keeps them in the in-memory feed store, rebuilt from those answers, and writes nothing to `gameState`. Each answer's `reactions` list is bounded by the authored `reacts` (the build log measured 65 to 72 B per item).
- **Schema and known fields.** The only new scenario key is `feed.reacts`, now declared in the closed `feed` block. The validator's `check_unknown_fields` works per NPC field (`feed` is already known); keys inside `feed` are checked by the schema. `test_access_social` validates with no ❌.
- **Format 1 (steps 7 and 8a).** Reactions read no field that 8a renamed. Their unit test did (fix 1).
- **Icon size (q80).** The test in `social-feed-reactions.test.mjs` passes on the merged CSS. It reads every stylesheet the game page links, slice 7's minigame rules included. Live: each icon draws at 32x32 from 16px art with `image-rendering: pixelated`.
- **Slice 7's font-weight rule.** The names line and the chip count compute to GNF at weight 400 (14px and 16px). They are readable in the shots at both widths. The chips keep their 2px square borders (radius 0).

## Fixes

1. `test/unit/access_work_feed_reactions_test.rb` (2409766b6). In the first full Rails run, 7 failures and 1 error, all in this file. Its hand-built scenario gave the resource outage as `downIf`. Step 8a (format 1) renamed a resource's `downIf` to `offWhen`, and `AccessWork` now reads only `offWhen`. So the fixture's drive was never down, no vent was served and no reaction came out. Batch 26 had already made the same one-word change to the C3 reply test's fixture. With `offWhen`, the file passes 19 runs, 235 assertions. The engine code needed no change.

## Suites

- Rails, first run on a619b6081: 2386 runs, 7 failures, 1 error, 1 skip. All eight were in the file fixed above.
- Rails, rerun on 2409766b6: 2386 runs, 0 failures, 0 errors, 1 skip.
- JS (`MERGE_BATCH=1 bin/test-js -j 3`) on a619b6081: 598 files, 0 failed. The fix after it touches only a Ruby test.
- Validator (`--no-graph`) over all 179 `scenarios/*/scenario.json.erb` and `scenarios/*/scenario.json` files: every file exits 0. The 73 ❌ lines (11 files: biometric_breach, ceo_exfil, crypto1 to crypto3 and six lab scenarios) are all entries in `validator_known_failures.json` and are not touched by this merge. No dungeon graph files were rewritten. `validator_known_failures.json` is unchanged by the merge.

## Live proof (game 2887)

Keyless server on :3060 from this worktree, headless shell with scrollbars shown, `setFPS(20)` with fixed steps on. A new game was made with `tools/playtest/swap-scenario-game.rb test_seating test_access_social`. The server was stopped afterwards.

- **1400x1000.** Phone picked up, walked east through every room to `f15_room`. F15's reactions came out as in the build log: Kofi and Mei sad on Asha's vent, Mei's like on Kofi's reply, Asha's like on Mei's reply. On Asha's Friendface page: one chip "Sad, 2", 61x40, icon 32x32 (natural 16, pixelated), row 61.6 px tall, no row overflow and no horizontal page scroll.
- **Keyboard.** Three Tab presses from the browser's main area reach the chip, which shows `:focus-visible`, and the names line reads "Sad: Kofi Mensah, Mei Tanaka". Keyboard focus pushes no overlay layer, the same as in the build log's step 9.
- **Click.** A real mouse click on the chip sets `data-open`, shows the names line and pushes the `reaction-names` layer. One Esc closes the names line and empties the layers, and the browser stays open. A second Esc closes the browser.
- **390x844.** The same game was reloaded and resumed. The reactions come back from `feedPosts` with no new `npc_reacted` events. The chip, icon and row sizes match the desktop. The main area is 370 px wide, with no horizontal scroll. The keyboard, click and Esc steps behave as at 1400 px.
- **Leak check** over both captures (81 responses): no leaks. The four reaction rules (`feed_reacts_key`, `feed_reaction_target`, `feed_reaction_key`, `feed_reaction_reactor`) are all 0. There are no `[reactions] derivation failed` lines in the server log.
- **Shots** (scratchpad `ux-shots/reactions-merge/`, not committed): `01-chips`, `02-keyboard-focus-names`, `03-click-open-names` and `04-after-esc-names-closed`, each at `1400x1000` and `390x844`, as lossless webp.

## Left alone

- `README_scenario_design.md` still names a resource's and a network's outage field `downIf` in the Networks and office-life sections. That text came from batch 26, not from reactions, and this merge leaves it as it is. Whoever owns step 8a should check it against the format 1 names.
