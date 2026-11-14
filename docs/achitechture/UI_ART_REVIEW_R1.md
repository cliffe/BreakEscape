# UI art review, round 1: Kevin Park and Derek Lawson sprite keys

Branch `build/ui-art`, tip `fca9df29e`, diffed against its merge-base with main (`fc4b4d8a5`).
One commit, 37 files: new `kevin_park` and `derek_lawson` atlases, headshots, concept and prompt, talk and viseme sheets, override frames, two `tools/pixellab_characters.json` entries, and 10 changed lines in `scenarios/m01_first_contact/scenario.json.erb`.

**Counts: 0 B, 1 M, 2 m, 3 nit.**

## What was checked

- **Every old-key reference in m01 moved.** After the change, `scenario.json.erb` names neither `male_nerd*` nor `male_office_worker*` (the remaining `female_office_worker_v2` at line 577 is Sarah, correctly untouched). Nothing in `ink/` names a sprite key. No Ruby, JS or CSS maps an NPC id to a sprite (grep of `app/`, `lib/`, `config/`, `public/break_escape/js`, `css`). Repointed: Derek `spriteSheet`/`spriteTalk`/`spriteVisemes` (1399-1401), Kevin's (1591-1593), `desktopUser.character` on IT-MON-01 (1647), KEVIN-WS (1814) and DEREK-PC (1950), Kevin's voicemail `avatar` (1196).
- **No other mission changed.** The diff touches only m01's scenario file under `scenarios/`.
- **Files are byte copies.** md5: `kevin_park.png` = `male_nerd_v2.png`, `derek_lawson.png` = `male_office_worker_v2.png`; the talk, viseme png/json, headshot, nonpixelart and prompt files each match their source. The atlas json files differ from their sources only in `meta.image`, which reads `kevin_park.png` and `derek_lawson.png` (264 frames each, same as the sources).
- **Headshot naming.** `kevin_park_headshot.png` and `derek_lawson_headshot.png` follow `<key>_headshot.png`; the engine resolver (`utils/npc-headshot.js` `headshotCandidates`) asks for exactly these and the server returns 200 for both.
- **Overrides and drift.** `tools/pixellab_overrides/kevin_park` and `derek_lawson` are recursive-identical to the `male_nerd_v2` (3 frames) and `male_office_worker_v2` (16 frames) folders. The builder also copied the local exports into the worktree's `tmp/pixellab/_export/`; `python3 tools/pixellab_drift_audit.py kevin_park derek_lawson` reports both clean.
- **Validator.** `scripts/validate_scenario.rb scenarios/m01_first_contact/scenario.json.erb --no-graph`: 0 lines with ❌, exit 0. No dungeon_graph rewrites left behind.
- **Rails tests (no lock, named files).** `avatar_unlocks_test.rb`, `player_preferences_controller_test.rb`, `wearable_test.rb`: 88 runs, 0 failures. `scenario_npc_records_test.rb`, `access_model_login_test.rb`, `player_preference_name_test.rb`: 49 runs, 0 failures. `games_controller_test.rb -n /avatar|unlock|sprite/i`: 10 runs, 0 failures.
- **Fixtures.** Hacktivity `test/` has no reference to any of the four keys or to `unlockedAvatars`. BreakEscape's `test/fixtures/format_8a/test_access_work.*.json` name `male_nerd_v2`/`male_office_worker_v2` for a test scenario, not m01, so they are right to stay. No seed names the keys.
- **Seats and sitting.** The `sit_from` ids are copied with the entries, and the atlases carry the seated frames, so both NPCs can still sit.

## Live proof (keyless server on :3496, fresh games)

- Games 3553 (`--start-room it_room`) and 3554 (`--start-room break_room`) made with `tools/playtest/new-game.rb`. No page errors.
- Kevin: the world sprite draws (red shirt, glasses, beard) at his desk; the NPC record reads `spriteSheet: kevin_park` and its texture exists; talking opens person-chat with his bust and viseme sheet (`kevin_park_visemes.png` and `.json` fetched, 200).
- Derek: the world sprite draws (white shirt, black tie) in the break room; talking opens person-chat with his portrait. The first bridge `interact` showed only the name label, and a second press of E opened the chat. No JS changed on this branch, so this is a bridge or approach quirk, not a finding.
- Headshots: the engine resolver gives `kevin_park_headshot.png` / `derek_lawson_headshot.png` first, both 200; the avatar menu DOM loads both. A side-by-side of the two new headshots and the old `male_nerd_headshot.png` was viewed.
- Avatar unlock (runner on throwaway game 3553: add both NPCs to `encounteredNPCs`, set `mission_concluded_at`, save): the game stores `unlockedAvatars` `["kevin_park", "derek_lawson"]`; `AvatarUnlocks.for_player` includes both; `avatar_sprite?` is true for both; `available_sprites(m01)` includes `kevin_park`. The catalogue names them "Kevin Park" and "Derek Lawson" (First Contact), and m01's candidates list is `kevin_park, derek_lawson, female_scientist_v2, agent_hax, female_office_worker_v2`.
- Screenshots (scratch, not committed): kevin_world, kevin_talk, derek_world, derek_talk2, kevinws_pc, headshots.

