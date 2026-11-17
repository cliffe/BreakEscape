# npcThoughts flag, review round 1

B 0 / M 1 / m 4

Commit reviewed: be259ff2e on build/npc-thoughts (worktree p-npc-thoughts).

What holds up:
- The gate in `NpcActionIcons.update()` (public/break_escape/js/systems/npc-action-icons.js:583-588) sits before any icon or bubble is created, so with the flag false nothing is made, and boxes made before a flip are hidden. A flip back on re-shows them: `_render` returns early on an unchanged signature, but `setVisible(true)` and the position are set after it, every frame.
- The flag is read from `window.gameScenario` each frame, the same object `actionIcons` and `showPressingNeeds` are read from. `game.js:1703` replaces it on load, so a reload or a new scenario picks it up. With the flag absent `npcThoughtsOn` returns true (`null` and `undefined` included), so the default is unchanged.
- No leak: with the flag off the maps stay empty; a box from a destroyed scene is only hidden (the existing `!ic.box.scene` rebuild covers the on path, as before).
- The server passes top-level keys through: `Game#filtered_scenario_for_bootstrap` (app/models/break_escape/game.rb:2341) filters only room fields, so the flag reaches the client.
- Other cues over NPCs checked and not thoughts: talk prompt (interactions.js, npc-talk-icons.js), held items and the lock and phone glyphs (npc-office-visuals.js; the glyphs sit over objects, not NPCs), the needs debug overlay (off unless `needsDebugOverlay`), chase, patrol and LOS graphics (debug only), attack telegraph (combat), overheard toasts (npc-workarounds.js).
- Unit tests (test/js/npc-thoughts-flag.test.mjs) import the real module and drive the real `update()`, not a copy; 9 of 9 pass with `bin/test-js`.
- The m01 to m10 line sits at the top level in every file (just before `"startRoom"`). The validator renders and passes m02, m07, m10 and test_npc_thoughts_off: 0 errors, schema passes, no warning about the new key.

## M1. Picture chat still draws need and intent icons over NPCs' heads

- Files: public/break_escape/js/systems/npc-needs.js:294 (`pictures: scenarioChatter !== false`), npc-needs.js:2927-2930 (`_pickBark` falls back to a picture), npc-needs.js:2110 (a grumble's picture is the need's own icon), npc-needs.js:121-157 (`PICTURE_CHATTER`), npc-world-bubbles.js:711 and 1050 (the bubble draws `talking.picture`).
- Severity: Major.
- What happens: a chatter turn with no lines, or one the player is out of earshot of, shows a speech bubble holding an icon, not text. m02 and m03 define only `coffee` and `cooler` pools, so in those missions every grumble (turn-back from a dead or empty machine shows the need's icon, such as caffeine; an avoidance shows the storm cloud), every `news` (the magnet's need), each workaround start (`wk_prop_door`, `wk_writes_down`, `wk_borrow`, `wk_share_login` show the workaround icon), each failure mutter (`barrier`, `file`, `print`) and each unheard coffee or cooler turn (caffeine, thirst, social, work) draws a need or intent icon over the NPC, with `npcThoughts: false`. That is the cue D77 is meant to remove: what an NPC wants, and in the workaround case a security window about to open. The docs and schema text say "chatter text" is untouched, which reads as covering only lines, so picture chat sits in a gap nobody decided on.
- Suggested fix (needs a user call through AC0, since D77 says speech and bark bubbles must still show): treat a line-less picture bubble as a thought, not speech. The smallest change is in `chatterPool`: `pictures: scenarioChatter !== false && gameScenario?.npcThoughts !== false` (read the scenario through `this.world`, as `chatterConfig` does, since npc-needs.js imports nothing). The existing `pictures: false` path already handles an unheard turn without counting it as silence (npc-needs.js:4495), and `_pickBark` returns null for a grumble, so voiced lines still play. The phone-call picture (npc-needs.js:4812, `c.pictures`) follows the same switch. Add a unit test that drives `_pickBark` or `chatterPool` with the flag false, and say "picture chat" by name in NPC_NEEDS_SYSTEM.md:288-292 and the schema description, whichever way the user decides.

## m1. No live browser proof of the gate yet

