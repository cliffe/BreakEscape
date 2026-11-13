# Network fixes code review, round 4 (build/net-fixes)

Scope: commits d36ef7003 to d164c1484 (the round 3 fixes), read against
`NET_FIXES_CODE_REVIEW_R3.md` and the build log's "R3 fixes" section, with a close look at the one
change that reaches every mission: `core/rooms.js` now records the texture a Tiled-matched sprite
was made with (`variantBaseKey`) and a `spriteVariants` listener returns to it when no variant
holds.

Counts: 0 blockers, 0 majors, 2 minors, 3 nits.

Evidence: a throwaway integration test on the `NetworkModelScenario` fixture (deleted, not
committed), quoted under m1, and live runs on a keyless server on :3071, headless, `setFPS(20)`
with fixed steps on. Game ids created: 1587 (`m07_architects_gambit`), 1588
(`m10_full_disclosure`), 1589 (`test_access_networks`), 1596 (`sis02_energy`). Screenshots and
the driver script are in the session scratchpad folder `net-r4/`.

## Round 3 findings

| R3 item | State |
|---|---|
| M1, an implant on a switched-off PC still gives a working foothold | Fixed. `implant_source_off?` empties the outage walk in `reach_walk_uncached` for an `implant_<pc>` foothold whose source PC is off, and `reach_cache_key` carries the source's power, so a cached walk cannot outlive the switch. `structural_reach` is untouched, so nothing is pruned. The view lists the foothold with `responding: false`, `sourceHost` (escaped on the client) and no rows. The five new tests in `network_implants_test.rb` drive the real routes (view, remote sign-in, session desktop, share and add, capture and bootstrap) and pass. No shipped scenario puts an implant on a PC with an `offWhen`, so the absence of a live check is acceptable. |
| m1, a PIN pad under an off PC counts the refusal as a wrong attempt | Fixed for the PIN pad: `POST /unlock` answers 403 with `reason` when the refusal is the held session's, and the pad refunds the attempt, says why and closes. The R3 live log (game 1575) shows attemptCount 0, no history entry and no desktop reopened afterwards. Two loose ends are new findings below: the reason is also given for objects the player has never been shown (m1), and the other lock screens do not read it (m2). |
| Nit 1, plan 5.2 wording | Fixed. The plan now says `not_responding`, that a local session gains a refusal only while its PC is off, and describes the implant rule and the unlock reason. Its sentence "so a lock screen closes and counts no attempt" is true only of the PIN pad (m2). |
| Nit 2, a desktop open when its PC goes off | Fixed. `watchPcPower` listens on the `offWhen` globals and closes the desktop, or a share or folder opened from it, with one "This PC is off." (or back to the view as not responding when remote); a failed load at an off PC says the same rather than open empty. |
| Nit 3, `GET /login_accounts` with any foothold | Fixed. The off check no longer looks at `foothold`; the test covers a real and a forged value. |
| Nit 4, a claim refused as `off` toasts twice | Fixed. `claim` passes `serverReason`, and `interactLoginPc` shows one toast and opens nothing. |
| Nit 5, `bench_pc` looks the same on and off | Fixed, with the `rooms.js` change reviewed below. Live it now reads clearly (see "bench_pc"). |

## The `rooms.js` change, across every scenario

What changed: `createSpriteFromMatch` sets `sprite.variantBaseKey = scenarioObj.sprite || imageName`
(the key it creates the sprite with), and `registerSpriteVariantListeners` falls back with
`sprite.variantBaseKey || scenarioObj.sprite || scenarioObj.type`. So the change alters behaviour
only for an object that has `spriteVariants`, has no `sprite` of its own and is matched to a map
item: there the "no variant holds" picture after a change event is now the map's picture rather
than the type's texture. Every other object keeps the same base as before (`scenarioObj.sprite`
is first either way, and an unmatched object is created and restored with `sprite || type`).
Nothing else reads `variantBaseKey`.

Every object with `spriteVariants` in `scenarios/` (m01 to m10, the labs, the SIS games and the
test scenarios; the labs and m01, m03 to m06 and m09 have none):

