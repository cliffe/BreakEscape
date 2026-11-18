# Table-top placement live proof: handover

Branch `build/lab-pp-tables`, worktree `.claude/worktrees/p-lab-pp-tables`. Server already running on
:3061 (answers 200 on /break_escape). Proving commit d8b6bc9fa (per-item `position` + `table_items` y).

## Done and PASSING (do not redo)

1. Base-on-surface, all 25 moved items PASS. The audit already proved the engine applies these
   positions deterministically and live == computed, so this is authoritative. Script + output:
   - `<scratch>/table-audit/new_compute.py` -> prints PASS/FAIL per item; all PASS, FAILS=[].
   - (`<scratch>` = /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/71228547-c9d6-4671-85b6-93d22be0c8a1/scratchpad)
   - Uses this worktree's assets. kit_rogue_ap now seats on credenza kit_C_NW2; staff_pc_2 moved
     x6->5.75 (commit moved TWO pcs: staff_pc x2->1.5 and staff_pc_2 x6->5.75).

2. No-menu (tap disambiguation) analysis via the all-rooms loader on snapshot game 8977 (all rooms
   unlocked with tools/playtest/unlock-all-rooms.rb; unlock state does not affect positions, so this
   is layout-only evidence). Scripts: `<scratch>/table-audit/rivals.mjs`, `dist.mjs`,
   `snapshot.mjs`. Model = engine's own rivalsAt (aim.js): rival if item CENTRE is inside another
   INTERACTABLE object's bounds, or within TAP_SLOP(32)+2 of its top-left; inReach forced true
   (strict worst case). Results in `<scratch>/table-audit/after/rivals-first.json`.

   PASS (no menu) - the whole open_plan desk cluster, the main risk the audit flagged:
   staff_pc, staff_pc_2, planted_deviceA, hampshire_badge, pierce_printout, pierce_comms_card,
   usb_malware_note - ALL noMenu=true. Also kit_qr, kit_cloner, kit_cable, kieran_laptop,
   visitor_book, p1_franking: noMenu=true.

3. Screenshots (zoom 2, items revealed, lights on) for briefing_room, reception, open_plan, P1, P2,
   store_room, secure_area in `<scratch>/table-audit/after/first-<room>.png`. Not yet eyeballed one
   by one, but positions confirmed numerically.

## OPEN - needs a decision + data fix + re-prove

Strict centre-tap analysis finds these share a tap (gap < 32 px). Distances (centre-to-neighbour
top-left, the engine metric):
- kit_deviceB centre ~ kit_dust TL = 31 px  (commit moved both; briefing credenza)
- kit_dust centre ~ kit_rogue_ap TL = 28 px (commit moved both)
- kit_rogue_ap centre ~ kit_hivis TL = 16 px (rogue_ap was moved onto the credenza beside the
  hi-vis wall hook; hivis itself not moved)
- store_controller_folder centre ~ store_shelf TL = 26 px (folder moved only ~1.4 px up; the
  folder-on-shelf overlap is almost certainly PRE-EXISTING, not introduced by this commit -
  confirm against the pre-commit tree before treating as in scope)

Cause in briefing: four kit items (deviceA tl38, deviceB tl72, dust tl106, rogue_ap tl138) span two
64px credenzas (x32..159) at ~32-34 px top-left spacing. The audit author INTENDED 32 px and said so,
but centre-to-TL drops a few pairs just under the 34 threshold. Options: (a) widen spacing - but the
credenza pair is only 128 px for 4 items; may need to drop one item to the lower credenza row or
accept; (b) move rogue_ap away from the hivis hook specifically. These are DATA-only position edits
in scenario.json.erb, then re-run rivals.mjs to confirm noMenu=true, re-run new_compute.py to confirm
still seated, commit by explicit path.

Decision needed from orchestrator/user: is 32 px top-left spacing acceptable (menu only on a dead-centre
tap, and interact() still finds a clean edge point), or must centre taps be menu-free? If the latter,
re-space the four briefing kit items and (if in scope) nudge the store folder.

## NOT STARTED

- Live walk-to + centre tap opens/takes with no menu on real games (8957 default, 8958 open_plan
  head-start), via the harness (session-start.sh + cmd.sh, `interact` reply carries aim.clean/rivals).
  Repeat after a reload (eval location.href = pathname + '?skip_resume=1', Enter on title).
  Re-tap staff_pc and staff_pc_2 (both MOVED) - confirm no menu.
- Office-life NPC still walks to and USES the two moved PCs (staff_pc owner hampshire/Chris,
  staff_pc_2 owner pierce/Melanie). Check needs/affordance routing reaches the new x.
- Renders of changed rooms: Skill tool, skill "mission-room-dressing", its render step ->
  `<scratch>/table-audit/after/`.
- Validator: `BUNDLE_PATH=... ruby scripts/validate_scenario.rb scenarios/lab_physical_pentest/scenario.json.erb --no-graph` (only known door_admin error allowed).
- Model test: `BUNDLE_PATH=... flock tmp/tests.lock bin/rails test test/models/break_escape/lab_physical_pentest_content_test.rb`.
- Append an "After" section to `scenarios/lab_physical_pentest/TABLE_PLACEMENT_AUDIT.md` with
  PASS/FAIL per item + screenshot paths. Do NOT touch any NPC eventMappings.

## Env notes
- Ruby: `export PATH=/home/cliffe/.rbenv/bin:/home/cliffe/.rbenv/shims:$PATH; unset RBENV_VERSION` (2.7.8). Do NOT set RBENV_VERSION=3.1.6 (not installed).
- BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
- new-game: `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3061 bin/rails runner tools/playtest/new-game.rb lab_physical_pentest [--start-room open_plan]`
- playwright headless shell: /home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell; require from main checkout node_modules.
- loadRoom 403s on locked rooms (server-gated); use unlock-all-rooms on a throwaway layout game, or navigate via harness `enter` through the open doors.
- Games created this session: 8957 (default), 8958 (open_plan head-start), 8977 (snapshot, all rooms unlocked - layout only).
- No scenario/map edits made this session. Nothing committed except this note.
- Xvfb :97 NOT started (headless playwright needs no X). Start it only for the mission-room-dressing render step; stop by PID.