- Files: scenarios/test_npc_thoughts_off/ (the demo), test/js/npc-thoughts-flag.test.mjs.
- Severity: minor.
- The unit tests drive the class with a Phaser stand-in. Nothing yet shows the gate on the live path (the `installNpcActionIcons` hook from game.js:2105, the world-bubbles `hideFor` interplay, real textures). Standing rule: every engine feature needs unit tests, a focused test scenario and a live browser proof.
- Suggested fix: a headless proof on test_npc_thoughts_off (Ravi's coffee trip completes `see_coffee` and `window.npcActionIcons.icons.size + bubbles.size` stays 0) and on m02 for a few needs-clock minutes, with test_needs_sims as the icons-on control. No edits to any game row's scenario copy.

## m2. Office-life plan and skill still offer icon levers for campaign missions

- Files: docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:60 (lists `showPressingNeeds` as a mission atmosphere option), .claude/skills/mission-office-life/ (no mention of the flag).
- Severity: minor.
- In m01 to m10, `showPressingNeeds` and `actionIcons` now do nothing. A later office-life pass on m04 to m10 could add them, design a security window around an icon, or drop the line.
- Suggested fix: one line in the plan and in the skill's SKILL.md or gotchas: campaign missions keep `"npcThoughts": false` (D77); security windows must read from movement, barks, sounds and held items, not icons.

## m3. sis01_healthcare has needs NPCs and keeps its icons

- File: scenarios/sis01_healthcare/scenario.json.erb (no `npcThoughts`).
- Severity: minor (question).
- D77 names m01 to m10 only. sis01 is a story mission with needs NPCs (as are m02 and m03), so the same "icons read as clues" problem can arise there. lab_physical_pentest also keeps icons, which the docs say is intended.
- Suggested fix: ask through AC0 whether sis01 (and later sis missions) should set the flag; if yes, one line, as in the missions.

## m4. Validator does not flag dead icon config

- File: scripts/validate_npc_needs.rb:1082-1084.
- Severity: minor.
- With `npcThoughts: false`, `showPressingNeeds: true` or an `actionIcons` table has no effect. The validator checks only that the flag is a boolean.
- Suggested fix: a warning when `npcThoughts` is false and `showPressingNeeds` is true or `actionIcons` is set ("has no effect while npcThoughts is false"). test_npc_thoughts_off sets both on purpose, so either accept one warning there or add an `_comment` and skip the warning for `test_` scenarios.

## Outcomes

- M1: fixed (user decision D86a: hide picture chat). `chatterPool` takes a `thoughtsOn` argument and the needs world reads `gameScenario.npcThoughts`; picture chat is off when it is false, spoken lines and barks are unchanged. Own commit, test/js/npc-thoughts-pictures.test.mjs, docs and schema name picture chat.
- m1: done. Live proof on test_npc_thoughts_off, m02 and the test_needs_sims control; game ids and counts in the Live proof section below. Proof script tools/playtest/npc-thoughts-proof.mjs, screenshots tmp/npc-thoughts-proof/ (gitignored).
- m2: done. One line each in OFFICE_LIFE_MISSIONS_PLAN.md and the mission-office-life SKILL.md.
- m3: decided (D87a). sis01, sis02 and sis03 now set `"npcThoughts": false` beside the m01 to m10 line; validator 0 errors on each.
- m4: done. validate_npc_needs.rb warns when `showPressingNeeds` or `actionIcons` is set while `npcThoughts` is false; test/js/validator-npc-thoughts.test.mjs. test_npc_thoughts_off keeps its one warning on purpose.

## Live proof

Run on a keyless server (port 3093) from the worktree p-npc-thoughts at the R1 build, with `tools/playtest/npc-thoughts-proof.mjs` (samples action icons, thought bubbles, picture bubbles and spoken bubbles every 100 ms at setFPS(20), fixed steps on; writes nothing to the game row). Game ids are taken from the server log by request time, so treat the pairing as recorded after the fact.

| Run | Game id | Scenario and flag | Icons / thoughts / pictures seen |
| --- | --- | --- | --- |
| off | 6976 | test_npc_thoughts_off, flag false | 0 / 0 / 0 |
| offflip | 6966 | test_npc_thoughts_off, flag flipped true in the page only (`FLIP=1`, sensitivity control) | 2 / 2 / 2 |
| control | 6932 | test_needs_sims, flag unset (on) | icons and pictures shown |
| m02 | 6984, 6987 | m02, flag false | no icons or pictures; counts were not kept |

The off and offflip counts are from the R2 review of the screenshots and script output; the control and m02 counts were not written down at the time, so only the screenshots back them. Screenshots (gitignored, local only): `tmp/npc-thoughts-proof/off-*.png`, `offflip-*.png`, `control-*.png`, `m02-*.png`. offflip-0-far-1.png shows two coffee bubbles over two NPCs; off-0-far-0.png shows none.
