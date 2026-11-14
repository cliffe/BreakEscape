# Spy starters review, round 2

Branch `build/spy-starters`, tip 0882e9f09, reviewed in worktree `.claude/worktrees/p-spies`.
Keyless server on :3498 only. No full suites; named test files one at a time.

Since R1 (tip ecf74a3c1): one code change, 0882e9f09, which adds `box-sizing: border-box`
to the code-name input (`.form-control`) in `public/break_escape/css/player_preferences.css`
and records the fix-round-1 notes in the build log. The nine hand-written starter lists were
kept, with the reasoning in the build log "Fix round 1" section.

Verdict: no blockers. The R1 picker-overflow minor is fixed and isolated; the list-drift minor
is reasonably answered and its test is a genuine guard; validators and the format corpus are
green; main has not moved, so no merge was needed. Live, both a noir starter and the default
character sit on m07's operator chairs; the start-room "hospital" chairs open no sit menu because
waiting chairs are non-sittable by engine design, which is how m07 has always been, not a change
from this branch. One pre-existing UI-language breach (a Cancel button in the picker modal) is
noted; it does not belong to this branch.

## Counts
- B (blocker): 0
- M (should fix): 0
- m (minor): 2
- n (note): 6

## R1 minor 1 (list drift): reasonably answered, the test is a real guard

The nine m02 to m10 `validSprites` blocks keep the 14 starter keys written out by hand
(e.g. scenarios/m02_ransomed_trust/scenario.json.erb:111), so they can drift from
`PlayerPreference::AVAILABLE_SPRITES`. The build log (Fix round 1, item 1) keeps them hand-written
because the single source would have to be the constant, and the scenario validator, the dungeon
graph script, tools/pass2/render.rb and tools/format/rewrite_templates.rb all render the ERB
without Rails, so each would need its own copy of the constant: the same drift moved, not removed.
That reasoning holds.

The guard is `test/models/break_escape/avatar_unlocks_test.rb`, "m01 to m10 offer the noir starters
and keep their earlier options". It builds a catalogue from `AVAILABLE_SPRITES`, generates each
mission's scenario data, and asserts `mission_sprites(...).first(size - 8).sort` equals
`AVAILABLE_SPRITES.sort` (m01 keeps its four hooded keys). Add a key to `AVAILABLE_SPRITES` without
touching the nine lists and the hand-written `validSprites` no longer names it, so it is absent
from `here` while present in `earlier`, and the lengths differ: the assertion fails. The guard is a
real tripwire for the realistic drift (adding or removing a starter). Residual gap, theoretical:
a key dropped from `AVAILABLE_SPRITES` that is still an NPC sprite of some mission would stay in
the real catalogue and could still be offered by a stale hand-written entry, but the synthetic
test catalogue would not include it, so that one case would pass unnoticed. Minor, not a gate.
Ran green this round: 18 runs, 143 assertions, 0 failures.

## R1 minor 2 (picker 390 px overflow): fixed and isolated

`public/break_escape/css/player_preferences.css:70` adds `box-sizing: border-box` to `.form-control`.
Before, the input was `width: 100%; max-width: 400px` with 10px padding and a 2px border and no
box-sizing, so it ran past its column and drew a browser horizontal scrollbar at narrow widths.

Isolation checked by grep of the class. `.form-control` is defined only in
public/break_escape/css/player_preferences.css and used on three elements, all the same code-name
text input: app/views/break_escape/player_preferences/show.html.erb:58 and :99 (the preferences
page), and app/views/break_escape/player_preferences/_modal.html.erb:23 (the in-game picker modal).
box-sizing only affects elements carrying the class, so nothing else on the preferences page or in
the picker shifts; the three inputs simply honour their own width box. The rest of the page already
used border-box (the same stylesheet sets it on nine other rules), so this brings the lone omission
into line.

Hacktivity embed: Hacktivity does not load player_preferences.css (grep of its app/ found no
reference), and both BE pages are standalone HTML documents served by the BE engine
(app/views/break_escape/games/show.html.erb:1 and player_preferences/show.html.erb:1 each start
`<!doctype html><html>`), so the rule cannot reach Hacktivity's own `.form-control` forms. No
cross-form effect.

## Merge main: not needed

`git log -1 main` is 372600713, the same commit the branch already merged (87d576e53). Main has not
moved past it, so there was nothing to merge. Validators and tests below were run on the branch tip
as it stands.

