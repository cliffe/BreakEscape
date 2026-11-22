# ca12 trailer pilot: capture runbook

For the capture window. Shot list: `CA12_TRAILER45_SHOTLIST.md`. Scripts: `tools/video/takes/ca12/`. Every take is a fresh game of
`ca12_visitor_tailgater`, `--hide-hud --zoom-step 1`, 30 fps, serial captures (one display), music 0. Setup before the capture starts
(off camera) is not in the durations. Durations are the take body in game seconds, from the headless dry runs (throttled to 20 fps, so
walking and physics shots may differ by a second or two in a real capture).

Before each batch: `pgrep -af 'remotion|render.mjs|render.sh'` must be empty; `tools/video/capture/env-up.sh <display>` (see the video-takes skill). VID1 uses display 113 with `VIDEO_STATE_DIR=$HOME/.cache/be-video-state-113`; use another number and its own state dir (the pilot used 147).

**Footage root: always `FOOTAGE_ROOT=$HOME/video-takes-local`. Never write into `~/safetynet-footage`.** That folder is a one-way rclone mirror of Google Drive (the owner's `footage-sync.timer`, every :00 and :30), so anything not on Drive is moved to `~/safetynet-footage-deleted/<date>/` at the next run. It did this to the pilot's ca12 folder mid-capture on 2026-11-22.

## Order and commands

Run all as `tools/video/takes/run-take.sh ca12_visitor_tailgater <take> "<new-game flags>" "--hide-hud --zoom-step 1"`.
`mission.sh` accepts the full id (and the short key `ca12`) since f931300e9.

| # | Take | Avatar window | New-game flags (3rd arg) | Body (s) | Notes |
|---|---|---|---|---|---|
| 1 | t01_studio_wide | optional (player small) | `""` | 12 | no A1 here: A1 only fires from t09; opportunistic bubbles |
| 2 | t02_two_rooms | **yes** | `""` | about 7 (+41 s call in setup) | |
| 3 | t03_kiosk_strip | no | `""` | about 10 | |
| 4 | t04_osint_note | no | `""` | about 10 | |
| 5 | t05_pretext_card | no | `""` | about 9 | |
| 6 | t06_the_call | no (call is a full-screen chat) | `""` | 20 (setup about 21 s) | tells list hidden by CSS; never presses Done |
| 7 | t07_flip | **yes** per the shot list (the player is only seen walking to Lorna; the bust view hides them, so optional in practice) | `""` | 17 (setup about 60 s incl. reload) | own run; flip body hidden by CSS |
| 8 | t08_triage | **yes** per the shot list (kiosk panel hides the player; optional in practice) | `""` | 10 (setup about 65 s) | stops before any verdict |
| 9 | t09_step_away | **yes** (player visible in the studio) | see below | 54 (A1 at 3 s, C1 at 42 s after Look up) | cut before the choice menu |
| 10 | t10_ambient_spares | no | `""` | up to 300 | **unscriptable as random chatter** (see below) |

t09 flags (verified entry state; `kit_defend_done` alone is not enough). Pass them to `run-take.sh` **without** single quotes round the JSON: it splits the flags string itself, so quotes reach the state as literal characters and corrupt it (the pilot's first t09 attempt failed this way):

```
--set episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip","defend"]} --set episode_e12_visitor_tailgater_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e12_visitor_tailgater_defend_percent=100
```

Group the avatar-window takes (t02, t07, t08, t09) into one block: set BE_SPRITE once per take, restore at the end.

## Avatar step (BE_SPRITE)

Sprite key: `female_office_worker_v2` (chosen by the t01 to t05 agent; check it is offered: new-game aborts with the offered list if not).
Prefix the avatar takes:

```
BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca12_visitor_tailgater t02_two_rooms "" "--hide-hud --zoom-step 1"
```

`new-game.rb` switches the shared demo user's saved avatar and records the original in `tools/playtest/sprite-restore-<gameid>.txt`.
`run-take.sh` restores it after each take.

## Restore step (demo user id 1 back to female_hacker_hood_v2)

After the last avatar take, check no `tools/playtest/sprite-restore-*.txt` is left (a left file means a take did not finish its restore):

```
ls tools/playtest/sprite-restore-*.txt 2>/dev/null
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/restore-sprite.rb <game_id>     # once per leftover file
```

Verify with this read-only check (it reads, never writes):

```
BREAK_ESCAPE_STANDALONE=true bin/rails runner 'p BreakEscape::PlayerPreference.find_by(id: 1)&.selected_sprite'
```

Expected `"female_hacker_hood_v2"`. (The demo user's preference is id 1. A `joins(:player)` form raises on this schema; the pilot used this `find_by` form.) Check after every avatar take, including one that crashed, not only at the end.
`restore-sprite.rb` only restores if the preference still holds the sprite the take set, so someone else's change is left alone.

## Spoiler rules held in the scripts

- t06: the technique explanation lines under the meter (`ol.pretext-tells`) are hidden in every frame (a crop above them would lose Delphine's subtitle). Done is never pressed (it opens the flip screen at once).
- t07: flip body hidden (heading and strip only). L1 only, the hub is closed before Lorna's second line.
- t08: no verdict. t09: ends at the C1 bubble end; the door/screen menu opens about then: the editor cuts before `choice-menu-opened` if it is marked.
- First frame with the NPC's portrait: `frame:npc-portrait-up` marks (t07 Lorna). In the call (t06) the player's portrait never shows.
- Marks are times on the take clock; the A1 and C1 lines are world bubbles (`bubble-start/bubble-end`), not voice marks.

## t10 verdict

Unscriptable as scripted. A 300 s un-throttled hold in the studio (player idle) showed no bubble at all (earlier 120 s throttled probe: none;
t01's 12 s holds: none). A3/A4 sit in a random chatter bag with a needs-minutes cooldown, A5 comes from the kettle trip in the ambient ink.
No `window.__test` hook triggers them. Untested fallback in the script: `window.npcNeedsSystem.world.speak(id, line)` after a wait
(`FORCE_AFTER_S`, default 45 s, marks `forced-speak:*`); one try produced no visible bubble in the headless run, so treat it as unproven.
Alternative shot from the scout: reuse t09's real bubbles (A1 Thandiwe at about 3 s, Thandiwe's "that's me back" at about 18 s, C1) for
ambient texture, and t01's studio hold for the three staff moving. Dropping t10 loses only A3/A4/A5 spares.