## Findings

### M1. The lookalike guard no longer protects Kevin or Derek, and does not know the new keys are the same art as the generic ones

`public/break_escape/js/utils/npc-lookalike.js:16-21` (`POOLS`), `:34-38` (`poolOf`), `:52-58` (`lookalikeSwap`), called from `public/break_escape/js/systems/npc-lazy-loader.js:83`.

The guard swaps an NPC's sprite when it wears the player's chosen key. It compares keys, and only keys in its `male_`/`female_` pools can be swapped. Before this branch, a player wearing `male_nerd_v2` who met Kevin got Kevin swapped to another stock sprite. Now:

| Player wears | NPC wears | main | this branch |
|---|---|---|---|
| `male_nerd_v2` | Kevin `male_nerd_v2` / `kevin_park` | swapped to `male_office_worker_v2` | `null`: two identical figures |
| `kevin_park` | Kevin `kevin_park` | (not possible) | `null`: `poolOf('kevin_park')` has no pool |
| `kevin_park` | any `male_nerd_v2` NPC elsewhere (11 missions, e.g. lab Kieran Doyle) | (not possible) | `null`: keys differ |

Proved with a direct import of the module (all three branch rows return `null`; the main row returns the swap). All three cases are reachable: `available_sprites` is mission sprites plus every unlocked avatar (`player_preference.rb:96-97`), so in m01, despite its hacker-hood `validSprites`, a player may wear `male_nerd_v2` or `male_office_worker_v2` unlocked from other missions, and after finishing m01, `kevin_park` or `derek_lawson`. Replaying m01 as Kevin puts two Kevins in the IT room. This is the E7 bug class the guard was written for (P5-4).

The fix needs the guard to treat a copied key and its source as one look (for example a small alias table, or reading `copied_from`), and a named-character key worn by the player should push the NPC to a stock sprite. Add unit cases for the three rows above.

### m1. Players who finished m01 before this change never get `kevin_park` or `derek_lawson`

`app/models/break_escape/avatar_unlocks.rb:115`, `app/models/break_escape/game.rb:882-896`.

A completed game's stored `unlockedAvatars` is used as-is; backfill runs only when the list is absent. Old m01 games stored `male_nerd_v2`/`male_office_worker_v2` (also starter sprites, so they lose nothing), and their `scenario_data` snapshot still names the generic keys, so re-deriving from the game would not help either. Unless that is intended, a one-off mapping is needed (treat a stored `male_nerd_v2` entry with `npcId: kevin_park` from an m01 game as `kevin_park`, likewise Derek), done either in `for_player` or as a data task. The old keys stay valid, so no saved preference or in-progress game breaks.

### m2. The avatar menu now shows the same art twice under two names

`app/models/break_escape/avatar_unlocks.rb:56-70` (`catalogue`).

`male_nerd_v2` is now named after another mission's wearer ("Kieran Doyle") and `kevin_park` is a separate entry ("Kevin Park"); same for `male_office_worker_v2` ("Omar Haddad") and `derek_lawson`. A player sees a locked "Kevin Park" that looks the same as a starter they already have. This follows from what the user asked, so it may be accepted as is. If it is unwanted, the menu could hide a copied key's source, or the copies could get distinct art later.

### nit 1. Kevin's voicemail picture changes look

`scenarios/m01_first_contact/scenario.json.erb:1196`. The old avatar was `male_nerd_headshot.png`, the first-generation art (blue hair highlight, different face). The new `kevin_park_headshot.png` is a copy of `male_nerd_v2_headshot.png` and now matches his sprite and talk portrait. This is an improvement, but it is a visible change the commit message does not mention.

### nit 2. `copied_from` is read by nothing

`tools/pixellab_characters.json:239`, `:629`. No tool reads the field. If M1 is fixed by reading it, it gains a use; otherwise say in `tools/pixellab_drift_audit.py` or the pipeline skill that it is informational.

### nit 3. Two manifest keys share one PixelLab character

`tools/pixellab_characters.json:230-240`, `:620-630`: `kevin_park` and `male_nerd_v2` share `ae175532-...`, and `derek_lawson` and `male_office_worker_v2` share `f9fdf0ce-...`. Lookups go key to id, so nothing breaks. But an animation added in PixelLab for one key, followed by a re-import of only that key, makes the pair diverge, and deleting that PixelLab character would orphan both. A note in the pixellab-character-pipeline skill (copied keys share the PixelLab character; re-import both, never delete it) would cover this.

## Not checked

- The desktop account bar picture after signing in to KEVIN-WS or DEREK-PC. The sign-in screen does not show the user picture, and I did not sign in. The resolver and file checks above cover the path.
- Full suites (orchestrator runs them per merge batch).