## Validators and format corpus: PASS

- Scenario validator (`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph`),
  m01 to m10: 0 lines with the failure mark each. No dungeon_graph files were touched (`--no-graph`).
- Format corpus (RBENV_VERSION=2.7.8, one file at a time, no lock): format_8a_corpus 21/0,
  format_8b_corpus 29/0, format_8c_corpus 23/0, format_upgrade 22/0.
- Drift guard: avatar_unlocks_test 18/0 (see R1 minor 1).

## Live check (fresh m07 game, keyless :3498)

Fresh game 3759 from tools/playtest/new-game.rb m07_architects_gambit --start-room operations_floor,
created right before the run.

- Access, live: the configuration page for the fresh m07 game offers marcus_hale (and the other
  seven noir keys) as choosable starters alongside the 14 hand-written starters, confirming the
  server-authoritative offer on freshly generated m07 scenario_data (the gap R1 n2 could not close).
- Noir character sits: picked marcus_hale on the configuration page, entered operations_floor. The
  room has three sittable grey operator chairs (chair-grey-1, swivel). `window.seating.canPlayerSit()`
  true, `trySit` on operations_floor_chair-grey-1_8 returned seated, pose "sit". Screenshot
  tmp/spyr2/m07_marcus_sit.png shows the detective seated at a console.
- Default character sits: set the shared demo player back to female_hacker_hood_v2 on the
  configuration page, re-entered the same game. Same chair: canPlayerSit true, seated, pose "sit".
- Start-room "hospital" chairs: security_checkpoint's waiting chairs are decorative furniture, not
  interactable objects; none is in window.chairs and no chair-like object is in the room's object
  map, so no sit menu opens on them. This is engine design: rooms.js:2668 makes a sprite a chair
  only when its name starts `chair-` and NOT `chair-waiting` (or is a rotate/static-swivel prop), so
  waiting chairs are deliberately non-sittable, for every character. The fixer's observation is
  correct and is how m07 has always been, not new and not caused by this branch (the branch's m07
  diff is only a validSprites block; it touches no seating or room code).
- On main: not run as a separate server (the brief pins :3498 and the worktree). It is not needed:
  the seating system (public/break_escape/js/systems/seating.js), rooms.js and m07's chair objects
  are byte-identical to main (the branch changes none of them), and female_hacker_hood_v2 had sit
  frames before this branch, so the default character's sit behaviour on the branch equals main.
- Housekeeping: the shared demo player's selected_sprite ends as female_hacker_hood_v2 (confirmed by
  a read of the preference after the run). Session and server stopped by PID.

## Minor

- m (UI language): the in-game picker modal has a Cancel button,
  app/views/break_escape/player_preferences/_modal.html.erb:66
  (`<button ... id="player-preferences-cancel-btn" class="btn btn-secondary">Cancel</button>`),
  next to an `×` close button at :6. The project's UI language is "X closes, no Cancel", so the
  Cancel button is a breach. Rating: minor. It does NOT belong to this branch: _modal.html.erb is
  unchanged on build/spy-starters (not in the branch diff) and the Cancel button is already present
  on main at the same line. Recommend removing it in a separate change on the modal's owning branch,
  not here.

- m (list drift): carried from R1, accepted. Kept hand-written with sound reasoning; the test is a
  genuine guard (see R1 minor 1). Open only as the theoretical removal-of-a-still-NPC-key gap.

## Notes

- n1: main has not moved (372600713), so no merge and no re-validation against a newer main was
  required this round.
- n2: the box-sizing fix also aligns `.form-control` with the nine other rules in the same
  stylesheet that already set border-box; it is the one input that was missing it.
- n3: the configuration page for a fresh m07 game offers the full catalogue (every m07 NPC sprite)
  plus the 14 starters plus the eight noir. The eight are genuinely offered as "This mission"
  starters; access is unchanged from R1's analysis.
- n4: both the noir and the default character sit on the same m07 operator chair with pose "sit";
  the sit mechanic is avatar-independent given seated frames, which all eight noir keys and the
  default keys have.
- n5: reaching a sittable chair in a normal m07 playthrough needs mission progress past the
  checkpoint; the start room has only non-sittable waiting chairs. The live run used --start-room to
  reach operations_floor directly.
- n6: left in place, not killed: some chrome-headless processes on the shared machine whose owner
  could not be attributed with certainty. My own server (port 3498) and named sessions (3759) were
  stopped by PID.
