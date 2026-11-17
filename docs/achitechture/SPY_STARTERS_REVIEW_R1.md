# Spy starters review, round 1

Branch `build/spy-starters`, tip ecf74a3c1, reviewed against main 372600713 in worktree
`.claude/worktrees/p-spies`. Keyless server on :3498 only. No full suites; named test files only.

Scope: add the eight noir characters (vivian_ashby, mei_lin_chow, lucia_moreno, ngozi_adeyemi,
daniel_seo, frank_callahan, marcus_hale, harjit_singh) as starting options in m01 to m10, give
them seated frames, and let a mission offer an exactly named avatar key through validSprites.

Verdict: no blockers. The access change is sound and well tested; art is honest; validators and
named tests pass. Two minor points and some notes below. Nothing to fix as a merge gate; one
live sub-check could not be completed (see n2).

## Counts
- B (blocker): 0
- M (should fix): 0
- m (minor): 2
- n (note): 4

## Access and cheat resistance: PASS

The new offer path is `validSprites` entry (exact key) -> `AvatarUnlocks.listed_avatars`
(app/models/break_escape/avatar_unlocks.rb:94) -> `mission_sprites` pool
(avatar_unlocks.rb:81) -> `PlayerPreference#available_sprites` (player_preference.rb:96) ->
`selected_sprite_available` validation (player_preference.rb:153). A save is accepted only when
the key is in `available_sprites`, and `available_sprites` derives the scenario from
`scenario_context`, which the controller sets to the player's own game's stored scenario_data
(player_preferences_controller.rb:127, `Game.find_by(id:, player: current_player)`). The client
never supplies the validSprites list, so the offer set is server-authoritative.

Checked against the brief's attack list:
- Forged request with any key: rejected. The validation ignores the request body's sprite unless
  it is in the server-computed `available_sprites`.
- Key from another mission: rejected when the current game does not list it. Proven by the test
  "an exact validSprites key offers an avatar no NPC wears" (avatar_unlocks_test.rb), which saves
  `vivian_ashby` under a listing scenario and then asserts it is NOT valid for a scenario that
  omits it.
- Non-existent key: rejected. `listed_avatars` requires `unlockable_sprite?` (atlas + headshot +
  8-direction walk/idle), so a missing key never enters the pool.
- Retired / NPC-only / wildcard-named key: rejected or skipped. `listed_avatars` skips wildcards,
  keys where `current_sprite(key) != key` (legacy/retired), and non-avatar sprites. Covered by
  "listed keys skip wildcards, retired keys and sprites that are not avatars".
- Outside a game (no game_id): `scenario_context` is nil, `mission_sprites` returns
  `AVAILABLE_SPRITES` only; the eight are not in that constant, so they are not choosable on the
  menu or in labs/SIS/awareness.

Not added to the global catalogue: the eight are not NPCs of any published mission and not in
AVAILABLE_SPRITES, so `catalogue` excludes them and `menu`'s locked section cannot list them.
They appear only as "mission" entries where a scenario names them. Confirmed by code and by the
test's `refute ... status == 'locked'`.

Other scenarios unchanged: only lab_tesseract_trials declares validSprites outside m01 to m10,
with legacy keys (`male_hacker_hood`, `female_hacker_hood`) that `listed_avatars` skips; its pool
is catalogue-only as before. SIS and awareness scenarios declare no validSprites, so they fall to
AVAILABLE_SPRITES untouched. The only behavioural change for existing scenarios is the order
`mission_sprites` returns (now pattern order, deduped), which is cosmetic.

Sync size: no change to player_state. The feature touches the avatar menu and validation only;
`unlockedAvatars` already existed and is unchanged. No new per-game growth.

## Art: PASS

- Drift audit clean for all eight keys (`tools/pixellab_drift_audit.py`), each reproducible from
  its export plus overrides.