| Scenario, object | Own `sprite` | Behaviour change | Check |
|---|---|---|---|
| m02 `ehr_terminal_ward` | `pc_ransomware` | none | unit test `table-group-variant-listeners` (grouped object) |
| m07 `situation_board` | `pnw_video_wall1` | none | by reading |
| m07 `cascade_countdown_display` | none, `as-type:pnw_countdown` | base now `pnw_countdown1`, was `smartscreen` | live, game 1587 |
| m08 `recording_lamp`, `evidence_display`, `disposition_terminal` | yes | none | by reading |
| m10 `projection_desk` | `m10_field_screen_dark1` | none | by reading |
| m10 `gate_hut` | none, `as-type:m10_gate_post` | base now `m10_gate_post1`, was `aes_security_desk1` (a security desk) | live, game 1588 |
| sis02 `analog_thermometer` | none | none in effect: the map picture is `thermometer`, the type's own key | live, game 1596 |
| test_access_networks `bench_pc` | none | base now `pc6`, was `pc` | live, game 1589 |

Live results (texture key read from the sprite after each change event; screenshots
`m07-strip.png`, `m10-strip.png`, `sis02-strip.png`, `bench-strip.png`):

- m07, game 1587, `scada_control`: load `pnw_countdown1`; `cascade_armed` true gives
  `pnw_countdown_armed1`; back to false gives `pnw_countdown1` (the old code gave the generic
  `smartscreen` here); `countdown_expired` gives `pnw_countdown_running1`; `grid_saved` gives
  `pnw_countdown_aborted1`. Every face lines up with its text in the screenshots.
- m10, game 1588, `forward_post`: load `m10_gate_post1` (lit); `m06_assets_seized` true gives
  `m10_gate_post_dark1`; false again gives `m10_gate_post1`.
- sis02, game 1596, `battery_hall_1`: `thermometer`, `thermometer_high`, `thermometer_low`, then
  `thermometer` again with every watched global cleared.
- bench_pc, game 1589, `workshop`: load off `aw_pc_off1` (34x22); on `pc6` (32x30); off
  `aw_pc_off1`; on `pc6`. The off picture sits on the desk's back edge and reads as a dark monitor
  and tower; the on picture is the map's lit monitor. Position is unchanged throughout.

In shipped play the base matters only rarely: most watched globals in these objects only ever go
from false to true. But events also fire when a value is set to what it already was (the
`setVariable` and `setGlobal` paths emit without comparing), so under the old code a no-variant
object that took such an event switched to its type's texture; now it stays on the map picture.
The change is a fix wherever it bites, and I found no object that relied on the type fallback.

The other state-driven pictures do not read `variantBaseKey` and are unaffected: the locked
screen (`screen-states.js`) caches `_screenBaseKey` from the live texture and skips any object
with `spriteVariants`; the jack look (`network-links.js`) caches `_jackBaseKey` and no jack has
variants; doors and containers change no texture; swivel chairs and seating keep their own keys;
lighting keys emitters to the live texture, so it follows the restored map picture. The 60 JS
test files that import `rooms.js` or the other changed modules pass.

## Minor

### m1. The new unlock reasons tell whether a hidden object id exists

`unlock_session_refusal` says it gives nil for "a locked container above", but it only checks
that no held session's route is up. While the PC is off, `session_route_up?` is false for every
session there, so an object nested inside a still-locked folder (whose id the client has never
been sent) answers 403 `off`, while an invented id answers 422. The same holds for `unreachable`
over a down route, and for profile contents.

Probe (fixture, keyboard session at `lena_pc`, an outer PIN folder holding an inner one):

- the desktop listing and the bootstrap do not contain the inner id;
- PC on: inner id 422 "Invalid attempt", invented id 422 "Invalid attempt" (same);
- PC off: inner id 403 `off` "This PC is off.", invented id 422 "Invalid attempt"; with method
  `password` too.