- Honesty of the re-import, verified independently by cropping every frame from the committed
  main atlas and the branch atlas and comparing bytes (scratchpad cmp): for all eight keys,
  256 pre-existing frames are byte-identical, 8 `sit_*` frames added, 0 existing frames changed,
  0 removed. The ngozi_adeyemi rebuild claim ("256 identical to HEAD") holds exactly, as does the
  frank_callahan north-west override (existing frames untouched).
- Seated frames reviewed by eye in all 8 directions for all 8 characters (scratchpad contact
  sheet from the committed atlases): each reads as seated, colours match the walk rotation, back
  (north) views show the head above the seat, frank north-west has no floor-shadow artifact.
- tools/pixellab_characters.json: adds `sit_from` and the import date for the eight only. Benign.

## Validators and tests: PASS

- Scenario validator (`--no-graph`), m01 to m10: 0 errors each.
- Named Rails tests (RBENV_VERSION=2.7.8, no lock): avatar_unlocks_test 18/0, player_preference_
  name_test 7/0, player_preferences_controller_test 45/0. (The build log's other named files were
  not re-run; these three cover the changed model and controller.)
- Hacktivity fixtures: read-only grep of the Hacktivity repo `test/` found no `validSprites` and
  none of the eight keys. Its fixture scenarios (test_objectives, test_simple_success) declare no
  validSprites, so the change is backward-compatible for them. Not edited.

## Minor

- m (drift): the fourteen starter keys are hand-written into each of m02 to m10's `validSprites`
  (e.g. scenarios/m02_ransomed_trust/scenario.json.erb:111), nine copies with no single source. If
  `PlayerPreference::AVAILABLE_SPRITES` changes, the nine lists drift. Mitigation already present:
  the test "m01 to m10 offer the noir starters and keep their earlier options" asserts each
  mission's non-noir options equal AVAILABLE_SPRITES, so a divergence fails CI. Recommend, not as
  a gate: generate the block in ERB from the constant (e.g.
  `<%= (BreakEscape::PlayerPreference::AVAILABLE_SPRITES + NOIR).to_json %>`) so there is one
  source and the test becomes a tautology rather than a tripwire.

- m (pixel-art UI rule): at 390 wide the picker page overflows its viewport by ~12 px, drawing a
  plain browser horizontal scrollbar (measured live: body scrollWidth 387 vs clientWidth 375; the
  `.sprite-grid` itself does not overflow). This is a non-pixel scrollbar in game UI, so it breaks
  the pixel-art UI rule. It is pre-existing shared picker chrome, width-driven not row-count
  driven (so not caused by adding eight tiles), and absent at 1400 wide. Recommend a separate fix
  (trim the ~12 px overflow and/or apply `.pixel-scroll`); not a blocker for this branch.

## Notes

- n1: m01 lists the four hooded options by their legacy non-v2 keys
  (scenarios/m01_first_contact/scenario.json.erb:52) while m02 to m10 use the v2 keys. Works via
  `LEGACY_SPRITES` and matches m01's prior restricted set; cosmetic inconsistency only.
- n2: live detective-render plus walk/sit on fresh m01/m07 games could not be completed. The
  existing demo games store an older scenario_data snapshot without the new validSprites, and
  regenerating/creating game records was blocked by the auto-mode safety classifier
  ("Destructive or Unwanted Actions"), which I did not work around. The server-side offer of the
  eight for freshly generated m01 to m10 scenario_data is proven by the model test
  "m01 to m10 offer the noir starters ... (here.last(8))", the builder's own live run is in the
  build log (games 3611/3612/3622), and the picker page itself was verified live at 1400x1000 and
  390x844 (pixel-art frame, pixel font, "This mission"/"Unlocked" badges, no desktop horizontal
  scroll).
- n3: once a player picks a listed starter in a mission, the global preference persists into other
  scenarios that do not list it (the picker only validates on change). This is the existing
  behaviour for every unlocked avatar (player_preference.rb:151 comment), not a regression; the
  eight behave like any unlocked character once chosen.
- n4: `listed_avatars` names keys with `titleize` while `catalogue` uses `humanize`
  (avatar_unlocks.rb:100 vs :69). Cosmetic; titleize gives the nicer "Mei Lin Chow".