So a client holding a session at an off PC can confirm guessed ids under it. It learns existence
only (no code, no contents, no pips: the 403 returns before `pin_cracker_feedback`), it needs a
guessed id and a PC that can be switched off, and today only test scenarios carry an `offWhen`
or an outage. On the questions asked: no, the reasons cannot dodge an attempt count. The server
keeps no count for `POST /unlock` at all (the pad's count is client-side), and a 403 is given for
the right code and a wrong one alike, so it is no oracle for the code.

Fix: give a reason only when the path above is open, for example add
`&& path_unlocked?(located[:path])` (with `located = login_scope_of(target_id)`) before the
reason is built, so a nested object behind a locked folder answers as an invented id. One test:
the nested id while off answers 422 like an invented one.

### m2. The other lock screens do not read the refusal reason

Graded as asked: the password screen shows "Network error. Please try again." for the 403 `off`
(its catch treats anything but 422 as a network failure). It refunds the try, so nothing is
counted, but it blames the network for a PC the player can see is off, which sends a student to
reload or report a bug. Minor rather than nit because the same gap is wider on two other screens:
`combination-minigame.js` and `cryptex-minigame.js` return false for any answer with a status, so
a 403 `off` reads as a wrong combination and the right one is shown as wrong. The plan's "so a
lock screen closes and counts no attempt" holds only for the PIN pad. Reach is small today (a
lock screen open under a held session when its PC goes off or its route drops, in test scenarios
only), which keeps it at minor.

Fix: share `PIN_SCOPE_REFUSAL_TEXT` (or move it next to `PC_OFF_TEXT`) and, in the password,
combination and cryptex catches, treat a 403 whose `body.reason` is one of the three as no
attempt: show the matching line and close as cancelled, as the PIN pad does. One JS test per
screen.

## Nits

1. **An implant-off remote sign-in answers the generic 403 "PC not reachable".** Through an
   implant whose PC is off, `POST /login` to another host gets the same answer as a host outside
   reach, which the password screen shows as "This PC can't be reached." No failure is counted and
   nothing new is told. The view already says "This link is not responding: <host> is off." and
   offers nothing to click, so the screen is reached only from a view opened before the switch. A
   `reason: 'link_off'` with "This link is not responding." would match the view, but the current
   answer is acceptable.
2. **The proximity ghost keeps the old picture after a variant swap.** Live, game 1589, player
   next to `bench_pc`: the sprite went `aw_pc_off1`, `pc6`, `aw_pc_off1`, `pc6` while
   `proximityGhost.texture.key` stayed `aw_pc_off1` throughout, so the 20% blue outline shows the
   tower shape over the lit monitor. Pre-existing (the listener has never updated the ghost), but
   `bench_pc` is now the first variant object a player flips while standing beside it.
   `screen-states.js` and `network-links.js` already set the ghost's texture in the same way; the
   listener in `registerSpriteVariantListeners` should too.
3. **Two notes now overstate the type fallback.** `.claude/skills/mission-room-lighting/SKILL.md`
   line 107 says an object with `spriteVariants` and no `sprite` "falls back to its `type`" when a
   variant clears, and the m08 comments on `recording_lamp` and `evidence_display` say the same.
   That is now true only for an object not matched to a map item. Proposed skill wording (for the
   orchestrator, since skills are out of scope here): "An object with `spriteVariants` and no
   `sprite` returns to the map item's picture when it is matched to one, and to its `type`
   texture when it is placed without a map item, so give a lit prop a base `sprite` unless it
   takes a map slot." The m08 comments are harmless as they stand (those objects have a `sprite`).

## Sync size

No round 3 change adds to `player_state` or to what the client re-sends. `unlock_session_refusal`
and `implant_source_off?` only read `sessions`, `globalVariables` and the scenario; the reach
cache key gains one boolean. On the client, the PIN pad's `lastAttemptRefusal` and the
container's power watcher are per-screen and cleared on close. Each sync still sends what it did
in round 3.

## Tests run (no lock, per the test lock rule)

- Rails: `network_host_service_off_test.rb`, `network_implants_test.rb`,
  `network_no_exposure_test.rb`: 47 runs, 1945 assertions, 0 failures, 0 errors, 0 skips.
- JS: the 60 test files that import `core/rooms.js`, `pin-minigame.js`, `unlock-system.js`,
  `pc-sessions.js`, `container-minigame.js` or `network-view-minigame.js`: 60 passed, 0 failed.
- No test covers m1, m2 or nit 2.
